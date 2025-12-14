import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates, auditTemplateSections, auditTemplateQuestions } from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

console.log('🌱 Starting audit templates Part 2 (Monthly Audits)...\n');

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

// 3. INFECTION PREVENTION AND CONTROL (IPC) AUDIT
const ipcAudit = allAuditTypes.find(a => a.templateReference === 'IPC-001');
if (ipcAudit) {
  await createAuditTemplate(ipcAudit.id, 'Infection Prevention and Control Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Hand Hygiene',
      sectionDescription: 'Hand hygiene compliance and facilities',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Hand hygiene facilities (sinks, soap, paper towels) are available and accessible in all required areas', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Alcohol-based hand rub is available at point of care', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Hand hygiene posters/guidance are displayed appropriately', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Staff demonstrate correct hand hygiene technique (5 moments)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Staff are bare below the elbows when providing care', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Personal Protective Equipment (PPE)',
      sectionDescription: 'PPE availability and correct usage',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Adequate stocks of PPE (gloves, aprons, masks, eye protection) are available', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'PPE is stored appropriately and is easily accessible', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Staff use PPE correctly for the task being undertaken', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'PPE is changed between residents and tasks', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Staff demonstrate correct donning and doffing procedures', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Environmental Cleanliness',
      sectionDescription: 'Cleaning standards and protocols',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Cleaning schedules are in place and up to date', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Cleaning schedules are being followed and signed off', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Resident rooms are visibly clean and free from dust', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Communal areas are visibly clean and well-maintained', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Bathrooms and toilets are clean and odour-free', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'High-touch surfaces (door handles, light switches, handrails) are clean', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '3.7', questionText: 'Cleaning equipment and materials are stored correctly', questionType: 'yes_no', displayOrder: 7 },
        { questionNumber: '3.8', questionText: 'Colour-coded cleaning system is in use and understood by staff', questionType: 'yes_no', displayOrder: 8 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Waste Management',
      sectionDescription: 'Clinical and domestic waste disposal',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Clinical waste bins are available and correctly labelled', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Clinical waste is segregated correctly (offensive, infectious, sharps)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Waste bins are not overfilled and are emptied regularly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Sharps bins are available, dated, and not filled beyond the fill line', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Waste storage area is secure and maintained appropriately', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '4.6', questionText: 'Waste collection records are up to date', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Laundry and Linen',
      sectionDescription: 'Laundry handling and infection control',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'Clean and dirty linen are segregated and stored separately', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Soiled linen is handled in accordance with infection control procedures', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Laundry is washed at appropriate temperatures', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'Laundry equipment is clean and well-maintained', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '5.5', questionText: 'Staff use PPE when handling soiled linen', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 6,
      sectionTitle: 'Isolation and Outbreak Management',
      sectionDescription: 'Procedures for managing infections',
      displayOrder: 6,
      questions: [
        { questionNumber: '6.1', questionText: 'Isolation facilities/procedures are available when needed', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '6.2', questionText: 'Outbreak management plan is in place and accessible', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '6.3', questionText: 'Staff understand when to isolate residents', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '6.4', questionText: 'Infection incidents are reported appropriately (PHE, CQC)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '6.5', questionText: 'Records of infections and outbreaks are maintained', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 4. FIRE SAFETY AUDIT
const fireAudit = allAuditTypes.find(a => a.templateReference === 'FIRE-001');
if (fireAudit) {
  await createAuditTemplate(fireAudit.id, 'Fire Safety Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Fire Detection and Alarm Systems',
      sectionDescription: 'Fire alarm testing and maintenance',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Fire alarm system is tested weekly and records maintained', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Fire alarm is audible throughout the building', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Fire alarm system has been serviced annually by competent person', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Smoke detectors are present in all required areas', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Call points are unobstructed and clearly visible', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Fire Fighting Equipment',
      sectionDescription: 'Fire extinguishers and equipment checks',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Fire extinguishers are present in appropriate locations', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Fire extinguishers have been serviced annually', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Fire extinguishers are unobstructed and accessible', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Fire blanket is available in kitchen area', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Staff know how to use fire extinguishers', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Escape Routes and Emergency Exits',
      sectionDescription: 'Fire exits and escape route checks',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'All fire exits are clearly marked and illuminated', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Fire exits and escape routes are clear and unobstructed', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Fire doors are in good condition and close properly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Fire doors are not wedged open (unless on automatic release)', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Emergency lighting is tested monthly and serviced annually', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '3.6', questionText: 'Assembly point is clearly identified and known to all staff', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Fire Drills and Training',
      sectionDescription: 'Fire drill records and staff training',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Fire drills are conducted at least every 6 months', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Fire drill records are maintained and include lessons learned', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'All staff have received fire safety training', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'New staff receive fire safety training during induction', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Staff know the fire evacuation procedure', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '4.6', questionText: 'Staff know their roles and responsibilities in the event of fire', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Personal Emergency Evacuation Plans (PEEPs)',
      sectionDescription: 'Individual evacuation plans for residents',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'PEEPs are in place for all residents who require them', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'PEEPs are reviewed regularly and after any change in resident needs', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'PEEPs are accessible to staff in an emergency', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'Staff are familiar with individual resident PEEPs', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 6,
      sectionTitle: 'Fire Risk Assessment',
      sectionDescription: 'Fire risk assessment and actions',
      displayOrder: 6,
      questions: [
        { questionNumber: '6.1', questionText: 'Fire risk assessment is in place and up to date', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '6.2', questionText: 'Fire risk assessment has been reviewed in last 12 months', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '6.3', questionText: 'Actions from fire risk assessment have been completed', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '6.4', questionText: 'Fire safety policy is in place and accessible to staff', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '6.5', questionText: 'Electrical equipment is tested (PAT testing) and records maintained', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
  ]);
}

// 5. FALLS PREVENTION AUDIT
const fallsAudit = allAuditTypes.find(a => a.templateReference === 'FALLS-001');
if (fallsAudit) {
  await createAuditTemplate(fallsAudit.id, 'Falls Prevention Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Falls Risk Assessment',
      sectionDescription: 'Individual falls risk assessments',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Falls risk assessment completed on admission for all residents', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Falls risk assessments are reviewed regularly (at least monthly)', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Falls risk assessments are updated after any fall or change in condition', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Risk factors are clearly identified and documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Falls prevention strategies are documented in care plans', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Environmental Safety',
      sectionDescription: 'Physical environment and hazard management',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Floors are clean, dry, and free from trip hazards', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Lighting is adequate throughout the building', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Handrails are present and secure in corridors and stairs', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Carpets and floor coverings are in good repair', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Furniture is stable and appropriately positioned', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '2.6', questionText: 'Call bells are accessible to residents', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Mobility Aids and Equipment',
      sectionDescription: 'Walking aids and assistive equipment',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Residents have access to appropriate mobility aids', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Mobility aids are in good working condition', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Residents use mobility aids correctly', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Footwear is appropriate and well-fitting', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Bed rails (if used) have been risk assessed', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Falls Monitoring and Sensors',
      sectionDescription: 'Technology and monitoring systems',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Falls sensors/alarms are used where appropriate', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Sensor equipment is working correctly', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Staff respond promptly to sensor alarms', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'Sensor use is reviewed regularly for effectiveness', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Post-Fall Management',
      sectionDescription: 'Response to falls and post-fall reviews',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'All falls are recorded in incident log', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Post-fall assessment is completed for every fall', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Medical review is arranged following falls where appropriate', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'Families are informed of falls in accordance with policy', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '5.5', questionText: 'Falls are analysed for trends and patterns', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '5.6', questionText: 'Actions are taken to prevent recurrence', questionType: 'yes_no', displayOrder: 6 },
      ],
    },
    {
      sectionNumber: 6,
      sectionTitle: 'Staff Training and Awareness',
      sectionDescription: 'Falls prevention training',
      displayOrder: 6,
      questions: [
        { questionNumber: '6.1', questionText: 'Staff have received falls prevention training', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '6.2', questionText: 'Staff understand individual resident falls risks', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '6.3', questionText: 'Staff know how to respond to a fall', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '6.4', questionText: 'Staff encourage resident mobility and independence safely', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

// 6. CARE PLAN AUDIT
const carePlanAudit = allAuditTypes.find(a => a.templateReference === 'CARE-001');
if (carePlanAudit) {
  await createAuditTemplate(carePlanAudit.id, 'Care Plan Audit', [
    {
      sectionNumber: 1,
      sectionTitle: 'Person-Centred Approach',
      sectionDescription: 'Individualised and person-centred care planning',
      displayOrder: 1,
      questions: [
        { questionNumber: '1.1', questionText: 'Care plan is person-centred and reflects individual preferences', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '1.2', questionText: 'Resident has been involved in care plan development', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '1.3', questionText: 'Family/representatives have been involved where appropriate', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '1.4', questionText: 'Life history and personal preferences are documented', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '1.5', questionText: 'Cultural, religious, and spiritual needs are identified', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 2,
      sectionTitle: 'Care Plan Content and Quality',
      sectionDescription: 'Completeness and quality of care plans',
      displayOrder: 2,
      questions: [
        { questionNumber: '2.1', questionText: 'Care plan covers all identified needs (physical, mental, social)', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '2.2', questionText: 'Care plan includes clear, measurable goals', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '2.3', questionText: 'Care plan specifies how care should be delivered', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '2.4', questionText: 'Care plan is written in clear, understandable language', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '2.5', questionText: 'Risk assessments are completed and linked to care plan', questionType: 'yes_no', displayOrder: 5 },
        { questionNumber: '2.6', questionText: 'Care plan addresses nutrition and hydration needs', questionType: 'yes_no', displayOrder: 6 },
        { questionNumber: '2.7', questionText: 'Care plan addresses mobility and moving/handling needs', questionType: 'yes_no', displayOrder: 7 },
        { questionNumber: '2.8', questionText: 'Care plan addresses personal care and hygiene needs', questionType: 'yes_no', displayOrder: 8 },
      ],
    },
    {
      sectionNumber: 3,
      sectionTitle: 'Reviews and Updates',
      sectionDescription: 'Regular review and updating of care plans',
      displayOrder: 3,
      questions: [
        { questionNumber: '3.1', questionText: 'Care plan has been reviewed in last month', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '3.2', questionText: 'Review dates are clearly documented', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '3.3', questionText: 'Changes in condition are reflected in care plan updates', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '3.4', questionText: 'Resident/family are involved in reviews', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '3.5', questionText: 'Progress towards goals is documented', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 4,
      sectionTitle: 'Consent and Mental Capacity',
      sectionDescription: 'Consent documentation and capacity assessments',
      displayOrder: 4,
      questions: [
        { questionNumber: '4.1', questionText: 'Consent to care is documented', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '4.2', questionText: 'Mental capacity assessment completed where required', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '4.3', questionText: 'Best interest decisions are documented where resident lacks capacity', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '4.4', questionText: 'DoLS authorisation is in place if required', questionType: 'yes_no', displayOrder: 4 },
        { questionNumber: '4.5', questionText: 'Advance care planning/DNACPR decisions are documented', questionType: 'yes_no', displayOrder: 5 },
      ],
    },
    {
      sectionNumber: 5,
      sectionTitle: 'Implementation and Staff Knowledge',
      sectionDescription: 'Staff understanding and implementation of care plans',
      displayOrder: 5,
      questions: [
        { questionNumber: '5.1', questionText: 'Care plan is accessible to all staff providing care', questionType: 'yes_no', displayOrder: 1 },
        { questionNumber: '5.2', questionText: 'Staff demonstrate knowledge of resident care needs', questionType: 'yes_no', displayOrder: 2 },
        { questionNumber: '5.3', questionText: 'Care delivered matches care plan instructions', questionType: 'yes_no', displayOrder: 3 },
        { questionNumber: '5.4', questionText: 'Daily records reflect care plan implementation', questionType: 'yes_no', displayOrder: 4 },
      ],
    },
  ]);
}

console.log('\n✅ Part 2 complete: IPC, Fire, Falls, and Care Plan audits seeded\n');

await connection.end();
