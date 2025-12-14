import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting audit templates Part 3 (Remaining Monthly + Weekly Audits)...\n');

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

// 7. ACCIDENTS AND INCIDENTS AUDIT
const incidentsAudit = allAuditTypes.find(a => a.templateReference === 'INC-001');
if (incidentsAudit) {
  await createAuditTemplate(incidentsAudit.id, 'Accidents and Incidents Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Incident Recording',
      sectionDescription: 'Completeness and accuracy of incident records',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'All incidents are recorded in the incident log', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Incident forms are completed fully and accurately', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Incidents are recorded in a timely manner', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Witness statements are obtained where appropriate', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Body maps/photographs are completed for injuries', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Immediate Response and Actions',
      sectionDescription: 'Initial response to incidents',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Immediate first aid/medical attention was provided', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Emergency services were called when appropriate', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Scene was made safe to prevent further incidents', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Families were notified appropriately and in timely manner', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Investigation and Analysis',
      sectionDescription: 'Incident investigation process',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Incidents are investigated appropriately', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Root cause analysis is completed for serious incidents', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Contributing factors are identified', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Lessons learned are documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Trends and patterns are analysed', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Action Plans and Follow-up',
      sectionDescription: 'Preventive actions and monitoring',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Action plans are developed to prevent recurrence', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Actions have clear responsibilities and timescales', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Actions are monitored and completed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Care plans are updated following incidents', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Risk assessments are reviewed and updated', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Safeguarding and Notifications',
      sectionDescription: 'Statutory notifications and safeguarding',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'Safeguarding referrals made where appropriate', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'CQC notifications submitted when required', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Local authority notified as per contractual requirements', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'RIDDOR reports submitted where applicable', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 8. FIRST AID EQUIPMENT AUDIT
const firstAidAudit = allAuditTypes.find(a => a.templateReference === 'FIRST-001');
if (firstAidAudit) {
  await createAuditTemplate(firstAidAudit.id, 'First Aid Equipment Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'First Aid Box Contents',
      sectionDescription: 'Checking first aid supplies',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'First aid boxes are present in all required locations', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'First aid boxes are clearly marked and accessible', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Sterile dressings (various sizes) are in stock', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Bandages and triangular bandages are available', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Disposable gloves are in stock', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Eye wash and eye pads are available', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '1.7', questionText: 'Safety pins and scissors are present', questionType: 'yes_no', displayOrder: 7 },
        { questionNumber: '1.8', questionText: 'Adhesive plasters (various sizes) are in stock', questionType: 'yes_no', displayOrder: 8 },
        { questionNumber: '1.9', questionText: 'Micropore tape is available', questionType: 'yes_no', displayOrder: 9 },
        { questionNumber: '1.10', questionText: 'Resuscitation face shield/pocket mask is present', questionType: 'yes_no', displayOrder: 10 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Expiry Dates and Stock Rotation',
      sectionDescription: 'Monitoring expiry dates',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'All items are within expiry dates', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Expired items are removed and replaced', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Stock levels are adequate', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Used items are replaced promptly', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Documentation and Training',
      sectionDescription: 'First aid records and staff training',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'First aid box check records are maintained', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Checks are completed monthly', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Qualified first aiders are identified and known to staff', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'First aid certificates are current and displayed', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 9. WATER SAFETY (LEGIONELLA) AUDIT
const waterAudit = allAuditTypes.find(a => a.templateReference === 'WATER-001');
if (waterAudit) {
  await createAuditTemplate(waterAudit.id, 'Water Safety (Legionella) Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Temperature Monitoring',
      sectionDescription: 'Hot and cold water temperature checks',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Hot water temperatures are checked monthly at sentinel outlets', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Hot water temperature at calorifier is 60°C or above', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Hot water at outlets reaches 50°C within 1 minute', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Cold water temperatures are checked monthly', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Cold water temperature is below 20°C', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Temperature readings are recorded accurately', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Flushing Regimes',
      sectionDescription: 'Little-used outlets flushing',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Little-used outlets are identified', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Weekly flushing is carried out on little-used outlets', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Flushing records are maintained', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Showerheads are descaled and disinfected quarterly', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Risk Assessment and Maintenance',
      sectionDescription: 'Legionella risk management',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Legionella risk assessment is in place and up to date', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Risk assessment has been reviewed in last 2 years', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Water system schematic is available', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'TMVs (thermostatic mixing valves) are serviced annually', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Water tanks are inspected and cleaned annually', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'Dead legs in pipework have been identified and removed', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
  ]);
}

// 10. CARE RECORDS AUDIT
const recordsAudit = allAuditTypes.find(a => a.templateReference === 'REC-001');
if (recordsAudit) {
  await createAuditTemplate(recordsAudit.id, 'Care Records Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Daily Care Notes Quality',
      sectionDescription: 'Quality and completeness of daily records',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Daily notes are completed for every shift', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Notes are legible and written in black ink', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Notes are factual, objective, and person-centred', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Notes reflect care plan implementation', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Significant events and changes are documented', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Notes are dated, timed, and signed by staff member', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '1.7', questionText: 'Staff name and designation are clearly identifiable', questionType: 'yes_no', displayOrder: 7 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Record Keeping Standards',
      sectionDescription: 'Professional record keeping practices',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'No gaps in recording are evident', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Corrections are made appropriately (single line, initialled)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'No use of correction fluid or erasures', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Abbreviations are avoided or are standard/understood', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Records are free from judgmental or inappropriate language', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Storage and Confidentiality',
      sectionDescription: 'Secure storage and data protection',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Records are stored securely when not in use', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Access to records is restricted to authorised staff', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Electronic records are password protected', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Confidentiality is maintained at all times', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Records are available when needed for care delivery', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Monitoring Charts and Forms',
      sectionDescription: 'Completion of monitoring documentation',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Food and fluid charts are completed accurately', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Repositioning charts are completed as required', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Bowel monitoring charts are maintained', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Vital signs monitoring is documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Topical medication administration records (T-MARs) are complete', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 11. TISSUE VIABILITY (PRESSURE ULCER PREVENTION) AUDIT
const tissueAudit = allAuditTypes.find(a => a.templateReference === 'TISSUE-001');
if (tissueAudit) {
  await createAuditTemplate(tissueAudit.id, 'Tissue Viability Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Skin Assessments',
      sectionDescription: 'Regular skin integrity assessments',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Skin assessment completed on admission', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Pressure ulcer risk assessment (Waterlow/Braden) completed', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Risk assessments are reviewed monthly or when condition changes', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Skin inspections are documented in daily notes', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Any skin damage is graded correctly (Category 1-4)', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Pressure-Relieving Equipment',
      sectionDescription: 'Equipment provision and maintenance',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Pressure-relieving mattresses are provided for at-risk residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Equipment is appropriate for resident weight and risk level', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Equipment is functioning correctly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Cushions are provided for chair-bound residents at risk', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Heel protectors/positioning aids are used where appropriate', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Repositioning and Mobility',
      sectionDescription: 'Repositioning schedules and implementation',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Repositioning schedule is documented in care plan', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Repositioning charts are completed accurately', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Residents are repositioned as per care plan', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Mobility and independence are encouraged', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Positioning aids (pillows, wedges) are used correctly', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Nutrition and Hydration',
      sectionDescription: 'Nutritional support for skin health',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Nutritional assessment completed for at-risk residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Adequate nutrition and hydration are provided', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Food and fluid intake is monitored', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Dietary supplements are provided if required', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Wound Management',
      sectionDescription: 'Treatment of existing pressure damage',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'All pressure ulcers are documented with body map', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Tissue viability nurse/GP referral made for Category 2+', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Treatment plan is in place and followed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'Wound progress is monitored and documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '5.5', questionText: 'Root cause analysis completed for hospital/community-acquired pressure ulcers', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 12. DEPENDENCY TOOL/STAFFING LEVELS AUDIT
const staffingAudit = allAuditTypes.find(a => a.templateReference === 'STAFF-001');
if (staffingAudit) {
  await createAuditTemplate(staffingAudit.id, 'Dependency Tool and Staffing Levels Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Dependency Assessments',
      sectionDescription: 'Resident acuity and dependency scoring',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Dependency assessments completed for all residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Dependency tool is appropriate and validated', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Assessments are reviewed monthly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Changes in dependency are reflected promptly', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Overall dependency score is calculated', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Staffing Levels',
      sectionDescription: 'Adequate staffing based on dependency',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Staffing levels match dependency requirements', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Minimum staffing levels are maintained at all times', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Rotas reflect planned staffing levels', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Actual staffing matches rota (sickness/absence covered)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Night staffing is adequate for resident needs', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Skill Mix',
      sectionDescription: 'Appropriate mix of qualified and care staff',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Registered nurse is on duty at all times (if nursing home)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Skill mix is appropriate for resident needs', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Senior staff member is identified for each shift', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Specialist skills are available (e.g., dementia, end-of-life)', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 13. MAINTENANCE AUDIT
const maintenanceAudit = allAuditTypes.find(a => a.templateReference === 'MAINT-001');
if (maintenanceAudit) {
  await createAuditTemplate(maintenanceAudit.id, 'Maintenance Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Maintenance Logging and Tracking',
      sectionDescription: 'Recording and monitoring maintenance requests',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Maintenance log/system is in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'All maintenance requests are logged', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Requests are prioritised appropriately (urgent/routine)', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Completion dates are recorded', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Outstanding maintenance is monitored', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Response Times',
      sectionDescription: 'Timely completion of maintenance',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Urgent repairs are addressed within 24 hours', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Routine maintenance is completed within reasonable timescales', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Delays are justified and documented', questionType: 'yes_no', displayOrder: 3 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Planned Preventative Maintenance',
      sectionDescription: 'Scheduled servicing and inspections',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Planned maintenance schedule is in place', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Boiler servicing is up to date', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Gas safety certificate is current', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Electrical installation testing (EICR) is current', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'PAT testing is up to date', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'Lift servicing is current (if applicable)', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '3.7', questionText: 'Window restrictors are tested annually', questionType: 'yes_no', displayOrder: 7 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Contractor Management',
      sectionDescription: 'Use of external contractors',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Contractors have appropriate qualifications/certifications', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Contractor insurance certificates are on file', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'DBS checks obtained for contractors with resident contact', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Work completion certificates are retained', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 14. WOUND CARE AUDIT
const woundAudit = allAuditTypes.find(a => a.templateReference === 'WOUND-001');
if (woundAudit) {
  await createAuditTemplate(woundAudit.id, 'Wound Care Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Wound Assessment',
      sectionDescription: 'Initial and ongoing wound assessment',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Wound assessment completed using standardised tool', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Wound type and cause are documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Wound measurements (length, width, depth) recorded', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Wound bed appearance documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Exudate type and amount recorded', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Surrounding skin condition assessed', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '1.7', questionText: 'Photographs taken with consent', questionType: 'yes_no', displayOrder: 7 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Treatment and Dressing Selection',
      sectionDescription: 'Appropriate wound management',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Treatment plan is documented', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Dressing selection is appropriate for wound type', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Dressing change frequency is specified', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Aseptic technique is used for dressing changes', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Tissue viability nurse/GP involved where appropriate', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Monitoring and Review',
      sectionDescription: 'Tracking wound healing progress',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Wound is reassessed at each dressing change', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Healing progress is documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Treatment plan is reviewed if wound not improving', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Signs of infection are monitored', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Wound care records are complete and up to date', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Stock Management',
      sectionDescription: 'Dressing supplies and storage',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Adequate stock of dressings is maintained', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Dressings are stored appropriately', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Expiry dates are checked', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Sterile supplies remain sealed until use', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 15. RESTRAINT AND RESTRICTIVE PRACTICE AUDIT
const restraintAudit = allAuditTypes.find(a => a.templateReference === 'REST-001');
if (restraintAudit) {
  await createAuditTemplate(restraintAudit.id, 'Restraint and Restrictive Practice Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Identification of Restrictive Practices',
      sectionDescription: 'Recognising restraint and restrictions',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'All forms of restraint/restriction are identified', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Physical restraints (bed rails, lap belts) are documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Chemical restraint (PRN sedation) is identified', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Environmental restrictions (locked doors, keypads) are documented', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Least Restrictive Options',
      sectionDescription: 'Exploring alternatives to restraint',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Less restrictive alternatives have been explored', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Reasons for restraint use are clearly documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Restraint is used as last resort only', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Restraint is proportionate to risk', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Consent and Mental Capacity',
      sectionDescription: 'Legal framework for restraint use',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Mental capacity assessment completed', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Consent obtained where resident has capacity', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Best interest decision documented if lacking capacity', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'DoLS authorisation in place if required', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Family/representatives involved in decision-making', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Monitoring and Review',
      sectionDescription: 'Regular review of restraint use',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Restraint use is reviewed regularly', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Ongoing need for restraint is questioned', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Resident wellbeing is monitored', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Reduction/removal plan is in place', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 16. RESIDENT FINANCES AUDIT
const financesAudit = allAuditTypes.find(a => a.templateReference === 'FIN-001');
if (financesAudit) {
  await createAuditTemplate(financesAudit.id, 'Resident Finances Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Financial Agreements',
      sectionDescription: 'Contracts and fee arrangements',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Signed contract is on file for each resident', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Fee structure is clearly documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Additional charges are itemised and agreed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Fee increases are communicated in writing with notice', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Personal Allowance Management',
      sectionDescription: 'Handling resident personal money',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Written agreement in place for managing resident money', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Individual finance records are maintained', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'All transactions are recorded with receipts', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Regular reconciliation is completed', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Resident/family receive financial statements', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '2.6', questionText: 'Cash is stored securely', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Safeguarding Financial Abuse',
      sectionDescription: 'Protecting residents from financial exploitation',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Staff understand financial abuse indicators', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Unusual transactions are questioned', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Residents are supported to manage own finances where possible', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Power of attorney arrangements are verified', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 17. KITCHEN HYGIENE AUDIT (Weekly)
const kitchenAudit = allAuditTypes.find(a => a.templateReference === 'KITCHEN-001');
if (kitchenAudit) {
  await createAuditTemplate(kitchenAudit.id, 'Kitchen Hygiene Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Food Storage',
      sectionDescription: 'Proper food storage practices',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Fridge temperatures are within safe range (0-5°C)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Freezer temperatures are -18°C or below', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Temperature checks are recorded twice daily', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Food is stored at correct levels (cooked above raw)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Food is covered and labelled with dates', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Use-by dates are checked and expired food discarded', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '1.7', questionText: 'Dry goods are stored off the floor', questionType: 'yes_no', displayOrder: 7 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Food Preparation',
      sectionDescription: 'Safe food handling practices',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Separate colour-coded boards used for raw/cooked food', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Food is cooked to safe core temperatures (75°C+)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Probe thermometer is used and records kept', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Hot food is kept above 63°C', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Food is cooled quickly if not served immediately', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Cleanliness and Hygiene',
      sectionDescription: 'Kitchen cleaning standards',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Kitchen surfaces are clean and sanitised', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Equipment is clean and well-maintained', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Floors are clean and free from spillages', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Waste bins are clean, lidded, and emptied regularly', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Cleaning schedules are in place and signed off', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'Deep cleaning is carried out regularly', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Staff Hygiene',
      sectionDescription: 'Personal hygiene of kitchen staff',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Staff wear clean protective clothing', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Hair is tied back and covered', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Jewellery is minimal (wedding band only)', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Hand washing is frequent and thorough', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Staff with illness do not handle food', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Pest Control',
      sectionDescription: 'Prevention and management of pests',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'No evidence of pests (droppings, gnaw marks)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Pest control contract is in place', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Pest control visits are regular and documented', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'External doors and windows are proofed', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 18. CLEANLINESS AND HOUSEKEEPING AUDIT (Weekly)
const cleanAudit = allAuditTypes.find(a => a.templateReference === 'CLEAN-001');
if (cleanAudit) {
  await createAuditTemplate(cleanAudit.id, 'Cleanliness and Housekeeping Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'General Cleanliness',
      sectionDescription: 'Overall cleanliness standards',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Entrance and reception areas are clean and welcoming', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Corridors are clean, dust-free, and uncluttered', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Communal lounges are clean and well-maintained', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Dining areas are clean before and after meals', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Resident bedrooms are clean and tidy', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '1.6', questionText: 'Windows are clean inside and out', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Bathrooms and Toilets',
      sectionDescription: 'Sanitary facilities cleanliness',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Toilets are clean and odour-free', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Bathrooms are clean and free from limescale', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Toilet paper, soap, and paper towels are stocked', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Bins are emptied regularly', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Shower curtains/screens are clean and mould-free', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Cleaning Schedules',
      sectionDescription: 'Systematic cleaning routines',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Cleaning schedules are in place for all areas', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Schedules are being followed and signed off', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Deep cleaning is scheduled and completed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Cleaning standards are monitored', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Odour Control',
      sectionDescription: 'Managing unpleasant odours',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Building is free from unpleasant odours', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Ventilation is adequate throughout', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Soiled linen is removed promptly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Air fresheners are used appropriately (not masking)', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

console.log('\n✅ Part 3 complete: Remaining monthly and weekly audits seeded\n');
console.log('Progress: 18 of 42 audit templates complete\n');

await connection.end();
