import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting remaining audit templates seed...\n');

// Get all audit types
const allAuditTypes = await db.select().from(auditTypes);
console.log(`📋 Found ${allAuditTypes.length} audit types\n`);

// Define templates for the 25 missing audit types
const templates = [
  {
    ref: 'daily_notes_template',
    name: 'Daily Notes Audit',
    sections: [
      {
        name: 'Daily Care Notes Quality',
        description: 'Quality and completeness of daily records',
        questions: [
          { number: '1.1', text: 'Daily notes are completed for every shift', type: 'yes_no' },
          { number: '1.2', text: 'Notes are factual and person-centred', type: 'yes_no' },
          { number: '1.3', text: 'Notes are dated and timed correctly', type: 'yes_no' },
          { number: '1.4', text: 'Staff member is identifiable from signature/initials', type: 'yes_no' },
          { number: '1.5', text: 'Notes describe activities, mood, and wellbeing', type: 'yes_no' },
          { number: '1.6', text: 'Any concerns or changes are clearly documented', type: 'yes_no' },
          { number: '1.7', text: 'Notes avoid abbreviations and jargon', type: 'yes_no' },
        ]
      },
      {
        name: 'Record Storage and Access',
        description: 'Security and accessibility of records',
        questions: [
          { number: '2.1', text: 'Records are stored securely when not in use', type: 'yes_no' },
          { number: '2.2', text: 'Records are easily accessible to authorised staff', type: 'yes_no' },
          { number: '2.3', text: 'Electronic records have appropriate access controls', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'infection_control_template',
    name: 'Infection Control Audit',
    sections: [
      {
        name: 'Hand Hygiene',
        description: 'Hand washing and sanitisation practices',
        questions: [
          { number: '1.1', text: 'Hand washing facilities are available and accessible', type: 'yes_no' },
          { number: '1.2', text: 'Soap dispensers are filled and functional', type: 'yes_no' },
          { number: '1.3', text: 'Paper towels are available at all sinks', type: 'yes_no' },
          { number: '1.4', text: 'Hand sanitiser is available at key points', type: 'yes_no' },
          { number: '1.5', text: 'Staff demonstrate correct hand hygiene technique', type: 'yes_no' },
        ]
      },
      {
        name: 'PPE and Equipment',
        description: 'Personal protective equipment availability and use',
        questions: [
          { number: '2.1', text: 'Adequate supply of gloves in all sizes', type: 'yes_no' },
          { number: '2.2', text: 'Aprons are available and used appropriately', type: 'yes_no' },
          { number: '2.3', text: 'Face masks are available when required', type: 'yes_no' },
          { number: '2.4', text: 'PPE is stored hygienically', type: 'yes_no' },
          { number: '2.5', text: 'Clinical waste bins are available and used correctly', type: 'yes_no' },
        ]
      },
      {
        name: 'Environmental Cleanliness',
        description: 'Cleaning standards and infection control',
        questions: [
          { number: '3.1', text: 'Cleaning schedules are up to date', type: 'yes_no' },
          { number: '3.2', text: 'High-touch surfaces are visibly clean', type: 'yes_no' },
          { number: '3.3', text: 'Bathrooms and toilets are clean and hygienic', type: 'yes_no' },
          { number: '3.4', text: 'Spillages are dealt with promptly', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'medication_audit_template',
    name: 'Medication Audit',
    sections: [
      {
        name: 'MAR Charts',
        description: 'Medication Administration Record accuracy',
        questions: [
          { number: '1.1', text: 'MAR charts are legible and complete', type: 'yes_no' },
          { number: '1.2', text: 'All medications are correctly transcribed', type: 'yes_no' },
          { number: '1.3', text: 'Signatures are present for all administered doses', type: 'yes_no' },
          { number: '1.4', text: 'Reasons for non-administration are documented', type: 'yes_no' },
          { number: '1.5', text: 'PRN medications have clear protocols', type: 'yes_no' },
          { number: '1.6', text: 'Allergies are clearly documented', type: 'yes_no' },
        ]
      },
      {
        name: 'Storage and Security',
        description: 'Safe storage of medications',
        questions: [
          { number: '2.1', text: 'Medication trolley/cupboard is locked when not in use', type: 'yes_no' },
          { number: '2.2', text: 'Controlled drugs are stored in CD cupboard', type: 'yes_no' },
          { number: '2.3', text: 'Refrigerated medications are stored at correct temperature', type: 'yes_no' },
          { number: '2.4', text: 'Temperature records are maintained', type: 'yes_no' },
          { number: '2.5', text: 'Out-of-date medications are not present', type: 'yes_no' },
        ]
      },
      {
        name: 'Controlled Drugs',
        description: 'CD register and stock checks',
        questions: [
          { number: '3.1', text: 'CD register is up to date', type: 'yes_no' },
          { number: '3.2', text: 'CD stock balances are correct', type: 'yes_no' },
          { number: '3.3', text: 'Two signatures present for CD administration', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'care_plan_template',
    name: 'Care Plan Audit',
    sections: [
      {
        name: 'Care Plan Quality',
        description: 'Person-centred planning and documentation',
        questions: [
          { number: '1.1', text: 'Care plan is person-centred and individualised', type: 'yes_no' },
          { number: '1.2', text: 'Resident/family involvement is documented', type: 'yes_no' },
          { number: '1.3', text: 'Care plan is reviewed monthly', type: 'yes_no' },
          { number: '1.4', text: 'Risk assessments are up to date', type: 'yes_no' },
          { number: '1.5', text: 'Goals and outcomes are clearly stated', type: 'yes_no' },
          { number: '1.6', text: 'Care plan reflects current needs', type: 'yes_no' },
        ]
      },
      {
        name: 'Documentation Standards',
        description: 'Completeness and accuracy',
        questions: [
          { number: '2.1', text: 'All sections of care plan are completed', type: 'yes_no' },
          { number: '2.2', text: 'Changes are dated and signed', type: 'yes_no' },
          { number: '2.3', text: 'Care plan is accessible to care staff', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'health_safety_template',
    name: 'Health & Safety Audit',
    sections: [
      {
        name: 'Risk Assessments',
        description: 'General and specific risk assessments',
        questions: [
          { number: '1.1', text: 'General risk assessments are in place', type: 'yes_no' },
          { number: '1.2', text: 'Risk assessments are reviewed annually', type: 'yes_no' },
          { number: '1.3', text: 'COSHH assessments are up to date', type: 'yes_no' },
          { number: '1.4', text: 'Manual handling risk assessments completed', type: 'yes_no' },
        ]
      },
      {
        name: 'Accident and Incident Reporting',
        description: 'Recording and learning from incidents',
        questions: [
          { number: '2.1', text: 'Accident book is maintained', type: 'yes_no' },
          { number: '2.2', text: 'RIDDOR reportable incidents are reported', type: 'yes_no' },
          { number: '2.3', text: 'Incident investigations are completed', type: 'yes_no' },
          { number: '2.4', text: 'Learning from incidents is shared with staff', type: 'yes_no' },
        ]
      },
      {
        name: 'Safety Equipment',
        description: 'Equipment checks and maintenance',
        questions: [
          { number: '3.1', text: 'Fire extinguishers are in date and accessible', type: 'yes_no' },
          { number: '3.2', text: 'Emergency lighting is tested monthly', type: 'yes_no' },
          { number: '3.3', text: 'Personal alarms are functional', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'kitchen_audit_template',
    name: 'Kitchen/Catering Audit',
    sections: [
      {
        name: 'Food Hygiene',
        description: 'Food safety and hygiene standards',
        questions: [
          { number: '1.1', text: 'Kitchen is clean and well-maintained', type: 'yes_no' },
          { number: '1.2', text: 'Food is stored at correct temperatures', type: 'yes_no' },
          { number: '1.3', text: 'Temperature records are maintained', type: 'yes_no' },
          { number: '1.4', text: 'Food is labelled with dates', type: 'yes_no' },
          { number: '1.5', text: 'Out-of-date food is not present', type: 'yes_no' },
          { number: '1.6', text: 'Cleaning schedules are up to date', type: 'yes_no' },
        ]
      },
      {
        name: 'Staff Competency',
        description: 'Training and food safety knowledge',
        questions: [
          { number: '2.1', text: 'All kitchen staff have food hygiene certificates', type: 'yes_no' },
          { number: '2.2', text: 'Staff demonstrate good hygiene practices', type: 'yes_no' },
          { number: '2.3', text: 'Food safety procedures are followed', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'safeguarding_audit_template',
    name: 'Safeguarding Audit',
    sections: [
      {
        name: 'Safeguarding Policies',
        description: 'Policy framework and awareness',
        questions: [
          { number: '1.1', text: 'Safeguarding policy is up to date', type: 'yes_no' },
          { number: '1.2', text: 'Policy is accessible to all staff', type: 'yes_no' },
          { number: '1.3', text: 'Staff are aware of safeguarding procedures', type: 'yes_no' },
          { number: '1.4', text: 'Safeguarding lead is clearly identified', type: 'yes_no' },
        ]
      },
      {
        name: 'Training and Competency',
        description: 'Staff safeguarding training',
        questions: [
          { number: '2.1', text: 'All staff have completed safeguarding training', type: 'yes_no' },
          { number: '2.2', text: 'Training is refreshed annually', type: 'yes_no' },
          { number: '2.3', text: 'Staff can identify types of abuse', type: 'yes_no' },
          { number: '2.4', text: 'Staff know how to raise concerns', type: 'yes_no' },
        ]
      },
      {
        name: 'Safeguarding Records',
        description: 'Documentation of concerns and actions',
        questions: [
          { number: '3.1', text: 'Safeguarding concerns are documented', type: 'yes_no' },
          { number: '3.2', text: 'Referrals to local authority are made when appropriate', type: 'yes_no' },
          { number: '3.3', text: 'Outcomes of safeguarding investigations are recorded', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'staff_file_audit_template',
    name: 'Staff File Audit',
    sections: [
      {
        name: 'Pre-Employment Checks',
        description: 'Recruitment documentation',
        questions: [
          { number: '1.1', text: 'DBS check is in place and in date', type: 'yes_no' },
          { number: '1.2', text: 'Two written references are on file', type: 'yes_no' },
          { number: '1.3', text: 'Proof of identity is documented', type: 'yes_no' },
          { number: '1.4', text: 'Right to work in UK is verified', type: 'yes_no' },
          { number: '1.5', text: 'Application form is complete', type: 'yes_no' },
          { number: '1.6', text: 'Interview notes are on file', type: 'yes_no' },
        ]
      },
      {
        name: 'Ongoing Requirements',
        description: 'Training and supervision records',
        questions: [
          { number: '2.1', text: 'Mandatory training is up to date', type: 'yes_no' },
          { number: '2.2', text: 'Supervision records are on file', type: 'yes_no' },
          { number: '2.3', text: 'Annual appraisal is completed', type: 'yes_no' },
          { number: '2.4', text: 'Professional registration is current (if applicable)', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'dignity_audit_template',
    name: 'Dignity Audit',
    sections: [
      {
        name: 'Privacy and Dignity',
        description: 'Respect for privacy during care',
        questions: [
          { number: '1.1', text: 'Doors are knocked before entering', type: 'yes_no' },
          { number: '1.2', text: 'Curtains/screens are used during personal care', type: 'yes_no' },
          { number: '1.3', text: 'Residents are addressed by preferred name', type: 'yes_no' },
          { number: '1.4', text: 'Residents are dressed appropriately', type: 'yes_no' },
          { number: '1.5', text: 'Personal care is provided discreetly', type: 'yes_no' },
        ]
      },
      {
        name: 'Choice and Independence',
        description: 'Promoting autonomy and choice',
        questions: [
          { number: '2.1', text: 'Residents are offered choices in daily routines', type: 'yes_no' },
          { number: '2.2', text: 'Residents are supported to maintain independence', type: 'yes_no' },
          { number: '2.3', text: 'Residents can personalise their rooms', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'finance_audit_template',
    name: 'Finance Audit',
    sections: [
      {
        name: 'Resident Finances',
        description: 'Management of resident money',
        questions: [
          { number: '1.1', text: 'Resident finance records are up to date', type: 'yes_no' },
          { number: '1.2', text: 'Receipts are provided for all transactions', type: 'yes_no' },
          { number: '1.3', text: 'Two signatures required for withdrawals', type: 'yes_no' },
          { number: '1.4', text: 'Regular audits of resident money are conducted', type: 'yes_no' },
          { number: '1.5', text: 'Safe is secure and access is controlled', type: 'yes_no' },
        ]
      },
      {
        name: 'Financial Policies',
        description: 'Policy compliance',
        questions: [
          { number: '2.1', text: 'Finance policy is in place', type: 'yes_no' },
          { number: '2.2', text: 'Staff are trained in financial procedures', type: 'yes_no' },
          { number: '2.3', text: 'Discrepancies are investigated and documented', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'complaints_audit_template',
    name: 'Complaints Audit',
    sections: [
      {
        name: 'Complaints Management',
        description: 'Recording and responding to complaints',
        questions: [
          { number: '1.1', text: 'Complaints policy is accessible to residents/families', type: 'yes_no' },
          { number: '1.2', text: 'All complaints are logged', type: 'yes_no' },
          { number: '1.3', text: 'Complaints are acknowledged within 48 hours', type: 'yes_no' },
          { number: '1.4', text: 'Investigations are completed within policy timescales', type: 'yes_no' },
          { number: '1.5', text: 'Complainants receive written responses', type: 'yes_no' },
        ]
      },
      {
        name: 'Learning from Complaints',
        description: 'Service improvement',
        questions: [
          { number: '2.1', text: 'Complaints are analysed for trends', type: 'yes_no' },
          { number: '2.2', text: 'Learning is shared with staff', type: 'yes_no' },
          { number: '2.3', text: 'Actions are taken to prevent recurrence', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'first_aid_template',
    name: 'First Aid Box Audit',
    sections: [
      {
        name: 'First Aid Equipment',
        description: 'Contents and condition of first aid boxes',
        questions: [
          { number: '1.1', text: 'First aid box is easily accessible', type: 'yes_no' },
          { number: '1.2', text: 'Contents list is displayed', type: 'yes_no' },
          { number: '1.3', text: 'All items are in date', type: 'yes_no' },
          { number: '1.4', text: 'Adequate supply of plasters and dressings', type: 'yes_no' },
          { number: '1.5', text: 'Disposable gloves are available', type: 'yes_no' },
          { number: '1.6', text: 'Box is clean and well-maintained', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'manager_walkabout_template',
    name: 'Manager Walkabout Audit',
    sections: [
      {
        name: 'Environment',
        description: 'General environmental observations',
        questions: [
          { number: '1.1', text: 'Communal areas are clean and tidy', type: 'yes_no' },
          { number: '1.2', text: 'No unpleasant odours are present', type: 'yes_no' },
          { number: '1.3', text: 'Temperature is comfortable', type: 'yes_no' },
          { number: '1.4', text: 'Lighting is adequate', type: 'yes_no' },
          { number: '1.5', text: 'Hazards are not present', type: 'yes_no' },
        ]
      },
      {
        name: 'Staff Observations',
        description: 'Staff conduct and practice',
        questions: [
          { number: '2.1', text: 'Staff are wearing appropriate uniform/ID', type: 'yes_no' },
          { number: '2.2', text: 'Staff interactions with residents are respectful', type: 'yes_no' },
          { number: '2.3', text: 'Call bells are answered promptly', type: 'yes_no' },
        ]
      },
      {
        name: 'Resident Wellbeing',
        description: 'Observations of resident care',
        questions: [
          { number: '3.1', text: 'Residents appear well-cared for', type: 'yes_no' },
          { number: '3.2', text: 'Residents are engaged in activities', type: 'yes_no' },
          { number: '3.3', text: 'Residents have access to drinks', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'skin_integrity_template',
    name: 'Skin Integrity Audit',
    sections: [
      {
        name: 'Pressure Area Care',
        description: 'Prevention and management of pressure ulcers',
        questions: [
          { number: '1.1', text: 'Waterlow scores are up to date', type: 'yes_no' },
          { number: '1.2', text: 'Repositioning charts are completed', type: 'yes_no' },
          { number: '1.3', text: 'Pressure-relieving equipment is in use where needed', type: 'yes_no' },
          { number: '1.4', text: 'Skin inspections are documented', type: 'yes_no' },
          { number: '1.5', text: 'Any pressure damage is reported and treated', type: 'yes_no' },
        ]
      },
      {
        name: 'Skin Care Documentation',
        description: 'Recording and monitoring',
        questions: [
          { number: '2.1', text: 'Body maps are completed for any skin damage', type: 'yes_no' },
          { number: '2.2', text: 'Wound care plans are in place', type: 'yes_no' },
          { number: '2.3', text: 'Referrals to tissue viability nurse are made when appropriate', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'dining_experience_template',
    name: 'Dining Experience Audit',
    sections: [
      {
        name: 'Mealtime Environment',
        description: 'Dining atmosphere and presentation',
        questions: [
          { number: '1.1', text: 'Dining area is clean and welcoming', type: 'yes_no' },
          { number: '1.2', text: 'Tables are set appropriately', type: 'yes_no' },
          { number: '1.3', text: 'Background noise is minimised', type: 'yes_no' },
          { number: '1.4', text: 'Food is served at correct temperature', type: 'yes_no' },
          { number: '1.5', text: 'Food presentation is appetising', type: 'yes_no' },
        ]
      },
      {
        name: 'Resident Support',
        description: 'Assistance and choice at mealtimes',
        questions: [
          { number: '2.1', text: 'Residents are offered choice of meals', type: 'yes_no' },
          { number: '2.2', text: 'Assistance is provided where needed', type: 'yes_no' },
          { number: '2.3', text: 'Adaptive equipment is available', type: 'yes_no' },
          { number: '2.4', text: 'Residents are positioned comfortably', type: 'yes_no' },
          { number: '2.5', text: 'Drinks are offered throughout the meal', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'weight_analysis_template',
    name: 'Weight Analysis Audit',
    sections: [
      {
        name: 'Weight Monitoring',
        description: 'Regular weight checks and recording',
        questions: [
          { number: '1.1', text: 'Residents are weighed monthly', type: 'yes_no' },
          { number: '1.2', text: 'Weight is recorded accurately', type: 'yes_no' },
          { number: '1.3', text: 'Significant weight loss/gain is identified', type: 'yes_no' },
          { number: '1.4', text: 'MUST scores are calculated where appropriate', type: 'yes_no' },
        ]
      },
      {
        name: 'Action and Referrals',
        description: 'Response to weight changes',
        questions: [
          { number: '2.1', text: 'GP is informed of significant weight changes', type: 'yes_no' },
          { number: '2.2', text: 'Dietitian referrals are made when needed', type: 'yes_no' },
          { number: '2.3', text: 'Food and fluid charts are implemented where appropriate', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'call_bell_template',
    name: 'Call Bell Analysis Audit',
    sections: [
      {
        name: 'Call Bell Response',
        description: 'Response times and effectiveness',
        questions: [
          { number: '1.1', text: 'Call bells are within reach of all residents', type: 'yes_no' },
          { number: '1.2', text: 'Call bells are answered within 5 minutes', type: 'yes_no' },
          { number: '1.3', text: 'Response times are monitored', type: 'yes_no' },
          { number: '1.4', text: 'Call bell system is tested regularly', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'night_visits_template',
    name: 'Night Visits Audit',
    sections: [
      {
        name: 'Night Staffing',
        description: 'Staffing levels and competency',
        questions: [
          { number: '1.1', text: 'Adequate staff on duty overnight', type: 'yes_no' },
          { number: '1.2', text: 'Senior staff member is on duty', type: 'yes_no' },
          { number: '1.3', text: 'Staff are awake and alert', type: 'yes_no' },
        ]
      },
      {
        name: 'Night Care Quality',
        description: 'Care delivery during night hours',
        questions: [
          { number: '2.1', text: 'Resident checks are documented', type: 'yes_no' },
          { number: '2.2', text: 'Call bells are answered promptly', type: 'yes_no' },
          { number: '2.3', text: 'Environment is safe and secure', type: 'yes_no' },
          { number: '2.4', text: 'Lighting levels are appropriate', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'missed_calls_template',
    name: 'Missed and Late Calls Audit',
    sections: [
      {
        name: 'Call Monitoring',
        description: 'Tracking missed and late calls',
        questions: [
          { number: '1.1', text: 'All missed calls are logged', type: 'yes_no' },
          { number: '1.2', text: 'Late calls are recorded with reasons', type: 'yes_no' },
          { number: '1.3', text: 'Service users are informed of delays', type: 'yes_no' },
          { number: '1.4', text: 'Trends are analysed monthly', type: 'yes_no' },
        ]
      },
      {
        name: 'Corrective Actions',
        description: 'Addressing missed and late calls',
        questions: [
          { number: '2.1', text: 'Root causes are investigated', type: 'yes_no' },
          { number: '2.2', text: 'Actions are taken to prevent recurrence', type: 'yes_no' },
          { number: '2.3', text: 'Service users receive apologies where appropriate', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'senior_qa_template',
    name: 'Senior Manager QA Audit',
    sections: [
      {
        name: 'Quality Assurance Systems',
        description: 'QA framework and monitoring',
        questions: [
          { number: '1.1', text: 'Quality assurance policy is in place', type: 'yes_no' },
          { number: '1.2', text: 'Regular audits are conducted', type: 'yes_no' },
          { number: '1.3', text: 'Audit findings are acted upon', type: 'yes_no' },
          { number: '1.4', text: 'Quality improvement plans are in place', type: 'yes_no' },
        ]
      },
      {
        name: 'Governance',
        description: 'Leadership and accountability',
        questions: [
          { number: '2.1', text: 'Management meetings are held regularly', type: 'yes_no' },
          { number: '2.2', text: 'Key performance indicators are monitored', type: 'yes_no' },
          { number: '2.3', text: 'Risks are identified and managed', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'nmc_checks_template',
    name: 'NMC Checks Audit',
    sections: [
      {
        name: 'NMC Registration',
        description: 'Nursing and Midwifery Council registration checks',
        questions: [
          { number: '1.1', text: 'All nurses have current NMC registration', type: 'yes_no' },
          { number: '1.2', text: 'NMC PIN numbers are verified', type: 'yes_no' },
          { number: '1.3', text: 'Registration expiry dates are monitored', type: 'yes_no' },
          { number: '1.4', text: 'Revalidation dates are tracked', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'driving_checks_template',
    name: 'Driving License & Insurance Checks Audit',
    sections: [
      {
        name: 'Driver Documentation',
        description: 'License and insurance verification',
        questions: [
          { number: '1.1', text: 'Valid driving license is on file for all drivers', type: 'yes_no' },
          { number: '1.2', text: 'License is checked every 6 months', type: 'yes_no' },
          { number: '1.3', text: 'Business insurance is in place', type: 'yes_no' },
          { number: '1.4', text: 'Insurance certificates are current', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'safe_contents_template',
    name: 'Safe Contents Audit',
    sections: [
      {
        name: 'Safe Security',
        description: 'Safe access and contents',
        questions: [
          { number: '1.1', text: 'Safe is locked and secure', type: 'yes_no' },
          { number: '1.2', text: 'Access to safe is controlled', type: 'yes_no' },
          { number: '1.3', text: 'Contents match safe register', type: 'yes_no' },
          { number: '1.4', text: 'Resident valuables are documented', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'burns_kit_template',
    name: 'Burns Kit Audit',
    sections: [
      {
        name: 'Burns Kit Contents',
        description: 'Equipment for treating burns',
        questions: [
          { number: '1.1', text: 'Burns kit is easily accessible', type: 'yes_no' },
          { number: '1.2', text: 'Burn dressings are in date', type: 'yes_no' },
          { number: '1.3', text: 'Cling film is available', type: 'yes_no' },
          { number: '1.4', text: 'Kit contents are complete', type: 'yes_no' },
        ]
      }
    ]
  },
  {
    ref: 'spillage_kit_template',
    name: 'Body Fluid Spillage Kits Audit',
    sections: [
      {
        name: 'Spillage Kit Contents',
        description: 'Equipment for managing body fluid spillages',
        questions: [
          { number: '1.1', text: 'Spillage kits are available on each floor', type: 'yes_no' },
          { number: '1.2', text: 'Absorbent granules/powder is present', type: 'yes_no' },
          { number: '1.3', text: 'PPE is included in kit', type: 'yes_no' },
          { number: '1.4', text: 'Disposal bags are available', type: 'yes_no' },
          { number: '1.5', text: 'Instructions for use are displayed', type: 'yes_no' },
        ]
      }
    ]
  }
];

// Create templates for each missing audit type
for (const template of templates) {
  const auditType = allAuditTypes.find(at => at.templateReference === template.ref);
  
  if (!auditType) {
    console.log(`  ⚠️  Audit type not found: ${template.ref}`);
    continue;
  }

  console.log(`  Creating template: ${template.name}`);

  // Create the audit template
  const [newTemplate] = await db.insert(auditTemplates).values({
    auditTypeId: auditType.id,
    templateName: template.name,
    description: `Comprehensive ${template.name.toLowerCase()} based on UK CQC standards`,
  });

  const templateId = newTemplate.insertId;

  // Create sections and questions
  for (const section of template.sections) {
    const sectionIndex = template.sections.indexOf(section) + 1;
    const [newSection] = await db.insert(auditTemplateSections).values({
      auditTemplateId: templateId,
      sectionNumber: sectionIndex,
      sectionTitle: section.name,
      sectionDescription: section.description,
      displayOrder: sectionIndex,
    });

    const sectionId = newSection.insertId;

    // Create questions for this section
    for (const question of section.questions) {
      const questionIndex = section.questions.indexOf(question) + 1;
      await db.insert(auditTemplateQuestions).values({
        auditTemplateSectionId: sectionId,
        questionNumber: question.number,
        questionText: question.text,
        questionType: question.type,
        displayOrder: questionIndex,
      });
    }
  }

  console.log(`    ✓ Created with ${template.sections.length} sections`);
}

console.log('\n✅ All remaining audit templates seeded successfully!');

await connection.end();
