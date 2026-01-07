/**
 * Care Plan Section Parser
 * Parses care plans into individual sections for detailed analysis
 * 
 * Improved to:
 * - Filter out non-care-plan sections (assessment descriptions, metadata)
 * - Focus on actual care plan content sections
 * - Handle various care plan formats intelligently
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
 * Sections that should be EXCLUDED from analysis
 * These are typically metadata, assessment descriptions, or non-care-plan content
 */
const EXCLUDED_SECTION_PATTERNS = [
  // Assessment description sections (not actual care plans)
  /needs\s*assess(ing|ment)/i,
  /dependency\s*assessment/i,
  /physical\s*risk\s*assessment\s*description/i,
  /assessment\s*description/i,
  
  // Metadata and administrative sections
  /table\s*of\s*contents/i,
  /contents?\s*page/i,
  /index/i,
  /appendix/i,
  /glossary/i,
  /definitions/i,
  
  // Header/footer content
  /page\s*\d+/i,
  /confidential/i,
  /draft/i,
  
  // Generic non-care sections
  /introduction/i,
  /overview/i,
  /summary\s*page/i,
  /cover\s*page/i,
  /front\s*page/i,
  
  // Review history (not current care plan)
  /review\s*history/i,
  /version\s*history/i,
  /change\s*log/i,
  /audit\s*trail/i,
];

/**
 * Sections that should be INCLUDED in analysis
 * These are actual care plan sections with care content
 */
const CARE_PLAN_SECTION_KEYWORDS = [
  // Personal care
  'personal care', 'hygiene', 'bathing', 'washing', 'dressing', 'grooming', 'toileting',
  
  // Accommodation and environment
  'accommodation', 'cleanliness', 'comfort', 'environment', 'home', 'living space',
  
  // Health and medical
  'health', 'medical', 'medication', 'medicine', 'treatment', 'condition', 'illness',
  'pain', 'symptom', 'diagnosis', 'therapy',
  
  // Nutrition
  'nutrition', 'hydration', 'eating', 'drinking', 'diet', 'food', 'meal', 'swallowing',
  
  // Mobility
  'mobility', 'moving', 'handling', 'transfer', 'walking', 'positioning', 'falls',
  'wheelchair', 'equipment',
  
  // Communication
  'communication', 'speech', 'language', 'hearing', 'vision', 'sensory',
  
  // Mental health and wellbeing
  'mental health', 'wellbeing', 'emotional', 'psychological', 'anxiety', 'depression',
  'mood', 'behaviour', 'dementia', 'cognitive', 'memory',
  
  // Social and activities
  'social', 'activities', 'hobbies', 'interests', 'relationships', 'family', 'friends',
  'community', 'leisure', 'recreation',
  
  // Safety and risk
  'safety', 'risk', 'safeguarding', 'protection', 'abuse', 'neglect',
  
  // End of life
  'end of life', 'palliative', 'advance', 'wishes', 'preferences', 'dnacpr',
  
  // Capacity and consent
  'capacity', 'consent', 'mental capacity', 'best interest', 'deprivation of liberty',
  
  // Cultural and spiritual
  'cultural', 'religious', 'spiritual', 'faith', 'beliefs', 'values',
  
  // Sleep
  'sleep', 'rest', 'night', 'bedtime',
  
  // Continence
  'continence', 'bladder', 'bowel', 'incontinence',
  
  // Skin and wound care
  'skin', 'wound', 'pressure', 'ulcer', 'tissue viability',
];

/**
 * Check if a section name indicates it should be excluded
 */
function shouldExcludeSection(sectionName: string): boolean {
  const normalised = sectionName.toLowerCase().trim();
  
  // Check against exclusion patterns
  for (const pattern of EXCLUDED_SECTION_PATTERNS) {
    if (pattern.test(normalised)) {
      return true;
    }
  }
  
  // If section name is very short or just numbers, exclude it
  if (normalised.length < 5 || /^\d+\.?\s*$/.test(normalised)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a section name indicates it's a care plan section
 */
function isCarePlanSection(sectionName: string): boolean {
  const normalised = sectionName.toLowerCase().trim();
  
  // Check if any care plan keyword is present
  for (const keyword of CARE_PLAN_SECTION_KEYWORDS) {
    if (normalised.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  // Also check for numbered sections that might be care plan sections
  // e.g., "2. Accommodation Cleanliness and Comfort"
  const numberedMatch = normalised.match(/^\d+\.\s*(.+)/);
  if (numberedMatch) {
    const sectionTitle = numberedMatch[1];
    for (const keyword of CARE_PLAN_SECTION_KEYWORDS) {
      if (sectionTitle.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
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
    // Format 3: All caps headers (at least 10 chars to avoid false positives)
    /(?:^|\n)([A-Z][A-Z\s&]{10,})\n/g,
    // Format 4: Numbered sections (e.g., "2. Accommodation Cleanliness and Comfort")
    /(?:^|\n)(\d+\.\s+[A-Z][A-Za-z\s&]+)\n/g,
    // Format 5: Bold or emphasised section headers (common in Word docs)
    /(?:^|\n)\*\*([A-Z][A-Za-z\s&]+)\*\*/g,
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
  
  console.log(`[Care Plan Parser] Found ${uniqueSections.length} potential sections`);
  
  // If no sections found, treat entire document as one section
  if (uniqueSections.length === 0) {
    console.log('[Care Plan Parser] No sections detected, treating as single section');
    return [{
      section_name: 'Care Plan',
      raw_content: carePlanText,
      fields: extractFields(carePlanText),
    }];
  }
  
  // Extract content for each section and filter
  let includedCount = 0;
  let excludedCount = 0;
  
  for (let i = 0; i < uniqueSections.length; i++) {
    const currentSection = uniqueSections[i];
    const nextSection = uniqueSections[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : carePlanText.length;
    
    const sectionContent = carePlanText.substring(startIndex, endIndex).trim();
    
    // Check if this section should be excluded
    if (shouldExcludeSection(currentSection.name)) {
      console.log(`[Care Plan Parser] Excluding section: "${currentSection.name}" (matches exclusion pattern)`);
      excludedCount++;
      continue;
    }
    
    // Check if this is a care plan section (has relevant keywords)
    // If we can't determine, include it to be safe
    const isCareSection = isCarePlanSection(currentSection.name);
    
    if (!isCareSection && sectionContent.length < 100) {
      // Skip very short sections that don't appear to be care plan content
      console.log(`[Care Plan Parser] Excluding section: "${currentSection.name}" (too short and no care keywords)`);
      excludedCount++;
      continue;
    }
    
    // Include this section
    sections.push({
      section_name: currentSection.name,
      raw_content: sectionContent,
      fields: extractFields(sectionContent),
      metadata: extractMetadata(sectionContent),
    });
    includedCount++;
    console.log(`[Care Plan Parser] Including section: "${currentSection.name}"`);
  }
  
  console.log(`[Care Plan Parser] Included ${includedCount} sections, excluded ${excludedCount} sections`);
  
  // If all sections were excluded, fall back to treating as single section
  if (sections.length === 0) {
    console.log('[Care Plan Parser] All sections excluded, treating as single section');
    return [{
      section_name: 'Care Plan',
      raw_content: carePlanText,
      fields: extractFields(carePlanText),
    }];
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
