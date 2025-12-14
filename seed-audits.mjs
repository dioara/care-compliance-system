import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting audit system seed...\n');

// Define all 40 audit types based on CQC standards
const auditTypesData = [
  // I. Safety, Health & Risk Management Audits (Monthly)
  {
    auditName: 'Infection Prevention and Control (IPC) Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Comprehensive audit of infection control practices including hand hygiene, PPE use, cleaning protocols, and waste disposal',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'IPC-001',
  },
  {
    auditName: 'Medication Management Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Audit of medication administration records, storage, controlled drugs, PRN protocols, and staff competency',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'MED-001',
  },
  {
    auditName: 'Fire Safety Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly fire safety checks including drills, equipment servicing, evacuation plans, and staff training',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'FIRE-001',
  },
  {
    auditName: 'Accidents and Incidents Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Review of incident logging, investigation, action plans, trend analysis, and safeguarding referrals',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'INC-001',
  },
  {
    auditName: 'Falls Prevention Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Audit of fall risk assessments, sensor use, post-fall reviews, environmental hazards, and mobility aids',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'FALLS-001',
  },
  {
    auditName: 'First Aid Equipment Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly check of first aid box contents, expiry dates, accessibility, and staff awareness',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'FIRST-001',
  },
  {
    auditName: 'Water Safety (Legionella) Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly water temperature checks, flushing regimes, risk assessments, and maintenance records',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'WATER-001',
  },
  {
    auditName: 'Care Plan Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Review of person-centred care plans, regular updates, consent documentation, and risk assessments',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'CARE-001',
  },
  {
    auditName: 'Care Records Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Audit of daily notes quality, timeliness, secure storage, confidentiality, and record accuracy',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'REC-001',
  },
  {
    auditName: 'Tissue Viability (Pressure Ulcer Prevention) Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly audit of skin assessments, pressure-relieving equipment, repositioning, and wound care',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'TISSUE-001',
  },
  {
    auditName: 'Dependency Tool/Staffing Levels Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly review of resident acuity assessments, staffing ratios, rota planning, and skill mix',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'STAFF-001',
  },
  {
    auditName: 'Maintenance Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly review of maintenance logs, contractor records, response times, and outstanding repairs',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'MAINT-001',
  },
  {
    auditName: 'Wound Care Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly audit of wound assessment, treatment plans, dressing stock, and healing progress',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'WOUND-001',
  },
  {
    auditName: 'Restraint and Restrictive Practice Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly review of restraint documentation, least restrictive options, and staff training',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'REST-001',
  },
  {
    auditName: 'Resident Finances Audit',
    auditCategory: 'mandatory_monthly',
    description: 'Monthly audit of resident finance management, contracts, receipts, and reconciliation (if applicable)',
    recommendedFrequency: 'monthly',
    isAiPowered: false,
    templateReference: 'FIN-001',
  },

  // Weekly Audits
  {
    auditName: 'Kitchen Hygiene Audit',
    auditCategory: 'operational',
    description: 'Weekly audit of food safety protocols, temperature records, cleanliness, and food hygiene ratings',
    recommendedFrequency: 'weekly',
    isAiPowered: false,
    templateReference: 'KITCHEN-001',
  },
  {
    auditName: 'Cleanliness and Housekeeping Audit',
    auditCategory: 'operational',
    description: 'Weekly audit of cleaning schedules, dust control, odour management, and environmental standards',
    recommendedFrequency: 'weekly',
    isAiPowered: false,
    templateReference: 'CLEAN-001',
  },

  // Quarterly Audits
  {
    auditName: 'Health and Safety Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of risk assessments, COSHH compliance, emergency procedures, and staff training',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'HS-001',
  },
  {
    auditName: 'Bed Rails Safety Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of bed rail risk assessments, safe installation, and alternative options',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'BEDRAIL-001',
  },
  {
    auditName: 'Moving and Handling Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of training records, equipment audits, incident reports, and safe practices',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'MH-001',
  },
  {
    auditName: 'Specialist Equipment Maintenance Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of hoists, lifts, medical devices, service records, and LOLER compliance',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'EQUIP-001',
  },
  {
    auditName: 'Dignity and Respect Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly observation of privacy during care, autonomy, choice, and communication approaches',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'DIG-001',
  },
  {
    auditName: 'Activities and Social Engagement Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of activity schedules, resident participation, preferences, and meaningful engagement',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'ACT-001',
  },
  {
    auditName: 'End-of-Life Care Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of anticipatory care plans, palliative care training, family support, and symptom management',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'EOL-001',
  },
  {
    auditName: 'Continence Management Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of continence assessments, appropriate aids, dignity in care, and skin integrity',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'CONT-001',
  },
  {
    auditName: 'Staff File Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of DBS checks, references, qualifications, contracts, and professional registration',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'STAFFFILE-001',
  },
  {
    auditName: 'Training and Competency Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of mandatory training completion, specialist training, competency assessments, and induction records',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'TRAIN-001',
  },
  {
    auditName: 'Safeguarding Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of incident logs, referral records, staff awareness, whistleblowing, and DoLS authorisations',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'SAFE-001',
  },
  {
    auditName: 'Staff Supervision and Appraisal Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of supervision frequency, performance reviews, development plans, and support needs',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'SUPER-001',
  },
  {
    auditName: 'Recruitment and Induction Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of onboarding checklists, shadowing records, competency assessments, and probation reviews',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'RECRUIT-001',
  },
  {
    auditName: 'Security and Access Control Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of door codes, visitor logs, CCTV policies, and missing person procedures',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'SEC-001',
  },
  {
    auditName: 'Environmental Risk Assessment Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of building safety, accessibility, lighting, heating, outdoor spaces, and furniture',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'ENV-001',
  },
  {
    auditName: 'Quality Assurance/Governance Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of internal audit cycle, action plan completion, quality improvement, and performance indicators',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'QA-001',
  },
  {
    auditName: 'Compliments and Complaints Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of logging, tracking, response times, learning outcomes, and satisfaction trends',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'COMP-001',
  },
  {
    auditName: 'Mental Capacity Act (MCA) and DoLS Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of capacity assessments, best interest decisions, DoLS authorisations, and staff understanding',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'MCA-001',
  },
  {
    auditName: 'Diabetes Management Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of blood glucose monitoring, dietary management, medication, foot care, and emergency protocols',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'DIAB-001',
  },
  {
    auditName: 'Dementia Care Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of person-centred approaches, environmental adaptations, staff training, and family engagement',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'DEM-001',
  },
  {
    auditName: 'Communication and Language Support Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly review of communication needs assessments, interpreter services, assistive technology, and accessible information',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'COMM-001',
  },
  {
    auditName: 'Nutrition and Mealtimes Audit',
    auditCategory: 'quarterly',
    description: 'Quarterly audit of dietary assessments, mealtime observations, hydration monitoring, and dignity support',
    recommendedFrequency: 'quarterly',
    isAiPowered: false,
    templateReference: 'NUT-001',
  },

  // Annual Audits
  {
    auditName: 'LOLER Equipment Testing Audit',
    auditCategory: 'annual',
    description: 'Annual Lifting Operations and Lifting Equipment Regulations testing and certification',
    recommendedFrequency: 'annually',
    isAiPowered: false,
    templateReference: 'LOLER-001',
  },
  {
    auditName: 'Contingency Planning Audit',
    auditCategory: 'annual',
    description: 'Annual review of emergency plans, business continuity, disaster recovery, and communication protocols',
    recommendedFrequency: 'annually',
    isAiPowered: false,
    templateReference: 'CONT-PLAN-001',
  },
  {
    auditName: 'Data Protection/Confidentiality Audit',
    auditCategory: 'annual',
    description: 'Annual GDPR compliance audit including record storage, access controls, data breach procedures, and staff training',
    recommendedFrequency: 'annually',
    isAiPowered: false,
    templateReference: 'GDPR-001',
  },
];

console.log(`📋 Inserting ${auditTypesData.length} audit types...`);

// Insert audit types
for (const auditType of auditTypesData) {
  await db.insert(auditTypes).values(auditType);
  console.log(`  ✓ ${auditType.auditName}`);
}

console.log('\n✅ Audit types seeded successfully!\n');
console.log('🔄 Next: Run seed-audit-templates.mjs to populate audit questions\n');

await connection.end();
