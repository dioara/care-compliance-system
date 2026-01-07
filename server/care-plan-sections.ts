/**
 * Comprehensive Care Plan Sections Definition
 * Based on Nourish template + CQC requirements
 * 
 * This defines all expected sections in a CQC-compliant care plan
 * and provides keywords for detecting each section in various formats
 */

export interface CarePlanSectionDefinition {
  id: string;
  name: string;
  description: string;
  cqcRegulation: string;
  requiredFields: string[];
  keywords: string[]; // Keywords to detect this section in text
  aliases: string[]; // Alternative names for this section
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Core care plan domains that should be present in every comprehensive care plan
 */
export const CORE_CARE_PLAN_SECTIONS: CarePlanSectionDefinition[] = [
  {
    id: 'personal_profile',
    name: 'Personal Profile / About Me',
    description: 'Life history, background, preferences, likes, dislikes, and what matters most to the service user',
    cqcRegulation: 'Regulation 9 - Person-centred care',
    requiredFields: ['Life history', 'Preferences', 'Likes and dislikes', 'Important relationships', 'Cultural/religious needs'],
    keywords: ['about me', 'personal profile', 'life history', 'my story', 'background', 'biography', 'who i am'],
    aliases: ['About Me', 'My Story', 'Life History', 'Personal History', 'My Background'],
    priority: 'critical'
  },
  {
    id: 'communication_senses',
    name: 'Communication and Senses',
    description: 'How the service user communicates, hearing, vision, speech, and preferred communication methods',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including communication needs',
    requiredFields: ['Communication method', 'Hearing assessment', 'Vision assessment', 'Speech/language needs', 'Aids required'],
    keywords: ['communication', 'senses', 'hearing', 'vision', 'speech', 'language', 'talking', 'listening', 'eyesight', 'glasses', 'hearing aid'],
    aliases: ['Communication', 'Senses', 'Communication Needs', 'Sensory Needs'],
    priority: 'critical'
  },
  {
    id: 'personal_care',
    name: 'Personal Care and Hygiene',
    description: 'Washing, bathing, showering, oral care, grooming, dressing, and maintaining personal hygiene',
    cqcRegulation: 'Regulation 9(3)(b) - Dignity and respect in personal care',
    requiredFields: ['Washing preferences', 'Bathing/showering needs', 'Oral care', 'Grooming', 'Dressing support', 'Privacy preferences'],
    keywords: ['personal care', 'hygiene', 'washing', 'bathing', 'showering', 'oral care', 'teeth', 'grooming', 'dressing', 'undressing', 'toileting'],
    aliases: ['Personal Care', 'Hygiene', 'Washing and Dressing', 'Personal Hygiene'],
    priority: 'critical'
  },
  {
    id: 'mobility',
    name: 'Mobility and Moving & Handling',
    description: 'How the service user moves, transfers, walks, and any equipment or support needed',
    cqcRegulation: 'Regulation 12(2)(a) - Safe care and treatment',
    requiredFields: ['Mobility level', 'Walking aids', 'Transfer method', 'Manual handling needs', 'Equipment required', 'Number of carers'],
    keywords: ['mobility', 'moving', 'handling', 'walking', 'transfer', 'wheelchair', 'hoist', 'zimmer', 'frame', 'stick', 'crutches', 'standing'],
    aliases: ['Mobility', 'Moving and Handling', 'Transfers', 'Movement'],
    priority: 'critical'
  },
  {
    id: 'nutrition_hydration',
    name: 'Eating, Drinking and Nutrition',
    description: 'Nutritional needs, dietary requirements, eating and drinking support, food preferences, and hydration',
    cqcRegulation: 'Regulation 14 - Meeting nutritional and hydration needs',
    requiredFields: ['Dietary requirements', 'Food preferences', 'Allergies', 'Texture modification', 'Eating support', 'Hydration needs', 'MUST score'],
    keywords: ['eating', 'drinking', 'nutrition', 'hydration', 'food', 'diet', 'meals', 'breakfast', 'lunch', 'dinner', 'fluids', 'swallowing', 'dysphagia', 'weight'],
    aliases: ['Nutrition', 'Eating and Drinking', 'Diet', 'Nutrition and Hydration', 'Food and Drink'],
    priority: 'critical'
  },
  {
    id: 'continence',
    name: 'Continence Care',
    description: 'Bladder and bowel management, continence aids, toileting support, and dignity in continence care',
    cqcRegulation: 'Regulation 9(3)(b) - Dignity in continence care',
    requiredFields: ['Bladder continence', 'Bowel continence', 'Continence aids', 'Toileting routine', 'Catheter care', 'Stoma care'],
    keywords: ['continence', 'bladder', 'bowel', 'toilet', 'pad', 'incontinence', 'catheter', 'stoma', 'commode', 'urinary', 'faecal'],
    aliases: ['Continence', 'Toileting', 'Bladder and Bowel', 'Continence Care'],
    priority: 'critical'
  },
  {
    id: 'skin_integrity',
    name: 'Skin Integrity and Pressure Care',
    description: 'Skin condition, pressure areas, wound care, and prevention of pressure ulcers',
    cqcRegulation: 'Regulation 12(2)(a) - Safe care including skin integrity',
    requiredFields: ['Skin condition', 'Pressure areas', 'Waterlow score', 'Repositioning schedule', 'Pressure relieving equipment', 'Wound care'],
    keywords: ['skin', 'pressure', 'wound', 'ulcer', 'sore', 'waterlow', 'repositioning', 'turning', 'mattress', 'cushion', 'tissue viability'],
    aliases: ['Skin Care', 'Pressure Care', 'Skin Integrity', 'Wound Care', 'Tissue Viability'],
    priority: 'critical'
  },
  {
    id: 'medication',
    name: 'Medication Management',
    description: 'All medications, administration, storage, side effects monitoring, and medication support needs',
    cqcRegulation: 'Regulation 12(2)(g) - Proper and safe management of medicines',
    requiredFields: ['Medication list', 'Administration times', 'Administration method', 'Storage', 'Side effects', 'PRN protocols', 'Self-administration assessment'],
    keywords: ['medication', 'medicine', 'drug', 'tablet', 'capsule', 'prescription', 'dose', 'prn', 'pharmacy', 'administer'],
    aliases: ['Medication', 'Medicines', 'Medication Management', 'Drug Administration'],
    priority: 'critical'
  },
  {
    id: 'breathing',
    name: 'Breathing and Respiratory',
    description: 'Respiratory conditions, oxygen therapy, breathing support, and respiratory monitoring',
    cqcRegulation: 'Regulation 12(2)(a) - Safe care and treatment',
    requiredFields: ['Respiratory condition', 'Oxygen requirements', 'Inhalers', 'Breathing exercises', 'Monitoring', 'Emergency protocol'],
    keywords: ['breathing', 'respiratory', 'oxygen', 'inhaler', 'nebuliser', 'copd', 'asthma', 'breathless', 'lungs', 'chest'],
    aliases: ['Breathing', 'Respiratory', 'Respiratory Care', 'Breathing Support'],
    priority: 'high'
  },
  {
    id: 'pain_management',
    name: 'Pain Management',
    description: 'Pain assessment, pain relief, comfort measures, and pain monitoring',
    cqcRegulation: 'Regulation 12(2)(a) - Safe care including pain management',
    requiredFields: ['Pain assessment', 'Pain locations', 'Pain triggers', 'Pain relief methods', 'Medication for pain', 'Non-pharmacological interventions'],
    keywords: ['pain', 'discomfort', 'ache', 'sore', 'analgesic', 'painkiller', 'comfort', 'abbey pain scale'],
    aliases: ['Pain', 'Pain Management', 'Pain Control', 'Comfort'],
    priority: 'high'
  },
  {
    id: 'mental_health',
    name: 'Mental Health and Emotional Wellbeing',
    description: 'Mental health conditions, emotional support, anxiety, depression, and psychological needs',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including mental health needs',
    requiredFields: ['Mental health conditions', 'Mood assessment', 'Anxiety triggers', 'Coping strategies', 'Professional support', 'Crisis plan'],
    keywords: ['mental health', 'emotional', 'wellbeing', 'mood', 'anxiety', 'depression', 'psychological', 'behaviour', 'distress', 'agitation'],
    aliases: ['Mental Health', 'Emotional Wellbeing', 'Psychological Needs', 'Mental Wellbeing'],
    priority: 'high'
  },
  {
    id: 'cognitive_capacity',
    name: 'Cognitive Needs and Mental Capacity',
    description: 'Cognitive conditions, dementia care, mental capacity assessment, and decision-making support',
    cqcRegulation: 'Regulation 11 - Need for consent and mental capacity',
    requiredFields: ['Cognitive assessment', 'Dementia diagnosis', 'Capacity assessment', 'Best interests decisions', 'Decision-making support', 'Memory aids'],
    keywords: ['cognitive', 'dementia', 'alzheimer', 'memory', 'confusion', 'capacity', 'consent', 'best interests', 'dols', 'mental capacity'],
    aliases: ['Cognitive', 'Dementia Care', 'Mental Capacity', 'Memory'],
    priority: 'high'
  },
  {
    id: 'falls_prevention',
    name: 'Falls Prevention',
    description: 'Falls risk assessment, prevention strategies, and post-fall protocols',
    cqcRegulation: 'Regulation 12(2)(a) - Safe care and falls prevention',
    requiredFields: ['Falls history', 'Risk factors', 'Prevention measures', 'Environmental modifications', 'Equipment', 'Post-fall protocol'],
    keywords: ['falls', 'fall', 'balance', 'unsteady', 'trip', 'slip', 'fracture', 'osteoporosis'],
    aliases: ['Falls', 'Falls Prevention', 'Falls Risk', 'Balance'],
    priority: 'high'
  },
  {
    id: 'sleep_rest',
    name: 'Sleep and Rest',
    description: 'Sleep patterns, rest needs, night-time support, and sleep hygiene',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including rest needs',
    requiredFields: ['Sleep pattern', 'Bedtime routine', 'Night-time needs', 'Sleep aids', 'Rest periods', 'Disturbances'],
    keywords: ['sleep', 'rest', 'night', 'bedtime', 'waking', 'insomnia', 'nap', 'tired', 'fatigue'],
    aliases: ['Sleep', 'Rest', 'Sleep and Rest', 'Night Care'],
    priority: 'medium'
  },
  {
    id: 'social_relationships',
    name: 'Social Needs and Relationships',
    description: 'Social activities, relationships, family involvement, and community engagement',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including social needs',
    requiredFields: ['Family relationships', 'Social activities', 'Hobbies', 'Community involvement', 'Visitors', 'Isolation risk'],
    keywords: ['social', 'relationship', 'family', 'friends', 'visitor', 'activities', 'hobbies', 'community', 'isolation', 'loneliness'],
    aliases: ['Social', 'Relationships', 'Social Needs', 'Social Activities'],
    priority: 'medium'
  },
  {
    id: 'spiritual_cultural',
    name: 'Spiritual and Cultural Needs',
    description: 'Religious beliefs, cultural practices, spiritual support, and cultural preferences',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including spiritual/cultural needs',
    requiredFields: ['Religion', 'Cultural background', 'Spiritual practices', 'Dietary restrictions', 'Festivals/observances', 'Language preferences'],
    keywords: ['spiritual', 'cultural', 'religion', 'faith', 'church', 'mosque', 'temple', 'prayer', 'beliefs', 'traditions'],
    aliases: ['Spiritual', 'Cultural', 'Religious Needs', 'Faith'],
    priority: 'medium'
  },
  {
    id: 'end_of_life',
    name: 'End of Life Care and Advance Planning',
    description: 'Advance care planning, DNACPR, preferred place of death, and end of life wishes',
    cqcRegulation: 'Regulation 9(3)(a) - Person-centred care including end of life',
    requiredFields: ['Advance care plan', 'DNACPR status', 'Preferred place of death', 'Funeral wishes', 'Power of attorney', 'Lasting wishes'],
    keywords: ['end of life', 'advance care', 'dnacpr', 'resuscitation', 'palliative', 'terminal', 'dying', 'death', 'funeral', 'wishes'],
    aliases: ['End of Life', 'Advance Care Planning', 'Palliative Care', 'DNACPR'],
    priority: 'high'
  },
  {
    id: 'safeguarding',
    name: 'Personal Safety and Safeguarding',
    description: 'Safeguarding concerns, abuse prevention, safety measures, and reporting procedures',
    cqcRegulation: 'Regulation 13 - Safeguarding service users from abuse and improper treatment',
    requiredFields: ['Safeguarding concerns', 'Risk indicators', 'Safety measures', 'Reporting procedures', 'Advocacy', 'DoLS status'],
    keywords: ['safeguarding', 'safety', 'abuse', 'neglect', 'protection', 'vulnerable', 'exploitation', 'harm', 'dols'],
    aliases: ['Safeguarding', 'Safety', 'Protection', 'Personal Safety'],
    priority: 'critical'
  },
  {
    id: 'infection_control',
    name: 'Infection Prevention and Control',
    description: 'Infection risks, hygiene practices, isolation requirements, and infection prevention measures',
    cqcRegulation: 'Regulation 12(2)(h) - Infection prevention and control',
    requiredFields: ['Infection risks', 'PPE requirements', 'Hand hygiene', 'Isolation needs', 'Vaccination status', 'MRSA/C.diff status'],
    keywords: ['infection', 'hygiene', 'ppe', 'gloves', 'apron', 'mrsa', 'c diff', 'isolation', 'handwashing', 'contamination'],
    aliases: ['Infection Control', 'IPC', 'Infection Prevention', 'Hygiene'],
    priority: 'high'
  },
  {
    id: 'accommodation',
    name: 'Accommodation, Cleanliness and Comfort',
    description: 'Living environment, cleanliness, comfort, temperature, and environmental preferences',
    cqcRegulation: 'Regulation 15 - Premises and equipment',
    requiredFields: ['Home environment', 'Cleanliness needs', 'Temperature preferences', 'Lighting', 'Accessibility', 'Equipment location'],
    keywords: ['accommodation', 'cleanliness', 'comfort', 'environment', 'home', 'house', 'room', 'temperature', 'heating', 'cleaning', 'domestic'],
    aliases: ['Accommodation', 'Environment', 'Home Environment', 'Cleanliness'],
    priority: 'medium'
  }
];

/**
 * Additional required sections for a complete care plan
 */
export const ADDITIONAL_REQUIRED_SECTIONS: CarePlanSectionDefinition[] = [
  {
    id: 'emergency_contacts',
    name: 'Emergency Contacts and Procedures',
    description: 'Emergency contact details, key holder information, and emergency procedures',
    cqcRegulation: 'Regulation 12 - Safe care and treatment',
    requiredFields: ['Emergency contacts', 'Key holder details', 'GP details', 'Hospital preferences', 'Emergency protocol'],
    keywords: ['emergency', 'contact', 'next of kin', 'key holder', 'gp', 'doctor', 'hospital', '999', 'ambulance'],
    aliases: ['Emergency Contacts', 'Emergency Procedures', 'Key Contacts'],
    priority: 'critical'
  },
  {
    id: 'access_information',
    name: 'Access and Key Safe Information',
    description: 'How to access the property, key safe codes, and entry procedures',
    cqcRegulation: 'Regulation 12 - Safe care and treatment',
    requiredFields: ['Access method', 'Key safe location', 'Key safe code', 'Entry procedure', 'Security requirements'],
    keywords: ['access', 'key safe', 'key', 'door', 'entry', 'code', 'lock', 'security'],
    aliases: ['Access', 'Key Safe', 'Entry Information'],
    priority: 'high'
  },
  {
    id: 'equipment_aids',
    name: 'Equipment and Aids',
    description: 'All equipment and aids used, maintenance requirements, and usage instructions',
    cqcRegulation: 'Regulation 15 - Premises and equipment',
    requiredFields: ['Equipment list', 'Location', 'Usage instructions', 'Maintenance schedule', 'Supplier details'],
    keywords: ['equipment', 'aids', 'hoist', 'wheelchair', 'commode', 'hospital bed', 'pressure mattress', 'walking frame'],
    aliases: ['Equipment', 'Aids', 'Assistive Devices'],
    priority: 'medium'
  },
  {
    id: 'healthcare_professionals',
    name: 'Healthcare Professionals Involved',
    description: 'All healthcare professionals involved in care, their roles, and contact details',
    cqcRegulation: 'Regulation 9 - Person-centred care coordination',
    requiredFields: ['GP', 'District nurse', 'Specialists', 'Therapists', 'Social worker', 'Contact details'],
    keywords: ['healthcare', 'professional', 'gp', 'nurse', 'doctor', 'therapist', 'social worker', 'consultant', 'specialist'],
    aliases: ['Healthcare Team', 'Professionals Involved', 'Care Team'],
    priority: 'medium'
  },
  {
    id: 'consent',
    name: 'Consent and Agreements',
    description: 'Consent documentation, service agreements, and permissions',
    cqcRegulation: 'Regulation 11 - Need for consent',
    requiredFields: ['Consent to care', 'Information sharing consent', 'Photography consent', 'Medication consent'],
    keywords: ['consent', 'agreement', 'permission', 'authorisation', 'signature'],
    aliases: ['Consent', 'Agreements', 'Permissions'],
    priority: 'high'
  }
];

/**
 * All sections combined
 */
export const ALL_CARE_PLAN_SECTIONS = [...CORE_CARE_PLAN_SECTIONS, ...ADDITIONAL_REQUIRED_SECTIONS];

/**
 * Get section by ID
 */
export function getSectionById(id: string): CarePlanSectionDefinition | undefined {
  return ALL_CARE_PLAN_SECTIONS.find(s => s.id === id);
}

/**
 * Detect which sections are present in the care plan text
 */
export function detectPresentSections(text: string): { 
  present: CarePlanSectionDefinition[]; 
  missing: CarePlanSectionDefinition[];
  coverage: number;
} {
  const textLower = text.toLowerCase();
  const present: CarePlanSectionDefinition[] = [];
  const missing: CarePlanSectionDefinition[] = [];

  for (const section of ALL_CARE_PLAN_SECTIONS) {
    // Check if any keywords match
    const hasKeyword = section.keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
    // Check if any aliases match
    const hasAlias = section.aliases.some(alias => textLower.includes(alias.toLowerCase()));
    
    if (hasKeyword || hasAlias) {
      present.push(section);
    } else {
      missing.push(section);
    }
  }

  // Sort missing by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  missing.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const coverage = Math.round((present.length / ALL_CARE_PLAN_SECTIONS.length) * 100);

  return { present, missing, coverage };
}

/**
 * Generate missing sections report
 */
export function generateMissingSectionsReport(missing: CarePlanSectionDefinition[]): string {
  if (missing.length === 0) {
    return 'All required care plan sections are present.';
  }

  const critical = missing.filter(s => s.priority === 'critical');
  const high = missing.filter(s => s.priority === 'high');
  const medium = missing.filter(s => s.priority === 'medium');
  const low = missing.filter(s => s.priority === 'low');

  let report = '';

  if (critical.length > 0) {
    report += '### CRITICAL MISSING SECTIONS (Immediate Action Required)\n\n';
    critical.forEach(s => {
      report += `**${s.name}**\n`;
      report += `- ${s.description}\n`;
      report += `- CQC Requirement: ${s.cqcRegulation}\n`;
      report += `- Should include: ${s.requiredFields.join(', ')}\n\n`;
    });
  }

  if (high.length > 0) {
    report += '### HIGH PRIORITY MISSING SECTIONS (Action Required Within 7 Days)\n\n';
    high.forEach(s => {
      report += `**${s.name}**\n`;
      report += `- ${s.description}\n`;
      report += `- CQC Requirement: ${s.cqcRegulation}\n`;
      report += `- Should include: ${s.requiredFields.join(', ')}\n\n`;
    });
  }

  if (medium.length > 0) {
    report += '### MEDIUM PRIORITY MISSING SECTIONS (Action Required Within 30 Days)\n\n';
    medium.forEach(s => {
      report += `**${s.name}**\n`;
      report += `- ${s.description}\n`;
      report += `- CQC Requirement: ${s.cqcRegulation}\n\n`;
    });
  }

  if (low.length > 0) {
    report += '### LOW PRIORITY MISSING SECTIONS (Review at Next Care Plan Update)\n\n';
    low.forEach(s => {
      report += `**${s.name}**\n`;
      report += `- ${s.description}\n\n`;
    });
  }

  return report;
}
