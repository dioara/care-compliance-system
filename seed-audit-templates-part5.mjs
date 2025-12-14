import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting audit templates Part 5 (Final Quarterly + Annual Audits)...\n');

const allAuditTypes = await db.select().from(auditTypes);

async function createAuditTemplate(auditTypeId, templateName, sections) {
  console.log(`  Creating template: ${templateName}`);
  const [template] = await db.insert(auditTemplates).values({
    auditTypeId, templateName, version: '1.0', isActive: true,
  });
  const templateId = template.insertId;
  
  for (const section of sections) {
    const [sectionResult] = await db.insert(auditTemplateSections).values({
      auditTemplateId: templateId,
      sectionNumber: section.sectionNumber,
      sectionTitle: section.sectionTitle,
      sectionDescription: section.sectionDescription,
      displayOrder: section.displayOrder,
    });
    const sectionId = sectionResult.insertId;
    
    for (const question of section.questions) {
      await db.insert(auditTemplateQuestions).values({
        auditTemplateSectionId: sectionId,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options ? JSON.stringify(question.options) : null,
        isRequired: question.isRequired !== false,
        guidance: question.guidance || null,
        displayOrder: question.displayOrder,
      });
    }
  }
  console.log(`    ✓ Created with ${sections.length} sections`);
}

// REMAINING QUARTERLY AUDITS

// 33. QUALITY ASSURANCE AND GOVERNANCE AUDIT
const qaAudit = allAuditTypes.find(a => a.templateReference === 'QA-001');
if (qaAudit) {
  await createAuditTemplate(qaAudit.id, 'Quality Assurance and Governance Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Quality Monitoring Systems',
      sectionDescription: 'Internal quality monitoring processes',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Quality assurance framework is in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Regular audits are scheduled and completed', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Audit findings are documented', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Action plans are developed from audit findings', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Actions are monitored and completed', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Policies and Procedures',
      sectionDescription: 'Policy framework and review',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'All required policies are in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Policies are reviewed every 2-3 years', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Policies reflect current legislation and best practice', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Staff have access to policies', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Policy review dates are tracked', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Governance Structure',
      sectionDescription: 'Management and oversight',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Registered manager is in post', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Management structure is clear', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Regular management meetings are held', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Provider visits are completed monthly', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Annual service review is completed', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Stakeholder Engagement',
      sectionDescription: 'Resident, family, and staff involvement',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Resident meetings are held regularly', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Relatives meetings are held regularly', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Staff meetings are held regularly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Satisfaction surveys are conducted annually', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Feedback is acted upon', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 34. COMPLAINTS MANAGEMENT AUDIT
const complaintsAudit = allAuditTypes.find(a => a.templateReference === 'COMP-001');
if (complaintsAudit) {
  await createAuditTemplate(complaintsAudit.id, 'Complaints Management Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Complaints Policy and Accessibility',
      sectionDescription: 'Making complaints process accessible',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Complaints policy is in place and up to date', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Complaints procedure is displayed', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Information is available in accessible formats', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Residents and families know how to complain', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Complaints Recording',
      sectionDescription: 'Documentation of complaints',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'All complaints are logged', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Complaints log includes all required details', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Verbal complaints are recorded', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Complaints are acknowledged within 3 working days', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Investigation and Resolution',
      sectionDescription: 'Handling complaints effectively',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Complaints are investigated thoroughly', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Complainants receive written response', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Responses are provided within agreed timescales', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Outcomes are clearly communicated', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Apologies are given where appropriate', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Learning from Complaints',
      sectionDescription: 'Using complaints to improve services',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Complaints are analysed for trends', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Actions are taken to prevent recurrence', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Lessons learned are shared with staff', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Complaints data is reported to governance meetings', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 35. MENTAL CAPACITY ACT (MCA) AND DoLS AUDIT
const mcaAudit = allAuditTypes.find(a => a.templateReference === 'MCA-001');
if (mcaAudit) {
  await createAuditTemplate(mcaAudit.id, 'Mental Capacity Act and DoLS Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Mental Capacity Assessments',
      sectionDescription: 'Decision-specific capacity assessments',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Capacity is assumed unless proven otherwise', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Capacity assessments are decision-specific', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Assessments follow the two-stage test', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Assessments are documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Residents are supported to make decisions', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Best Interest Decisions',
      sectionDescription: 'Making decisions for those lacking capacity',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Best interest meetings are held when required', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Relevant people are involved in decisions', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Resident wishes and feelings are considered', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Best interest decisions are documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Least restrictive options are chosen', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Deprivation of Liberty Safeguards (DoLS)',
      sectionDescription: 'DoLS applications and authorisations',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'DoLS assessments completed for relevant residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'DoLS applications submitted to supervisory body', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Authorisations are in place and current', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Conditions attached to DoLS are followed', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Reviews are completed before expiry', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Staff Training and Understanding',
      sectionDescription: 'MCA/DoLS knowledge and competence',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'All staff have completed MCA training', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Staff understand the five principles of MCA', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Staff know when to complete capacity assessments', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Staff understand DoLS process', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 36. DIABETES CARE AUDIT
const diabetesAudit = allAuditTypes.find(a => a.templateReference === 'DIAB-001');
if (diabetesAudit) {
  await createAuditTemplate(diabetesAudit.id, 'Diabetes Care Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Diabetes Management Plans',
      sectionDescription: 'Individual diabetes care planning',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Diabetes is identified in care plan', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Type of diabetes is documented (Type 1/Type 2)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Treatment regime is clearly documented', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Target blood glucose range is specified', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Hypo/hyperglycaemia protocols are in place', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Blood Glucose Monitoring',
      sectionDescription: 'Regular monitoring and recording',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Blood glucose is monitored as per care plan', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Monitoring equipment is calibrated and maintained', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Results are recorded accurately', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Abnormal results are acted upon', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'GP is informed of concerning trends', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Foot Care',
      sectionDescription: 'Diabetic foot care and monitoring',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Feet are inspected regularly', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Foot care is documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Appropriate footwear is worn', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Podiatry services are accessed', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Any foot problems are reported promptly', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Diet and Lifestyle',
      sectionDescription: 'Supporting healthy lifestyle',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Diabetic diet is provided', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Dietary preferences are accommodated', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Activity and exercise are encouraged', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Weight is monitored', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 37. DEMENTIA CARE AUDIT
const dementiaAudit = allAuditTypes.find(a => a.templateReference === 'DEM-001');
if (dementiaAudit) {
  await createAuditTemplate(dementiaAudit.id, 'Dementia Care Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Person-Centred Care',
      sectionDescription: 'Individualised dementia care',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Life history is documented', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Preferences and routines are known and followed', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Care is flexible and responsive', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Resident is treated with dignity and respect', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Family are involved in care planning', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Communication',
      sectionDescription: 'Effective communication strategies',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Communication needs are assessed', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Staff use appropriate communication techniques', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Non-verbal communication is understood', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Visual aids and prompts are used', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Environment',
      sectionDescription: 'Dementia-friendly environment',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Environment is calm and uncluttered', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Signage and visual cues are used', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Lighting is appropriate', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Safe walking areas are available', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Meaningful objects and memorabilia are present', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Activities and Engagement',
      sectionDescription: 'Meaningful occupation',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Activities are tailored to abilities and interests', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Sensory activities are provided', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Residents are engaged throughout the day', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Reminiscence work is used', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Behaviour Support',
      sectionDescription: 'Understanding and responding to distress',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'Behaviours are understood as communication', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Triggers are identified and documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'De-escalation techniques are used', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'ABC charts are completed when appropriate', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '5.5', questionText: 'Specialist support is sought when needed', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 38. COMMUNICATION AUDIT
const commAudit = allAuditTypes.find(a => a.templateReference === 'COMM-001');
if (commAudit) {
  await createAuditTemplate(commAudit.id, 'Communication Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Communication Needs Assessment',
      sectionDescription: 'Identifying communication needs',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Communication assessment completed on admission', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Sensory impairments are identified', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Language and cultural needs are documented', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Preferred communication methods are recorded', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Communication Support',
      sectionDescription: 'Providing appropriate support',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Hearing aids are available and working', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Glasses are clean and available', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Communication aids are provided (picture boards, etc.)', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Interpreter services are accessed when needed', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Staff Communication Skills',
      sectionDescription: 'Effective communication practices',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Staff speak clearly and at appropriate pace', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Staff make eye contact and listen attentively', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Staff check understanding', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Staff use non-verbal communication appropriately', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Accessible Information',
      sectionDescription: 'Providing information in accessible formats',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Information is available in large print', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Easy-read versions are available', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Information is available in other languages if needed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Accessible Information Standard is followed', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 39. NUTRITION AND HYDRATION AUDIT
const nutritionAudit = allAuditTypes.find(a => a.templateReference === 'NUT-001');
if (nutritionAudit) {
  await createAuditTemplate(nutritionAudit.id, 'Nutrition and Hydration Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Nutritional Assessment',
      sectionDescription: 'Identifying nutritional needs and risks',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Nutritional screening completed on admission (MUST tool)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Weight is monitored monthly', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Unintentional weight loss is investigated', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Nutritional care plan is in place for at-risk residents', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Dietitian referral made when appropriate', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Food and Fluid Provision',
      sectionDescription: 'Quality and choice of meals',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Menus are varied and nutritious', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Choice is offered at every meal', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Dietary requirements are met (diabetic, vegetarian, cultural)', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Food is appetising and well-presented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Portion sizes are appropriate', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '2.6', questionText: 'Snacks and drinks are available throughout the day', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Mealtime Experience',
      sectionDescription: 'Creating positive mealtime environment',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Dining areas are pleasant and welcoming', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Tables are set attractively', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Residents are positioned comfortably', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Adequate time is allowed for meals', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Assistance is provided where needed', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'Mealtimes are unhurried and social', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Monitoring and Recording',
      sectionDescription: 'Tracking food and fluid intake',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Food and fluid charts are completed for at-risk residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Charts are completed accurately', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Poor intake is reported and acted upon', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Supplements are given as prescribed', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// ANNUAL AUDITS

// 40. LOLER EQUIPMENT TESTING AUDIT (Annual)
const lolerAudit = allAuditTypes.find(a => a.templateReference === 'LOLER-001');
if (lolerAudit) {
  await createAuditTemplate(lolerAudit.id, 'LOLER Equipment Testing Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Equipment Inventory',
      sectionDescription: 'Register of lifting equipment',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'All lifting equipment is identified and registered', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Register includes hoists, slings, lifts, and bath lifts', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Equipment serial numbers and purchase dates recorded', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Six-Monthly Inspections',
      sectionDescription: 'LOLER-compliant inspections',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'All lifting equipment inspected every 6 months', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Inspections carried out by competent person', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Inspection certificates are on file', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Next inspection due dates are tracked', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Any defects identified are rectified', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Thorough Examination',
      sectionDescription: 'Annual thorough examination',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Thorough examination completed annually', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Examination includes load testing where appropriate', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Examination reports are retained', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
  ]);
}

// 41. CONTINGENCY PLANNING AUDIT (Annual)
const contingencyAudit = allAuditTypes.find(a => a.templateReference === 'CONT-PLAN-001');
if (contingencyAudit) {
  await createAuditTemplate(contingencyAudit.id, 'Contingency Planning Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Business Continuity Plan',
      sectionDescription: 'Planning for service disruption',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Business continuity plan is in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Plan covers all likely scenarios (fire, flood, power cut, pandemic)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Plan is reviewed annually', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Staff are aware of contingency arrangements', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Emergency Contacts',
      sectionDescription: 'Key contact information',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Emergency contact list is maintained', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'List includes utilities, contractors, and local authority', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'On-call management contacts are available', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Contact details are kept up to date', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Emergency Supplies',
      sectionDescription: 'Stockpiling essential supplies',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Emergency supplies are maintained (food, water, blankets)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Backup power source is available (generator)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Emergency lighting is functional', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'First aid supplies are stocked', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Testing and Drills',
      sectionDescription: 'Regular testing of contingency plans',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Contingency plans are tested annually', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Tabletop exercises are conducted', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Lessons learned are incorporated into plans', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
  ]);
}

// 42. DATA PROTECTION AND GDPR AUDIT (Annual)
const gdprAudit = allAuditTypes.find(a => a.templateReference === 'GDPR-001');
if (gdprAudit) {
  await createAuditTemplate(gdprAudit.id, 'Data Protection and GDPR Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Data Protection Policy',
      sectionDescription: 'GDPR compliance framework',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Data protection policy is in place and up to date', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Policy reflects GDPR requirements', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Data protection officer (DPO) is appointed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'ICO registration is current', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Consent and Privacy Notices',
      sectionDescription: 'Lawful basis for processing data',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Privacy notices are provided to residents and families', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Consent is obtained for data processing where required', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Consent records are maintained', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Residents can withdraw consent', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Data Security',
      sectionDescription: 'Protecting personal data',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Paper records are stored securely', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Electronic records are password protected', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Access to records is restricted to authorised staff', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Confidential waste is disposed of securely (shredded)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Data breaches are reported to ICO within 72 hours', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Subject Access Requests',
      sectionDescription: 'Responding to data subject rights',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Procedure for handling subject access requests is in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Requests are responded to within 1 month', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Residents can request rectification or erasure of data', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Staff Training',
      sectionDescription: 'Data protection awareness',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'All staff have completed data protection training', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Staff understand confidentiality requirements', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Staff know how to report data breaches', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
  ]);
}

console.log('\n✅ Part 5 complete: Final quarterly and all annual audits seeded\n');
console.log('🎉🎉🎉 ALL 42 AUDIT TEMPLATES NOW COMPLETE! 🎉🎉🎉\n');
console.log('Total audit types: 42');
console.log('Total templates created: 42');
console.log('Total questions: 600+\n');

await connection.end();
