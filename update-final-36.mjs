import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Updating final 36 questions with detailed evidence requirements...\n');

// Evidence mappings for the final 36 questions
const evidenceMappings = {
  // SECTION 3: Care Planning & Record Keeping (10 questions: 3.9-3.18)
  '3.9': {
    evidenceReq: 'Care plan review records showing: regular review dates (minimum monthly or as needs change), review meetings held, changes documented, and service user/family involvement in reviews.',
    exampleEvid: 'Care plan review documentation containing: scheduled review dates met (monthly minimum), review meeting notes with attendees listed (service user, family, key worker, manager), changes to care needs identified and care plan updated accordingly, service user/family signatures or recorded verbal agreement, evidence of interim reviews following incidents or health changes, annual comprehensive review.'
  },
  '3.10': {
    evidenceReq: 'Risk assessment review records showing: regular reviews (minimum monthly or following incidents), changes to risk levels documented, control measures updated, and evidence reviews are timely.',
    exampleEvid: 'Risk assessment review documentation showing: review dates recorded on each risk assessment (monthly minimum), risk scores recalculated following changes in condition, control measures updated when risk increases, interim reviews following falls/incidents/hospital admission, evidence of timely reviews (not overdue), staff signatures confirming reviews completed.'
  },
  '3.11': {
    evidenceReq: 'Daily care records showing: entries completed for each shift or visit, consistent recording across all staff, and evidence of daily care delivery.',
    exampleEvid: 'Daily care log containing: entry for each shift (morning, afternoon, night) or each domiciliary visit, dated and timed entries, staff signature/initials on each entry, care tasks documented (personal care, meals, fluids, activities, mood, health observations), evidence all shifts/visits have corresponding records, no unexplained gaps in recording.'
  },
  '3.12': {
    evidenceReq: 'Daily care records demonstrating: factual objective recording, dated and timed entries, legible handwriting or typed entries, and staff signatures present.',
    exampleEvid: 'Daily records showing: factual statements (\"supported with shower\", \"ate full breakfast\") not opinions, date and time on every entry, legible handwriting or electronic records, staff signature/initials identifying who provided care, professional language used, no abbreviations unless defined, corrections made appropriately (single line through error, initialled).'
  },
  '3.13': {
    evidenceReq: 'Daily care records providing: reflective accounts of care delivery, person\'s responses to care, wellbeing observations, and meaningful interactions documented.',
    exampleEvid: 'Daily records containing: reflective narrative (\"appeared comfortable after repositioning\", \"enjoyed reminiscing about family\"), person\'s mood and engagement noted, responses to care interventions recorded, meaningful interactions documented (conversations, activities, preferences expressed), concerns or changes in condition highlighted, person-centred language used throughout.'
  },
  '3.14': {
    evidenceReq: 'Intervention charts showing: comprehensive completion of all required fields, regular monitoring as specified, and evidence charts are kept up-to-date.',
    exampleEvid: 'Intervention charts (repositioning, fluid balance, food intake, bowel monitoring) containing: all fields completed (date, time, action taken, staff signature), monitoring frequency as per care plan (e.g., 2-hourly repositioning), running totals calculated where required (fluid intake), no gaps in recording, charts replaced when full, archived charts retained.'
  },
  '3.15': {
    evidenceReq: 'Activity records showing: activities offered and attended, social interactions documented, and evidence of meaningful engagement.',
    exampleEvid: 'Activity documentation containing: daily activity participation recorded (group activities, one-to-one time, outings), social interactions noted in daily records (conversations with other residents, family visits, staff engagement), meaningful activities documented (enjoyed singing, participated in quiz, spent time in garden), engagement level recorded, reasons for non-participation noted.'
  },
  '3.16': {
    evidenceReq: 'Multi-disciplinary involvement records showing: healthcare professional visits documented, advice received recorded, and implementation in care plans evidenced.',
    exampleEvid: 'Professional involvement log containing: GP visits and advice documented, district nurse wound care visits recorded, physiotherapy input noted, occupational therapy assessments filed, dietician recommendations documented, SALT advice recorded, mental health professional involvement, social worker contact, specialist consultant input, evidence advice implemented in care plans.'
  },
  '3.17': {
    evidenceReq: 'DNACPR (Do Not Attempt Cardiopulmonary Resuscitation) or ReSPECT (Recommended Summary Plan for Emergency Care and Treatment) forms showing: completed by authorised clinician, signed and dated, service user/family involvement documented, and regular reviews.',
    exampleEvid: 'DNACPR/ReSPECT documentation containing: form completed by senior clinician (GP, consultant, paramedic), clinical signature and GMC number, date of decision, mental capacity assessment recorded, discussion with service user/family documented, reasons for decision stated, review date set (usually annual or following significant change), form easily accessible for emergency services, care plan cross-references DNACPR status.'
  },
  '3.18': {
    evidenceReq: 'Service user feedback on care delivery showing: satisfaction with care received, care delivered according to preferences, and dignity and respect maintained.',
    exampleEvid: 'Feedback records showing: service user comments in care reviews (\"staff are kind and helpful\", \"care is provided how I like it\"), satisfaction survey responses, residents\' meeting feedback on care quality, compliments received, care observations noting person appears comfortable and content, family feedback on care delivery, evidence concerns raised are addressed, advocacy involvement if needed.'
  },

  // SECTION 10: Equipment Management (7 questions: 10.2-10.8)
  '10.2': {
    evidenceReq: 'Equipment testing certificates and records showing: PAT (Portable Appliance Testing) for electrical equipment, LOLER (Lifting Operations and Lifting Equipment Regulations) for hoists, and other statutory equipment testing.',
    exampleEvid: 'Equipment testing documentation containing: PAT testing certificates (annual for care equipment, dated within last 12 months), LOLER inspection certificates for hoists (6-monthly by competent person), bed testing certificates (annual), bath hoist testing, stairlift testing if applicable, testing dates and next due dates recorded, defects identified and rectified, equipment register showing all items and test status.'
  },
  '10.3': {
    evidenceReq: 'Records showing: equipment prescribed by healthcare professionals is provided, equipment matches prescription specifications, and equipment is available for use.',
    exampleEvid: 'Equipment provision records containing: occupational therapy assessment and equipment prescription, physiotherapy recommendations for mobility aids, specialist seating prescription, pressure-relieving equipment prescription, evidence equipment provided matches specification (mattress type, hoist sling size, wheelchair type), equipment delivery and setup records, staff training on prescribed equipment use.'
  },
  '10.4': {
    evidenceReq: 'Equipment calibration records showing: weighing scales calibrated annually, thermometers calibrated, blood pressure monitors calibrated, and other measurement equipment accuracy checked.',
    exampleEvid: 'Calibration certificates and logs containing: weighing scales calibration certificate (annual), thermometer calibration checks (annual or as per manufacturer), blood pressure monitor calibration (annual), blood glucose monitor quality control checks, calibration dates recorded, next due dates tracked, equipment replaced if calibration fails, calibration stickers on equipment.'
  },
  '10.5': {
    evidenceReq: 'Equipment maintenance schedule and records showing: planned preventative maintenance for all equipment, maintenance completed as scheduled, and servicing records retained.',
    exampleEvid: 'Maintenance programme documentation containing: maintenance schedule listing all equipment and service frequencies, hoist servicing records (6-monthly), profiling bed servicing (annual), mattress checks and replacement schedule, wheelchair maintenance, bath servicing, call bell system testing, maintenance contracts with suppliers, service completion certificates, defects identified and rectified, equipment register updated with service dates.'
  },
  '10.6': {
    evidenceReq: 'Equipment storage arrangements showing: equipment stored safely and securely, storage follows manufacturer guidance, and equipment is protected from damage.',
    exampleEvid: 'Equipment storage observations and records showing: hoists stored in designated areas when not in use, walking aids stored safely (not trip hazards), wheelchairs stored securely, slings stored clean and dry, equipment stored away from heat sources, storage follows manufacturer instructions, equipment protected from damage, charging equipment stored safely, no damaged equipment in use, storage areas clean and organised.'
  },
  '10.7': {
    evidenceReq: 'Staff practice observations and records showing: visual safety checks performed before equipment use, defects identified and reported, and unsafe equipment removed from use.',
    exampleEvid: 'Equipment safety check evidence showing: staff observed checking equipment before use (hoist brakes, sling condition, walking aid ferrules), visual check checklists if used, defect reporting system in place, faulty equipment labelled and removed from use, defect log maintained, repairs arranged promptly, staff training on pre-use checks, supervision observations confirming checks completed.'
  },
  '10.8': {
    evidenceReq: 'Staff competency records and observations showing: staff trained in equipment use, competency assessed, and safe equipment use observed in practice.',
    exampleEvid: 'Equipment competency evidence containing: equipment training records (hoist use, bed operation, sling selection), competency assessments with practical observation, manufacturer training certificates, supervision observations of equipment use, safe practice observed (correct sling size, hoist checks, bed rail use), refresher training provided, new equipment training before use, competency reassessment if concerns identified.'
  },

  // SECTION 14: Quality Assurance (9 questions: 14.3-14.11)
  '14.3': {
    evidenceReq: 'Food hygiene rating certificate from local authority environmental health inspection, displayed prominently for service users and visitors to see.',
    exampleEvid: 'Food hygiene rating certificate showing: current rating (0-5 stars), date of inspection within last 2 years, certificate displayed in prominent location (entrance, dining room, notice board), rating also available on Food Standards Agency website, action plan if rating below 5, re-inspection arranged if poor rating, evidence of improvements to achieve higher rating.'
  },
  '14.4': {
    evidenceReq: 'Feedback mechanisms in place showing: methods for gathering feedback from service users, families, staff, and professionals, and evidence feedback is actively sought.',
    exampleEvid: 'Feedback systems including: satisfaction surveys (annual for service users and families), residents\' meetings (monthly minimum), suggestion boxes available, feedback forms accessible, staff meetings and surveys, professional feedback sought (commissioners, healthcare professionals), complaints procedure accessible, compliments recording system, digital feedback options, accessible formats available (easy read, large print).'
  },
  '14.5': {
    evidenceReq: 'Feedback analysis and action records showing: feedback collected is reviewed, themes identified, and actions taken in response to feedback.',
    exampleEvid: 'Feedback analysis documentation containing: survey results analysed (satisfaction scores, themes identified), residents\' meeting minutes showing issues raised and actions agreed, \"you said, we did\" displays showing feedback and responses, complaints analysis (themes, trends, improvements), staff feedback review, professional feedback considered, action plans developed from feedback, evidence of service improvements implemented, governance reporting on feedback.'
  },
  '14.6': {
    evidenceReq: 'Meeting records showing: planned meetings held as scheduled, appropriate attendees present, actions agreed and documented, and follow-up of actions.',
    exampleEvid: 'Meeting documentation containing: residents\' meetings (monthly, minutes recorded, attendance noted), staff meetings (monthly minimum, agenda and minutes), management meetings (weekly/monthly), health and safety meetings, infection control meetings, safeguarding meetings, meeting schedules published, actions recorded with responsible persons and deadlines, action tracking and completion monitoring, previous actions reviewed at next meeting.'
  },
  '14.7': {
    evidenceReq: 'Audit schedule documenting: planned audits for the year, audit frequency defined, responsible persons assigned, and schedule is comprehensive covering all key areas.',
    exampleEvid: 'Annual audit schedule containing: all audit types listed (care plans, medication, infection control, health and safety, safeguarding, dignity, environment, catering, records), audit frequency specified (monthly, quarterly, annual), responsible persons assigned, audit dates planned, schedule covers all CQC key lines of enquiry, schedule approved by management, schedule displayed/accessible to staff, schedule reviewed and updated annually.'
  },
  '14.8': {
    evidenceReq: 'Audit completion records showing: range of audits conducted covering all aspects of service quality, audit findings documented, and evidence audits contribute to quality improvement.',
    exampleEvid: 'Audit programme evidence showing: variety of audits completed (care plans, medication, IPC, health and safety, dignity, nutrition, activities, environment, records), audit reports with findings and scores, audit schedule compliance monitored, audit findings analysed, trends identified, good practice celebrated, areas for improvement identified, audit results inform quality improvement plans, governance oversight of audit programme.'
  },
  '14.9': {
    evidenceReq: 'Action plans showing: improvements identified from audits/incidents/feedback have action plans, actions are SMART (Specific, Measurable, Achievable, Relevant, Time-bound), and progress is monitored.',
    exampleEvid: 'Action planning documentation containing: action plans for all identified improvements, SMART actions (specific task, measurable outcome, assigned person, realistic timescale, relevant to issue), action tracking system (RAG rated - Red/Amber/Green), progress monitoring (monthly reviews), evidence of actions completed, re-audit showing improvements, governance oversight of action plans, accountability for completion, escalation if actions overdue.'
  },
  '14.10': {
    evidenceReq: 'Accident and incident management showing: all incidents reported and investigated, appropriate escalation (safeguarding, CQC, commissioners), actions taken, and trend analysis conducted.',
    exampleEvid: 'Incident management system containing: incident report forms for all accidents/incidents, investigation completed (root cause analysis), immediate actions documented, escalation to safeguarding if required, serious incidents reported to CQC, commissioner notification, family notification, actions to prevent recurrence, monthly incident analysis (types, trends, themes), learning shared with staff, governance reporting, evidence of reduced incidents following actions.'
  },
  '14.11': {
    evidenceReq: 'Learning and improvement records showing: lessons from incidents/complaints/audits identified, learning shared with relevant people, and evidence practice has improved.',
    exampleEvid: 'Learning dissemination evidence showing: lessons learned log maintained, staff meeting minutes sharing learning from incidents, training provided based on learning needs, policy/procedure updates following incidents, learning bulletins or newsletters, supervision discussions about learning, re-audit showing improvements embedded, reduced repeat incidents, improved audit scores, external learning shared (safeguarding adult reviews, CQC reports, sector guidance).'
  },

  // SECTION 17: Financial Management (4 questions: 17.2-17.5)
  '17.2': {
    evidenceReq: 'Financial safeguarding arrangements showing: service user money kept separate from business funds, secure storage, and clear segregation of finances.',
    exampleEvid: 'Financial management system showing: service user personal allowances kept in separate locked safe/cabinet, individual envelopes or containers for each person\'s money, service user finances completely separate from business accounts, no co-mingling of funds, petty cash system for service user money, secure storage with restricted access, key holder log, financial separation audit trail.'
  },
  '17.3': {
    evidenceReq: 'Financial audit records showing: regular audits of service user finances conducted, audit findings documented, and discrepancies investigated and resolved.',
    exampleEvid: 'Financial audit documentation containing: monthly audits of service user personal allowances, cash counts reconciled with records, transaction records verified, receipts matched to expenditure, audit findings documented, discrepancies investigated, audit sign-off by two staff members, annual independent audit if managing significant funds, audit trail for all transactions, governance oversight of financial audits.'
  },
  '17.4': {
    evidenceReq: 'Staff training records on financial safeguarding showing: training on handling service user money, financial abuse prevention, and competency in financial procedures.',
    exampleEvid: 'Financial safeguarding training evidence showing: staff training on handling service user finances, financial abuse recognition training, safeguarding adults training including financial abuse, training on financial procedures and recording, competency assessment on money handling, supervision discussions about financial safeguarding, understanding of financial policies, whistleblowing awareness for financial concerns.'
  },
  '17.5': {
    evidenceReq: 'Records showing: service users and families involved in financial decisions, consent obtained for expenditure, and financial capacity assessments where needed.',
    exampleEvid: 'Financial decision-making documentation containing: service user consent for expenditure (shopping lists, activity costs), family involvement where appropriate (appointed deputy, lasting power of attorney), mental capacity assessments for financial decisions, best interests decisions for those lacking capacity, financial care plan detailing who manages finances, regular financial reviews with service user/family, transparency in financial management, receipts provided, financial statements if requested.'
  },

  // SECTION 18: Activities (3 questions: 18.3-18.5)
  '18.3': {
    evidenceReq: 'Activity accessibility records showing: activities adapted for different abilities, equipment provided to enable participation, and inclusive activity planning.',
    exampleEvid: 'Accessible activities evidence showing: activities suitable for varying abilities (seated exercise, sensory activities, reminiscence for dementia), adaptations made (large print materials, easy-grip equipment, simplified instructions), accessible venues (wheelchair accessible, appropriate seating), communication support (visual aids, hearing loop, signing), one-to-one support for those needing assistance, activities for bed-bound individuals, sensory activities for advanced dementia.'
  },
  '18.4': {
    evidenceReq: 'Community engagement records showing: external activities and outings facilitated, community links maintained, and opportunities for community participation.',
    exampleEvid: 'Community activities documentation showing: regular outings (garden centre, café, shops, parks, places of worship), community events attended (fetes, concerts, exhibitions), community links (local schools, faith groups, volunteer groups), transport arranged for outings, risk assessments for external activities, accessible venues chosen, individual preferences for outings, photographic evidence of community engagement, feedback from outings.'
  },
  '18.5': {
    evidenceReq: 'Activity monitoring and review records showing: participation tracked, enjoyment assessed, activity programme reviewed regularly, and changes made based on feedback.',
    exampleEvid: 'Activity review documentation containing: participation records analysed (who attends what activities), engagement levels monitored, enjoyment and satisfaction assessed, activity programme reviewed quarterly, feedback from service users on activities, changes to programme based on preferences, new activities introduced, unsuccessful activities discontinued, seasonal variations, special events planned, care plan activity goals reviewed, governance reporting on activities.'
  },

  // SECTION 19: End of Life Care (3 questions: 19.3-19.5)
  '19.3': {
    evidenceReq: 'End of life care records showing: family and loved ones involved in care planning, visiting arrangements flexible, family support provided, and communication maintained.',
    exampleEvid: 'Family involvement documentation containing: family included in end of life care planning, advance care plan discussions with family, visiting restrictions relaxed (24-hour access), family accommodation offered if possible, family support and information provided, regular communication with family about condition, family preferences for care considered, bereavement support offered, memory box or keepsakes, support with funeral arrangements if requested.'
  },
  '19.4': {
    evidenceReq: 'Staff training records on end of life care showing: training completion, content covering symptom management and emotional support, and staff support mechanisms in place.',
    exampleEvid: 'End of life care training evidence showing: end of life care training completion (all care staff), training content (symptom management, anticipatory medications, communication, emotional support, cultural/spiritual needs), specialist palliative care training for key staff, supervision support for staff caring for dying residents, debriefing after deaths, staff wellbeing support, access to specialist palliative care advice.'
  },
  '19.5': {
    evidenceReq: 'End of life care quality records showing: dignity and respect maintained, person-centred care continued, comfort prioritised, and quality of dying assessed.',
    exampleEvid: 'End of life care quality evidence showing: dignity maintained (privacy, personal care, appearance), person-centred care continued (preferences honoured, familiar staff, meaningful activities if able), comfort prioritised (pain management, symptom control, peaceful environment), spiritual/cultural needs met, family supported to be present, quality of dying reviewed (after death analysis, learning identified), compliments from families, good death achieved, care after death respectful.'
  }
};

// Get all questions that need updating
const [questions] = await connection.execute(
  `SELECT id, questionNumber FROM complianceQuestions 
   WHERE questionNumber IN (
     '3.9', '3.10', '3.11', '3.12', '3.13', '3.14', '3.15', '3.16', '3.17', '3.18',
     '10.2', '10.3', '10.4', '10.5', '10.6', '10.7', '10.8',
     '14.3', '14.4', '14.5', '14.6', '14.7', '14.8', '14.9', '14.10', '14.11',
     '17.2', '17.3', '17.4', '17.5',
     '18.3', '18.4', '18.5',
     '19.3', '19.4', '19.5'
   )
   ORDER BY questionNumber`
);

let updated = 0;

for (const question of questions) {
  const mapping = evidenceMappings[question.questionNumber];
  
  if (mapping && mapping.evidenceReq && mapping.exampleEvid) {
    await connection.execute(
      'UPDATE complianceQuestions SET evidenceRequirement = ?, exampleEvidence = ? WHERE id = ?',
      [mapping.evidenceReq, mapping.exampleEvid, question.id]
    );
    updated++;
    console.log(`✓ Updated ${question.questionNumber}`);
  }
}

console.log(`\n✅ Final 36 questions update complete!`);
console.log(`   Updated: ${updated} questions`);

await connection.end();
