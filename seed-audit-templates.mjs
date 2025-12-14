import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting audit templates seed...\n');

// Get all audit types
const allAuditTypes = await db.select().from(auditTypes);
console.log(`📋 Found ${allAuditTypes.length} audit types\n`);

// Helper function to create template with sections and questions
async function createAuditTemplate(auditTypeId, templateName, sections) {
  console.log(`  Creating template: ${templateName}`);
  
  // Create template
  const [template] = await db.insert(auditTemplates).values({
    auditTypeId,
    templateName,
    version: '1.0',
    isActive: true,
  });
  
  const templateId = template.insertId;
  
  // Create sections and questions
  for (const section of sections) {
    const [sectionResult] = await db.insert(auditTemplateSections).values({
      auditTemplateId: templateId,
      sectionNumber: section.sectionNumber,
      sectionTitle: section.sectionTitle,
      sectionDescription: section.sectionDescription,
      displayOrder: section.displayOrder,
    });
    
    const sectionId = sectionResult.insertId;
    
    // Create questions for this section
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

// 1. MEDICATION MANAGEMENT AUDIT (from uploaded template)
const medicationAudit = allAuditTypes.find(a => a.templateReference === 'MED-001');
if (medicationAudit) {
  await createAuditTemplate(medicationAudit.id, 'Medication Competency Assessment', [
    {
      sectionNumber: 1,
      sectionTitle: 'Medication Storage and Handling',
      sectionDescription: 'Assessment of medication receipt, storage, and stock management',
      displayOrder: 1,
      questions: [
        {
          questionNumber: '1.1',
          questionText: 'You receive and store supplies of medication in line with your organisational ways of working',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '1.2',
          questionText: 'You apply standard precautions for infection control and any other relevant health and safety measures',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '1.3',
          questionText: 'You monitor and rotate stocks of medication, maintain appropriate storage conditions and report any discrepancies in stocks immediately',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '1.4',
          questionText: 'You dispose of out of date and part-used medications in accordance with legal and organisational requirements',
          questionType: 'yes_no',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Medication Administration Records',
      sectionDescription: 'Checking and using MAR charts correctly',
      displayOrder: 2,
      questions: [
        {
          questionNumber: '2.1',
          questionText: 'You check that all medication administration records, protocols, and any relevant risk assessments are available, up to date and legible',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '2.2',
          questionText: 'You report any discrepancies or omissions you find to the relevant person as appropriate',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '2.3',
          questionText: 'Before administering any medication you read the medication administration record (MAR) accurately, referring any illegible directions to the appropriate care professional',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '2.4',
          questionText: 'You clearly and accurately enter relevant information in the correct records, returning the records to the correct storage location after use',
          questionType: 'yes_no',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Safe Administration of Medication',
      sectionDescription: 'Preparing and administering medication safely',
      displayOrder: 3,
      questions: [
        {
          questionNumber: '3.1',
          questionText: 'You select, check and prepare correctly the medication according to the medication administration record',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '3.2',
          questionText: 'Before administering medication you check and confirm the identity of the individual who is to receive the medication',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '3.3',
          questionText: 'You check that the individual has not taken any medication recently and act accordingly in relation to the appropriate timing of the medication',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '3.4',
          questionText: 'You obtain the individual\'s consent and offer information, support and reassurance throughout',
          questionType: 'yes_no',
          displayOrder: 4,
        },
        {
          questionNumber: '3.5',
          questionText: 'You administer medication following written instructions and in line with legislation and local policies',
          questionType: 'yes_no',
          displayOrder: 5,
        },
        {
          questionNumber: '3.6',
          questionText: 'You administer medication in a way which minimises pain, discomfort and trauma to the individual',
          questionType: 'yes_no',
          displayOrder: 6,
        },
        {
          questionNumber: '3.7',
          questionText: 'You maintain the security of medication throughout and return it to the correct place for storage after use',
          questionType: 'yes_no',
          displayOrder: 7,
        },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Monitoring and Problem Solving',
      sectionDescription: 'Monitoring effects and responding to issues',
      displayOrder: 4,
      questions: [
        {
          questionNumber: '4.1',
          questionText: 'You monitor the individual\'s condition throughout, recognise any adverse effects and take the appropriate action without delay',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '4.2',
          questionText: 'You know where to go for help to seek advice about a medicine if you are unsure (including role of Manager, Pharmacist, District Nurse, GP)',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '4.3',
          questionText: 'You report any immediate problems with the administration (e.g., person refuses medication, medication out of stock)',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '4.4',
          questionText: 'You can explain your responsibilities if a person requests "over the counter" remedies as part of their support',
          questionType: 'yes_no',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Administration Techniques',
      sectionDescription: 'Competency in various medication administration routes',
      displayOrder: 5,
      questions: [
        {
          questionNumber: '5.1',
          questionText: 'Tablets/capsules administration',
          questionType: 'pass_fail',
          guidance: 'Observe and assess competency',
          displayOrder: 1,
        },
        {
          questionNumber: '5.2',
          questionText: 'Liquids administration',
          questionType: 'pass_fail',
          displayOrder: 2,
        },
        {
          questionNumber: '5.3',
          questionText: 'Sachets and powders administration',
          questionType: 'pass_fail',
          displayOrder: 3,
        },
        {
          questionNumber: '5.4',
          questionText: 'Inhaler devices',
          questionType: 'pass_fail',
          displayOrder: 4,
        },
        {
          questionNumber: '5.5',
          questionText: 'Eye drops',
          questionType: 'pass_fail',
          displayOrder: 5,
        },
        {
          questionNumber: '5.6',
          questionText: 'Eye ointment',
          questionType: 'pass_fail',
          displayOrder: 6,
        },
        {
          questionNumber: '5.7',
          questionText: 'Ear drops',
          questionType: 'pass_fail',
          displayOrder: 7,
        },
        {
          questionNumber: '5.8',
          questionText: 'Nose drops',
          questionType: 'pass_fail',
          displayOrder: 8,
        },
        {
          questionNumber: '5.9',
          questionText: 'Nasal sprays',
          questionType: 'pass_fail',
          displayOrder: 9,
        },
        {
          questionNumber: '5.10',
          questionText: 'Creams and ointments',
          questionType: 'pass_fail',
          displayOrder: 10,
        },
        {
          questionNumber: '5.11',
          questionText: 'Trans-dermal patches',
          questionType: 'pass_fail',
          displayOrder: 11,
        },
      ],
    },
  ]);
}

// 2. STAFF FILE AUDIT (from uploaded template)
const staffFileAudit = allAuditTypes.find(a => a.templateReference === 'STAFFFILE-001');
if (staffFileAudit) {
  await createAuditTemplate(staffFileAudit.id, 'Staff File Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Recruitment',
      sectionDescription: 'Pre-employment checks and documentation',
      displayOrder: 1,
      questions: [
        {
          questionNumber: '1.1',
          questionText: 'Completed Application form is on file - all gaps in employment have been explored and appropriate records of explanation made',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '1.2',
          questionText: 'Copy of Curriculum Vitae is on file',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '1.3',
          questionText: 'Copy of all interview notes are on file along with associated selection process tools (a minimum of two interviewers)',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '1.4',
          questionText: 'Two written references are on file (one professional reference is from last place of employment, if applicable)',
          questionType: 'yes_no',
          displayOrder: 4,
        },
        {
          questionNumber: '1.5',
          questionText: 'Start date of employment is noted on file',
          questionType: 'yes_no',
          displayOrder: 5,
        },
        {
          questionNumber: '1.6',
          questionText: 'Evidence of relevant qualifications and or prior training are on file',
          questionType: 'yes_no',
          displayOrder: 6,
        },
        {
          questionNumber: '1.7',
          questionText: 'Evidence of entitlement to work in the UK e.g. UK passport, employment status form, work permits, visas etc',
          questionType: 'yes_no',
          displayOrder: 7,
        },
        {
          questionNumber: '1.8',
          questionText: 'Up to date DBS certificate number, date, and list of convictions/cautions/warnings is on file (associated risk assessment, if required)',
          questionType: 'yes_no',
          displayOrder: 8,
        },
        {
          questionNumber: '1.9',
          questionText: 'A record of any conflicts of interests are noted and on file',
          questionType: 'yes_no',
          displayOrder: 9,
        },
        {
          questionNumber: '1.10',
          questionText: 'Membership of any professional bodies are noted and are on file',
          questionType: 'yes_no',
          displayOrder: 10,
        },
        {
          questionNumber: '1.11',
          questionText: 'Certificate/proof of registration are on file for any essential requirements for qualification or registration for the post undertaken i.e. Nursing and Midwifery Council etc',
          questionType: 'yes_no',
          displayOrder: 11,
        },
        {
          questionNumber: '1.12',
          questionText: 'Letter of Offer of employment is on file',
          questionType: 'yes_no',
          displayOrder: 12,
        },
        {
          questionNumber: '1.13',
          questionText: 'Completed Medical/Health questionnaire is on file (associated risk assessment, if required)',
          questionType: 'yes_no',
          displayOrder: 13,
        },
        {
          questionNumber: '1.14',
          questionText: 'Staff personal details form is on file with up-to-date contact details and with emergency contact details',
          questionType: 'yes_no',
          displayOrder: 14,
        },
        {
          questionNumber: '1.15',
          questionText: 'A copy of Equalities and Diversity statement is signed and on file',
          questionType: 'yes_no',
          displayOrder: 15,
        },
        {
          questionNumber: '1.16',
          questionText: 'Any relevant staff benefit forms are on file i.e., death in service, pensions, health insurance etc.',
          questionType: 'yes_no',
          displayOrder: 16,
        },
        {
          questionNumber: '1.17',
          questionText: 'A copy of the job description and person specification is on file (signed and dated)',
          questionType: 'yes_no',
          displayOrder: 17,
        },
        {
          questionNumber: '1.18',
          questionText: 'A signed copy of contract of employment is on file',
          questionType: 'yes_no',
          displayOrder: 18,
        },
        {
          questionNumber: '1.19',
          questionText: 'A signed and dated copy of the Working Time Directive is on file (if applicable)',
          questionType: 'yes_no',
          displayOrder: 19,
        },
        {
          questionNumber: '1.20',
          questionText: 'Records of any amendments to contract are on file',
          questionType: 'yes_no',
          displayOrder: 20,
        },
        {
          questionNumber: '1.21',
          questionText: 'Copy of driving documentation is on file (driving licence, MOT, business insurance etc)',
          questionType: 'yes_no',
          displayOrder: 21,
        },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Personal/Professional Development',
      sectionDescription: 'Training and development records',
      displayOrder: 2,
      questions: [
        {
          questionNumber: '2.1',
          questionText: 'Evidence that a staff handbook has been issued and or the ethos and values of the provider have been discussed with the staff member',
          questionType: 'pass_fail',
          displayOrder: 1,
        },
        {
          questionNumber: '2.2',
          questionText: 'Completed staff induction booklet is on file',
          questionType: 'pass_fail',
          displayOrder: 2,
        },
        {
          questionNumber: '2.3',
          questionText: 'Evidence that training is up to date is on file',
          questionType: 'pass_fail',
          displayOrder: 3,
        },
        {
          questionNumber: '2.4',
          questionText: 'A record is made of any additional training requests made by staff over and above any mandatory or statutory requirements along with the outcomes of the request',
          questionType: 'pass_fail',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Performance Management',
      sectionDescription: 'Supervision and appraisal records',
      displayOrder: 3,
      questions: [
        {
          questionNumber: '3.1',
          questionText: 'Regular supervision is taking place in line with the homes policy and procedure and CQC requirements and these are recorded and on file',
          questionType: 'pass_fail',
          displayOrder: 1,
        },
        {
          questionNumber: '3.2',
          questionText: 'Any ad-hoc supervisions are recorded and noted on file',
          questionType: 'pass_fail',
          displayOrder: 2,
        },
        {
          questionNumber: '3.3',
          questionText: 'Annual appraisal is on file and is being actioned and followed up as appropriate and necessary',
          questionType: 'pass_fail',
          displayOrder: 3,
        },
        {
          questionNumber: '3.4',
          questionText: 'Any informal or formal action in line with the capability and/or disciplinary procedures are recorded and on file',
          questionType: 'pass_fail',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Wellbeing and Personal Welfare',
      sectionDescription: 'Leave and absence management',
      displayOrder: 4,
      questions: [
        {
          questionNumber: '4.1',
          questionText: 'A record of annual leave requests, those authorised, rejected, withdrawn and taken are kept on file',
          questionType: 'pass_fail',
          displayOrder: 1,
        },
        {
          questionNumber: '4.2',
          questionText: 'A record of any sickness absence is kept on file',
          questionType: 'pass_fail',
          displayOrder: 2,
        },
        {
          questionNumber: '4.3',
          questionText: 'A record of return to work follow staff absence interviews/welfare checks are recorded and kept on file',
          questionType: 'pass_fail',
          displayOrder: 3,
        },
        {
          questionNumber: '4.4',
          questionText: 'A record of any compassionate leave is kept on file',
          questionType: 'pass_fail',
          displayOrder: 4,
        },
        {
          questionNumber: '4.5',
          questionText: 'A record of any unauthorised leave is kept on file along with any actions taken',
          questionType: 'pass_fail',
          displayOrder: 5,
        },
        {
          questionNumber: '4.6',
          questionText: 'A record of any Occupational Health or other wellbeing service referrals and their outcomes are kept on file',
          questionType: 'pass_fail',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Leavers',
      sectionDescription: 'Exit documentation',
      displayOrder: 5,
      questions: [
        {
          questionNumber: '5.1',
          questionText: 'Resignation letter on file',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '5.2',
          questionText: 'Completed exit interview that has been signed off and acknowledged by the Manager is on file',
          questionType: 'yes_no',
          displayOrder: 2,
        },
        {
          questionNumber: '5.3',
          questionText: 'Reason for leaving is noted on file',
          questionType: 'yes_no',
          displayOrder: 3,
        },
        {
          questionNumber: '5.4',
          questionText: 'Last date of employment is noted on file',
          questionType: 'yes_no',
          displayOrder: 4,
        },
      ],
    },
    {
      sectionNumber: 6,
      sectionTitle: 'Any Other Business',
      sectionDescription: 'Additional documentation',
      displayOrder: 6,
      questions: [
        {
          questionNumber: '6.1',
          questionText: 'General correspondence is filed',
          questionType: 'yes_no',
          displayOrder: 1,
        },
        {
          questionNumber: '6.2',
          questionText: 'Consent forms are filed',
          questionType: 'yes_no',
          displayOrder: 2,
        },
      ],
    },
  ]);
}

console.log('\n✅ Part 1 complete: Medication and Staff File audits seeded\n');
console.log('🔄 Continue with remaining audit templates...\n');

await connection.end();
