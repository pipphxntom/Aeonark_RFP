import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { documentClassifier, type DocumentClassification } from './documentClassifier';

export interface ProcessedFile {
  title: string;
  extractedText: string;
  documentType: 'RFP' | 'RFQ' | 'Invoice' | 'Resume' | 'Email' | 'Legal' | 'Proposal' | 'Unknown';
  confidence: number;
  classification: DocumentClassification;
  isValidRFP: boolean;
  fitScore: number;
  rejectionReason?: string;
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

    // Clean and normalize the text
    extractedText = documentClassifier.cleanDocumentText(extractedText);
    extractedText = extractedText.substring(0, 50000).trim();

    // Extract potential title from content
    const lines = extractedText.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && firstLine.length > 10) {
        title = firstLine;
      }
    }

    // Use advanced document classification
    const classification = await documentClassifier.classifyDocument(extractedText);
    
    // Check if document should be rejected
    if (!classification.isValidRFP || classification.fitScore < 30) {
      return {
        title,
        extractedText,
        documentType: classification.type,
        confidence: classification.confidence,
        classification,
        isValidRFP: false,
        fitScore: classification.fitScore,
        rejectionReason: classification.reason
      };
    }

    return {
      title,
      extractedText,
      documentType: classification.type,
      confidence: classification.confidence,
      classification,
      isValidRFP: classification.isValidRFP,
      fitScore: classification.fitScore
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process uploaded file: ${error.message}`);
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    // Use pdfjs-dist for pure JavaScript PDF text extraction
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // Read the PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = '';
    
    // Extract text from all pages (limit to first 10 pages for performance)
    const numPages = Math.min(pdf.numPages, 10);
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('No text content found in PDF. The file may be image-based or corrupted.');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file contains readable text content.');
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
    // Check if the file exists and is readable
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status !== 'recognizing text') {
          console.log(m);
        }
      }
    });
    
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image using OCR.');
  }
}

// Legacy analyzeDocumentType function removed - now using DocumentClassifier

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}
