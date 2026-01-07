/**
 * Care Plan Section Parser
 * Parses care plans into individual sections for detailed analysis
 * 
 * Supports multiple formats:
 * - Nourish PDF exports
 * - Access Care Planning exports
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
    visit_time?: string;
    visit_days?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Metadata and footer patterns to remove from content
 */
const METADATA_PATTERNS_TO_REMOVE = [
  // Nourish footer patterns
  /Page\s*\d+\s*of\s*\d+/gi,
  /Created\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*-?\s*\d{1,2}:\d{2}/gi,
  /by\s*©?\s*Nourish\s*Care\s*Systems?\s*Ltd\.?/gi,
  /©\s*Nourish\s*Care\s*Systems?\s*Ltd\.?/gi,
  
  // Access Care Planning footer patterns
  /Generated\s*by\s*Access\s*Care\s*Planning/gi,
  /\d{1,2}\/[A-Za-z]{3}\/\d{2,4}\s*\d{1,2}:\d{2}/gi,
  /\d+\s*of\s*\d+$/gm,
  
  // Generic footer patterns
  /Page\s*\d+/gi,
  /Confidential/gi,
  /Draft/gi,
  
  // Report generation timestamps
  /Report\s*(?:run|generated)\s*(?:on)?\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*\d{1,2}:\d{2}/gi,
];

/**
 * Section categories to EXCLUDE from analysis
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
  'case id',
  'case:',
  'printed by',
  'printed date',
];

/**
 * Access Care Planning visit types
 */
const ACCESS_VISIT_TYPES = [
  'breakfast visit',
  'lunch visit',
  'tea visit',
  'dinner visit',
  'bedtime visit',
  'night visit',
  'morning visit',
  'afternoon visit',
  'evening visit',
  'medication collection',
  'medication visit',
  'sitting',
  'other',
  'domiciliary care',
  'personal care visit',
  'welfare check',
  'shopping',
  'appointment',
];

/**
 * Access Care Planning task types (map to CQC domains)
 */
const ACCESS_TASK_TO_CQC_DOMAIN: Record<string, string> = {
  'personal care': 'Personal Care & Hygiene',
  'cloth change': 'Personal Care & Hygiene',
  'dressing': 'Personal Care & Hygiene',
  'washing': 'Personal Care & Hygiene',
  'bathing': 'Personal Care & Hygiene',
  'shower': 'Personal Care & Hygiene',
  'grooming': 'Personal Care & Hygiene',
  'oral care': 'Personal Care & Hygiene',
  'pad check': 'Continence Care',
  'continence': 'Continence Care',
  'toileting': 'Continence Care',
  'breakfast': 'Nutrition & Hydration',
  'lunch': 'Nutrition & Hydration',
  'tea': 'Nutrition & Hydration',
  'dinner': 'Nutrition & Hydration',
  'meal': 'Nutrition & Hydration',
  'food': 'Nutrition & Hydration',
  'hydration': 'Nutrition & Hydration',
  'drink': 'Nutrition & Hydration',
  'medication': 'Medication Management',
  'medicines': 'Medication Management',
  'prompt medication': 'Medication Management',
  'morphine': 'Medication Management',
  'pregabalin': 'Medication Management',
  'mobility': 'Mobility & Moving/Handling',
  'transfer': 'Mobility & Moving/Handling',
  'hoist': 'Mobility & Moving/Handling',
  'walking': 'Mobility & Moving/Handling',
  'pendant': 'Emergency & Safety',
  'secure': 'Access & Key Safe',
  'door': 'Access & Key Safe',
  'key': 'Access & Key Safe',
  'domestic': 'Accommodation & Cleanliness',
  'make bed': 'Accommodation & Cleanliness',
  'clean': 'Accommodation & Cleanliness',
  'wash dishes': 'Accommodation & Cleanliness',
  'curtains': 'Accommodation & Cleanliness',
  'wellness': 'Mental Health & Emotional Wellbeing',
  'mood': 'Mental Health & Emotional Wellbeing',
  'emotional': 'Mental Health & Emotional Wellbeing',
  'daily task': 'Social Needs & Relationships',
  'planning': 'Social Needs & Relationships',
  'shopping': 'Social Needs & Relationships',
  'appointment': 'Healthcare Professionals',
  'gp': 'Healthcare Professionals',
  'hospital': 'Healthcare Professionals',
};

/**
 * Valid care plan section titles (normalised)
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
 * Detect if the content is from Access Care Planning
 */
function isAccessCarePlanningFormat(text: string): boolean {
  const accessIndicators = [
    /access\s*Care\s*Planning/i,
    /Active\s*Care\s*Plans/i,
    /Domiciliary\s*Care/i,
    /CASE\s*ID:\s*CASE-/i,
    /Breakfast\s*Visit/i,
    /Lunch\s*Visit/i,
    /Bedtime\s*Visit/i,
    /Tea\s*Visit/i,
    /ID:\s*\d{4,}/i,
    /Mon\s*Tue\s*Wed\s*Thu\s*Fri/i,
    /Every\s*Week/i,
  ];
  
  let matches = 0;
  for (const indicator of accessIndicators) {
    if (indicator.test(text)) {
      matches++;
    }
  }
  
  return matches >= 3;
}

/**
 * Parse Access Care Planning format
 */
function parseAccessCarePlanningFormat(text: string): CarePlanSection[] {
  const sections: CarePlanSection[] = [];
  
  console.log('[Care Plan Parser] Detected Access Care Planning format');
  
  // Clean the text first
  let cleanedText = cleanMetadata(text);
  
  // Find all visit sections
  // Pattern: Visit name followed by "Domiciliary Care" and schedule info
  const visitPattern = /(?:^|\n)([A-Za-z\s]+(?:Visit|Sitting|Other|Medication\s*Collection))\s*(?:ID:\s*\d+)?\s*(?:Domiciliary\s*Care)?\s*(?:\d{1,2}\/[A-Za-z]{3}\/\d{2,4}\s*-\s*\d{1,2}\/[A-Za-z]{3}\/\d{2,4})?\s*(?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})?\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Every\s*Week)?/gi;
  
  // Alternative: Look for visit headers more loosely
  const visitHeaders: { name: string; startIndex: number }[] = [];
  
  // Find visit type headers
  for (const visitType of ACCESS_VISIT_TYPES) {
    const pattern = new RegExp(`(?:^|\\n)(${visitType.replace(/\s+/g, '\\s*')})\\s*(?:ID:|Domiciliary|\\d{1,2}[/:]|$)`, 'gi');
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      const name = match[1].trim();
      // Avoid duplicates at same position
      if (!visitHeaders.some(h => Math.abs(h.startIndex - match.index) < 50)) {
        visitHeaders.push({ name, startIndex: match.index });
      }
    }
  }
  
  // Sort by position in document
  visitHeaders.sort((a, b) => a.startIndex - b.startIndex);
  
  console.log(`[Care Plan Parser] Found ${visitHeaders.length} visit sections in Access format`);
  
  // Extract content for each visit
  for (let i = 0; i < visitHeaders.length; i++) {
    const current = visitHeaders[i];
    const next = visitHeaders[i + 1];
    
    const startPos = current.startIndex;
    const endPos = next ? next.startIndex : cleanedText.length;
    
    const rawContent = cleanMetadata(cleanedText.substring(startPos, endPos));
    
    // Extract tasks from this visit
    const tasks = extractAccessTasks(rawContent);
    const medications = extractAccessMedications(rawContent);
    const scheduleInfo = extractAccessSchedule(rawContent);
    
    // Build the fields
    const fields: CarePlanSection['fields'] = {};
    
    // Identified Need - combine tasks into a description
    if (tasks.length > 0 || medications.length > 0) {
      const needParts: string[] = [];
      
      for (const task of tasks) {
        needParts.push(`${task.name}: ${task.description}`);
      }
      
      if (medications.length > 0) {
        needParts.push(`Medications: ${medications.map(m => `${m.name} - ${m.instructions}`).join('; ')}`);
      }
      
      fields.identified_need = needParts.join('\n');
    }
    
    // How to Achieve - list the specific tasks
    if (tasks.length > 0) {
      fields.how_to_achieve = tasks.map(t => `${t.name}: ${t.description}`).join('\n');
    }
    
    // Format the section name nicely
    const formattedTitle = current.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    sections.push({
      section_name: formattedTitle,
      raw_content: rawContent,
      fields,
      metadata: {
        visit_time: scheduleInfo.time,
        visit_days: scheduleInfo.days,
      },
    });
    
    console.log(`[Care Plan Parser] Extracted Access section: ${formattedTitle} with ${tasks.length} tasks`);
  }
  
  // If no visit sections found, try to extract individual tasks as sections
  if (sections.length === 0) {
    console.log('[Care Plan Parser] No visit sections found, extracting tasks as sections');
    const allTasks = extractAccessTasks(cleanedText);
    const allMedications = extractAccessMedications(cleanedText);
    
    // Group tasks by CQC domain
    const domainGroups: Record<string, { tasks: typeof allTasks; medications: typeof allMedications }> = {};
    
    for (const task of allTasks) {
      const domain = mapTaskToCQCDomain(task.name);
      if (!domainGroups[domain]) {
        domainGroups[domain] = { tasks: [], medications: [] };
      }
      domainGroups[domain].tasks.push(task);
    }
    
    // Add medications to Medication Management domain
    if (allMedications.length > 0) {
      if (!domainGroups['Medication Management']) {
        domainGroups['Medication Management'] = { tasks: [], medications: [] };
      }
      domainGroups['Medication Management'].medications = allMedications;
    }
    
    // Create sections from domain groups
    for (const [domain, group] of Object.entries(domainGroups)) {
      const contentParts: string[] = [];
      
      for (const task of group.tasks) {
        contentParts.push(`${task.name}: ${task.description}`);
      }
      
      for (const med of group.medications) {
        contentParts.push(`${med.name}: ${med.instructions}`);
      }
      
      if (contentParts.length > 0) {
        sections.push({
          section_name: domain,
          raw_content: contentParts.join('\n'),
          fields: {
            identified_need: contentParts.join('\n'),
            how_to_achieve: contentParts.join('\n'),
          },
        });
      }
    }
  }
  
  return sections;
}

/**
 * Extract tasks from Access Care Planning content
 */
function extractAccessTasks(content: string): { name: string; description: string }[] {
  const tasks: { name: string; description: string }[] = [];
  
  // Pattern: checkbox (✓ or ☐) followed by task name and description
  // Also matches without checkbox
  const taskPatterns = [
    /[✓☐✔☑]\s*([A-Za-z][A-Za-z\s\/\-]+?)\s+([A-Z][^✓☐✔☑\n]+)/g,
    /(?:^|\n)([A-Za-z][A-Za-z\s\/\-]{2,30}?)\s{2,}([A-Z][^\n]{10,})/gm,
  ];
  
  for (const pattern of taskPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      const description = match[2].trim();
      
      // Filter out non-tasks
      if (name.length > 2 && name.length < 50 && description.length > 5) {
        // Avoid duplicates
        if (!tasks.some(t => t.name.toLowerCase() === name.toLowerCase())) {
          tasks.push({ name, description });
        }
      }
    }
  }
  
  // Also look for specific known task patterns
  const knownTaskPatterns = [
    { pattern: /Door\s+([^\n]+)/i, name: 'Door' },
    { pattern: /Personal\s*Care\s+([^\n]+)/i, name: 'Personal Care' },
    { pattern: /Cloth\s*change\s+([^\n]+)/i, name: 'Cloth Change' },
    { pattern: /Curtains?\s+([^\n]+)/i, name: 'Curtains' },
    { pattern: /Domestic[^\n]*\s+([^\n]+)/i, name: 'Domestic' },
    { pattern: /Breakfast\s+([^\n]+)/i, name: 'Breakfast' },
    { pattern: /Lunch\.?\s+([^\n]+)/i, name: 'Lunch' },
    { pattern: /Tea\s+([^\n]+)/i, name: 'Tea' },
    { pattern: /Dinner\s+([^\n]+)/i, name: 'Dinner' },
    { pattern: /Pendant[^\n]*\s+([^\n]+)/i, name: 'Pendant' },
    { pattern: /Medication[^\n]*\s+([^\n]+)/i, name: 'Medication' },
    { pattern: /Hydration\s+([^\n]+)/i, name: 'Hydration' },
    { pattern: /Wellness\s+([^\n]+)/i, name: 'Wellness' },
    { pattern: /Mood\s+([^\n]+)/i, name: 'Mood' },
    { pattern: /Secure\s+([^\n]+)/i, name: 'Secure' },
    { pattern: /Pad\s*Check\s+([^\n]+)/i, name: 'Pad Check' },
    { pattern: /Daily\s*Task[^\n]*\s+([^\n]+)/i, name: 'Daily Task' },
  ];
  
  for (const { pattern, name } of knownTaskPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const description = match[1].trim();
      if (description.length > 5 && !tasks.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        tasks.push({ name, description });
      }
    }
  }
  
  return tasks;
}

/**
 * Extract medications from Access Care Planning content
 */
function extractAccessMedications(content: string): { name: string; instructions: string }[] {
  const medications: { name: string; instructions: string }[] = [];
  
  // Common medication patterns
  const medPatterns = [
    /(?:^|\n)(?:[✓☐✔☑⊘]\s*)?([A-Za-z]+(?:\s*\d+\s*(?:mg|mcg|ml|tabs?|capsules?))?)\s+(Take\s+[^\n]+)/gi,
    /(?:^|\n)([A-Za-z]+)\s*[-–]\s*(Take\s+[^\n]+)/gi,
    /(?:^|\n)([A-Za-z]+)\s+(ONE|TWO|THREE|FOUR|FIVE|\d+)\s+(?:tablet|capsule|ml)[^\n]*/gi,
  ];
  
  // Known medication names
  const knownMeds = [
    'Morphine', 'Pregabalin', 'Folic acid', 'Colecalciferol', 'Modafinil',
    'Sodium Bicarbonate', 'Lactulose', 'Diazepam', 'Paracetamol', 'Ibuprofen',
    'Omeprazole', 'Metformin', 'Amlodipine', 'Ramipril', 'Simvastatin',
    'Levothyroxine', 'Warfarin', 'Aspirin', 'Clopidogrel', 'Bisoprolol',
  ];
  
  for (const medName of knownMeds) {
    const pattern = new RegExp(`${medName}[^\\n]*?(Take[^\\n]+|ONE[^\\n]+|TWO[^\\n]+)`, 'gi');
    const match = content.match(pattern);
    if (match) {
      const fullMatch = match[0];
      const instructionMatch = fullMatch.match(/Take[^\n]+|ONE[^\n]+|TWO[^\n]+/i);
      if (instructionMatch) {
        medications.push({
          name: medName,
          instructions: instructionMatch[0].trim(),
        });
      }
    }
  }
  
  return medications;
}

/**
 * Extract schedule information from Access Care Planning content
 */
function extractAccessSchedule(content: string): { time?: string; days?: string } {
  const schedule: { time?: string; days?: string } = {};
  
  // Time pattern: HH:MM - HH:MM
  const timeMatch = content.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    schedule.time = `${timeMatch[1]} - ${timeMatch[2]}`;
  }
  
  // Days pattern
  const daysMatch = content.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[\s,]*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)?/i);
  if (daysMatch) {
    schedule.days = daysMatch[0].trim();
  }
  
  // Every Week pattern
  if (/Every\s*Week/i.test(content)) {
    schedule.days = (schedule.days || '') + ' (Every Week)';
  }
  
  return schedule;
}

/**
 * Map a task name to CQC domain
 */
function mapTaskToCQCDomain(taskName: string): string {
  const normalised = taskName.toLowerCase().trim();
  
  for (const [keyword, domain] of Object.entries(ACCESS_TASK_TO_CQC_DOMAIN)) {
    if (normalised.includes(keyword)) {
      return domain;
    }
  }
  
  return 'General Care';
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
  
  const scoreMatch = content.match(/(?:Risk\s*)?Score\s*\n?(\d+)/i);
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
  const reviewMatch = content.match(/Next\s*review\s*date\s*\n?(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (reviewMatch) {
    metadata.next_review_date = reviewMatch[1].trim();
  }
  
  // Level of need
  const levelMatch = content.match(/Level\s*of\s*need\s*\n?(\d\s*-\s*[^\n]+)/i);
  if (levelMatch) {
    metadata.level_of_need = levelMatch[1].trim();
  }
  
  // Reviewer
  const reviewerMatch = content.match(/Reviewed?\s*by\s*\n?([^\n]+)/i);
  if (reviewerMatch) {
    metadata.reviewer = reviewerMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Parse generic format care plans
 */
function parseGenericFormat(text: string): CarePlanSection[] {
  const sections: CarePlanSection[] = [];
  
  console.log('[Care Plan Parser] Using generic format parser');
  
  // Clean the text first
  let cleanedText = cleanMetadata(text);
  
  // Try to find sections by common headers
  const sectionPatterns = [
    // All caps headers
    /(?:^|\n)([A-Z][A-Z\s&,]+)(?:\n|$)/gm,
    // Title case headers with colon
    /(?:^|\n)([A-Z][a-z]+(?:\s+[A-Za-z]+)*)\s*:/gm,
    // Numbered sections
    /(?:^|\n)\d+\.\s*([A-Z][a-z]+(?:\s+[A-Za-z]+)*)/gm,
  ];
  
  const foundSections: { title: string; startIndex: number }[] = [];
  
  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      const title = match[1].trim();
      
      // Check if this is a valid care plan section
      if (!shouldExcludeSection(title) && (isKnownCarePlanSection(title) || title.length > 5)) {
        // Avoid duplicates at similar positions
        if (!foundSections.some(s => Math.abs(s.startIndex - match.index) < 20)) {
          foundSections.push({ title, startIndex: match.index });
        }
      }
    }
  }
  
  // Sort by position
  foundSections.sort((a, b) => a.startIndex - b.startIndex);
  
  console.log(`[Care Plan Parser] Found ${foundSections.length} sections in generic format`);
  
  // Extract content for each section
  for (let i = 0; i < foundSections.length; i++) {
    const current = foundSections[i];
    const next = foundSections[i + 1];
    
    const startPos = current.startIndex;
    const endPos = next ? next.startIndex : cleanedText.length;
    
    const rawContent = cleanMetadata(cleanedText.substring(startPos, endPos));
    const fields = extractGenericFields(rawContent);
    
    // Format the section name nicely
    const formattedTitle = current.title
      .toLowerCase()
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
  // Check Access Care Planning first (more specific format)
  if (isAccessCarePlanningFormat(carePlanText)) {
    const sections = parseAccessCarePlanningFormat(carePlanText);
    if (sections.length > 0) {
      console.log(`[Care Plan Parser] Successfully parsed ${sections.length} Access Care Planning sections`);
      return sections;
    }
  }
  
  // Check Nourish format
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
