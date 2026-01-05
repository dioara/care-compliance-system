/**
 * Care Plan Section Parser
 * Parses care plans into individual sections for detailed analysis
 */

export interface CarePlanSection {
  section_name: string;
  raw_content: string;
  fields: {
    identified_need?: string;
    planned_outcomes?: string;
    how_to_achieve?: string;
    risk?: string;
    [key: string]: string | undefined;
  };
  metadata?: {
    next_review_date?: string;
    level_of_need?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Parse a care plan into sections
 * Handles various care plan formats and structures
 */
export function parseCarePlanIntoSections(carePlanText: string): CarePlanSection[] {
  const sections: CarePlanSection[] = [];
  
  // Common section headers in care plans
  const sectionPatterns = [
    // Format 1: "Section: Name" or "SECTION: NAME"
    /(?:^|\n)(?:Section|SECTION):\s*([^\n]+)/gi,
    // Format 2: Headers with underlines or borders
    /(?:^|\n)([A-Z][A-Za-z\s&]+(?:Cleanliness|Care|Hygiene|Nutrition|Mobility|Communication|Health|Wellbeing|Social|Activities|Medication|Risk|Safety|End of Life|Capacity|Consent|Cultural|Religious)[^\n]*)\n[=\-_]{3,}/gi,
    // Format 3: All caps headers
    /(?:^|\n)([A-Z][A-Z\s&]{10,})\n/g,
    // Format 4: Numbered sections
    /(?:^|\n)(\d+\.\s+[A-Z][A-Za-z\s&]+)\n/g,
  ];
  
  // Try to find section boundaries
  const sectionMatches: Array<{ name: string; index: number }> = [];
  
  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.exec(carePlanText)) !== null) {
      const sectionName = match[1].trim();
      // Filter out very short matches or common words
      if (sectionName.length > 5 && !sectionName.match(/^(The|This|That|When|Where|How|What|Why)$/i)) {
        sectionMatches.push({
          name: sectionName,
          index: match.index,
        });
      }
    }
  }
  
  // Sort by index
  sectionMatches.sort((a, b) => a.index - b.index);
  
  // Remove duplicates (same index or very close)
  const uniqueSections: Array<{ name: string; index: number }> = [];
  for (const section of sectionMatches) {
    const isDuplicate = uniqueSections.some(
      s => Math.abs(s.index - section.index) < 50
    );
    if (!isDuplicate) {
      uniqueSections.push(section);
    }
  }
  
  // If no sections found, treat entire document as one section
  if (uniqueSections.length === 0) {
    return [{
      section_name: 'Care Plan',
      raw_content: carePlanText,
      fields: extractFields(carePlanText),
    }];
  }
  
  // Extract content for each section
  for (let i = 0; i < uniqueSections.length; i++) {
    const currentSection = uniqueSections[i];
    const nextSection = uniqueSections[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : carePlanText.length;
    
    const sectionContent = carePlanText.substring(startIndex, endIndex).trim();
    
    sections.push({
      section_name: currentSection.name,
      raw_content: sectionContent,
      fields: extractFields(sectionContent),
      metadata: extractMetadata(sectionContent),
    });
  }
  
  return sections;
}

/**
 * Extract structured fields from section content
 */
function extractFields(content: string): CarePlanSection['fields'] {
  const fields: CarePlanSection['fields'] = {};
  
  // Common field patterns
  const fieldPatterns = [
    { name: 'identified_need', patterns: [/Identified Need[:\s]*([^\n]+(?:\n(?!(?:Planned|How|Risk|Review))[^\n]+)*)/i] },
    { name: 'planned_outcomes', patterns: [/Planned Outcomes?[:\s]*([^\n]+(?:\n(?!(?:How|Risk|Review))[^\n]+)*)/i] },
    { name: 'how_to_achieve', patterns: [/How to Achieve[:\s]*([^\n]+(?:\n(?!(?:Risk|Review))[^\n]+)*)/i] },
    { name: 'risk', patterns: [/Risk[:\s]*([^\n]+(?:\n(?!(?:Review))[^\n]+)*)/i] },
  ];
  
  for (const field of fieldPatterns) {
    for (const pattern of field.patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        fields[field.name] = match[1].trim();
        break;
      }
    }
  }
  
  return fields;
}

/**
 * Extract metadata from section content
 */
function extractMetadata(content: string): CarePlanSection['metadata'] {
  const metadata: CarePlanSection['metadata'] = {};
  
  // Extract review date
  const reviewDateMatch = content.match(/(?:Next\s+)?Review\s+Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (reviewDateMatch) {
    metadata.next_review_date = reviewDateMatch[1];
  }
  
  // Extract level of need
  const levelMatch = content.match(/Level\s+of\s+Need[:\s]*(\d+\s*-\s*[^\n]+)/i);
  if (levelMatch) {
    metadata.level_of_need = levelMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Validate that sections were parsed correctly
 */
export function validateSections(sections: CarePlanSection[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (sections.length === 0) {
    issues.push('No sections found in care plan');
  }
  
  for (const section of sections) {
    if (!section.section_name || section.section_name.length < 3) {
      issues.push(`Invalid section name: "${section.section_name}"`);
    }
    
    if (!section.raw_content || section.raw_content.length < 10) {
      issues.push(`Section "${section.section_name}" has insufficient content`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
