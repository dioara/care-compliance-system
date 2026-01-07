// Knowledge base for the Care Compliance Assistant chatbot
// No AI needed - just keyword matching and predefined responses

export interface KnowledgeItem {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  category: 'platform' | 'cqc' | 'care-plans' | 'care-notes' | 'general';
}

export const knowledgeBase: KnowledgeItem[] = [
  // Platform Navigation - Dashboard
  {
    id: 'dashboard',
    keywords: ['dashboard', 'home', 'overview', 'main page', 'start'],
    question: 'What is the Dashboard?',
    answer: 'The **Dashboard** is your main overview page. It shows key metrics like upcoming audits, recent incidents, compliance scores, and quick actions. You can see at a glance how your care home is performing and access common tasks quickly.',
    category: 'platform'
  },
  
  // Service Users
  {
    id: 'service-users',
    keywords: ['service user', 'resident', 'client', 'patient', 'people we support'],
    question: 'How do I manage Service Users?',
    answer: 'Go to **Service Users** in the sidebar to manage profiles. You can:\n\n• Add new service users with personal details\n• Record care needs and preferences\n• Assign them to locations\n• View their associated care plans\n\nClick the **+ Quick Add** button and select "Service User" to add a new person.',
    category: 'platform'
  },
  
  // Staff
  {
    id: 'staff',
    keywords: ['staff', 'employee', 'carer', 'worker', 'team'],
    question: 'How do I manage Staff?',
    answer: 'Go to **Staff** in the sidebar to manage your team. You can:\n\n• Add staff members with contact details\n• Assign roles and permissions\n• Link staff to specific locations\n• Track training records\n\nUse **+ Quick Add** → "Staff Member" to add someone new.',
    category: 'platform'
  },
  
  // Audits
  {
    id: 'audits',
    keywords: ['audit', 'compliance check', 'inspection', 'assessment'],
    question: 'How do audits work?',
    answer: 'The audit system helps ensure compliance:\n\n• **Audits** - Create and complete compliance audits (medication, infection control, health & safety, etc.)\n• **Audit Calendar** - Schedule and view upcoming audits\n• **Audit History** - Review past results and track improvements\n\nRegular audits help you stay CQC-ready and identify areas for improvement.',
    category: 'platform'
  },
  {
    id: 'create-audit',
    keywords: ['create audit', 'new audit', 'start audit', 'add audit'],
    question: 'How do I create an audit?',
    answer: 'To create a new audit:\n\n1. Go to **Audits** in the sidebar\n2. Click **+ New Audit** or use **Quick Add** → "Audit"\n3. Select the audit type (e.g., Medication, Infection Control)\n4. Choose the location\n5. Complete the audit questions\n6. Submit when finished\n\nThe system will calculate your compliance score automatically.',
    category: 'platform'
  },
  
  // AI Care Plan Audit
  {
    id: 'ai-care-plan',
    keywords: ['ai care plan', 'care plan audit', 'analyse care plan', 'review care plan', 'care plan analysis'],
    question: 'What is AI Care Plan Audit?',
    answer: 'The **AI Care Plan Audit** analyses your care plans against CQC requirements:\n\n• Upload a care plan (PDF, Word, or paste text)\n• The system scores each section\n• Identifies missing information\n• Provides specific recommendations\n• Generates "ideal examples" to help improve\n\nGo to **AI Care Plan Audit** in the sidebar to get started. Analysis takes less than an hour.',
    category: 'platform'
  },
  
  // AI Care Notes Audit
  {
    id: 'ai-care-notes',
    keywords: ['ai care notes', 'care notes audit', 'daily notes', 'analyse notes', 'notes analysis'],
    question: 'What is AI Care Notes Audit?',
    answer: 'The **AI Care Notes Audit** evaluates your daily care notes:\n\n• Upload care notes (PDF, Word, Excel, or paste)\n• Scores notes across 5 categories\n• Identifies language issues with suggestions\n• Provides rewritten "improved versions"\n• Gives personalised feedback for carers\n\nGo to **AI Care Notes Audit** in the sidebar. Great for training and quality improvement.',
    category: 'platform'
  },
  
  // Incidents
  {
    id: 'incidents',
    keywords: ['incident', 'accident', 'fall', 'injury', 'safeguarding', 'report incident'],
    question: 'How do I record incidents?',
    answer: 'Go to **Incidents** in the sidebar to log and track incidents:\n\n• Record incident details, date, time, location\n• Add witnesses and people involved\n• Document actions taken\n• Track follow-up and outcomes\n\nUse **+ Quick Add** → "Incident" for quick logging. View **Incident Analytics** to see trends and patterns.',
    category: 'platform'
  },
  
  // Reports
  {
    id: 'reports',
    keywords: ['report', 'analytics', 'statistics', 'data', 'export'],
    question: 'How do I generate reports?',
    answer: 'Go to **Reports** in the sidebar to generate compliance reports and analytics. You can:\n\n• View compliance trends over time\n• Export data for external use\n• Generate reports for CQC inspections\n• Analyse performance by location',
    category: 'platform'
  },
  
  // Role Management
  {
    id: 'roles',
    keywords: ['role', 'permission', 'access', 'user access', 'role management'],
    question: 'How do roles and permissions work?',
    answer: 'Go to **Role Management** (under Administration) to control access:\n\n• Create custom roles (e.g., "Care Coordinator", "Manager")\n• Assign feature access (which tabs they can see)\n• Set location permissions (which sites they can access)\n• Control read/write access per location\n\nUsers only see the features and data their role allows.',
    category: 'platform'
  },
  
  // CQC - 5 Key Questions
  {
    id: 'cqc-5-questions',
    keywords: ['cqc', '5 questions', 'kloe', 'key lines', 'inspection', 'cqc inspection'],
    question: 'What are the CQC 5 Key Questions?',
    answer: 'CQC inspects services based on **5 Key Questions**:\n\n1. **Safe** - Are people protected from abuse and harm?\n2. **Effective** - Does care achieve good outcomes?\n3. **Caring** - Do staff treat people with compassion?\n4. **Responsive** - Are services organised to meet needs?\n5. **Well-led** - Is leadership effective?\n\nEach question has specific areas inspectors look at. Our audits are designed to help you meet these standards.',
    category: 'cqc'
  },
  {
    id: 'cqc-safe',
    keywords: ['safe', 'safety', 'safeguarding', 'harm', 'abuse', 'risk'],
    question: 'What does CQC mean by "Safe"?',
    answer: '**Safe** means people are protected from abuse and avoidable harm. CQC looks at:\n\n• Safeguarding procedures\n• Risk assessments\n• Medication management\n• Infection control\n• Staffing levels\n• Equipment safety\n• Incident reporting and learning',
    category: 'cqc'
  },
  {
    id: 'cqc-effective',
    keywords: ['effective', 'outcomes', 'evidence based', 'training', 'competence'],
    question: 'What does CQC mean by "Effective"?',
    answer: '**Effective** means care achieves good outcomes. CQC looks at:\n\n• Evidence-based care practices\n• Staff training and competence\n• Consent and mental capacity\n• Nutrition and hydration\n• Partnership working with other services\n• Monitoring and reviewing care',
    category: 'cqc'
  },
  {
    id: 'cqc-caring',
    keywords: ['caring', 'compassion', 'dignity', 'respect', 'privacy', 'kind'],
    question: 'What does CQC mean by "Caring"?',
    answer: '**Caring** means staff treat people with compassion and respect. CQC looks at:\n\n• Dignity and respect\n• Privacy\n• Supporting independence\n• Emotional support\n• Involving people in their care\n• Treating people as individuals',
    category: 'cqc'
  },
  {
    id: 'cqc-responsive',
    keywords: ['responsive', 'person centred', 'personalised', 'complaints', 'needs'],
    question: 'What does CQC mean by "Responsive"?',
    answer: '**Responsive** means services are organised to meet people\'s needs. CQC looks at:\n\n• Person-centred care planning\n• Meeting individual needs\n• Handling complaints effectively\n• End of life care\n• Activities and engagement\n• Flexibility in care delivery',
    category: 'cqc'
  },
  {
    id: 'cqc-well-led',
    keywords: ['well led', 'leadership', 'governance', 'management', 'quality'],
    question: 'What does CQC mean by "Well-led"?',
    answer: '**Well-led** means leadership is effective. CQC looks at:\n\n• Clear vision and values\n• Good governance systems\n• Quality assurance processes\n• Staff engagement and support\n• Continuous improvement\n• Learning from incidents\n• Open and transparent culture',
    category: 'cqc'
  },
  
  // Care Plan Requirements
  {
    id: 'care-plan-requirements',
    keywords: ['care plan', 'what should care plan include', 'care plan sections', 'care plan content'],
    question: 'What should a care plan include?',
    answer: 'A CQC-compliant care plan should include:\n\n**Essential sections:**\n• Personal profile / About Me\n• Communication needs\n• Personal care & hygiene\n• Mobility & moving/handling\n• Nutrition & hydration\n• Medication management\n• Skin integrity / pressure care\n• Continence care\n\n**Also important:**\n• Mental health & wellbeing\n• Pain management\n• Falls prevention\n• End of life wishes\n• Risk assessments\n\nEach section should be person-centred and written in first person where possible.',
    category: 'care-plans'
  },
  {
    id: 'person-centred',
    keywords: ['person centred', 'first person', 'about me', 'personalised', 'individual'],
    question: 'What is person-centred care?',
    answer: '**Person-centred care** puts the individual at the heart of their care. Key principles:\n\n• Write care plans in **first person** ("I prefer..." not "She prefers...")\n• Include life history, preferences, and personality\n• Focus on what matters to the person\n• Involve them in decisions about their care\n• Respect their choices and independence\n• Recognise them as an individual, not just their needs\n\nCQC specifically looks for person-centred language in care documentation.',
    category: 'care-plans'
  },
  
  // Care Notes
  {
    id: 'good-care-notes',
    keywords: ['care notes', 'daily notes', 'documentation', 'record keeping', 'write notes'],
    question: 'How should I write good care notes?',
    answer: 'Good care notes should be:\n\n• **Person-centred** - Focus on the person, not just tasks\n• **Factual** - Based on observations, not assumptions\n• **Timely** - Written as soon as possible after care\n• **Specific** - Include times, quantities, observations\n• **Professional** - Appropriate language, no jargon\n• **Outcome-focused** - What was achieved, not just done\n\n**Avoid:**\n• "Fed breakfast" → Use "Supported John to eat breakfast"\n• Assumptions about feelings\n• Abbreviations others won\'t understand',
    category: 'care-notes'
  },
  
  // Regulation 17
  {
    id: 'regulation-17',
    keywords: ['regulation 17', 'governance', 'records', 'quality assurance'],
    question: 'What is Regulation 17?',
    answer: '**Regulation 17: Good Governance** requires providers to have systems to:\n\n• Assess, monitor and improve quality\n• Assess, monitor and mitigate risks\n• Maintain accurate, complete records\n• Seek feedback from people using services\n• Evaluate and improve services\n\nThis is why regular audits and good record-keeping are so important.',
    category: 'cqc'
  },
  
  // Regulation 12
  {
    id: 'regulation-12',
    keywords: ['regulation 12', 'safe care', 'treatment', 'medicines', 'infection'],
    question: 'What is Regulation 12?',
    answer: '**Regulation 12: Safe Care and Treatment** requires:\n\n• Assessing risks to health and safety\n• Doing all reasonably practicable to mitigate risks\n• Proper and safe management of medicines\n• Preventing and controlling infection\n• Ensuring equipment is safe and suitable\n• Meeting nutritional and hydration needs',
    category: 'cqc'
  },
  
  // General Help
  {
    id: 'quick-add',
    keywords: ['quick add', 'add new', 'create new', 'shortcut'],
    question: 'How do I use Quick Add?',
    answer: 'The **+ Quick Add** button (top right) lets you quickly create:\n\n• Service Users\n• Staff Members\n• Audits\n• Incidents\n\nClick it and select what you want to add. It\'s faster than navigating to each section.',
    category: 'platform'
  },
  {
    id: 'search',
    keywords: ['search', 'find', 'look up', 'locate'],
    question: 'How do I search?',
    answer: 'Use the **Search** bar (top right) to quickly find:\n\n• Service users by name\n• Staff members\n• Audit records\n• Incidents\n\nJust start typing and results will appear. Press Enter or click a result to go directly there.',
    category: 'platform'
  },
  {
    id: 'locations',
    keywords: ['location', 'site', 'care home', 'branch', 'multiple locations'],
    question: 'How do I manage multiple locations?',
    answer: 'Go to **Locations** (under Administration) to manage your sites:\n\n• Add new care home locations\n• Set location details and addresses\n• Assign staff to specific locations\n• Filter data by location throughout the system\n\nRoles can be configured to give access to specific locations only.',
    category: 'platform'
  },
  {
    id: 'company-profile',
    keywords: ['company', 'organisation', 'settings', 'profile', 'api key'],
    question: 'Where are company settings?',
    answer: 'Go to **Company Profile** (under Administration) to manage:\n\n• Organisation name and details\n• CQC registration information\n• API keys for AI features\n• Subscription and billing\n\nOnly administrators can access these settings.',
    category: 'platform'
  },
  
  // Fallback / General
  {
    id: 'help',
    keywords: ['help', 'support', 'contact', 'assistance'],
    question: 'Where can I get more help?',
    answer: 'For more help:\n\n• Click **Help Center** in the footer for guides and FAQs\n• Contact your system administrator for access issues\n• For CQC-specific questions, consult official CQC guidance at cqc.org.uk\n\nI can help with platform navigation and general CQC guidance. Just ask!',
    category: 'general'
  }
];

// Quick suggestions shown to users
export const quickSuggestions = [
  'How do I create an audit?',
  'What are the CQC 5 Key Questions?',
  'How should I write care notes?',
  'What should a care plan include?',
  'How do roles work?'
];

// Find best matching answer based on user input
export function findAnswer(query: string): KnowledgeItem | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Score each knowledge item based on keyword matches
  let bestMatch: KnowledgeItem | null = null;
  let bestScore = 0;
  
  for (const item of knowledgeBase) {
    let score = 0;
    
    // Check each keyword
    for (const keyword of item.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        // Longer keyword matches are worth more
        score += keyword.length;
      }
    }
    
    // Bonus for question similarity
    const questionWords = item.question.toLowerCase().split(' ');
    for (const word of questionWords) {
      if (word.length > 3 && normalizedQuery.includes(word)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }
  
  // Only return if we have a reasonable match
  return bestScore >= 3 ? bestMatch : null;
}

// Get related questions based on category
export function getRelatedQuestions(category: string, excludeId: string): KnowledgeItem[] {
  return knowledgeBase
    .filter(item => item.category === category && item.id !== excludeId)
    .slice(0, 3);
}
