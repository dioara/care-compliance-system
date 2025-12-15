/**
 * File Extraction Service
 * Extracts text content from PDF and Word documents
 */

// @ts-ignore - pdf-parse doesn't have proper ESM exports
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

/**
 * Extract text from a PDF file buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF document.");
  }
}

/**
 * Extract text from a Word document buffer (.docx)
 */
export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("Word extraction error:", error);
    throw new Error("Failed to extract text from Word document. Please ensure the file is a valid .docx file.");
  }
}

/**
 * Detect file type from buffer and extract text
 */
export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const extension = filename.toLowerCase().split(".").pop();
  
  switch (extension) {
    case "pdf":
      return extractTextFromPDF(buffer);
    case "docx":
      return extractTextFromWord(buffer);
    case "doc":
      throw new Error("Legacy .doc files are not supported. Please convert to .docx format.");
    case "txt":
      return buffer.toString("utf-8").trim();
    default:
      throw new Error(`Unsupported file type: .${extension}. Please upload a PDF, Word (.docx), or text file.`);
  }
}

/**
 * Get supported file types for upload
 */
export function getSupportedFileTypes(): string[] {
  return [".pdf", ".docx", ".txt"];
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(sizeInBytes: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}
