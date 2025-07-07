import fs from 'fs';
import path from 'path';

export interface ProcessedFile {
  title: string;
  extractedText: string;
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
    } else {
      throw new Error('Unsupported file format');
    }

    // Extract potential title from content
    const lines = extractedText.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Use first substantial line as title if it looks like a title
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && firstLine.length > 10) {
        title = firstLine;
      }
    }

    return {
      title,
      extractedText: extractedText.substring(0, 50000) // Limit to 50k chars
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process uploaded file');
  }
}

async function extractPdfText(filePath: string): Promise<string> {
  try {
    // For now, return a placeholder since pdf-parse requires additional setup
    // In production, you would use: const pdf = await pdf.parse(fs.readFileSync(filePath));
    return `PDF content extracted from ${path.basename(filePath)}. This is a placeholder implementation. 
    In production, this would contain the actual extracted text from the PDF document using libraries like pdf-parse.
    The file has been successfully uploaded and can be processed when PDF parsing is configured.`;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'Error extracting PDF content. Please ensure the file is a valid PDF.';
  }
}

async function extractDocxText(filePath: string): Promise<string> {
  try {
    // For now, return a placeholder since mammoth requires additional setup
    // In production, you would use: const result = await mammoth.extractRawText({path: filePath});
    return `DOCX content extracted from ${path.basename(filePath)}. This is a placeholder implementation.
    In production, this would contain the actual extracted text from the DOCX document using libraries like mammoth.
    The file has been successfully uploaded and can be processed when DOCX parsing is configured.`;
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return 'Error extracting DOCX content. Please ensure the file is a valid DOCX document.';
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
