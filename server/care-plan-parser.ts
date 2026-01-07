/**
 * Care Plan Section Parser
 * Parses care plans into individual sections for detailed analysis
 * 
 * Supports multiple formats:
 * - Nourish PDF exports
 * - Copy/paste text
 * - Word documents
 * - Excel exports
 * - Other care management system formats
 */

export interface CarePlanSection {
  section_name: string;
  raw_content: string;
  fields: {
    identified_need?: string;
    planned_outcomes?: string;
    how_to_achieve?: string;
    risk?: string;
    risk_likelihood?: string;
    risk_impact?: string;
    risk_score?: string;
    level_of_need?: string;
    [key: string]: string | undefined;
  };
  metadata?: {
    next_review_date?: string;
    level_of_need?: string;
    reviewer?: string;
    review_date?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Metadata and footer patterns to remove from content
 * These appear in Nourish and other care management systems
 */
const METADATA_PATTERNS_TO_REMOVE = [
  // Nourish footer patterns
  /Page\s*\d+\s*of\s*\d+/gi,
  /Created\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*-?\s*\d{1,2}:\d{2}/gi,
  /by\s*©?\s*Nourish\s*Care\s*Systems?\s*Ltd\.?/gi,
  /©\s*Nourish\s*Care\s*Systems?\s*Ltd\.?/gi,
  
  // Generic footer patterns
  /Page\s*\d+/gi,
  /Confidential/gi,
  /Draft/gi,
  
  // Report generation timestamps
  /Report\s*(?:run|generated)\s*(?:on)?\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*\d{1,2}:\d{2}/gi,
];

/**
 * Section categories to EXCLUDE from analysis
 * These are assessments, not care plans
 */
const EXCLUDED_SECTION_TYPES = [
  'needs assessing',
  'dependency assessment',
  'physical risk assessment',
  'pre-assessment',
  'pre assessment',
  'initial assessment',
  'assessment description',
  'table of contents',
  'contents page',
  'index',
  'appendix',
  'glossary',
  'introduction',
  'overview',
  'summary page',
  'cover page',
  'front page',
  'review history',
  'version history',
  'change log',
  'audit trail',
];

/**
 * Valid care plan section titles (normalised)
 * Used to identify actual care plan content
 */
const CARE_PLAN_SECTION_TITLES = [
  'accommodation cleanliness and comfort',
  'accommodation',
  'breathing',
  'respiratory',
  'communication and senses',
  'communication',
  'senses',
  'hearing',
  'vision',
  'companionship social interaction and recreation',
  'companionship',
  'social interaction',
  'recreation',
  'daily routine',
  'routine',
  'dying well',
  'end of life',
  'palliative',
  'eating and drinking',
  'eating',
  'drinking',
  'nutrition',
  'hydration',
  'diet',
  'emotional wellbeing',
  'emotional',
  'wellbeing',
  'mental health',
  'psychological',
  'expressing sexuality',
  'sexuality',
  'intimate',
  'maintaining a safe environment',
  'safe environment',
  'safety',
  'safeguarding',
  'medication',
  'medicines',
  'mobility',
  'moving and handling',
  'moving',
  'transfers',
  'falls',
  'personal care',
  'personal hygiene',
  'hygiene',
  'washing',
  'bathing',
  'dressing',
  'grooming',
  'toileting',
  'continence',
  'rest and sleep',
  'rest',
  'sleep',
  'night',
  'skin integrity',
  'skin',
  'wound',
  'pressure',
  'tissue viability',
  'working and playing',
  'activities',
  'hobbies',
  'interests',
  'cultural',
  'religious',
  'spiritual',
  'faith',
  'capacity',
  'consent',
  'mental capacity',
  'best interest',
  'deprivation of liberty',
  'behaviour',
  'behaviors that challenge',
  'challenging behaviour',
  'dementia',
  'cognitive',
  'memory',
  'pain',
  'pain management',
];

/**
 * Clean metadata and footers from text content
 */
function cleanMetadata(text: string): string {
  let cleaned = text;
  
  for (const pattern of METADATA_PATTERNS_TO_REMOVE) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove lines that are just whitespace
  cleaned = cleaned.split('\n').filter(line => line.trim().length > 0 || line === '').join('\n');
  
  return cleaned.trim();
}

/**
 * Check if a section title should be excluded
 */
function shouldExcludeSection(title: string): boolean {
  const normalised = title.toLowerCase().trim();
  
  for (const excluded of EXCLUDED_SECTION_TYPES) {
    if (normalised.includes(excluded)) {
      return true;
    }
  }
  
  // Exclude very short titles (likely parsing errors)
  if (normalised.length < 3) {
    return true;
  }
  
  // Exclude titles that are just numbers
  if (/^\d+\.?\s*$/.test(normalised)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a title matches a known care plan section
 */
function isKnownCarePlanSection(title: string): boolean {
  const normalised = title.toLowerCase().trim();
  
  for (const known of CARE_PLAN_SECTION_TITLES) {
    if (normalised.includes(known) || known.includes(normalised)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if the content is from Nourish care system
 */
function isNourishFormat(text: string): boolean {
  const nourishIndicators = [
    /nourish\s*care\s*systems?/i,
    /2\.\s*Care\s*Plans/i,
    /1\.\s*Needs\s*Assessing/i,
    /Level\s*of\s*need\s*\d\s*-/i,
    /Next\s*review\s*date/i,
    /How\s*to\s*Achieve\s*Outcomes/i,
  ];
  
  let matches = 0;
  for (const indicator of nourishIndicators) {
    if (indicator.test(text)) {
      matches++;
    }
  }
  
  return matches >= 2;
}

/**
 * Parse Nourish-format care plans
 */
function parseNourishFormat(text: string): CarePlanSection[] {
  const sections: CarePlanSection[] = [];
  
  console.log('[Care Plan Parser] Detected Nourish format');
  
  // Clean the text first
  let cleanedText = cleanMetadata(text);
  
  // Pattern to find care plan sections in Nourish format
  // Look for "CARE PLAN" header followed by structured content
  const carePlanBlockPattern = /CARE\s*PLAN[\s\S]*?Title\s*\n([^\n]+)\s*\n[\s\S]*?(?=CARE\s*PLAN|2\.\s*Care\s*Plans|$)/gi;
  
  // Alternative: Look for "2. Care Plans" followed by section title
  const sectionHeaderPattern = /2\.\s*Care\s*Plans\s*\n([A-Z][A-Z\s,]+)\s*\n/gi;
  
  // First, try to find all section titles from "2. Care Plans" headers
  const sectionTitles: string[] = [];
  let headerMatch;
  while ((headerMatch = sectionHeaderPattern.exec(cleanedText)) !== null) {
    const title = headerMatch[1].trim();
    if (!shouldExcludeSection(title)) {
      sectionTitles.push(title);
    }
  }
  
  console.log(`[Care Plan Parser] Found ${sectionTitles.length} section headers from Nourish format`);
  
  // Now extract content for each section
  for (let i = 0; i < sectionTitles.length; i++) {
    const currentTitle = sectionTitles[i];
    const nextTitle = sectionTitles[i + 1];
    
    // Find the content between this title and the next
    const titleEscaped = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let contentPattern: RegExp;
    
    if (nextTitle) {
      const nextTitleEscaped = nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      contentPattern = new RegExp(`${titleEscaped}[\\s\\S]*?(?=${nextTitleEscaped}|$)`, 'i');
    } else {
      contentPattern = new RegExp(`${titleEscaped}[\\s\\S]*$`, 'i');
    }
    
    const contentMatch = cleanedText.match(contentPattern);
    if (contentMatch) {
      const rawContent = cleanMetadata(contentMatch[0]);
      const fields = extractNourishFields(rawContent);
      const metadata = extractNourishMetadata(rawContent);
      
      // Format the section name nicely (Title Case)
      const formattedTitle = currentTitle
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      sections.push({
        section_name: formattedTitle,
        raw_content: rawContent,
        fields,
        metadata,
      });
      
      console.log(`[Care Plan Parser] Extracted section: ${formattedTitle}`);
    }
  }
  
  return sections;
}

/**
 * Extract structured fields from Nourish content
 */
function extractNourishFields(content: string): CarePlanSection['fields'] {
  const fields: CarePlanSection['fields'] = {};
  
  // Identified Need
  const identifiedNeedMatch = content.match(/Identified\s*Need\s*\n([^\n][\s\S]*?)(?=\n(?:Level\s*of\s*need|Planned\s*Outcomes|How\s*to|Risk|$))/i);
  if (identifiedNeedMatch) {
    fields.identified_need = cleanMetadata(identifiedNeedMatch[1].trim());
  }
  
  // Level of Need
  const levelMatch = content.match(/Level\s*of\s*need\s*\n?(\d\s*-\s*[^\n]+)/i);
  if (levelMatch) {
    fields.level_of_need = levelMatch[1].trim();
  }
  
  // Planned Outcomes
  const plannedMatch = content.match(/Planned\s*Outcomes?\s*\n([^\n][\s\S]*?)(?=\n(?:How\s*to|Risk|Review|$))/i);
  if (plannedMatch) {
    fields.planned_outcomes = cleanMetadata(plannedMatch[1].trim());
  }
  
  // How to Achieve Outcomes
  const howToMatch = content.match(/How\s*to\s*Achieve\s*(?:Outcomes?)?\s*\n([^\n][\s\S]*?)(?=\n(?:Risk|Review|Likelihood|$))/i);
  if (howToMatch) {
    fields.how_to_achieve = cleanMetadata(howToMatch[1].trim());
  }
  
  // Risk section
  const riskMatch = content.match(/Risk\s*\n([^\n][\s\S]*?)(?=\n(?:Likelihood|Review|$))/i);
  if (riskMatch) {
    fields.risk = cleanMetadata(riskMatch[1].trim());
  }
  
  // Risk scoring
  const likelihoodMatch = content.match(/Likelihood\s*\n?(\d)\s*([^\n]*)/i);
  if (likelihoodMatch) {
    fields.risk_likelihood = `${likelihoodMatch[1]} ${likelihoodMatch[2]}`.trim();
  }
  
  const impactMatch = content.match(/Impact\s*\n?(\d)\s*([^\n]*)/i);
  if (impactMatch) {
    fields.risk_impact = `${impactMatch[1]} ${impactMatch[2]}`.trim();
  }
  
  const scoreMatch = content.match(/(?:Total\s*score|Risk)\s*\n?(\d+)\s*(?:Total\s*score)?/i);
  if (scoreMatch) {
    fields.risk_score = scoreMatch[1].trim();
  }
  
  return fields;
}

/**
 * Extract metadata from Nourish content
 */
function extractNourishMetadata(content: string): CarePlanSection['metadata'] {
  const metadata: CarePlanSection['metadata'] = {};
  
  // Next review date
  const reviewDateMatch = content.match(/Next\s*review\s*date\s*\n?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (reviewDateMatch) {
    metadata.next_review_date = reviewDateMatch[1];
  }
  
  // Level of need
  const levelMatch = content.match(/Level\s*of\s*need\s*\n?(\d\s*-\s*[^\n]+)/i);
  if (levelMatch) {
    metadata.level_of_need = levelMatch[1].trim();
  }
  
  // Reviewer
  const reviewerMatch = content.match(/Reviewer\s*\n([^\n]+)/i);
  if (reviewerMatch) {
    metadata.reviewer = reviewerMatch[1].trim();
  }
  
  // Review date (from review note)
  const reviewNoteDateMatch = content.match(/Review\s*date\s*\n?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (reviewNoteDateMatch) {
    metadata.review_date = reviewNoteDateMatch[1];
  }
  
  return metadata;
}

/**
 * Parse generic care plan format (non-Nourish)
 */
function parseGenericFormat(text: string): CarePlanSection[] {
  const sections: CarePlanSection[] = [];
  
  console.log('[Care Plan Parser] Using generic format parser');
  
  // Clean the text
  let cleanedText = cleanMetadata(text);
  
  // Try multiple patterns to find sections
  const sectionPatterns = [
    // Pattern 1: "Section: NAME" or "SECTION: NAME"
    /(?:^|\n)(?:Section|SECTION):\s*([^\n]+)/gi,
    
    // Pattern 2: Numbered sections like "2. Personal Care"
    /(?:^|\n)(\d+\.\s*[A-Z][A-Za-z\s&,]+)(?:\n|$)/g,
    
    // Pattern 3: All caps headers (care plan titles)
    /(?:^|\n)([A-Z][A-Z\s&,]{5,})(?:\n|$)/g,
    
    // Pattern 4: Headers with colons
    /(?:^|\n)([A-Z][A-Za-z\s&,]+):\s*\n/g,
    
    // Pattern 5: Bold/emphasised headers (from Word docs)
    /(?:^|\n)\*\*([A-Z][A-Za-z\s&,]+)\*\*/g,
  ];
  
  // Collect all potential section headers
  const potentialSections: Array<{ title: string; index: number }> = [];
  
  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      const title = match[1].trim();
      
      // Skip if too short or excluded
      if (title.length < 5 || shouldExcludeSection(title)) {
        continue;
      }
      
      // Prefer known care plan sections
      if (isKnownCarePlanSection(title)) {
        potentialSections.push({
          title,
          index: match.index,
        });
      }
    }
  }
  
  // Sort by position and remove duplicates
  potentialSections.sort((a, b) => a.index - b.index);
  
  const uniqueSections: Array<{ title: string; index: number }> = [];
  for (const section of potentialSections) {
    const isDuplicate = uniqueSections.some(
      s => Math.abs(s.index - section.index) < 100 || 
           s.title.toLowerCase() === section.title.toLowerCase()
    );
    if (!isDuplicate) {
      uniqueSections.push(section);
    }
  }
  
  console.log(`[Care Plan Parser] Found ${uniqueSections.length} sections in generic format`);
  
  // Extract content for each section
  for (let i = 0; i < uniqueSections.length; i++) {
    const current = uniqueSections[i];
    const next = uniqueSections[i + 1];
    
    const startIndex = current.index;
    const endIndex = next ? next.index : cleanedText.length;
    
    const rawContent = cleanMetadata(cleanedText.substring(startIndex, endIndex));
    const fields = extractGenericFields(rawContent);
    
    // Format title nicely
    const formattedTitle = current.title
      .toLowerCase()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    sections.push({
      section_name: formattedTitle,
      raw_content: rawContent,
      fields,
    });
    
    console.log(`[Care Plan Parser] Extracted section: ${formattedTitle}`);
  }
  
  // If no sections found, treat entire document as one section
  if (sections.length === 0) {
    console.log('[Care Plan Parser] No sections detected, treating as single care plan');
    sections.push({
      section_name: 'Care Plan',
      raw_content: cleanedText,
      fields: extractGenericFields(cleanedText),
    });
  }
  
  return sections;
}

/**
 * Extract fields from generic format content
 */
function extractGenericFields(content: string): CarePlanSection['fields'] {
  const fields: CarePlanSection['fields'] = {};
  
  // Try various field patterns
  const fieldPatterns = [
    { name: 'identified_need', patterns: [
      /Identified\s*Need[:\s]*([^\n][\s\S]*?)(?=\n(?:Planned|How|Risk|Level|$))/i,
      /Need[:\s]*([^\n][\s\S]*?)(?=\n(?:Outcome|Goal|Plan|$))/i,
    ]},
    { name: 'planned_outcomes', patterns: [
      /Planned\s*Outcomes?[:\s]*([^\n][\s\S]*?)(?=\n(?:How|Risk|$))/i,
      /(?:Outcomes?|Goals?)[:\s]*([^\n][\s\S]*?)(?=\n(?:How|Action|Plan|$))/i,
    ]},
    { name: 'how_to_achieve', patterns: [
      /How\s*to\s*Achieve[:\s]*([^\n][\s\S]*?)(?=\n(?:Risk|Review|$))/i,
      /(?:Actions?|Plan|Interventions?)[:\s]*([^\n][\s\S]*?)(?=\n(?:Risk|Review|$))/i,
    ]},
    { name: 'risk', patterns: [
      /Risk[:\s]*([^\n][\s\S]*?)(?=\n(?:Review|Likelihood|$))/i,
      /Risks?\s*(?:Assessment|Identified)?[:\s]*([^\n][\s\S]*?)(?=\n(?:Review|$))/i,
    ]},
  ];
  
  for (const field of fieldPatterns) {
    for (const pattern of field.patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        fields[field.name] = cleanMetadata(match[1].trim());
        break;
      }
    }
  }
  
  return fields;
}

/**
 * Main parsing function - detects format and parses accordingly
 */
export function parseCarePlanIntoSections(carePlanText: string): CarePlanSection[] {
  console.log(`[Care Plan Parser] Parsing care plan (${carePlanText.length} characters)`);
  
  // Detect format and parse
  if (isNourishFormat(carePlanText)) {
    const sections = parseNourishFormat(carePlanText);
    if (sections.length > 0) {
      console.log(`[Care Plan Parser] Successfully parsed ${sections.length} Nourish sections`);
      return sections;
    }
  }
  
  // Fall back to generic parser
  const sections = parseGenericFormat(carePlanText);
  console.log(`[Care Plan Parser] Parsed ${sections.length} sections total`);
  
  return sections;
}

/**
 * Validate parsed sections
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
    
    if (!section.raw_content || section.raw_content.length < 20) {
      issues.push(`Section "${section.section_name}" has insufficient content`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
