import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

export interface ProcessedFile {
  title: string;
  extractedText: string;
  documentType: 'RFP' | 'INVOICE' | 'CONTRACT' | 'PROPOSAL' | 'OTHER';
  confidence: number;
}

export async function processUploadedFile(file: Express.Multer.File): Promise<ProcessedFile> {
  try {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let extractedText = '';
    let title = path.basename(file.originalname, fileExtension);

    if (fileExtension === '.pdf') {
      extractedText = await extractPdfText(file.path);
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      extractedText = await extractDocxText(file.path);
    } else if (['.jpg', '.jpeg', '.png', '.tiff', '.bmp'].includes(fileExtension)) {
      extractedText = await extractImageText(file.path);
    } else {
      throw new Error('Unsupported file format. Please upload PDF, DOCX, or image files.');
    }

    // Limit text length and clean up
    extractedText = extractedText.substring(0, 50000).trim();

    // Extract potential title from content
    const lines = extractedText.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && firstLine.length > 10) {
        title = firstLine;
      }
    }

    // Identify document type using AI analysis
    const documentAnalysis = await analyzeDocumentType(extractedText, title);

    return {
      title,
      extractedText,
      documentType: documentAnalysis.type,
      confidence: documentAnalysis.confidence
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process uploaded file: ${error.message}`);
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    // Dynamic import to avoid the test file issue
    const pdfParse = await import('pdf-parse');
    const pdf = pdfParse.default;
    
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      console.log('PDF text extraction failed, attempting OCR fallback');
      return await extractImageText(filePath);
    }
    
    return pdfData.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    // Fallback to OCR if regular text extraction fails
    try {
      return await extractImageText(filePath);
    } catch (ocrError) {
      console.error('OCR fallback failed:', ocrError);
      throw new Error('Failed to extract text from PDF. Please ensure the file is readable.');
    }
  }
}

async function extractDocxText(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    throw new Error('Failed to extract text from DOCX. Please ensure the file is a valid DOCX document.');
  }
}

async function extractImageText(filePath: string): Promise<string> {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image using OCR.');
  }
}

async function analyzeDocumentType(text: string, filename: string): Promise<{ type: 'RFP' | 'INVOICE' | 'CONTRACT' | 'PROPOSAL' | 'OTHER', confidence: number }> {
  try {
    // Import here to avoid circular dependency
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY || 'dummy-key');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Analyze this document and determine its type. Look for specific indicators:

      FILENAME: ${filename}
      
      CONTENT SAMPLE: ${text.substring(0, 2000)}

      Document Type Indicators:
      - RFP: "Request for Proposal", "RFP", "tender", "bid solicitation", "project requirements", "scope of work", "evaluation criteria"
      - INVOICE: "Invoice", "Bill", "Amount Due", "Payment Terms", "Invoice Number", "Billing Address", "Tax ID", currency symbols, itemized charges
      - CONTRACT: "Agreement", "Contract", "Terms and Conditions", "Party A", "Party B", "Whereas", legal language
      - PROPOSAL: "Proposal", "Executive Summary", "Solution Overview", "Implementation Plan", "Pricing", response to RFP
      - OTHER: None of the above patterns

      CRITICAL: If you see invoice-specific elements like "Invoice Number", "Amount Due", "Billing Address", "Payment Terms", or currency amounts, this is definitely an INVOICE, not an RFP.

      Respond with JSON only:
      {
        "type": "RFP|INVOICE|CONTRACT|PROPOSAL|OTHER",
        "confidence": 0.0-1.0,
        "indicators": ["key phrases that led to this classification"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const parsed = JSON.parse(responseText.replace(/```json\n?/, '').replace(/```\n?/, ''));
      return {
        type: parsed.type || 'OTHER',
        confidence: parsed.confidence || 0.5
      };
    } catch (parseError) {
      console.error('Failed to parse document type analysis:', parseError);
      // Simple keyword-based fallback
      const lowerText = text.toLowerCase();
      const lowerFilename = filename.toLowerCase();
      
      if (lowerText.includes('invoice') || lowerText.includes('bill') || lowerText.includes('amount due') || lowerFilename.includes('invoice')) {
        return { type: 'INVOICE', confidence: 0.8 };
      } else if (lowerText.includes('request for proposal') || lowerText.includes('rfp') || lowerText.includes('tender')) {
        return { type: 'RFP', confidence: 0.8 };
      } else if (lowerText.includes('contract') || lowerText.includes('agreement')) {
        return { type: 'CONTRACT', confidence: 0.7 };
      } else if (lowerText.includes('proposal') && lowerText.includes('executive summary')) {
        return { type: 'PROPOSAL', confidence: 0.7 };
      }
      
      return { type: 'OTHER', confidence: 0.3 };
    }
  } catch (error) {
    console.error('Error analyzing document type:', error);
    return { type: 'OTHER', confidence: 0.1 };
  }
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}
