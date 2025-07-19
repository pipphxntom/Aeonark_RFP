import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export interface DocumentClassification {
  type: 'RFP' | 'RFQ' | 'Invoice' | 'Resume' | 'Email' | 'Legal' | 'Proposal' | 'Unknown';
  confidence: number;
  fitScore: number;
  reason: string;
  extractedSections: {
    scope?: string;
    deliverables?: string;
    deadline?: string;
    evaluation?: string;
    eligibility?: string;
  };
  keywords: string[];
  isValidRFP: boolean;
}

export class DocumentClassifier {
  
  /**
   * Classify document type and validate if it's a real RFP/RFQ
   */
  async classifyDocument(text: string): Promise<DocumentClassification> {
    console.log('🔍 Starting document classification...');
    
    if (!process.env.GOOGLE_API_KEY) {
      console.log('⚠️ Google API key not configured, using fallback');
      return this.getFallbackClassification(text);
    }

    try {
      console.log('🤖 Using Gemini AI for classification...');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
You are a document classification expert. Analyze this document and provide a structured response.

CLASSIFICATION TASK:
1. Identify the document type from: RFP, RFQ, Invoice, Resume, Email, Legal, Proposal, Unknown
2. Extract RFP-relevant sections if present
3. Score the document's fit for proposal generation (0-100)
4. Validate if this is a legitimate RFP/RFQ

DOCUMENT TEXT:
${text.substring(0, 8000)} // Limit to prevent token overflow

RESPONSE FORMAT (JSON only):
{
  "type": "RFP|RFQ|Invoice|Resume|Email|Legal|Proposal|Unknown",
  "confidence": 0-100,
  "fitScore": 0-100,
  "reason": "Brief explanation of classification",
  "extractedSections": {
    "scope": "extracted scope text or null",
    "deliverables": "extracted deliverables or null", 
    "deadline": "extracted deadline or null",
    "evaluation": "evaluation criteria or null",
    "eligibility": "eligibility requirements or null"
  },
  "keywords": ["list", "of", "key", "terms", "found"],
  "isValidRFP": true/false
}

VALIDATION RULES:
- Set fitScore = 0 if document contains: "Invoice No.", "Total Due", "Billed To", "Payment Terms"
- Set fitScore = 0 if missing ALL of: scope, deliverables, deadline, evaluation criteria
- Set isValidRFP = false for invoices, receipts, emails, resumes
- Set isValidRFP = true only for documents with clear RFP/RFQ structure
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const classification = JSON.parse(jsonMatch[0]) as DocumentClassification;
      
      // Apply additional validation rules
      classification.isValidRFP = this.validateRFP(text, classification);
      
      return classification;
      
    } catch (error) {
      console.error('Document classification failed:', error);
      console.log('🔄 Falling back to keyword-based classification...');
      return this.getFallbackClassification(text);
    }
  }
  
  /**
   * Fallback classification method using keyword detection
   */
  private getFallbackClassification(text: string): DocumentClassification {
    console.log('📝 Using fallback classification system...');
    
    const lowerText = text.toLowerCase();
    const rfpKeywords = ['request for proposal', 'rfp', 'rfq', 'request for quotation', 'scope of work', 'deliverables', 'timeline', 'proposal submission'];
    const invoiceKeywords = ['invoice', 'invoice number', 'bill to', 'payment due', 'total amount', 'invoice date'];
    const resumeKeywords = ['experience', 'education', 'skills', 'employment', 'resume', 'cv', 'curriculum vitae'];
    
    let type: DocumentClassification['type'] = 'RFP'; // Default to RFP
    let fitScore = 75; // Default high score to allow through
    let isValidRFP = true; // Default to valid
    let reason = 'Document accepted as business document (fallback classification)';
    
    // Simple keyword-based classification
    if (rfpKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'RFP';
      fitScore = 85;
      isValidRFP = true;
      reason = 'RFP keywords detected';
      console.log('✅ RFP keywords found, classifying as RFP');
    } else if (invoiceKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'Invoice';
      fitScore = 0;
      isValidRFP = false;
      reason = 'Invoice keywords detected';
      console.log('❌ Invoice keywords found, rejecting');
    } else if (resumeKeywords.some(keyword => lowerText.includes(keyword))) {
      type = 'Resume';
      fitScore = 0;
      isValidRFP = false;
      reason = 'Resume keywords detected';
      console.log('❌ Resume keywords found, rejecting');
    } else {
      // Default case - accept as business document
      console.log('✅ No specific keywords found, accepting as business document');
    }
    
    const result = {
      type,
      confidence: 60,
      fitScore,
      reason,
      extractedSections: {
        scope: text.includes('scope') ? 'Document contains scope-related content' : undefined,
        deliverables: text.includes('deliverable') ? 'Document mentions deliverables' : undefined
      },
      keywords: rfpKeywords.filter(keyword => lowerText.includes(keyword)),
      isValidRFP
    };
    
    console.log(`📊 Classification result: ${type}, fitScore: ${fitScore}, valid: ${isValidRFP}`);
    return result;
  }
  
  /**
   * Additional validation rules for RFP documents
   */
  private validateRFP(text: string, classification: DocumentClassification): boolean {
    const lowerText = text.toLowerCase();
    
    // Reject if contains invoice/receipt keywords
    const invoiceKeywords = [
      'invoice no.', 'invoice number', 'total due', 'billed to', 
      'payment terms', 'remit to', 'tax id', 'account payable'
    ];
    
    const hasInvoiceKeywords = invoiceKeywords.some(keyword => 
      lowerText.includes(keyword)
    );
    
    if (hasInvoiceKeywords) {
      return false;
    }
    
    // Check for RFP structure keywords
    const rfpKeywords = [
      'request for proposal', 'request for quotation', 'rfp', 'rfq',
      'scope of work', 'deliverables', 'proposal deadline', 
      'evaluation criteria', 'eligibility', 'requirements'
    ];
    
    const hasRFPKeywords = rfpKeywords.some(keyword => 
      lowerText.includes(keyword)
    );
    
    // Must have RFP keywords and valid sections
    const hasValidSections = Object.values(classification.extractedSections)
      .some(section => section && section.length > 10);
    
    return hasRFPKeywords && hasValidSections && classification.type === 'RFP';
  }
  
  /**
   * Clean and normalize PDF content before classification
   */
  cleanDocumentText(rawText: string): string {
    // Remove headers, footers, watermarks, and excessive whitespace
    let cleaned = rawText
      .replace(/^.*?(?=\n)/gm, '') // Remove potential headers
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\,\;\:\!\?\-\(\)]/g, '') // Remove special characters
      .trim();
    
    // Remove common PDF artifacts
    const artifacts = [
      /page \d+ of \d+/gi,
      /confidential/gi,
      /proprietary/gi,
      /watermark/gi
    ];
    
    artifacts.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }
}

export const documentClassifier = new DocumentClassifier();