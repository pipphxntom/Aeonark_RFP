import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import { DocumentClassifier } from './documentClassifier';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  senderEmail: string;
  date: Date;
  snippet: string;
  body: string;
  attachments: GmailAttachment[];
  hasAttachments: boolean;
  labels: string[];
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: Buffer;
}

export interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  summary: string;
  isRfp: boolean;
  confidence: number;
  timestamp: string;
  attachmentCount: number;
  attachments: string[];
  snippet: string;
}

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private classifier: DocumentClassifier;

  constructor() {
    // Use same redirect URI logic as oauthService
    let redirectUri = 'http://localhost:5000/api/auth/google/callback';
    
    if (process.env.REPLIT_DOMAINS) {
      redirectUri = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      redirectUri = `https://${process.env.REPL_SLUG}--5000--${process.env.REPL_OWNER}.replit.app/api/auth/google/callback`;
    }

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    this.classifier = new DocumentClassifier();
  }

  /**
   * Set OAuth tokens for authenticated user
   */
  async setCredentials(userId: string): Promise<boolean> {
    try {
      const oauthTokens = await storage.getOAuthTokens(userId, 'gmail');
      if (!oauthTokens) {
        throw new Error('No OAuth tokens found for user');
      }

      this.oauth2Client.setCredentials({
        access_token: oauthTokens.accessToken,
        refresh_token: oauthTokens.refreshToken,
        scope: oauthTokens.scope,
        token_type: 'Bearer',
        expiry_date: new Date(oauthTokens.expiresAt).getTime()
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      return true;
    } catch (error) {
      console.error('Failed to set Gmail credentials:', error);
      return false;
    }
  }

  /**
   * Fetch recent emails with attachments
   */
  async fetchEmailsWithAttachments(userId: string, maxResults: number = 20): Promise<GmailMessage[]> {
    if (!await this.setCredentials(userId)) {
      throw new Error('Failed to authenticate with Gmail');
    }

    try {
      // Search for emails with attachments in the last 30 days
      const query = 'has:attachment newer_than:30d';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const detailedMessages: GmailMessage[] = [];

      for (const message of messages) {
        try {
          const detailedMessage = await this.getMessageDetails(message.id);
          if (detailedMessage && detailedMessage.hasAttachments) {
            detailedMessages.push(detailedMessage);
          }
        } catch (error) {
          console.error(`Failed to fetch message details for ${message.id}:`, error);
        }
      }

      return detailedMessages;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  /**
   * Get detailed message information
   */
  private async getMessageDetails(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers || [];
      
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      
      // Parse sender info
      const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
      const senderName = senderMatch?.[1]?.trim() || from;
      const senderEmail = senderMatch?.[2]?.trim() || from;

      // Extract body text
      const body = this.extractBodyText(message.payload);
      
      // Extract attachments
      const attachments = this.extractAttachments(message.payload);
      
      return {
        id: messageId,
        threadId: message.threadId,
        subject,
        sender: senderName,
        senderEmail,
        date: new Date(date),
        snippet: message.snippet || '',
        body,
        attachments,
        hasAttachments: attachments.length > 0,
        labels: message.labelIds || []
      };
    } catch (error) {
      console.error(`Error getting message details for ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Extract body text from message payload
   */
  private extractBodyText(payload: any): string {
    let body = '';

    if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data && !body) {
          // Fallback to HTML if no plain text
          const htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
          body = htmlBody.replace(/<[^>]*>/g, ''); // Strip HTML tags
        }
      }
    }

    return body;
  }

  /**
   * Extract attachment information from message payload
   */
  private extractAttachments(payload: any): GmailAttachment[] {
    const attachments: GmailAttachment[] = [];

    const extractFromParts = (parts: any[]) => {
      for (const part of parts) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId
          });
        }
        
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  /**
   * Download attachment data
   */
  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer | null> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      if (response.data.data) {
        return Buffer.from(response.data.data, 'base64');
      }
      
      return null;
    } catch (error) {
      console.error(`Error downloading attachment ${attachmentId}:`, error);
      return null;
    }
  }

  /**
   * Generate email summary and RFP classification
   */
  async generateEmailSummary(message: GmailMessage): Promise<EmailSummary> {
    try {
      const emailContent = `
        Subject: ${message.subject}
        From: ${message.sender} <${message.senderEmail}>
        Body: ${message.body}
        Attachments: ${message.attachments.map(a => a.filename).join(', ')}
      `;

      const classification = await this.classifier.classifyDocument(
        emailContent,
        message.subject
      );

      // Determine if this looks like an RFP based on classification
      const isRfp = classification.isRFP && classification.confidence > 0.6;
      
      return {
        id: message.id,
        subject: message.subject,
        sender: message.sender,
        senderEmail: message.senderEmail,
        summary: classification.summary || message.snippet,
        isRfp,
        confidence: classification.confidence,
        timestamp: this.formatTimestamp(message.date),
        attachmentCount: message.attachments.length,
        attachments: message.attachments.map(a => a.filename),
        snippet: message.snippet
      };
    } catch (error) {
      console.error('Error generating email summary:', error);
      
      // Fallback summary
      return {
        id: message.id,
        subject: message.subject,
        sender: message.sender,
        senderEmail: message.senderEmail,
        summary: message.snippet || 'No summary available',
        isRfp: false,
        confidence: 0,
        timestamp: this.formatTimestamp(message.date),
        attachmentCount: message.attachments.length,
        attachments: message.attachments.map(a => a.filename),
        snippet: message.snippet
      };
    }
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  }

  /**
   * Create RFP from email with attachments
   */
  async createRfpFromEmail(userId: string, messageId: string): Promise<any> {
    try {
      const messages = await this.fetchEmailsWithAttachments(userId, 50);
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        throw new Error('Email not found');
      }

      // Process attachments to find RFP documents
      const rfpAttachments = [];
      
      for (const attachment of message.attachments) {
        if (this.isRfpDocument(attachment.filename)) {
          const data = await this.downloadAttachment(messageId, attachment.attachmentId);
          if (data) {
            rfpAttachments.push({
              ...attachment,
              data
            });
          }
        }
      }

      if (rfpAttachments.length === 0) {
        throw new Error('No RFP documents found in email attachments');
      }

      // For now, process the first RFP attachment
      const primaryAttachment = rfpAttachments[0];
      
      // Save attachment to filesystem first 
      const fs = require('fs').promises;
      const path = require('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
      
      // Save the attachment file
      const timestamp = Date.now();
      const sanitizedFilename = primaryAttachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const savedFileName = `gmail_${timestamp}_${sanitizedFilename}`;
      const filePath = path.join(uploadsDir, savedFileName);
      
      await fs.writeFile(filePath, primaryAttachment.data);
      
      // Create RFP record with proper file_url
      const rfpData = {
        userId,
        title: `${message.subject} - ${primaryAttachment.filename}`,
        description: `RFP document imported from Gmail: ${message.senderEmail}`,
        fileName: primaryAttachment.filename,
        fileUrl: `/uploads/${savedFileName}`, // Required field
        fileSize: primaryAttachment.size,
        extractedText: message.body,
        status: "uploaded" as const
      };

      const rfp = await storage.createRfp(rfpData);
      return rfp;
    } catch (error) {
      console.error('Error creating RFP from email:', error);
      throw error;
    }
  }

  /**
   * Check if filename suggests RFP document
   */
  private isRfpDocument(filename: string): boolean {
    const rfpKeywords = [
      'rfp', 'request for proposal', 'proposal', 'rfq', 'request for quote',
      'tender', 'bid', 'solicitation', 'procurement'
    ];
    
    const lowerFilename = filename.toLowerCase();
    return rfpKeywords.some(keyword => lowerFilename.includes(keyword)) ||
           lowerFilename.includes('.pdf') || lowerFilename.includes('.docx');
  }
}

export const gmailService = new GmailService();