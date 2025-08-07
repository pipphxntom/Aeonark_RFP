import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';
import cron from 'node-cron';
import { DocumentClassifier } from './documentClassifier';
import { VectorDatabase } from './vectorDatabase';

interface EmailProvider {
  name: string;
  isConfigured: boolean;
  authenticate(): Promise<boolean>;
  fetchNewEmails(): Promise<EmailMessage[]>;
}

interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  date: Date;
  body: string;
  attachments: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
}

interface IngestionResult {
  processed: number;
  classified: number;
  rejected: number;
  errors: string[];
}

export class EmailIngestionService {
  private genAI: GoogleGenerativeAI;
  private classifier: DocumentClassifier;
  private vectorDB: VectorDatabase;
  private providers: Map<string, EmailProvider> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.classifier = new DocumentClassifier();
    this.vectorDB = new VectorDatabase();
    
    this.initializeProviders();
    this.startScheduledIngestion();
  }

  /**
   * Initialize email providers (Gmail, Outlook, etc.)
   */
  private initializeProviders(): void {
    // Gmail provider
    this.providers.set('gmail', {
      name: 'Gmail',
      isConfigured: Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
      authenticate: async () => {
        // Implementation would use Gmail API with OAuth
        return this.providers.get('gmail')?.isConfigured || false;
      },
      fetchNewEmails: async () => {
        // Implementation would fetch emails from Gmail API
        return this.getMockEmails(); // Placeholder
      }
    });

    // Outlook provider
    this.providers.set('outlook', {
      name: 'Outlook',
      isConfigured: Boolean(process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET),
      authenticate: async () => {
        return this.providers.get('outlook')?.isConfigured || false;
      },
      fetchNewEmails: async () => {
        return []; // Placeholder
      }
    });
  }

  /**
   * Start scheduled email ingestion
   */
  private startScheduledIngestion(): void {
    // Run every 15 minutes during business hours
    cron.schedule('*/15 9-17 * * 1-5', async () => {
      if (!this.isRunning) {
        console.log('Starting scheduled email ingestion...');
        await this.runIngestionCycle();
      }
    });

    // Run every hour outside business hours
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) {
        await this.runIngestionCycle();
      }
    });
  }

  /**
   * Manual ingestion trigger
   */
  async ingestEmails(userId: string, provider?: string): Promise<IngestionResult> {
    if (this.isRunning) {
      throw new Error('Ingestion already in progress');
    }

    this.isRunning = true;
    const result: IngestionResult = {
      processed: 0,
      classified: 0,
      rejected: 0,
      errors: []
    };

    try {
      const providersToProcess = provider 
        ? [this.providers.get(provider)].filter(Boolean)
        : Array.from(this.providers.values()).filter(p => p.isConfigured);

      for (const emailProvider of providersToProcess) {
        try {
          const authenticated = await emailProvider.authenticate();
          if (!authenticated) {
            result.errors.push(`Failed to authenticate with ${emailProvider.name}`);
            continue;
          }

          const emails = await emailProvider.fetchNewEmails();
          console.log(`Fetched ${emails.length} emails from ${emailProvider.name}`);

          for (const email of emails) {
            try {
              const emailResult = await this.processEmail(userId, email, emailProvider.name.toLowerCase());
              result.processed++;
              
              if (emailResult.classified) {
                result.classified++;
              } else {
                result.rejected++;
              }
            } catch (error) {
              result.errors.push(`Error processing email ${email.id}: ${error.message}`);
            }
          }

          // Log ingestion for this provider
          await storage.createEmailIngestionLog({
            userId,
            provider: emailProvider.name.toLowerCase(),
            messageId: `batch_${Date.now()}`,
            subject: `Processed ${emails.length} emails`,
            sender: 'system',
            attachmentCount: emails.reduce((sum, e) => sum + e.attachments.length, 0),
            documentsExtracted: result.classified,
            classificationResults: {
              processed: result.processed,
              classified: result.classified,
              rejected: result.rejected
            }
          });

        } catch (error) {
          result.errors.push(`Provider ${emailProvider.name} error: ${error.message}`);
        }
      }

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process individual email for RFP documents
   */
  private async processEmail(userId: string, email: EmailMessage, provider: string): Promise<{ classified: boolean; rfpIds: number[] }> {
    const rfpIds: number[] = [];
    let hasValidRFP = false;

    try {
      // Check if email subject/body indicates RFP content
      const emailContent = `${email.subject} ${email.body}`;
      const shouldProcess = await this.shouldProcessEmail(emailContent);

      if (!shouldProcess.shouldProcess) {
        console.log(`Skipping email ${email.id}: ${shouldProcess.reason}`);
        return { classified: false, rfpIds: [] };
      }

      // Process attachments
      for (const attachment of email.attachments) {
        if (this.isSupportedFileType(attachment.contentType)) {
          try {
            const extractedText = await this.extractTextFromAttachment(attachment);
            
            if (extractedText.length < 100) {
              console.log(`Skipping attachment ${attachment.filename}: insufficient content`);
              continue;
            }

            // Classify the document
            const classification = await this.classifier.classifyDocument(0, extractedText, attachment.filename);
            
            if (classification.isValidRFP) {
              // Create RFP record
              const rfp = await storage.createRfp({
                userId,
                title: email.subject.substring(0, 200),
                description: `Automatically ingested from ${provider} email`,
                fileName: attachment.filename,
                fileUrl: `email_attachment_${email.id}_${attachment.filename}`,
                fileSize: attachment.size,
                extractedText,
                status: 'uploaded'
              });

              // Index in vector database
              await this.vectorDB.indexRFP(rfp.id, extractedText, {
                source: 'email',
                provider,
                sender: email.sender,
                subject: email.subject,
                ...classification.classification
              });

              rfpIds.push(rfp.id);
              hasValidRFP = true;

              console.log(`Created RFP ${rfp.id} from email attachment: ${attachment.filename}`);
            }
          } catch (error) {
            console.error(`Error processing attachment ${attachment.filename}:`, error);
          }
        }
      }

      // Log the email processing
      await storage.createEmailIngestionLog({
        userId,
        provider,
        messageId: email.id,
        subject: email.subject,
        sender: email.sender,
        attachmentCount: email.attachments.length,
        documentsExtracted: rfpIds.length,
        classificationResults: {
          hasValidRFP,
          rfpIds,
          attachmentsProcessed: email.attachments.length
        }
      });

      return { classified: hasValidRFP, rfpIds };
    } catch (error) {
      console.error(`Email processing error for ${email.id}:`, error);
      return { classified: false, rfpIds: [] };
    }
  }

  /**
   * Determine if email should be processed for RFPs
   */
  private async shouldProcessEmail(content: string): Promise<{ shouldProcess: boolean; reason: string; confidence: number }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        Analyze this email content to determine if it likely contains RFP documents:
        
        "${content.substring(0, 1000)}"
        
        Look for indicators like:
        - RFP, RFQ, tender, bid keywords
        - Government or corporate procurement language
        - Proposal submission mentions
        - Deadline and requirement language
        - Vendor solicitation terms
        
        Return JSON:
        {
          "shouldProcess": true/false,
          "reason": "explanation",
          "confidence": 0.85
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          shouldProcess: Boolean(analysis.shouldProcess),
          reason: analysis.reason || 'AI analysis result',
          confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5))
        };
      }
      
      // Fallback: keyword-based analysis
      const rfpKeywords = /rfp|proposal|tender|bid|procurement|solicitation/i;
      const hasKeywords = rfpKeywords.test(content);
      
      return {
        shouldProcess: hasKeywords,
        reason: hasKeywords ? 'Contains RFP-related keywords' : 'No RFP indicators found',
        confidence: 0.3
      };
    } catch (error) {
      console.error('Email analysis error:', error);
      return {
        shouldProcess: false,
        reason: 'Analysis failed',
        confidence: 0.1
      };
    }
  }

  /**
   * Extract text from email attachments
   */
  private async extractTextFromAttachment(attachment: EmailAttachment): Promise<string> {
    try {
      if (attachment.contentType.includes('pdf')) {
        // PDF text extraction using native JavaScript
        const text = attachment.data.toString('utf-8');
        // Basic PDF text extraction - would need proper PDF parser
        const cleanText = text.replace(/[^\x20-\x7E\n\r]/g, ' ').trim();
        return cleanText.length > 50 ? cleanText : '';
      } else if (attachment.contentType.includes('text') || attachment.filename.endsWith('.txt')) {
        return attachment.data.toString('utf-8');
      } else if (attachment.filename.endsWith('.docx')) {
        // DOCX extraction would require proper library
        const text = attachment.data.toString('utf-8');
        return text.replace(/[^\x20-\x7E\n\r]/g, ' ').trim();
      }
      
      return '';
    } catch (error) {
      console.error('Text extraction error:', error);
      return '';
    }
  }

  /**
   * Check if file type is supported for processing
   */
  private isSupportedFileType(contentType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/html'
    ];
    
    return supportedTypes.some(type => contentType.includes(type));
  }

  /**
   * Run complete ingestion cycle for all users
   */
  private async runIngestionCycle(): Promise<void> {
    try {
      let users;
      try {
        users = await storage.getAllUsers();
      } catch (dbError) {
        console.log('Database unavailable for email ingestion, skipping cycle');
        return;
      }

      console.log(`Starting ingestion cycle for ${users.length} users`);

      for (const user of users) {
        try {
          const result = await this.ingestEmails(user.id);
          if (result.processed > 0) {
            console.log(`User ${user.id}: processed ${result.processed}, classified ${result.classified} RFPs`);
          }
        } catch (error) {
          console.error(`Ingestion error for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Ingestion cycle error:', error);
    }
  }

  /**
   * Get ingestion status for a user
   */
  async getIngestionStatus(userId: string): Promise<{
    lastRun: Date | null;
    totalProcessed: number;
    recentActivity: any[];
    configuredProviders: string[];
  }> {
    try {
      const logs = await storage.getEmailIngestionLogs(userId);
      const configuredProviders = Array.from(this.providers.entries())
        .filter(([, provider]) => provider.isConfigured)
        .map(([name]) => name);

      return {
        lastRun: logs.length > 0 ? logs[0].processedAt : null,
        totalProcessed: logs.reduce((sum, log) => sum + (log.documentsExtracted || 0), 0),
        recentActivity: logs.slice(0, 10),
        configuredProviders
      };
    } catch (error) {
      console.error('Status retrieval error:', error);
      return {
        lastRun: null,
        totalProcessed: 0,
        recentActivity: [],
        configuredProviders: []
      };
    }
  }

  // Mock data for development
  private getMockEmails(): EmailMessage[] {
    return [
      {
        id: `mock_${Date.now()}`,
        subject: 'RFP: IT Infrastructure Modernization Project',
        sender: 'procurement@example.gov',
        date: new Date(),
        body: 'Please find attached the Request for Proposal for our IT infrastructure modernization initiative...',
        attachments: [
          {
            filename: 'IT_Infrastructure_RFP_2025.pdf',
            contentType: 'application/pdf',
            data: Buffer.from('Mock PDF content with RFP details...'),
            size: 1024
          }
        ]
      }
    ];
  }
}