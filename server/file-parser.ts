/**
 * File parsing utilities for extracting text from various file formats
 * Supports: PDF, Word (DOC/DOCX), CSV, Excel (XLS/XLSX)
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ParsedFileResult {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    format?: string;
  };
}

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedFileResult> {
  try {
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        format: 'PDF',
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Word document (DOC/DOCX) and extract text
 */
export async function parseWord(buffer: Buffer): Promise<ParsedFileResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    return {
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        format: 'Word',
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse CSV file and extract text
 * Formats as readable text with headers
 */
export function parseCSV(buffer: Buffer): ParsedFileResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    // Format as readable text
    const text = data
      .map(row => row.join(' | '))
      .join('\n');
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        format: 'CSV',
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Excel file (XLS/XLSX) and extract text
 * Formats as readable text with sheet names and headers
 */
export function parseExcel(buffer: Buffer): ParsedFileResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const allText: string[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Add sheet name as header
      allText.push(`\n--- ${sheetName} ---\n`);
      
      // Format rows as readable text
      const sheetText = data
        .map(row => row.join(' | '))
        .join('\n');
      
      allText.push(sheetText);
    });
    
    const text = allText.join('\n');
    
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        format: 'Excel',
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main file parser that detects format and calls appropriate parser
 */
export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedFileResult> {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'pdf':
      return parsePDF(buffer);
    
    case 'doc':
    case 'docx':
      return parseWord(buffer);
    
    case 'csv':
      return parseCSV(buffer);
    
    case 'xls':
    case 'xlsx':
      return parseExcel(buffer);
    
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(
  buffer: Buffer,
  filename: string,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  
  // Check file extension
  const ext = filename.toLowerCase().split('.').pop();
  const supportedFormats = ['pdf', 'doc', 'docx', 'csv', 'xls', 'xlsx'];
  
  if (!ext || !supportedFormats.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`,
    };
  }
  
  return { valid: true };
}
