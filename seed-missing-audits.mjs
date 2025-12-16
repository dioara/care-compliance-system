import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting missing audit templates seed...\n');

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

// 1. STAFF SUPERVISION AND APPRAISAL AUDIT (SUPER-001)
const supervisionAudit = allAuditTypes.find(a => a.templateReference === 'SUPER-001');
if (supervisionAudit) {
  await createAuditTemplate(supervisionAudit.id, 'Staff Supervision and Appraisal Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Supervision Frequency and Consistency',
      sectionDescription: 'Assessment of supervision scheduling and regularity',
      displayOrder: 1,
      questions: [
        {
          questionNumber: '1.1',
          questionText: 'Are all care staff receiving supervision at least every 8 weeks?',
          questionType: 'yes_no',
          guidance: 'Check supervision records for the last 6 months',
          displayOrder: 1,
        },
        {
          questionNumber: '1.2',
          questionText: 'Are senior staff and team leaders receiving supervision at least every 12 weeks?',
          questionType: 'yes_no',
          guidance: 'Review supervision schedules and actual completion dates',
          displayOrder: 2,
        },
        {
          questionNumber: '1.3',
          questionText: 'Are new staff receiving more frequent supervision (weekly/fortnightly) during probation?',
          questionType: 'yes_no',
          guidance: 'Check probation period supervision records',
          displayOrder: 3,
        },
        {
          questionNumber: '1.4',
          questionText: 'Is there a supervision schedule in place for all staff?',
          questionType: 'yes_no',
          guidance: 'Review annual supervision planner',
          displayOrder: 4,
        },
        {
          questionNumber: '1.5',
          questionText: 'Are missed supervisions rescheduled promptly?',
          questionType: 'yes_no',
          guidance: 'Check for gaps in supervision records and evidence of rescheduling',
          displayOrder: 5,
        },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Quality of Supervision',
      sectionDescription: 'Assessment of supervision content and effectiveness',
      displayOrder: 2,
      questions: [
        {
          questionNumber: '2.1',
          questionText: 'Are supervision sessions documented using a standard template?',
          questionType: 'yes_no',
          guidance: 'Review supervision records for consistency',
          displayOrder: 1,
        },
        {
          questionNumber: '2.2',
          questionText: 'Do supervision records include discussion of performance, wellbeing, and development?',
          questionType: 'yes_no',
          guidance: 'Sample 5 supervision records and check content',
          displayOrder: 2,
        },
        {
          questionNumber: '2.3',
          questionText: 'Are training needs identified during supervision and recorded?',
          questionType: 'yes_no',
          guidance: 'Check supervision records for training needs identification',
          displayOrder: 3,
        },
        {
          questionNumber: '2.4',
          questionText: 'Are action points from previous supervision reviewed and followed up?',
          questionType: 'yes_no',
          guidance: 'Review consecutive supervision records for action tracking',
          displayOrder: 4,
        },
        {
          questionNumber: '2.5',
          questionText: 'Are both supervisor and supervisee signing supervision records?',
          questionType: 'yes_no',
          guidance: 'Check for signatures on all supervision records',
          displayOrder: 5,
        },
        {
          questionNumber: '2.6',
          questionText: 'Are supervision sessions conducted in private and confidential settings?',
          questionType: 'yes_no',
          guidance: 'Ask staff about supervision environment',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Appraisal Completion',
      sectionDescription: 'Assessment of annual appraisal process',
      displayOrder: 3,
      questions: [
        {
          questionNumber: '3.1',
          questionText: 'Have all staff received an annual appraisal in the last 12 months?',
          questionType: 'yes_no',
          guidance: 'Check appraisal records and completion dates',
          displayOrder: 1,
        },
        {
          questionNumber: '3.2',
          questionText: 'Are appraisals conducted by appropriately trained managers?',
          questionType: 'yes_no',
          guidance: 'Verify supervisor training in appraisal techniques',
          displayOrder: 2,
        },
        {
          questionNumber: '3.3',
          questionText: 'Do appraisals include review of performance against objectives?',
          questionType: 'yes_no',
          guidance: 'Sample 5 appraisal records for content quality',
          displayOrder: 3,
        },
        {
          questionNumber: '3.4',
          questionText: 'Are SMART objectives set for the coming year during appraisals?',
          questionType: 'yes_no',
          guidance: 'Review appraisal records for objective setting',
          displayOrder: 4,
        },
        {
          questionNumber: '3.5',
          questionText: 'Are personal development plans created or updated during appraisals?',
          questionType: 'yes_no',
          guidance: 'Check for development plans in appraisal documentation',
          displayOrder: 5,
        },
        {
          questionNumber: '3.6',
          questionText: 'Are staff given opportunity to provide feedback on their role and the organization?',
          questionType: 'yes_no',
          guidance: 'Review appraisal forms for staff feedback sections',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Competency and Professional Development',
      sectionDescription: 'Assessment of competency maintenance and development support',
      displayOrder: 4,
      questions: [
        {
          questionNumber: '4.1',
          questionText: 'Are competency assessments conducted and documented?',
          questionType: 'yes_no',
          guidance: 'Check for competency assessment records',
          displayOrder: 1,
        },
        {
          questionNumber: '4.2',
          questionText: 'Are training needs identified in supervision/appraisal being met?',
          questionType: 'yes_no',
          guidance: 'Cross-reference supervision records with training matrix',
          displayOrder: 2,
        },
        {
          questionNumber: '4.3',
          questionText: 'Are staff supported to obtain further qualifications relevant to their role?',
          questionType: 'yes_no',
          guidance: 'Review evidence of support for professional development',
          displayOrder: 3,
        },
        {
          questionNumber: '4.4',
          questionText: 'Are registered professionals receiving clinical/professional supervision?',
          questionType: 'yes_no',
          guidance: 'Check supervision records for nurses and other registered professionals',
          displayOrder: 4,
        },
        {
          questionNumber: '4.5',
          questionText: 'Are supervision and appraisal records stored securely and confidentially?',
          questionType: 'yes_no',
          guidance: 'Check storage and access controls for supervision records',
          displayOrder: 5,
        },
      ],
    },
  ]);
}

// 2. RECRUITMENT AND INDUCTION AUDIT (RECRUIT-001)
const recruitmentAudit = allAuditTypes.find(a => a.templateReference === 'RECRUIT-001');
if (recruitmentAudit) {
  await createAuditTemplate(recruitmentAudit.id, 'Recruitment and Induction Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Pre-Employment Checks (Schedule 3)',
      sectionDescription: 'Assessment of recruitment checks compliance',
      displayOrder: 1,
      questions: [
        {
          questionNumber: '1.1',
          questionText: 'Are Enhanced DBS checks obtained for all care staff before they start work?',
          questionType: 'yes_no',
          guidance: 'Review 5 recent staff files for DBS certificates',
          displayOrder: 1,
        },
        {
          questionNumber: '1.2',
          questionText: 'Are two written references obtained, including one from the most recent employer?',
          questionType: 'yes_no',
          guidance: 'Check staff files for reference letters',
          displayOrder: 2,
        },
        {
          questionNumber: '1.3',
          questionText: 'Is a full employment history obtained from compulsory school age?',
          questionType: 'yes_no',
          guidance: 'Review application forms for complete employment history',
          displayOrder: 3,
        },
        {
          questionNumber: '1.4',
          questionText: 'Are gaps in employment history explored and explanations documented?',
          questionType: 'yes_no',
          guidance: 'Check interview notes for gap exploration',
          displayOrder: 4,
        },
        {
          questionNumber: '1.5',
          questionText: 'Is proof of identity verified with photographic ID?',
          questionType: 'yes_no',
          guidance: 'Check for copies of ID documents in staff files',
          displayOrder: 5,
        },
        {
          questionNumber: '1.6',
          questionText: 'Are qualifications verified against original certificates?',
          questionType: 'yes_no',
          guidance: 'Check for qualification verification records',
          displayOrder: 6,
        },
        {
          questionNumber: '1.7',
          questionText: 'Is right to work in the UK verified with original documents?',
          questionType: 'yes_no',
          guidance: 'Review right to work documentation',
          displayOrder: 7,
        },
        {
          questionNumber: '1.8',
          questionText: 'Are professional registrations verified with the relevant regulator (NMC, HCPC, etc.)?',
          questionType: 'yes_no',
          guidance: 'Check for registration verification for nurses and allied health professionals',
          displayOrder: 8,
        },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Interview and Selection',
      sectionDescription: 'Assessment of interview process quality',
      displayOrder: 2,
      questions: [
        {
          questionNumber: '2.1',
          questionText: 'Are structured interviews conducted using competency-based questions?',
          questionType: 'yes_no',
          guidance: 'Review interview templates and records',
          displayOrder: 1,
        },
        {
          questionNumber: '2.2',
          questionText: 'Are values-based questions included to assess suitability for care work?',
          questionType: 'yes_no',
          guidance: 'Check interview questions for values assessment',
          displayOrder: 2,
        },
        {
          questionNumber: '2.3',
          questionText: 'Are interview notes documented and retained?',
          questionType: 'yes_no',
          guidance: 'Review staff files for interview records',
          displayOrder: 3,
        },
        {
          questionNumber: '2.4',
          questionText: 'Are reasons for appointment decisions documented?',
          questionType: 'yes_no',
          guidance: 'Check for selection decision records',
          displayOrder: 4,
        },
        {
          questionNumber: '2.5',
          questionText: 'Are unsuccessful candidates\' records retained for the appropriate period?',
          questionType: 'yes_no',
          guidance: 'Check recruitment file retention policy',
          displayOrder: 5,
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Induction Programme',
      sectionDescription: 'Assessment of induction process and Care Certificate',
      displayOrder: 3,
      questions: [
        {
          questionNumber: '3.1',
          questionText: 'Do all new care staff complete a structured induction programme?',
          questionType: 'yes_no',
          guidance: 'Review induction checklists for recent starters',
          displayOrder: 1,
        },
        {
          questionNumber: '3.2',
          questionText: 'Is the Care Certificate completed by healthcare assistants and social care support workers?',
          questionType: 'yes_no',
          guidance: 'Check for Care Certificate completion records',
          displayOrder: 2,
        },
        {
          questionNumber: '3.3',
          questionText: 'Does the induction cover all mandatory topics (safeguarding, H&S, infection control, etc.)?',
          questionType: 'yes_no',
          guidance: 'Review induction checklist for topic coverage',
          displayOrder: 3,
        },
        {
          questionNumber: '3.4',
          questionText: 'Are new staff provided with shadowing opportunities with experienced staff?',
          questionType: 'yes_no',
          guidance: 'Check induction records for shadowing evidence',
          displayOrder: 4,
        },
        {
          questionNumber: '3.5',
          questionText: 'Are competency assessments completed before staff work unsupervised?',
          questionType: 'yes_no',
          guidance: 'Review competency assessment records',
          displayOrder: 5,
        },
        {
          questionNumber: '3.6',
          questionText: 'Are induction checklists signed off by both the new staff member and supervisor?',
          questionType: 'yes_no',
          guidance: 'Check for signatures on induction documentation',
          displayOrder: 6,
        },
        {
          questionNumber: '3.7',
          questionText: 'Are new staff receiving more frequent supervision during their probation period?',
          questionType: 'yes_no',
          guidance: 'Review supervision records for probationary staff',
          displayOrder: 7,
        },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Probation and Ongoing Monitoring',
      sectionDescription: 'Assessment of probation process and fitness monitoring',
      displayOrder: 4,
      questions: [
        {
          questionNumber: '4.1',
          questionText: 'Are probation periods clearly defined (typically 3-6 months)?',
          questionType: 'yes_no',
          guidance: 'Check employment contracts for probation terms',
          displayOrder: 1,
        },
        {
          questionNumber: '4.2',
          questionText: 'Are probation reviews conducted at regular intervals?',
          questionType: 'yes_no',
          guidance: 'Review probation review records',
          displayOrder: 2,
        },
        {
          questionNumber: '4.3',
          questionText: 'Are concerns about staff fitness addressed promptly and appropriately?',
          questionType: 'yes_no',
          guidance: 'Review HR records for fitness concern management',
          displayOrder: 3,
        },
        {
          questionNumber: '4.4',
          questionText: 'Are DBS checks renewed or monitored through the Update Service?',
          questionType: 'yes_no',
          guidance: 'Check DBS renewal/monitoring system',
          displayOrder: 4,
        },
        {
          questionNumber: '4.5',
          questionText: 'Are professional registrations checked annually for registered staff?',
          questionType: 'yes_no',
          guidance: 'Review professional registration verification records',
          displayOrder: 5,
        },
        {
          questionNumber: '4.6',
          questionText: 'Are recruitment and staff files well-organized and complete?',
          questionType: 'yes_no',
          guidance: 'Audit 5 staff files for completeness and organization',
          displayOrder: 6,
        },
      ],
    },
  ]);
}

// 3. SECURITY AND ACCESS CONTROL AUDIT (SEC-001)
const securityAudit = allAuditTypes.find(a => a.templateReference === 'SEC-001');
if (securityAudit) {
  await createAuditTemplate(securityAudit.id, 'Security and Access Control Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Visitor Management',
      sectionDescription: 'Assessment of visitor logging and management systems',
      displayOrder: 1,
      questions: [
        {
          questionNumber: '1.1',
          questionText: 'Is there a visitor log system in operation?',
          questionType: 'yes_no',
          guidance: 'Check for visitor book or electronic system',
          displayOrder: 1,
        },
        {
          questionNumber: '1.2',
          questionText: 'Are all visitors signing in and out?',
          questionType: 'yes_no',
          guidance: 'Review visitor log for completeness',
          displayOrder: 2,
        },
        {
          questionNumber: '1.3',
          questionText: 'Is visitor identity verified where appropriate?',
          questionType: 'yes_no',
          guidance: 'Check visitor management procedure',
          displayOrder: 3,
        },
        {
          questionNumber: '1.4',
          questionText: 'Are visitors screened for infection control risks during outbreaks?',
          questionType: 'yes_no',
          guidance: 'Review infection control visitor screening procedure',
          displayOrder: 4,
        },
        {
          questionNumber: '1.5',
          questionText: 'Is there a process for managing unexpected or unknown visitors?',
          questionType: 'yes_no',
          guidance: 'Check safeguarding and security procedures',
          displayOrder: 5,
        },
        {
          questionNumber: '1.6',
          questionText: 'Are visiting times clearly communicated while allowing flexibility for end-of-life visits?',
          questionType: 'yes_no',
          guidance: 'Review visiting policy and practice',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Door Codes and Access Control',
      sectionDescription: 'Assessment of entry systems and code security',
      displayOrder: 2,
      questions: [
        {
          questionNumber: '2.1',
          questionText: 'Are door entry codes changed regularly (at least quarterly)?',
          questionType: 'yes_no',
          guidance: 'Check code change log and schedule',
          displayOrder: 1,
        },
        {
          questionNumber: '2.2',
          questionText: 'Is there a record of who has current door codes?',
          questionType: 'yes_no',
          guidance: 'Review code distribution records',
          displayOrder: 2,
        },
        {
          questionNumber: '2.3',
          questionText: 'Are door codes kept secure and not visible to visitors?',
          questionType: 'yes_no',
          guidance: 'Observe keypad areas for visible codes',
          displayOrder: 3,
        },
        {
          questionNumber: '2.4',
          questionText: 'Do emergency exits function correctly and not compromise safety?',
          questionType: 'yes_no',
          guidance: 'Test emergency exit functionality',
          displayOrder: 4,
        },
        {
          questionNumber: '2.5',
          questionText: 'Are contractors supervised or escorted when on site?',
          questionType: 'yes_no',
          guidance: 'Review contractor management procedure',
          displayOrder: 5,
        },
        {
          questionNumber: '2.6',
          questionText: 'Is access control balanced with resident freedom and independence?',
          questionType: 'yes_no',
          guidance: 'Consider DoLS and least restrictive practice',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'CCTV and Surveillance',
      sectionDescription: 'Assessment of CCTV systems and data protection compliance',
      displayOrder: 3,
      questions: [
        {
          questionNumber: '3.1',
          questionText: 'Is there a CCTV policy in place?',
          questionType: 'yes_no',
          guidance: 'Review CCTV policy document',
          displayOrder: 1,
        },
        {
          questionNumber: '3.2',
          questionText: 'Are CCTV signs clearly displayed?',
          questionType: 'yes_no',
          guidance: 'Observe signage at entry points',
          displayOrder: 2,
        },
        {
          questionNumber: '3.3',
          questionText: 'Are cameras positioned to respect resident privacy and dignity?',
          questionType: 'yes_no',
          guidance: 'Review camera locations',
          displayOrder: 3,
        },
        {
          questionNumber: '3.4',
          questionText: 'Is CCTV footage stored securely and in compliance with GDPR?',
          questionType: 'yes_no',
          guidance: 'Check data protection measures',
          displayOrder: 4,
        },
        {
          questionNumber: '3.5',
          questionText: 'Is there a process for subject access requests for CCTV footage?',
          questionType: 'yes_no',
          guidance: 'Review data protection procedures',
          displayOrder: 5,
        },
        {
          questionNumber: '3.6',
          questionText: 'Are CCTV systems regularly maintained and functioning?',
          questionType: 'yes_no',
          guidance: 'Check maintenance records',
          displayOrder: 6,
        },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Missing Person Procedures',
      sectionDescription: 'Assessment of missing person protocols and preventative measures',
      displayOrder: 4,
      questions: [
        {
          questionNumber: '4.1',
          questionText: 'Is there a written missing person protocol in place?',
          questionType: 'yes_no',
          guidance: 'Review missing person procedure document',
          displayOrder: 1,
        },
        {
          questionNumber: '4.2',
          questionText: 'Are all staff trained in the missing person procedure?',
          questionType: 'yes_no',
          guidance: 'Check training records and ask staff',
          displayOrder: 2,
        },
        {
          questionNumber: '4.3',
          questionText: 'Are individual risk assessments in place for residents who may wander?',
          questionType: 'yes_no',
          guidance: 'Review care plans for wandering risk assessments',
          displayOrder: 3,
        },
        {
          questionNumber: '4.4',
          questionText: 'Is appropriate technology used (door sensors, wander alarms) where needed?',
          questionType: 'yes_no',
          guidance: 'Check use of assistive technology',
          displayOrder: 4,
        },
        {
          questionNumber: '4.5',
          questionText: 'Are all missing person incidents logged, investigated, and reviewed?',
          questionType: 'yes_no',
          guidance: 'Review incident logs for missing person events',
          displayOrder: 5,
        },
        {
          questionNumber: '4.6',
          questionText: 'Is police notification timely and appropriate based on risk level?',
          questionType: 'yes_no',
          guidance: 'Review missing person incident records',
          displayOrder: 6,
        },
        {
          questionNumber: '4.7',
          questionText: 'Are preventative measures in place (activities, engagement, environmental design)?',
          questionType: 'yes_no',
          guidance: 'Review activities programme and environmental adaptations',
          displayOrder: 7,
        },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'General Security and Information Security',
      sectionDescription: 'Assessment of overall security measures and data protection',
      displayOrder: 5,
      questions: [
        {
          questionNumber: '5.1',
          questionText: 'Is there a key management system with inventory of all keys?',
          questionType: 'yes_no',
          guidance: 'Review key register and management procedure',
          displayOrder: 1,
        },
        {
          questionNumber: '5.2',
          questionText: 'Are resident belongings and valuables stored securely?',
          questionType: 'yes_no',
          guidance: 'Check valuables storage and inventory system',
          displayOrder: 2,
        },
        {
          questionNumber: '5.3',
          questionText: 'Are computer systems password-protected with automatic screen locks?',
          questionType: 'yes_no',
          guidance: 'Test computer security measures',
          displayOrder: 3,
        },
        {
          questionNumber: '5.4',
          questionText: 'Are confidential paper records stored securely?',
          questionType: 'yes_no',
          guidance: 'Check filing cabinets and storage areas',
          displayOrder: 4,
        },
        {
          questionNumber: '5.5',
          questionText: 'Is confidential waste disposed of securely (shredding)?',
          questionType: 'yes_no',
          guidance: 'Review confidential waste disposal procedure',
          displayOrder: 5,
        },
        {
          questionNumber: '5.6',
          questionText: 'Is there a data breach procedure in place?',
          questionType: 'yes_no',
          guidance: 'Review data protection and incident response procedures',
          displayOrder: 6,
        },
        {
          questionNumber: '5.7',
          questionText: 'Are security incidents logged and reviewed for learning?',
          questionType: 'yes_no',
          guidance: 'Check incident logs for security-related events',
          displayOrder: 7,
        },
      ],
    },
  ]);
}

console.log('\n✅ Missing audit templates seeded successfully!\n');

await connection.end();
