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
    answer: 'The **Dashboard** is your main overview page. It shows key metrics like upcoming audits, recent incidents, compliance scores, and quick actions. You can see at a glance how your care home is performing and access common tasks quickly.\n\nQuick actions are filtered based on your role permissions - you\'ll only see actions you have access to.',
    category: 'platform'
  },
  
  // Service Users
  {
    id: 'service-users',
    keywords: ['service user', 'resident', 'client', 'patient', 'people we support'],
    question: 'How do I manage Service Users?',
    answer: 'Go to **Service Users** in the sidebar to manage profiles. You can:\n\n• Add new service users with personal details\n• Record care needs and preferences\n• Assign them to locations\n• View their associated care plans\n\nClick the **+ Quick Add** button and select "Service User" to add a new person.\n\n**Note:** You need the "Service Users" feature permission to access this section.',
    category: 'platform'
  },
  
  // Staff
  {
    id: 'staff',
    keywords: ['staff', 'employee', 'carer', 'worker', 'team'],
    question: 'How do I manage Staff?',
    answer: 'Go to **Staff** in the sidebar to manage your team. You can:\n\n• Add staff members with contact details\n• Assign roles and permissions\n• Link staff to specific locations\n• Track training records\n\nUse **+ Quick Add** → "Staff Member" to add someone new.\n\n**Note:** You need the "Staff" feature permission to access this section.',
    category: 'platform'
  },
  
  // Audits
  {
    id: 'audits',
    keywords: ['audit', 'compliance check', 'inspection', 'assessment'],
    question: 'How do audits work?',
    answer: 'The audit system helps ensure compliance:\n\n• **Audits** - Create and complete compliance audits (medication, infection control, health & safety, etc.)\n• **Audit Calendar** - Schedule and view upcoming audits\n• **Audit History** - Review past results and track improvements\n\nRegular audits help you stay CQC-ready and identify areas for improvement.\n\n**Note:** You need the "Audits" feature permission to access this section.',
    category: 'platform'
  },
  {
    id: 'create-audit',
    keywords: ['create audit', 'new audit', 'start audit', 'add audit'],
    question: 'How do I create an audit?',
    answer: 'To create a new audit:\n\n1. Go to **Audits** in the sidebar\n2. Click **+ New Audit** or use **Quick Add** → "Audit"\n3. Select the audit type (e.g., Medication, Infection Control)\n4. Choose the location\n5. Complete the audit questions\n6. Submit when finished\n\nThe system will calculate your compliance score automatically.',
    category: 'platform'
  },
  
  // AI Care Plan Audit - UPDATED
  {
    id: 'ai-care-plan',
    keywords: ['ai care plan', 'care plan audit', 'analyse care plan', 'review care plan', 'care plan analysis', 'nourish', 'access care planning'],
    question: 'What is AI Care Plan Audit?',
    answer: 'The **AI Care Plan Audit** analyses your care plans against CQC requirements:\n\n**Features:**\n• Upload care plans (PDF, Word, Excel, or paste text)\n• Supports multiple formats: **Nourish**, **Access Care Planning**, and generic formats\n• Scores each section against CQC standards\n• Identifies missing information and CQC sections\n• Provides specific recommendations with "ideal examples"\n• Includes review dates (current + 3 months ahead)\n\n**Anonymisation Options:**\n• Enter the service user\'s first and last name\n• Choose replacement names (defaults to John/Jane Smith)\n• Or keep original names if preferred\n• Requires consent confirmation\n\nGo to **AI Care Plan Audit** in the sidebar. Analysis typically takes less than an hour.',
    category: 'platform'
  },
  {
    id: 'care-plan-formats',
    keywords: ['nourish', 'access care planning', 'care plan format', 'pdf care plan', 'upload format'],
    question: 'What care plan formats are supported?',
    answer: 'The AI Care Plan Audit supports multiple formats:\n\n**Nourish Care Systems:**\n• Domain-based sections (Accommodation, Personal Care, etc.)\n• Automatically detected and parsed\n\n**Access Care Planning:**\n• Visit-based structure (Breakfast Visit, Lunch Visit, etc.)\n• Automatically detected and parsed\n\n**Generic Formats:**\n• Any PDF, Word, or Excel care plan\n• Text paste option available\n\nThe system automatically detects the format and extracts sections appropriately.',
    category: 'platform'
  },
  {
    id: 'care-plan-anonymisation',
    keywords: ['anonymise', 'anonymisation', 'name replacement', 'privacy', 'data protection', 'gdpr'],
    question: 'How does care plan anonymisation work?',
    answer: 'For **AI Care Plan Audit**, you can anonymise service user names:\n\n1. Enter the service user\'s **first name** and **last name**\n2. Choose replacement names (defaults to John/Jane Smith)\n3. Or tick "Keep original names" if not needed\n4. Confirm consent before submitting\n\nThe system will replace all instances of the name in the audit report.\n\n**Note:** Care Notes Audit does NOT have automatic anonymisation because notes contain multiple people. You\'re responsible for sanitising care notes data before uploading if needed.',
    category: 'platform'
  },
  
  // AI Care Notes Audit - UPDATED
  {
    id: 'ai-care-notes',
    keywords: ['ai care notes', 'care notes audit', 'daily notes', 'analyse notes', 'notes analysis', 'carer feedback'],
    question: 'What is AI Care Notes Audit?',
    answer: 'The **AI Care Notes Audit** evaluates your daily care notes:\n\n**Features:**\n• Upload notes (PDF, Word, Excel, CSV) or paste directly\n• Download a CSV template for optimal formatting\n• Scores notes across 5 categories\n• Identifies language issues with suggestions\n• Provides rewritten "improved versions"\n• Gives personalised feedback for carers\n\n**Data Privacy:**\nCare notes may contain multiple service user and staff names. If you need to anonymise the data, please do so **before uploading**. The system analyses notes as provided.\n\nGo to **AI Care Notes Audit** in the sidebar. Great for training and quality improvement.',
    category: 'platform'
  },
  {
    id: 'care-notes-template',
    keywords: ['csv template', 'notes template', 'download template', 'care notes format'],
    question: 'Is there a template for care notes?',
    answer: 'Yes! For optimal analysis results, you can download our **CSV template**:\n\n1. Go to **AI Care Notes Audit**\n2. Select "Upload File" option\n3. Click "Download Template" link\n4. Fill in your care notes following the format\n5. Upload the completed file\n\nThe template includes sample data showing the expected format. You can also upload notes directly from your care system in PDF, Word, or Excel format.',
    category: 'platform'
  },
  
  // Incidents
  {
    id: 'incidents',
    keywords: ['incident', 'accident', 'fall', 'injury', 'safeguarding', 'report incident'],
    question: 'How do I record incidents?',
    answer: 'Go to **Incidents** in the sidebar to log and track incidents:\n\n• Record incident details, date, time, location\n• Add witnesses and people involved\n• Document actions taken\n• Track follow-up and outcomes\n\nUse **+ Quick Add** → "Incident" for quick logging. View **Incident Analytics** to see trends and patterns.\n\n**Note:** You need the "Incidents" feature permission to access this section.',
    category: 'platform'
  },
  
  // Reports
  {
    id: 'reports',
    keywords: ['report', 'analytics', 'statistics', 'data', 'export'],
    question: 'How do I generate reports?',
    answer: 'Go to **Reports** in the sidebar to generate compliance reports and analytics. You can:\n\n• View compliance trends over time\n• Export data for external use\n• Generate reports for CQC inspections\n• Analyse performance by location\n\n**Note:** You need the "Reports" feature permission to access this section.',
    category: 'platform'
  },
  
  // Role Management - UPDATED
  {
    id: 'roles',
    keywords: ['role', 'permission', 'access', 'user access', 'role management', 'feature permission'],
    question: 'How do roles and permissions work?',
    answer: 'Go to **Role Management** (under Administration) to control access:\n\n**Feature Permissions (7 groups):**\n• Staff - Manage staff members\n• Service Users - Manage service user profiles\n• Audits - Create and view compliance audits\n• AI Care Plan Audit - Use AI care plan analysis\n• AI Care Notes Audit - Use AI care notes analysis\n• Incidents - Record and track incidents\n• Reports - Generate and view reports\n\n**Location Permissions:**\n• Control which sites each role can access\n• Set read-only or read/write access per location\n\n**Super Admin** always has full access to everything.\n\nUsers only see navigation tabs and quick actions for features their role allows.',
    category: 'platform'
  },
  {
    id: 'feature-permissions',
    keywords: ['feature permission', 'tab access', 'navigation', 'hide tabs', 'show tabs'],
    question: 'Why can\'t I see certain tabs?',
    answer: 'Navigation tabs are filtered based on your **role\'s feature permissions**:\n\n• If you can\'t see a tab, your role doesn\'t have that feature enabled\n• Contact your administrator to request access\n• Super Admin users can see all tabs\n\n**Available features:**\nStaff, Service Users, Audits, AI Care Plan Audit, AI Care Notes Audit, Incidents, Reports\n\nAdministrators can enable/disable features for each role in **Role Management**.',
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
  
  // Care Plan Requirements - UPDATED
  {
    id: 'care-plan-requirements',
    keywords: ['care plan', 'what should care plan include', 'care plan sections', 'care plan content', 'cqc sections'],
    question: 'What should a care plan include?',
    answer: 'A CQC-compliant care plan should include:\n\n**Essential sections:**\n• Personal profile / About Me\n• Communication needs\n• Personal care & hygiene\n• Mobility & moving/handling\n• Nutrition & hydration\n• Medication management\n• Skin integrity / pressure care\n• Continence care\n\n**Also important:**\n• Mental health & wellbeing\n• Pain management\n• Falls prevention\n• End of life wishes\n• Risk assessments\n\nEach section should be person-centred and written in first person where possible.\n\n**Tip:** Use our AI Care Plan Audit to identify missing CQC sections in your care plans.',
    category: 'care-plans'
  },
  {
    id: 'person-centred',
    keywords: ['person centred', 'first person', 'about me', 'personalised', 'individual'],
    question: 'What is person-centred care?',
    answer: '**Person-centred care** puts the individual at the heart of their care. Key principles:\n\n• Write care plans in **first person** ("I prefer..." not "She prefers...")\n• Include life history, preferences, and personality\n• Focus on what matters to the person\n• Involve them in decisions about their care\n• Respect their choices and independence\n• Recognise them as an individual, not just their needs\n\nCQC specifically looks for person-centred language in care documentation.',
    category: 'care-plans'
  },
  {
    id: 'review-dates',
    keywords: ['review date', 'care plan review', 'when to review', 'update care plan'],
    question: 'How often should care plans be reviewed?',
    answer: 'Care plans should be reviewed regularly:\n\n• **Minimum:** Every 3 months (or sooner if needs change)\n• **After incidents:** Falls, hospital admissions, health changes\n• **When requested:** By the person or their family\n\nOur AI Care Plan Audit includes **review date recommendations** (current date + 3 months) to help you stay on track.\n\nRegular reviews ensure care plans remain accurate and person-centred.',
    category: 'care-plans'
  },
  
  // Care Notes - UPDATED
  {
    id: 'good-care-notes',
    keywords: ['care notes', 'daily notes', 'documentation', 'record keeping', 'write notes'],
    question: 'How should I write good care notes?',
    answer: 'Good care notes should be:\n\n• **Person-centred** - Focus on the person, not just tasks\n• **Factual** - Based on observations, not assumptions\n• **Timely** - Written as soon as possible after care\n• **Specific** - Include times, quantities, observations\n• **Professional** - Appropriate language, no jargon\n• **Outcome-focused** - What was achieved, not just done\n\n**Avoid:**\n• "Fed breakfast" → Use "Supported John to eat breakfast"\n• Assumptions about feelings\n• Abbreviations others won\'t understand\n\n**Tip:** Use our AI Care Notes Audit to get feedback on your notes and suggestions for improvement.',
    category: 'care-notes'
  },
  {
    id: 'care-notes-scoring',
    keywords: ['notes score', 'notes categories', 'notes assessment', 'notes feedback'],
    question: 'How are care notes scored?',
    answer: 'The AI Care Notes Audit scores notes across **5 categories**:\n\n1. **Person-centred language** - Is the focus on the individual?\n2. **Factual accuracy** - Are observations specific and objective?\n3. **Professional language** - Is terminology appropriate?\n4. **Completeness** - Are all relevant details included?\n5. **Outcome focus** - Does it show what was achieved?\n\nEach note receives:\n• An overall score\n• Category-specific feedback\n• Specific improvement suggestions\n• A rewritten "ideal" version for learning',
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
    answer: 'The **+ Quick Add** button (top right) lets you quickly create:\n\n• Service Users\n• Staff Members\n• Audits\n• Incidents\n\nClick it and select what you want to add. It\'s faster than navigating to each section.\n\n**Note:** Quick Add options are filtered by your role permissions - you\'ll only see options for features you have access to.',
    category: 'platform'
  },
  {
    id: 'search',
    keywords: ['search', 'find', 'look up', 'locate'],
    question: 'How do I search?',
    answer: 'Use the **search bar** at the top of the page to quickly find:\n\n• Service users by name\n• Staff members\n• Audit records\n• Incidents\n\nResults are filtered based on your location permissions.',
    category: 'platform'
  },
  {
    id: 'locations',
    keywords: ['location', 'site', 'care home', 'branch', 'multiple locations'],
    question: 'How do I manage multiple locations?',
    answer: 'Go to **Locations** (under Administration) to manage your sites:\n\n• Add new care home locations\n• Set location details and addresses\n• Assign staff to specific locations\n• Filter data by location throughout the system\n\nRoles can be configured to give access to specific locations only (read-only or read/write).',
    category: 'platform'
  },
  {
    id: 'company-profile',
    keywords: ['company', 'organisation', 'settings', 'profile', 'api key', 'openai'],
    question: 'Where are company settings?',
    answer: 'Go to **Company Profile** (under Administration) to manage:\n\n• Organisation name and details\n• CQC registration information\n• **OpenAI API key** for AI features\n• Subscription and billing\n\nOnly administrators can access these settings.\n\n**Important:** AI Care Plan and Care Notes Audits require an OpenAI API key to be configured.',
    category: 'platform'
  },
  {
    id: 'openai-key',
    keywords: ['openai', 'api key', 'ai not working', 'configure ai'],
    question: 'How do I set up AI features?',
    answer: 'To enable AI Care Plan and Care Notes Audits:\n\n1. Go to **Company Profile** (under Administration)\n2. Find the **OpenAI API Key** field\n3. Enter your organisation\'s OpenAI API key\n4. Save changes\n\nIf you see "OpenAI API key not configured", contact your administrator to set this up.\n\nEach organisation uses their own API key for billing purposes.',
    category: 'platform'
  },
  {
    id: 'audit-history',
    keywords: ['audit history', 'previous audits', 'download report', 'past audits'],
    question: 'Where can I see past AI audits?',
    answer: 'Each AI audit page has an **Audit History** tab:\n\n• **AI Care Plan Audit** → Shows care plan audits only\n• **AI Care Notes Audit** → Shows care notes audits only\n\nFrom history you can:\n• See audit status (pending, processing, completed, failed)\n• View compliance scores\n• Download completed reports\n• Track when audits were submitted\n\nReports are available to download once processing completes.',
    category: 'platform'
  },
  
  // Fallback / General
  {
    id: 'help',
    keywords: ['help', 'support', 'contact', 'assistance'],
    question: 'Where can I get more help?',
    answer: 'For more help:\n\n• Use this **Help Assistant** for platform and CQC guidance\n• Contact your system administrator for access issues\n• For CQC-specific questions, consult official CQC guidance at cqc.org.uk\n\nI can help with platform navigation, feature explanations, and general CQC compliance guidance. Just ask!',
    category: 'general'
  },
  {
    id: 'super-admin',
    keywords: ['super admin', 'administrator', 'full access', 'all permissions'],
    question: 'What is a Super Admin?',
    answer: '**Super Admin** is a special role with full system access:\n\n• Can see all navigation tabs regardless of feature permissions\n• Can access all locations regardless of location permissions\n• Can manage roles, users, and organisation settings\n• Cannot be restricted by role permissions\n\nTypically assigned to system administrators and organisation owners.',
    category: 'platform'
  },
  {
    id: 'processing-time',
    keywords: ['how long', 'processing time', 'wait time', 'when ready'],
    question: 'How long do AI audits take?',
    answer: 'AI audit processing times:\n\n• **Typical:** Less than an hour\n• **Complex documents:** May take longer depending on size\n\nYou\'ll receive a notification when your audit is complete. You can close the page and come back later - check the **Audit History** tab to download your report.\n\nProcessing happens in the background, so you can continue using other features while waiting.',
    category: 'platform'
  }
];

// Quick suggestions shown to users - UPDATED
export const quickSuggestions = [
  'How do I create an audit?',
  'What is AI Care Plan Audit?',
  'What are the CQC 5 Key Questions?',
  'How should I write care notes?',
  'How do roles and permissions work?'
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
