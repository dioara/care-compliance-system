/**
 * Anonymization utilities for care plans and care notes
 * Converts full names to initials (e.g., "Anthony Hicks" -> "AH")
 */

interface NameMapping {
  original: string;
  abbreviated: string;
}

/**
 * Extract potential names from text
 * Looks for capitalized words that could be names
 */
function extractPotentialNames(text: string): string[] {
  // Match sequences of 2-4 capitalized words (likely names)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const matches = text.match(namePattern) || [];
  
  // Filter out common words that aren't names
  const commonWords = new Set([
    'The', 'This', 'That', 'These', 'Those',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);
  
  return matches.filter(name => {
    const words = name.split(' ');
    return !words.some(word => commonWords.has(word));
  });
}

/**
 * Convert a full name to initials
 * "Anthony Hicks" -> "AH"
 * "John Paul Smith" -> "JPS"
 */
function nameToInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Anonymize text by replacing names with initials
 * Returns both the anonymized text and the mapping of names
 */
export function anonymizeText(text: string): {
  anonymizedText: string;
  nameMappings: NameMapping[];
} {
  const names = extractPotentialNames(text);
  const uniqueNames = Array.from(new Set(names));
  
  const nameMappings: NameMapping[] = uniqueNames.map(name => ({
    original: name,
    abbreviated: nameToInitials(name),
  }));
  
  let anonymizedText = text;
  
  // Replace names with initials (longest names first to avoid partial replacements)
  nameMappings
    .sort((a, b) => b.original.length - a.original.length)
    .forEach(({ original, abbreviated }) => {
      // Use word boundaries to avoid partial replacements
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      anonymizedText = anonymizedText.replace(regex, abbreviated);
    });
  
  return {
    anonymizedText,
    nameMappings,
  };
}

/**
 * De-anonymize text by replacing initials back with original names
 */
export function deanonymizeText(
  text: string,
  nameMappings: NameMapping[]
): string {
  let deanonymizedText = text;
  
  // Replace initials with original names (longest abbreviations first)
  nameMappings
    .sort((a, b) => b.abbreviated.length - a.abbreviated.length)
    .forEach(({ original, abbreviated }) => {
      const regex = new RegExp(`\\b${abbreviated}\\b`, 'g');
      deanonymizedText = deanonymizedText.replace(regex, original);
    });
  
  return deanonymizedText;
}

/**
 * Anonymize a specific name if provided
 * Used when the user provides the service user name explicitly
 */
export function anonymizeSpecificName(
  text: string,
  nameToAnonymize: string
): {
  anonymizedText: string;
  abbreviation: string;
} {
  const abbreviation = nameToInitials(nameToAnonymize);
  const regex = new RegExp(`\\b${nameToAnonymize}\\b`, 'g');
  const anonymizedText = text.replace(regex, abbreviation);
  
  return {
    anonymizedText,
    abbreviation,
  };
}
