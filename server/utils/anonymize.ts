/**
 * Document Anonymization Utility
 * 
 * Converts full names to initials and removes/redacts PII from documents
 * before sending to OpenAI for analysis.
 * 
 * This ensures GDPR compliance and protects service user privacy.
 */

// Common UK name patterns
const NAME_PATTERNS = [
  // Full names (First Last, First Middle Last)
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  // Mr/Mrs/Ms/Dr titles with names
  /\b((?:Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
];

// PII patterns to redact
const PII_PATTERNS = {
  // UK National Insurance Number
  niNumber: /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Z]\b/gi,
  // UK Phone numbers
  phoneUK: /\b(?:0|\+44)\s?\d{2,4}\s?\d{3,4}\s?\d{3,4}\b/g,
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // UK Postcodes
  postcode: /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/gi,
  // NHS Numbers (10 digits, often formatted as XXX XXX XXXX)
  nhsNumber: /\b\d{3}\s?\d{3}\s?\d{4}\b/g,
  // Dates of birth (various formats)
  dob: /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g,
  // UK Bank account numbers (8 digits)
  bankAccount: /\b\d{8}\b/g,
  // UK Sort codes
  sortCode: /\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\b/g,
  // Credit card numbers
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // UK addresses (house number + street)
  streetAddress: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Road|Avenue|Lane|Drive|Close|Way|Court|Place|Gardens|Crescent|Terrace|Grove|Park|Square|Hill|View|Rise|Walk|Mews)\b/gi,
};

/**
 * Convert a full name to initials
 * e.g., "John Smith" -> "J.S.", "Mary Jane Watson" -> "M.J.W."
 */
export function nameToInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  // Remove titles
  const filteredParts = parts.filter(
    part => !['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'].includes(part)
  );
  
  if (filteredParts.length === 0) return '[REDACTED]';
  
  const initials = filteredParts
    .map(part => part.charAt(0).toUpperCase())
    .join('.');
  
  return initials + '.';
}

/**
 * Find and track all names in the document for consistent replacement
 */
function findAllNames(text: string): Map<string, string> {
  const nameMap = new Map<string, string>();
  
  for (const pattern of NAME_PATTERNS) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const fullName = match[1] || match[0];
      if (!nameMap.has(fullName)) {
        nameMap.set(fullName, nameToInitials(fullName));
      }
    }
  }
  
  return nameMap;
}

/**
 * Anonymize a document by converting names to initials and redacting PII
 * 
 * @param text - The document text to anonymize
 * @param options - Configuration options
 * @returns Anonymized text and a summary of redactions made
 */
export function anonymizeDocument(
  text: string,
  options: {
    preserveStructure?: boolean;  // Keep document structure intact
    redactDates?: boolean;        // Redact dates (default: false, as dates may be clinically relevant)
    customNames?: string[];       // Additional names to anonymize
  } = {}
): {
  anonymizedText: string;
  redactionSummary: {
    namesRedacted: number;
    piiRedacted: Record<string, number>;
    nameMapping: Record<string, string>;
  };
} {
  let result = text;
  const redactionSummary = {
    namesRedacted: 0,
    piiRedacted: {} as Record<string, number>,
    nameMapping: {} as Record<string, string>,
  };

  // Find all names first for consistent replacement
  const nameMap = findAllNames(text);
  
  // Add custom names if provided
  if (options.customNames) {
    for (const name of options.customNames) {
      if (!nameMap.has(name)) {
        nameMap.set(name, nameToInitials(name));
      }
    }
  }

  // Replace names with initials (longest names first to avoid partial matches)
  const sortedNames = Array.from(nameMap.entries()).sort((a, b) => b[0].length - a[0].length);
  
  for (const [fullName, initials] of sortedNames) {
    const escapedName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`\\b${escapedName}\\b`, 'gi');
    const matches = result.match(nameRegex);
    if (matches) {
      redactionSummary.namesRedacted += matches.length;
      redactionSummary.nameMapping[fullName] = initials;
    }
    result = result.replace(nameRegex, initials);
  }

  // Redact PII patterns
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    // Skip dates if not requested
    if (piiType === 'dob' && !options.redactDates) continue;
    
    const matches = result.match(pattern);
    if (matches) {
      redactionSummary.piiRedacted[piiType] = matches.length;
      result = result.replace(pattern, `[${piiType.toUpperCase()}_REDACTED]`);
    }
  }

  return {
    anonymizedText: result,
    redactionSummary,
  };
}

/**
 * Validate that a document has been properly anonymized
 * Returns any potential PII that may have been missed
 */
export function validateAnonymization(text: string): {
  isClean: boolean;
  potentialIssues: string[];
} {
  const issues: string[] = [];

  // Check for remaining full names (2+ capitalized words in sequence)
  const possibleNames = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (possibleNames && possibleNames.length > 0) {
    // Filter out common phrases that aren't names
    const commonPhrases = ['Care Plan', 'Daily Notes', 'Risk Assessment', 'Mental Capacity', 'Best Interest'];
    const suspiciousNames = possibleNames.filter(name => !commonPhrases.includes(name));
    if (suspiciousNames.length > 0) {
      issues.push(`Possible names found: ${suspiciousNames.slice(0, 5).join(', ')}`);
    }
  }

  // Check for remaining PII patterns
  for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
    if (text.match(pattern)) {
      issues.push(`Possible ${piiType} found`);
    }
  }

  return {
    isClean: issues.length === 0,
    potentialIssues: issues,
  };
}

/**
 * Create an anonymization report for audit trail
 */
export function createAnonymizationReport(
  originalLength: number,
  redactionSummary: {
    namesRedacted: number;
    piiRedacted: Record<string, number>;
    nameMapping: Record<string, string>;
  }
): string {
  const totalPiiRedacted = Object.values(redactionSummary.piiRedacted).reduce((a, b) => a + b, 0);
  
  let report = `## Anonymization Report\n\n`;
  report += `**Original document length:** ${originalLength} characters\n\n`;
  report += `### Names Converted to Initials\n`;
  report += `- Total names anonymized: ${redactionSummary.namesRedacted}\n`;
  
  if (Object.keys(redactionSummary.nameMapping).length > 0) {
    report += `- Conversions made:\n`;
    for (const [name, initials] of Object.entries(redactionSummary.nameMapping)) {
      report += `  - "${name}" → "${initials}"\n`;
    }
  }
  
  report += `\n### PII Redacted\n`;
  report += `- Total PII items redacted: ${totalPiiRedacted}\n`;
  
  if (totalPiiRedacted > 0) {
    report += `- Breakdown:\n`;
    for (const [type, count] of Object.entries(redactionSummary.piiRedacted)) {
      report += `  - ${type}: ${count}\n`;
    }
  }
  
  report += `\n---\n`;
  report += `*This document has been anonymized for GDPR compliance before AI analysis.*\n`;
  
  return report;
}
