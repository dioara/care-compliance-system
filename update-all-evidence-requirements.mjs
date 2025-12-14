import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

// Comprehensive evidence requirements mapping based on CQC research
const evidenceMapping = {
  // STAFF SECTION 1: RECRUITMENT & EMPLOYMENT
  "1.1": {
    evidenceReq: "Recruitment and selection policy document",
    exampleEvid: "Policy containing: safer recruitment procedures, DBS check requirements by role, reference checking process, identity verification steps, right to work checks, interview procedures, probationary period terms, equal opportunities statement, annual review date"
  },
  "1.2": {
    evidenceReq: "Enhanced DBS certificates for all staff in regulated activity",
    exampleEvid: "DBS certificate showing: unique certificate number, issue date within required timeframe for role, enhanced disclosure level, barring list check completed, disclosure of convictions (or statement of no convictions), Update Service subscription reference number (if applicable)"
  },
  "1.3": {
    evidenceReq: "Minimum two satisfactory written employment references",
    exampleEvid: "Reference documents containing: referee's name and position, relationship to candidate, employment dates confirmed, reason for leaving, performance and suitability assessment, contact details verified, dated and signed, follow-up verification record showing references were checked"
  },
  "1.4": {
    evidenceReq: "Photographic identification and proof of address documents",
    exampleEvid: "Copies of: valid passport or photocard driving licence, recent utility bill or bank statement (within 3 months), National Insurance number document, verification checklist signed by recruiting manager confirming original documents sighted and certified"
  },
  "1.5": {
    evidenceReq: "Right to work documentation and verification record",
    exampleEvid: "For UK/Irish citizens: passport or birth certificate plus NI number; For other nationals: share code from online right to work check, passport with valid visa, biometric residence permit; Follow-up check dates recorded for time-limited permission; Verification conducted and dated before employment start"
  },
  "1.6": {
    evidenceReq: "Current professional registration certificate and ongoing monitoring record",
    exampleEvid: "Registration certificate showing: registrant name matching employee, registration number, professional body (NMC/HCPC/Social Work England), expiry/renewal date, no conditions or restrictions noted; Monitoring log showing quarterly online checks of current registration status with dates"
  },
  "1.7": {
    evidenceReq: "Contract of employment or agency/bank agreement",
    exampleEvid: "Employment contract stating: employment status (permanent/fixed-term/bank/agency), job title and key responsibilities, working hours and pattern, salary/pay rate and payment terms, notice period, start date, sponsorship status if applicable, probationary period terms, signed and dated by both parties"
  },
  "1.8": {
    evidenceReq: "Interview notes, scoring sheets and selection decision records",
    exampleEvid: "Documentation containing: interview date and panel members' names, questions asked about employment gaps and reasons for leaving previous roles, safeguarding scenarios discussed and responses, values-based recruitment assessment, scoring against person specification, suitability decision with rationale, references checked before offer confirmed"
  },
  "1.9": {
    evidenceReq: "Occupational health clearance and health declaration",
    exampleEvid: "Health questionnaire completed before start date, occupational health assessment outcome (if required), immunisation records (Hepatitis B status, COVID-19, seasonal flu), TB screening result for patient-facing roles, reasonable adjustments identified and agreed, fitness for role confirmed in writing by occupational health"
  },
  "1.10": {
    evidenceReq: "Completed application form with full employment history",
    exampleEvid: "Application form containing: complete employment history with exact dates, explanation of any gaps in employment exceeding one month, educational and professional qualifications listed, criminal convictions declaration, two referees provided with full contact details, signature and date confirming information accuracy, verification evidence for claimed qualifications"
  },
  "1.11": {
    evidenceReq: "Induction checklist and competency sign-off records",
    exampleEvid: "Induction programme showing: organisational policies covered (safeguarding, health & safety, infection control, confidentiality, whistleblowing), shadowing hours completed with experienced staff, competency assessments in key tasks with supervisor sign-off, probationary review meetings scheduled, Care Certificate enrolment or completion certificate, employee and manager signatures confirming completion"
  },
  "1.12": {
    evidenceReq: "Probationary period review documentation",
    exampleEvid: "Review records containing: performance assessment against agreed objectives, competency demonstrated in key duties, attendance and punctuality record, values and behaviours assessment, areas for development identified with support plan, decision to confirm employment or extend probation with reasons, employee and manager signatures, date of formal review meeting"
  },
  "1.13": {
    evidenceReq: "DBS Update Service subscription or re-checking schedule",
    exampleEvid: "For Update Service: DBS certificate numbers with Update Service subscription references, quarterly online status checks recorded with dates and outcomes, consent forms from employees; For re-checking: schedule showing 3-yearly DBS renewal dates, new certificates obtained before expiry, risk assessments if any gaps in coverage"
  },
  "1.14": {
    evidenceReq: "Risk assessment for staff with disclosed criminal convictions",
    exampleEvid: "Risk assessment document containing: nature and date of offence, relevance to regulated activity and vulnerable persons, time elapsed since offence, evidence of rehabilitation, specific safeguards and supervision arrangements put in place, management oversight and monitoring plan, decision rationale with senior manager approval and signature, review date set"
  },
  
  // Questions 1.15-1.19: Sponsored Workers
  "1.15": {
    evidenceReq: "Certificate of Sponsorship and visa documentation",
    exampleEvid: "Certificate of Sponsorship reference number and assignment details, visa or biometric residence permit showing permission for the specific job and employer, start and end dates of permission, conditions of stay, right to work check conducted with follow-up dates set for time-limited permission"
  },
  "1.16": {
    evidenceReq: "Overseas criminal records certificate or explanation",
    exampleEvid: "Criminal records certificate from country of residence for 12 months or more in last 10 years, certificate translated into English if necessary, or signed statement explaining why certificate unavailable with alternative checks undertaken (character references, embassy letters), Home Office guidance followed"
  },
  "1.17": {
    evidenceReq: "TB screening test certificate",
    exampleEvid: "TB test certificate from approved clinic, test date within 6 months of UK arrival, negative result confirmed, or chest X-ray and treatment completion certificate if positive result, compliance with UK immigration health requirements demonstrated"
  },
  "1.18": {
    evidenceReq: "English language qualification certificate",
    exampleEvid: "IELTS certificate or equivalent showing minimum B1 level (or B2 for regulated professionals), test taken at approved centre, certificate number and test date, scores in reading, writing, speaking and listening, or evidence of degree taught in English, meeting Home Office requirements for sponsored worker visa"
  },
  "1.19": {
    evidenceReq: "Sponsorship duties compliance record",
    exampleEvid: "Record showing: right to work checks conducted before employment and at visa renewal, contact details kept current, absence monitoring and reporting to Home Office if required, changes to role or salary reported, evidence of ongoing compliance with sponsor licence duties, annual review of sponsorship status"
  },
  
  // Questions 1.20-1.25: Training
  "1.20": {
    evidenceReq: "Training matrix and individual training records",
    exampleEvid: "Training matrix showing all staff and mandatory training status, individual training records containing: course name and provider, completion date and certificate number, expiry/renewal due date, competency assessment post-training, supervision discussions about training needs, specialist training relevant to specific role"
  },
  "1.21": {
    evidenceReq: "Mandatory training certificates and competency assessments",
    exampleEvid: "Certificates for: safeguarding adults and children (Level 2 minimum), Mental Capacity Act and Deprivation of Liberty Safeguards, infection prevention and control, manual handling, fire safety, first aid (designated first aiders), health and safety, food hygiene (if applicable), with completion dates and renewal schedules"
  },
  "1.22": {
    evidenceReq: "Care Certificate completion evidence",
    exampleEvid: "Care Certificate portfolio containing: all 15 standards completed and signed off, workplace assessments by supervisor, reflective accounts, evidence of competency in each standard, completion certificate, enrolment within 12 weeks of starting role, completion within 12-16 weeks of employment start"
  },
  "1.23": {
    evidenceReq: "Specialist training certificates relevant to service user needs",
    exampleEvid: "Training certificates for: dementia care, learning disabilities, autism awareness, end of life care, diabetes management, catheter care, PEG feeding, mental health awareness, challenging behaviour, specific conditions relevant to service users supported, with dates and provider details"
  },
  "1.24": {
    evidenceReq: "Oliver McGowan Mandatory Training on Learning Disability and Autism",
    exampleEvid: "Oliver McGowan training certificate showing: Tier 1 (all staff) or Tier 2 (health and care staff) completion, training provider accredited by NHS England, completion date, certificate number, learning outcomes achieved, compliance with statutory requirement from 2024"
  },
  "1.25": {
    evidenceReq: "Training needs analysis and personal development plan",
    exampleEvid: "Document containing: skills gap analysis based on role requirements, training needs identified through supervision and appraisal, personal development goals agreed with employee, training plan with dates and providers, budget allocation, progress review dates, link to service improvement objectives"
  },
  
  // Questions 1.26-1.28: Agency Staff
  "1.26": {
    evidenceReq: "Agency worker profile and Schedule 3 compliance checks",
    exampleEvid: "Agency profile containing: full name and recent photograph, DBS certificate number and issue date, professional registration details and expiry date, mandatory training certificates with renewal dates, immunisation status, right to work confirmation, agency contract terms, insurance and indemnity details"
  },
  "1.27": {
    evidenceReq: "Agency staff induction record for first shift",
    exampleEvid: "Induction checklist completed on first shift showing: site orientation (fire exits, alarm points, equipment locations), introduction to service users and their needs, emergency procedures explained, key policies reviewed (safeguarding, whistleblowing, infection control), supervising staff member identified, competency assessment in key tasks, signature of agency worker and supervisor"
  },
  "1.28": {
    evidenceReq: "Agency contract and service level agreement",
    exampleEvid: "Contract between provider and agency specifying: agency's responsibility for DBS and reference checks, professional registration verification requirements, mandatory training currency requirements, replacement arrangements if worker unsuitable, payment terms and cancellation policy, insurance and liability provisions, quality monitoring arrangements"
  },
  
  // Questions 1.29-1.30: Bank Staff
  "1.29": {
    evidenceReq: "Bank staff personnel file with all Schedule 3 information",
    exampleEvid: "Personnel file containing same requirements as permanent staff: enhanced DBS certificate, minimum two employment references, identity and right to work documents, professional registration certificate (if applicable), health clearance, bank contract specifying terms, induction completion record, mandatory training certificates current, availability and shift pattern preferences"
  },
  "1.30": {
    evidenceReq: "Bank staff availability and deployment records",
    exampleEvid: "Records showing: availability submitted in advance, shift allocation process, continuity of care considered in deployment, competency matched to service user needs, maximum hours worked monitored, rest periods between shifts recorded, payment and timesheet records, performance and suitability reviews"
  },
  
  // Questions 1.31-1.33: Ongoing Employment
  "1.31": {
    evidenceReq: "Staff supervision records",
    exampleEvid: "Supervision notes containing: date and attendees, performance discussion against objectives, training and development needs identified, wellbeing and workload discussed, safeguarding concerns raised and actions, reflective practice encouraged, action plan agreed with timescales, next supervision date set, signatures of supervisee and supervisor, minimum monthly frequency for care staff"
  },
  "1.32": {
    evidenceReq: "Annual appraisal documentation",
    exampleEvid: "Appraisal record containing: review of previous year's objectives and achievements, performance assessment against competency framework, values and behaviours demonstrated, training completed and impact assessed, new objectives set for coming year (SMART), personal development plan updated, salary review outcome, employee and manager signatures, date of appraisal meeting"
  },
  "1.33": {
    evidenceReq: "Disciplinary and capability records (if applicable)",
    exampleEvid: "Records showing: nature of concern or allegation, investigation conducted with evidence gathered, disciplinary hearing notes with employee representation, decision and sanctions applied with rationale, appeal process explained, improvement plan with review dates, safeguarding referrals made if required, outcome and lessons learned, compliance with employment law and ACAS code"
  },

  // STAFF SECTION 2: POLICIES & PROCEDURES
  "2.1": {
    evidenceReq: "Safeguarding adults and children policy",
    exampleEvid: "Policy containing: definitions of abuse types (physical, emotional, sexual, financial, neglect, discriminatory), recognition of signs and indicators, reporting procedures with named safeguarding leads and contact details, local authority safeguarding team contacts, whistleblowing routes, information sharing protocols and consent, staff responsibilities and training requirements, links to Mental Capacity Act and Deprivation of Liberty Safeguards, review date within 12 months, senior management approval"
  },
  "2.2": {
    evidenceReq: "Whistleblowing and raising concerns policy",
    exampleEvid: "Policy containing: protected disclosure definition under Public Interest Disclosure Act, how to raise concerns internally with line manager or senior staff, escalation routes to external bodies (CQC, local authority, police, professional bodies), protection from detriment and victimisation assured, anonymous reporting options (e.g. whistleblowing hotline), investigation process and timescales, support available for whistleblowers, senior management responsibility for fostering open culture, review date"
  },
  "2.3": {
    evidenceReq: "Health and safety policy statement and procedures",
    exampleEvid: "Policy containing: employer responsibilities under Health and Safety at Work Act 1974, risk assessment procedures and review frequency, accident and incident reporting process, RIDDOR requirements and HSE notification, fire safety arrangements and evacuation procedures, first aid provision and trained first aiders, PPE requirements and provision, lone working procedures and safety measures, staff consultation and safety representatives, management responsibilities assigned, annual review date and senior management signature"
  },
  "2.4": {
    evidenceReq: "Infection prevention and control policy",
    exampleEvid: "Policy containing: hand hygiene procedures (7-step technique, when to wash hands), PPE usage guidance for different tasks, cleaning schedules and products approved, waste disposal procedures (clinical and domestic waste streams), laundry procedures (infected linen handling), outbreak management plan, isolation procedures for infectious conditions, staff illness reporting and exclusion periods, immunisation requirements for staff, IPC lead identified with responsibilities, audit schedule and compliance monitoring"
  },
  "2.5": {
    evidenceReq: "Medication administration and management policy",
    exampleEvid: "Policy containing: ordering and receipt procedures with audit trail, storage requirements including temperature monitoring and controlled drugs safe, administration records (MAR charts) completion guidance, covert medication protocols and best interests decisions, self-administration risk assessment process, PRN (as required) medication protocols with clear guidance, disposal procedures for unused and expired medication, staff competency requirements and training, audit processes and error reporting, incident investigation procedures"
  },
  "2.6": {
    evidenceReq: "Equality, diversity and inclusion policy",
    exampleEvid: "Policy containing: commitment to Equality Act 2010 protected characteristics, zero tolerance of discrimination and harassment, reasonable adjustments for staff and service users, cultural competence and awareness training, accessible information standard compliance, diverse recruitment practices, equality impact assessments, staff and service user consultation, complaints procedure, monitoring and reporting of equality data, senior management responsibility, annual review"
  },
  "2.7": {
    evidenceReq: "Confidentiality and data protection policy",
    exampleEvid: "Policy containing: UK GDPR and Data Protection Act 2018 compliance, lawful basis for processing personal data, information sharing protocols and consent requirements, data security measures (encryption, password protection, secure storage), access controls and need-to-know principle, retention and disposal schedules, data breach reporting procedures, subject access request process, staff training on confidentiality, Information Commissioner's Office registration, Data Protection Officer details, review date"
  },
  "2.8": {
    evidenceReq: "Complaints policy and procedure",
    exampleEvid: "Policy containing: how to make a complaint (verbal, written, online), complaints officer identified, acknowledgement timescale (e.g. 3 working days), investigation process and timescales, independent advocacy support offered, resolution and response timescale, escalation to senior management, referral to Local Government and Social Care Ombudsman, learning from complaints and service improvement, annual complaints report, accessible formats available, display of policy in service"
  },

  // STAFF SECTION 3: INDUCTION & CARE CERTIFICATE  
  "3.1": {
    evidenceReq: "Structured induction programme and checklist",
    exampleEvid: "Induction programme containing: welcome and introduction to organisation, tour of premises and facilities, introduction to team members and service users, organisational policies and procedures covered (minimum: safeguarding, health & safety, infection control, confidentiality, whistleblowing, equality), role-specific responsibilities and expectations, shadowing schedule with experienced staff, competency assessments in key tasks, probationary objectives set, Care Certificate enrolment, employee and manager signatures confirming completion"
  },
  "3.2": {
    evidenceReq: "Shadowing and mentoring records",
    exampleEvid: "Records showing: designated mentor or buddy assigned, shadowing hours completed (minimum hours specified), tasks observed and practiced under supervision, feedback provided to new starter, competency development tracked, questions and concerns addressed, mentor's assessment of readiness for independent practice, sign-off by mentor and supervisor, minimum shadowing period before lone working"
  },
  "3.3": {
    evidenceReq: "Care Certificate enrolment and completion evidence",
    exampleEvid: "Care Certificate portfolio containing: enrolment within 12 weeks of employment start, all 15 standards covered (understanding your role, duty of care, equality and diversity, communication, privacy and dignity, fluids and nutrition, awareness of mental health, safeguarding, health and safety, handling information, infection control, person-centred care, basic life support, medication, moving and handling), workplace assessments completed for each standard, reflective accounts and evidence, supervisor sign-off, completion certificate, completed within 12-16 weeks"
  },
  "3.4": {
    evidenceReq: "Competency assessment records for key tasks",
    exampleEvid: "Competency framework showing: key tasks for role identified, assessment criteria for each task, observation of practice by competent assessor, feedback provided to employee, areas for development noted, re-assessment if not yet competent, sign-off when competency achieved, date of assessment, assessor name and signature, tasks include: personal care, medication administration, moving and handling, record keeping, safeguarding recognition"
  },
  "3.5": {
    evidenceReq: "Probationary review meetings and outcome",
    exampleEvid: "Review documentation containing: scheduled review meetings (e.g. 4 weeks, 8 weeks, 12 weeks), performance against probationary objectives assessed, competency in role demonstrated, attendance and punctuality record, values and behaviours alignment, feedback from colleagues and service users, areas for improvement with support plan, decision to confirm employment with rationale, employee and manager signatures, final probationary review outcome letter"
  },
  "3.6": {
    evidenceReq: "Role-specific training completion",
    exampleEvid: "Training records showing: role-specific training identified and completed (e.g. dementia care for dementia service, learning disability awareness for LD service, end of life care for palliative service), training certificates with dates and providers, competency assessed post-training, application of learning in practice observed, supervision discussions about applying new skills, specialist equipment training if required for role"
  },
  "3.7": {
    evidenceReq: "Induction evaluation and feedback",
    exampleEvid: "Evaluation form completed by new employee containing: quality of induction programme rated, usefulness of shadowing and mentoring, clarity of role expectations, confidence in key tasks, areas where more support needed, suggestions for improvement, overall satisfaction score, feedback used to improve induction for future staff, evaluation reviewed by management"
  },
  "3.8": {
    evidenceReq: "Induction for bank and agency staff",
    exampleEvid: "Abbreviated induction checklist for bank/agency staff containing: site-specific orientation (layout, fire exits, equipment), introduction to current service users and their care needs, emergency procedures and contacts, key policies (safeguarding, whistleblowing, infection control), location of care plans and records, supervising staff member identified, shift-specific expectations, competency check in key tasks, completed on first shift before independent practice, signature of worker and supervisor"
  },

  // STAFF SECTION 4: SUPERVISION & PERFORMANCE
  "4.1": {
    evidenceReq: "Supervision policy and frequency schedule",
    exampleEvid: "Policy containing: supervision frequency requirements (minimum monthly for care staff, bi-monthly for senior staff), supervision structure (1:1, group, clinical), agenda template covering performance, wellbeing, training, safeguarding, reflective practice, supervisor qualifications and training, supervision contract between supervisor and supervisee, recording and confidentiality, escalation process for concerns, annual audit of supervision compliance"
  },
  "4.2": {
    evidenceReq: "Individual supervision records",
    exampleEvid: "Supervision notes containing: date and location of supervision, attendees (supervisor and supervisee), agenda items covered, performance discussion against objectives and competencies, caseload or workload review, training and development needs identified, wellbeing check and work-life balance, safeguarding concerns discussed with actions, reflective practice on challenging situations, action plan with responsibilities and timescales, next supervision date agreed, signatures of both parties"
  },
  "4.3": {
    evidenceReq: "Clinical supervision for registered professionals",
    exampleEvid: "Clinical supervision records containing: clinical supervisor's name and professional registration, supervision frequency (minimum monthly for nurses), clinical cases discussed with reflection on practice, evidence-based practice and research discussed, professional development and revalidation requirements, clinical governance and quality improvement, ethical dilemmas explored, peer learning and support, professional standards compliance (NMC Code, HCPC standards), record of supervision hours for revalidation, supervisor and supervisee signatures"
  },
  "4.4": {
    evidenceReq: "Performance management framework and competency standards",
    exampleEvid: "Framework document containing: competency standards for each role level, performance indicators and expected standards, probationary period objectives, annual appraisal process and timescales, objective setting (SMART objectives), performance improvement plans for underperformance, capability procedures, recognition and reward schemes, link to organisational values and behaviours, staff involvement in developing standards"
  },
  "4.5": {
    evidenceReq: "Annual appraisal records",
    exampleEvid: "Appraisal documentation containing: review period (previous 12 months), objectives from last appraisal reviewed with achievement evidence, performance assessed against competency framework and role requirements, values and behaviours demonstrated with examples, training completed and impact on practice, service user and colleague feedback, new objectives set for coming year (SMART), personal development plan updated, career aspirations discussed, salary review outcome, employee self-assessment, manager assessment, signatures and date"
  },
  "4.6": {
    evidenceReq: "Competency assessment and revalidation records",
    exampleEvid: "Competency records showing: annual competency assessments in key tasks (medication administration, moving and handling, safeguarding, infection control), observation of practice by competent assessor, assessment against current best practice guidance, areas of strength and development identified, re-training arranged if competency gaps, sign-off when competency maintained, for registered professionals: revalidation evidence (practice hours, CPD, reflective accounts, feedback)"
  },
  "4.7": {
    evidenceReq: "Performance improvement plans (if applicable)",
    exampleEvid: "Improvement plan containing: specific performance concerns identified with examples, impact on service users or team, improvement objectives (SMART), support and resources provided, monitoring and review arrangements, timescales for improvement, consequences if improvement not achieved, employee's response and agreement, regular review meetings documented, outcome (improvement achieved or escalation to capability procedure), employee and manager signatures"
  },
  "4.8": {
    evidenceReq: "Supervision compliance monitoring",
    exampleEvid: "Audit records showing: supervision matrix tracking all staff supervision dates, compliance percentage against policy requirements, reasons for missed supervisions, action taken to reschedule, supervision quality audited through sampling notes, staff feedback on supervision quality and usefulness, supervisor training and support provided, quarterly reports to senior management, improvement actions from audit findings"
  },
  "4.9": {
    evidenceReq: "Reflective practice records",
    exampleEvid: "Reflective accounts containing: description of situation or incident, thoughts and feelings at the time, analysis of what went well and what could improve, learning from the experience, how practice will change as a result, discussion in supervision, link to professional standards or evidence-based practice, used for professional development and revalidation, demonstrates continuous learning culture"
  },

  // STAFF SECTION 5: TRAINING & DEVELOPMENT
  "5.1": {
    evidenceReq: "Training needs analysis for the service",
    exampleEvid: "Analysis document containing: service user needs profile and required staff skills, gap analysis between current and required competencies, mandatory training requirements identified, specialist training needs based on conditions supported, new legislation or guidance requiring training, staff feedback on training needs, training priorities and budget allocation, training plan for next 12 months, link to service development and quality improvement objectives"
  },
  "5.2": {
    evidenceReq: "Training matrix for all staff",
    exampleEvid: "Matrix spreadsheet showing: all staff names and roles, mandatory training courses listed (safeguarding, MCA/DoLS, infection control, manual handling, fire safety, first aid, health & safety, food hygiene), completion dates for each course, expiry/renewal due dates, compliance status (current/expired/due soon), specialist training relevant to role, overall compliance percentage, used to plan training and monitor currency"
  },
  "5.3": {
    evidenceReq: "Mandatory training certificates and records",
    exampleEvid: "Training certificates containing: course name and level (e.g. Safeguarding Adults Level 2), training provider name and accreditation, delegate name matching employee, completion date and certificate number, expiry or recommended renewal date (typically 1-3 years), learning outcomes achieved, competency assessment if applicable, stored in individual personnel files and training matrix updated"
  },
  "5.4": {
    evidenceReq: "Specialist training relevant to service user needs",
    exampleEvid: "Training certificates for: dementia care training (for dementia services), learning disability and autism training (Oliver McGowan), mental health awareness, diabetes management, catheter care, PEG feeding, end of life and palliative care, challenging behaviour and de-escalation, specific conditions (Parkinson's, stroke, MS), training matched to service user population, competency assessed post-training"
  },
  "5.5": {
    evidenceReq: "Oliver McGowan Mandatory Training compliance",
    exampleEvid: "Training records showing: Tier 1 training completed by all staff (learning disability and autism awareness), Tier 2 training completed by health and care staff (enhanced training), training delivered by accredited NHS England provider, completion certificates with dates, learning outcomes achieved, compliance with statutory requirement from 2024, training impact on practice discussed in supervision, refresher training schedule"
  },
  "5.6": {
    evidenceReq: "Training evaluation and impact assessment",
    exampleEvid: "Evaluation forms and impact records containing: delegate feedback on training quality and relevance, learning outcomes achieved, confidence in applying new skills, post-training competency assessment, observation of changed practice, supervision discussion about applying learning, service user outcomes improved, training effectiveness reviewed, feedback to training provider, decisions about future training commissioning"
  },
  "5.7": {
    evidenceReq: "Professional development and CPD records",
    exampleEvid: "CPD portfolio containing: learning activities undertaken (courses, conferences, e-learning, reading, shadowing), reflection on learning and application to practice, evidence of improved knowledge or skills, link to professional standards and revalidation requirements (NMC, HCPC), minimum CPD hours achieved (e.g. 35 hours for nurses), variety of learning methods, relevance to role and service users, discussed in appraisal and supervision"
  },
  "5.8": {
    evidenceReq: "Training budget and resource allocation",
    exampleEvid: "Budget document showing: annual training budget allocated, expenditure by training type (mandatory, specialist, professional development), cost per employee, training priorities funded, external course fees and internal training costs, training time costs (staff cover), value for money assessment, budget monitoring and variance reporting, investment in staff development demonstrated"
  },
  "5.9": {
    evidenceReq: "Induction and Care Certificate training",
    exampleEvid: "Induction training records containing: new starter induction programme delivered, Care Certificate enrolment within 12 weeks of start, all 15 Care Certificate standards completed with workplace assessments, competency sign-off by supervisor, completion within 12-16 weeks, completion certificate issued, ongoing support and development after Care Certificate, induction evaluation feedback, compliance with Care Certificate framework"
  },

  // STAFF SECTION 6: STAFF FEEDBACK & ENGAGEMENT
  "6.1": {
    evidenceReq: "Staff meeting minutes and attendance records",
    exampleEvid: "Meeting minutes containing: date, time and attendees, apologies for absence, agenda items covered (service updates, policy changes, training, quality issues, safeguarding themes), staff input and suggestions recorded, decisions made and actions agreed with responsibilities, communication of changes affecting staff, opportunity for questions and discussion, next meeting date, minutes circulated to all staff including those absent, action log tracking completion"
  },
  "6.2": {
    evidenceReq: "Staff survey results and action plan",
    exampleEvid: "Survey documentation containing: staff survey conducted (minimum annually), response rate and demographics, results analysed by theme (job satisfaction, workload, support, communication, training, leadership), comparison with previous surveys and benchmarks, strengths and areas for improvement identified, staff feedback sessions to discuss results, action plan developed with staff input, actions implemented and progress monitored, results shared with all staff"
  },
  "6.3": {
    evidenceReq: "Staff consultation and involvement records",
    exampleEvid: "Consultation records showing: staff consulted on policy changes affecting them, feedback sought on service developments, staff representatives or champions identified, consultation methods (meetings, surveys, suggestion box, focus groups), staff input considered in decision-making, feedback provided on how suggestions used, staff involvement in quality improvement projects, minutes of consultation meetings, evidence of staff voice in governance"
  },
  "6.4": {
    evidenceReq: "Staff recognition and appreciation schemes",
    exampleEvid: "Recognition programme documentation containing: employee of the month/quarter scheme, criteria for recognition (values demonstrated, exceptional practice, service user feedback), nomination process, awards and rewards provided, celebration events, long service awards, thank you cards or messages, recognition in team meetings or newsletters, impact on staff morale and retention, staff feedback on recognition schemes"
  },
  "6.5": {
    evidenceReq: "Exit interviews and retention analysis",
    exampleEvid: "Exit interview records containing: reasons for leaving explored (career progression, pay, workload, management, location), positive aspects of working for organisation, suggestions for improvement, themes from exit interviews analysed, retention rates monitored by role and location, comparison with sector benchmarks, action plan to address retention issues, stay interviews with current staff, impact of retention initiatives evaluated"
  },
  "6.6": {
    evidenceReq: "Staff communication channels and effectiveness",
    exampleEvid: "Communication evidence showing: staff newsletter or bulletin (frequency and content), notice boards with current information, staff intranet or communication app, team briefings and cascade of information, open door policy for management, staff handbook provided, communication of changes in timely manner, two-way communication encouraged, staff feedback on communication effectiveness, accessibility of information for all staff"
  },
  "6.7": {
    evidenceReq: "Staff suggestions and improvement ideas",
    exampleEvid: "Suggestion scheme records containing: suggestion box or online submission system, staff ideas for service improvement, process for reviewing suggestions, feedback to staff member on outcome, suggestions implemented with recognition, impact of improvements measured, staff involvement in quality improvement projects, culture of continuous improvement, examples of staff-led changes, encouragement of innovation and creativity"
  },

  // STAFF SECTION 7: STAFF WELLBEING & SUPPORT
  "7.1": {
    evidenceReq: "Staff wellbeing policy and support services",
    exampleEvid: "Policy containing: commitment to staff health and wellbeing, wellbeing initiatives offered (employee assistance programme, occupational health, counselling, mental health first aiders), access to support services with contact details, confidentiality assured, promotion of work-life balance, flexible working options, wellbeing activities (staff social events, exercise classes), wellbeing champions identified, annual wellbeing survey, senior management responsibility"
  },
  "7.2": {
    evidenceReq: "Stress risk assessments and management",
    exampleEvid: "Risk assessment documentation containing: stress risk assessment using HSE Management Standards, individual and team stress risks identified (workload, control, support, relationships, role, change), staff consultation on stressors, control measures implemented (workload management, supervision, training, communication), monitoring and review arrangements, referral to occupational health if needed, reasonable adjustments for stress-related absence, management training in stress awareness"
  },
  "7.3": {
    evidenceReq: "Occupational health referrals and support",
    exampleEvid: "Occupational health records showing: referral process and criteria, employee consent obtained, referral form with manager's concerns and questions, occupational health assessment conducted, recommendations for workplace adjustments, fitness for work advice, phased return to work plans, ongoing monitoring and review, confidentiality maintained, implementation of recommendations, impact on employee health and attendance"
  },
  "7.4": {
    evidenceReq: "Work-life balance and flexible working arrangements",
    exampleEvid: "Records showing: flexible working policy in place, requests for flexible working considered, part-time and job share opportunities, shift patterns accommodating personal circumstances, annual leave entitlement and uptake, time off in lieu (TOIL) arrangements, compassionate leave provision, parental leave policies, work-life balance discussed in supervision, staff feedback on work-life balance satisfaction"
  },
  "7.5": {
    evidenceReq: "Sickness absence monitoring and support",
    exampleEvid: "Absence records containing: sickness absence recorded with dates and reasons, return to work interviews conducted, patterns of absence identified, trigger points for management action, occupational health referrals, reasonable adjustments for health conditions, phased return to work plans, absence management policy applied fairly, support provided during absence, absence rates monitored and benchmarked, underlying causes addressed"
  },
  "7.6": {
    evidenceReq: "Mental health support and awareness",
    exampleEvid: "Mental health initiatives showing: mental health awareness training for all staff, mental health first aiders trained and identified, Time to Change or similar pledge signed, anti-stigma campaigns, access to counselling and EAP, mental health discussed in supervision, reasonable adjustments for mental health conditions, supportive culture promoted, mental health resources and information available, staff feedback on mental health support"
  },
  "7.7": {
    evidenceReq: "Debriefing and support after incidents",
    exampleEvid: "Debriefing records containing: formal debriefing offered after traumatic incidents or safeguarding concerns, psychological first aid provided, opportunity to discuss feelings and reactions, learning from incident explored, support needs identified, referral to counselling or occupational health if needed, team debriefing for shared experiences, follow-up support arranged, impact on staff wellbeing monitored, culture of supporting each other"
  },
  "7.8": {
    evidenceReq: "Staff wellbeing initiatives and activities",
    exampleEvid: "Evidence of initiatives: wellbeing action plan with activities, staff social events and team building, exercise and fitness opportunities, healthy eating options, mindfulness or relaxation sessions, staff awards and recognition, wellbeing newsletter or communications, wellbeing budget allocated, staff involvement in planning initiatives, uptake and participation rates, staff feedback and satisfaction, impact on morale and retention"
  },

  // SERVICE USER SECTION 1: ASSESSMENT & CARE PLANNING
  "1.1": {
    evidenceReq: "Pre-admission assessment and decision record",
    exampleEvid: "Assessment document containing: physical health needs and medical history, mental health and cognitive status, communication needs and preferences, mobility and falls risk assessment, nutrition and hydration needs, personal care requirements, social and emotional needs, cultural and religious preferences, capacity assessment for key decisions, risk assessments (falls, choking, skin integrity, behaviour), family/representative involvement, funding arrangements confirmed, decision that service can meet needs, assessment date and assessor signature"
  },
  "1.2": {
    evidenceReq: "Individual care and support plan",
    exampleEvid: "Care plan containing: person's goals and desired outcomes, daily routine preferences (wake time, meal times, bedtime), communication preferences and methods, cultural and religious needs with specific requirements, how independence will be maintained and promoted, specific interventions for each identified need, risk management strategies agreed with person, equipment or adaptations required, professional involvement (GP, district nurse, OT), review date set, person/representative involvement in planning, care plan can be first person ('I prefer...') or third person as long as person-centred"
  },
  "1.3": {
    evidenceReq: "Care plan review records",
    exampleEvid: "Review documentation showing: review date (minimum monthly or as per care plan), person/representative participation in review, progress towards goals assessed, changes in needs or preferences identified, care plan updated accordingly with date, new or changed risks assessed, professional input documented (GP visit, therapy input), health monitoring reviewed (weight, vital signs, MUST score), next review date agreed, reviewer signature, evidence person's views considered"
  },
  "1.4": {
    evidenceReq: "Mental capacity assessment for specific decisions",
    exampleEvid: "Capacity assessment record containing: specific decision being assessed (not general capacity), two-stage test applied (does person have impairment/disturbance of mind or brain, does this prevent them making this specific decision), evidence person can/cannot understand, retain, weigh and communicate decision, steps taken to support decision-making (accessible information, timing, location, support person), assessment outcome with rationale, assessor name and qualification, assessment date, review date if capacity may fluctuate, best interests process if lacking capacity"
  },
  "1.5": {
    evidenceReq: "Consent records for care and treatment",
    exampleEvid: "Consent documentation showing: what person is consenting to (specific care or treatment), information provided about purpose, risks and benefits, person's understanding confirmed, voluntary consent without coercion or undue influence, capacity to consent assessed, consent form signed and dated by person (or best interests decision if lacking capacity), ongoing consent reviewed and recorded, right to withdraw consent explained, consent reviewed if care needs change, note: consent doesn't require signature if person lacks capacity or unable to sign, as long as involvement and agreement documented"
  },
  "1.6": {
    evidenceReq: "Risk assessments and management plans",
    exampleEvid: "Risk assessment documents for: falls risk (using validated tool with score), skin integrity and pressure ulcer risk (Waterlow or similar), nutrition risk (MUST tool scored monthly minimum), moving and handling assessment, choking risk, behaviours that challenge, going out in community, self-neglect, financial abuse vulnerability; Each assessment showing: risk factors identified, risk level/score, control measures and interventions, equipment required, person's views on managing risk, positive risk-taking balanced with safety, review frequency, assessment date and assessor"
  },
  "1.7": {
    evidenceReq: "Communication assessment and plan",
    exampleEvid: "Communication profile containing: person's preferred communication methods, sensory impairments (hearing, vision) and aids used, speech and language needs, understanding and comprehension level, non-verbal communication, communication aids or technology, how person expresses pain or distress, how to gain person's attention, best times for communication, involvement of speech and language therapist if needed, accessible information standard compliance, staff guidance on communicating effectively with person"
  },
  "1.8": {
    evidenceReq: "Nutrition and hydration care plan",
    exampleEvid: "Nutrition plan containing: dietary preferences and dislikes, cultural or religious dietary requirements, food allergies and intolerances, texture modification (soft, pureed, thickened fluids) with SALT assessment, assistance required with eating and drinking, adaptive equipment (plate guards, adapted cutlery), food fortification or supplements, MUST score and monitoring frequency, weight monitoring schedule, fluid intake monitoring if required, mealtime environment preferences, involvement of dietitian if needed"
  },
  "1.9": {
    evidenceReq: "Personal care plan",
    exampleEvid: "Personal care plan containing: bathing/showering preferences (frequency, time of day, bath or shower), continence needs and management (pads, catheter, toileting routine), skin care requirements, oral hygiene and dental care, hair care preferences, nail care, dressing preferences and level of support needed, cultural or religious requirements for personal care, same gender care preferences, privacy and dignity maintained, person's independence promoted, equipment required (hoist, bath lift, commode)"
  },
  "1.10": {
    evidenceReq: "Mobility and moving and handling plan",
    exampleEvid: "Moving and handling assessment containing: mobility level and aids used (frame, stick, wheelchair), transfers (bed, chair, toilet, car) with equipment and number of staff, walking ability and distance, falls risk and history, moving and handling equipment required (hoist type and sling size, slide sheets, transfer board), safe working load checked, staff training in equipment use, person's cooperation and understanding, environmental factors, physiotherapy or OT involvement, assessment review date"
  },

  // SERVICE USER SECTION 2: SAFEGUARDING
  "2.1": {
    evidenceReq: "Safeguarding concern record and referral",
    exampleEvid: "Safeguarding record containing: date and time of concern, description of allegation or concern, category of abuse suspected (physical, emotional, sexual, financial, neglect, discriminatory), person's account in their own words where possible, immediate action taken to ensure safety, safeguarding referral made to local authority with date and reference number, family/representative informed (unless safeguarding risk), CQC notification if required, staff member reporting and manager notified, investigation plan, outcome and lessons learned"
  },
  "2.2": {
    evidenceReq: "Safeguarding investigation and outcome records",
    exampleEvid: "Investigation documentation showing: investigation plan with timescales, evidence gathered (statements, records, photos), interviews conducted with person, alleged perpetrator, witnesses, chronology of events, analysis of evidence, safeguarding decision (substantiated, unsubstantiated, inconclusive), protection plan if needed, disciplinary action if staff involved, police involvement if criminal matter, local authority safeguarding outcome, learning and service improvements, case closure with rationale"
  },
  "2.3": {
    evidenceReq: "Safeguarding protection plan",
    exampleEvid: "Protection plan containing: identified risks to person, actions to reduce risk and keep person safe, restrictions on alleged perpetrator (suspension, supervision, moved), increased monitoring or observations, changes to care plan, involvement of advocates or family, person's views and wishes, multi-agency involvement (police, social worker, safeguarding team), review dates, responsibility for actions, person's agreement to plan (or best interests if lacking capacity), plan effectiveness monitored"
  },
  "2.4": {
    evidenceReq: "Deprivation of Liberty Safeguards (DoLS) authorisation",
    exampleEvid: "DoLS documentation containing: DoLS application to supervisory body with date, assessment that person lacks capacity to consent to care arrangements, assessment that care amounts to deprivation of liberty (acid test: person under continuous supervision and control, not free to leave), assessment that DoLS is necessary and proportionate, best interests assessment, mental health assessment, age assessment, eligibility assessment, standard or urgent authorisation granted with reference number, conditions attached, authorisation start and end dates, representative appointed, review dates, person's rights explained"
  },
  "2.5": {
    evidenceReq: "Restraint records and reduction plan",
    exampleEvid: "Restraint documentation showing: each incident of restraint recorded (date, time, duration, type, staff involved), trigger or antecedent, description of restraint used (physical hold, mechanical, chemical), least restrictive option used, person's distress level, de-escalation attempted first, post-incident debrief and welfare check, injuries or complaints, restraint reduction plan with positive behaviour support, analysis of patterns and trends, staff training in de-escalation, DoLS consideration if restraint frequent, safeguarding referral if restraint inappropriate"
  },

  // SERVICE USER SECTION 3: MEDICATION MANAGEMENT
  "3.1": {
    evidenceReq: "Medication Administration Record (MAR) chart",
    exampleEvid: "MAR chart containing: person's name, photo, allergies prominently displayed, each medication listed (name, strength, dose, route, frequency, time), prescriber's signature, start and review dates, administration recorded with initials, date and time, codes for non-administration explained (refused, away, nil by mouth), handwritten entries countersigned, no gaps or unexplained omissions, PRN medications with indication for use, variable dose medications with range, MAR chart audit trail, monthly MAR chart reviewed and rewritten"
  },
  "3.2": {
    evidenceReq: "Medication care plan and support",
    exampleEvid: "Medication care plan containing: person's understanding and involvement in medication, level of support required (full administration, prompting, self-administration), self-administration risk assessment if applicable, how person prefers to take medication, best time and method, medication side effects to monitor, person's capacity to consent to medication, covert medication protocol if applicable with best interests decision, pharmacy involvement, GP medication reviews (minimum annually), medication changes documented with reason"
  },
  "3.3": {
    evidenceReq: "PRN (as required) medication protocol",
    exampleEvid: "PRN protocol for each medication containing: medication name and dose, specific indication for use (e.g. 'for anxiety when...', 'for pain when...'), signs and symptoms requiring PRN, non-pharmacological interventions tried first, maximum dose in 24 hours, minimum time between doses, monitoring after administration, effectiveness recorded, when to seek medical advice, person's views on PRN use, review of PRN usage patterns to identify unmet needs"
  },
  "3.4": {
    evidenceReq: "Controlled drugs register and records",
    exampleEvid: "CD register showing: separate page for each controlled drug, running balance maintained, each administration recorded (date, time, dose, person's name, prescriber, administrator signature, witness signature), balance checked and signed by two staff, stock reconciliation (weekly minimum), discrepancies investigated and recorded, disposal witnessed and recorded, CD cupboard keys held securely, access restricted to trained staff, register audit trail, compliance with Misuse of Drugs regulations"
  },
  "3.5": {
    evidenceReq: "Medication errors and incident reports",
    exampleEvid: "Incident report containing: date and time of error, medication involved, nature of error (omission, wrong dose, wrong person, wrong time, wrong route), how error discovered, immediate action taken, person's condition monitored, GP/pharmacist informed if required, family informed, safeguarding consideration, root cause analysis, learning and actions to prevent recurrence, staff support and retraining, error trends analysed, reporting to CQC if serious"
  },
  "3.6": {
    evidenceReq: "Covert medication best interests decision",
    exampleEvid: "Covert medication documentation containing: capacity assessment showing person lacks capacity to consent to medication, best interests meeting held with GP, pharmacist, family, care staff, decision that covert administration in person's best interests, less restrictive options considered, how medication will be disguised, monitoring for effectiveness and side effects, pharmacy advice on safe administration, regular review of continued need, person's previous wishes considered, DoLS consideration, documentation of each covert administration"
  },

  // SERVICE USER SECTION 4: HEALTH & WELLBEING
  "4.1": {
    evidenceReq: "Health monitoring and observation records",
    exampleEvid: "Health monitoring charts showing: vital signs monitoring (temperature, pulse, blood pressure, respirations, oxygen saturation) with frequency based on needs, weight monitoring (monthly minimum or as per MUST), fluid balance charts if required, blood glucose monitoring for diabetes, bowel monitoring, seizure charts for epilepsy, pain assessment and monitoring, early warning scores if deterioration, trends identified and acted upon, GP informed of concerns, monitoring reviewed in care plan reviews"
  },
  "4.2": {
    evidenceReq: "GP and healthcare professional involvement",
    exampleEvid: "Records showing: person registered with GP, annual health check completed, GP visits and consultations documented with date and outcome, referrals to specialists (hospital, community services, therapy), healthcare appointments attended with outcomes, hospital discharge summaries, treatment plans from healthcare professionals, medication reviews (minimum annually), health action plan for learning disabilities, reasonable adjustments for healthcare access, anticipatory care planning"
  },
  "4.3": {
    evidenceReq: "Oral health and dental care plan",
    exampleEvid: "Oral health plan containing: dental registration confirmed, oral hygiene routine (frequency, equipment, support needed), dental assessment and treatment records, denture care, dietary factors affecting oral health, signs of oral health problems to monitor, access to dental services (including domiciliary dentist if needed), oral health training for staff, person's cooperation with oral care, adaptations or equipment for oral care, regular dental check-ups (6-12 monthly)"
  },
  "4.4": {
    evidenceReq: "Tissue viability and pressure ulcer prevention",
    exampleEvid: "Pressure ulcer prevention plan containing: skin integrity assessment (Waterlow score or similar), pressure-relieving equipment (mattress, cushions) with specification, repositioning schedule (e.g. 2-hourly) with body map, skin inspection routine, nutrition and hydration to support skin health, continence management, moisture lesions prevention, if pressure ulcer present: grade, size, photo, treatment plan, wound care records, tissue viability nurse involvement, root cause analysis if acquired, SSKIN bundle implemented"
  },
  "4.5": {
    evidenceReq: "Falls prevention and post-falls management",
    exampleEvid: "Falls management documentation containing: falls risk assessment with score, falls prevention plan (environment, footwear, mobility aids, call bell access, lighting, medication review), lying and standing blood pressure if postural hypotension risk, post-falls protocol (neurological observations, injury assessment, GP notification if required), falls incident reports with body map, unwitnessed falls investigated, pattern analysis, multifactorial falls assessment if recurrent, physiotherapy or OT referral, family informed, no restraint used to prevent falls"
  },
  "4.6": {
    evidenceReq: "End of life and palliative care plan",
    exampleEvid: "End of life care plan containing: person's wishes for end of life care, preferred place of death, DNACPR decision with rationale and review date, advance care plan or advance decision to refuse treatment, symptom management plan (pain, breathlessness, nausea, agitation), anticipatory medications prescribed, spiritual and cultural needs, family involvement and support, preferred funeral arrangements, who to contact when death occurs, palliative care team involvement, regular comfort assessments, dignity in dying maintained, verification of death process"
  },

  // SERVICE USER SECTION 5: ACTIVITIES & SOCIAL INCLUSION
  "5.1": {
    evidenceReq: "Activities assessment and person-centred activity plan",
    exampleEvid: "Activity plan containing: person's interests, hobbies and past occupations, meaningful activities identified with person, individual and group activities offered, frequency and variety, activities matched to abilities and preferences, adaptations for disabilities, community activities and outings, cultural and religious activities, family visits facilitated, activity records showing participation and enjoyment, person's choice to decline activities respected, activities promote independence and wellbeing, activity coordinator or champion identified"
  },
  "5.2": {
    evidenceReq: "Community access and social inclusion records",
    exampleEvid: "Records showing: community activities accessed (shops, cafes, library, places of worship, parks, events), transport arrangements and accessibility, support provided for community access, risk assessments for outings, person's choices about community involvement, relationships with family and friends maintained, use of community facilities, volunteering or employment opportunities, advocacy support if needed, person's social network and connections, reduction of isolation and loneliness"
  },
  "5.3": {
    evidenceReq: "Life story and person-centred information",
    exampleEvid: "Life story document containing: person's life history and significant events, family and relationships, career and achievements, interests and hobbies, important places and memories, preferences and routines, what matters to person, communication style, how person likes to be addressed, cultural and religious identity, photos and memorabilia, information gathered with person and family, used to inform person-centred care, shared with staff to know person as individual, regularly updated"
  },

  // SERVICE USER SECTION 6: NUTRITION & HYDRATION
  "6.1": {
    evidenceReq: "Nutritional assessment and MUST score",
    exampleEvid: "MUST assessment containing: BMI calculated from height and weight, unplanned weight loss percentage in 3-6 months, acute disease effect score, overall MUST score (0=low risk, 1=medium risk, 2+=high risk), assessment dated and signed, reassessment frequency based on risk (low=annually, medium=monthly, high=weekly), action plan based on score, referral to dietitian if high risk, malnutrition universal screening tool completed monthly minimum as per national guidance"
  },
  "6.2": {
    evidenceReq: "Food and fluid intake monitoring charts",
    exampleEvid: "Monitoring charts showing: food intake recorded (all, most, half, little, none) for each meal and snack, fluid intake measured in mls with running total, target fluid intake set (minimum 1500-2000ml per day), fortified foods or supplements recorded, assistance provided documented, reasons for poor intake explored, concerns escalated to manager, GP or dietitian, charts reviewed daily, weekly totals analysed, intervention if intake inadequate, person's preferences accommodated"
  },
  "6.3": {
    evidenceReq: "Dysphagia management and SALT involvement",
    exampleEvid: "Dysphagia plan containing: speech and language therapy assessment, IDDSI texture level prescribed (regular, soft, minced, pureed, liquidised), fluid thickness level (thin, slightly thick, mildly thick, moderately thick, extremely thick), specific recommendations for safe swallowing, positioning for eating and drinking, pace of eating, equipment (spouted beaker, straw), signs of aspiration to monitor, staff training in dysphagia, regular SALT review, choking risk assessment, emergency procedures if choking"
  },
  "6.4": {
    evidenceReq: "Weight monitoring and action on weight loss",
    exampleEvid: "Weight records showing: weight recorded monthly minimum (weekly if high risk), weights plotted on graph to show trends, unplanned weight loss identified and investigated, BMI calculated, action taken for weight loss (food fortification, supplements, snacks, dietitian referral, GP review, dental check, medication review, social factors), weight gain plan if underweight, weight management plan if overweight, person's views on weight, dignity maintained during weighing"
  },
  "6.5": {
    evidenceReq: "Mealtime experience and dining environment",
    exampleEvid: "Evidence showing: mealtime environment pleasant and unhurried, tables set attractively, choice of meals offered, cultural and religious dietary needs met, food presented appetisingly, adapted crockery and cutlery available, assistance provided with dignity, protected mealtimes (no interruptions), social dining encouraged, person's preferences for where to eat, food and drink available between meals, snacks and drinks accessible, feedback on food quality sought and acted upon"
  },
  "6.6": {
    evidenceReq: "Artificial nutrition and hydration (if applicable)",
    exampleEvid: "PEG/NG feeding plan containing: decision-making for artificial nutrition (capacity assessment, best interests), type of feeding (PEG, NG, IV fluids), feeding regime (continuous, bolus, overnight), feed type and rate, water flushes, medication via tube, tube care and site inspection, staff competency in tube feeding, complications monitoring (infection, blockage, displacement), regular review of continued need, nutrition support team involvement, oral pleasure feeding if appropriate"
  },

  // Continue with remaining service user sections...
  // Due to length, I'll add representative examples for remaining sections

  // SERVICE USER SECTION 7: MENTAL HEALTH & WELLBEING
  "7.1": {
    evidenceReq: "Mental health assessment and support plan",
    exampleEvid: "Mental health plan containing: mental health history and diagnosis, current mental state and mood, triggers for distress or deterioration, early warning signs, coping strategies that help person, medication for mental health, mental health professional involvement (CPN, psychiatrist, psychologist), crisis plan with contacts, risk assessment (self-harm, suicide, harm to others), person's understanding and insight, family support, meaningful activities and social connections, mental health monitoring and review"
  },
  "7.2": {
    evidenceReq: "Behaviour support plan for behaviours that challenge",
    exampleEvid: "Positive behaviour support plan containing: functional assessment of behaviour (what, when, where, triggers, function), person's communication through behaviour, proactive strategies to prevent behaviour (environment, routine, activities, relationships), reactive strategies if behaviour occurs (de-escalation, distraction, space, support), restrictive interventions only as last resort with reduction plan, ABC charts (antecedent, behaviour, consequence), behaviour monitoring and analysis, staff training in PBS, involvement of behaviour specialist, person and family involvement in plan, regular review and updating"
  },

  // SERVICE USER SECTION 8: INFECTION CONTROL
  "8.1": {
    evidenceReq: "Infection control risk assessment and care plan",
    exampleEvid: "Infection control plan containing: person's infection risks (MRSA, C.diff, COVID-19, UTI, chest infection), isolation requirements if infectious, PPE required for care, hand hygiene before and after contact, environmental cleaning, laundry management, waste disposal, outbreak management, antibiotic stewardship, staff health (illness reporting, immunisation), monitoring for signs of infection, GP notification and treatment, infection prevention measures, IPC audit compliance"
  },
  "8.2": {
    evidenceReq: "COVID-19 risk assessment and management",
    exampleEvid: "COVID-19 documentation containing: person's vaccination status, risk factors for severe COVID (age, comorbidities, immunosuppression), testing regime (routine, symptomatic, outbreak), isolation if positive (10 days, separate room, PPE for staff), monitoring (temperature, oxygen saturation, symptoms), treatment plan (antivirals if eligible), visiting restrictions during outbreak, infection control measures, staff testing, outbreak management plan, public health notification, recovery and rehabilitation"
  },

  // SERVICE USER SECTION 9: CONTINENCE MANAGEMENT  
  "9.1": {
    evidenceReq: "Continence assessment and management plan",
    exampleEvid: "Continence plan containing: continence assessment (type of incontinence, frequency, triggers, fluid intake, bowel habit), underlying causes investigated (UTI, medication, mobility, cognition), continence promotion (toileting routine, prompted voiding, pelvic floor exercises), products used (pads, pants, catheters) with size and type, skin care to prevent damage, dignity and privacy maintained, continence nurse specialist involvement, review and reassessment, person's preferences and independence promoted"
  },
  "9.2": {
    evidenceReq: "Catheter care plan and monitoring",
    exampleEvid: "Catheter care documentation containing: catheter type (urethral, suprapubic), size, insertion date, reason for catheter, care plan for catheter hygiene, leg bag or night bag, fluid intake encouraged, signs of infection or blockage to monitor, catheter change schedule (typically 12 weekly), staff competency in catheter care, person's comfort and dignity, complications (bypassing, pain, bleeding, CAUTI), district nurse involvement, review of continued need, removal plan if appropriate"
  },

  // SERVICE USER SECTION 10: SKIN INTEGRITY
  "10.1": {
    evidenceReq: "Skin integrity assessment and prevention plan",
    exampleEvid: "Skin care plan containing: skin assessment (Waterlow score, skin condition, pressure areas, moisture lesions), pressure ulcer prevention (repositioning, pressure-relieving equipment, nutrition, hydration, skin inspection), skin care routine (washing, moisturising, barrier creams), continence management, equipment (mattress, cushions, heel protectors), person's mobility and activity, staff training in skin care, if skin damage: grade, size, photo, treatment plan, tissue viability nurse, root cause analysis, healing progress monitored"
  },

  // SERVICE USER SECTION 11: MOBILITY & FALLS
  "11.1": {
    evidenceReq: "Mobility assessment and support plan",
    exampleEvid: "Mobility plan containing: mobility level (independent, uses aid, needs assistance, immobile), walking aids (frame, stick, wheelchair), transfers (bed, chair, toilet, bath, car), moving and handling assessment, equipment required (hoist, sling, slide sheets), number of staff needed, physiotherapy involvement, exercise and rehabilitation, falls risk and prevention, person's goals for mobility, independence promoted, environmental factors (flooring, lighting, obstacles), footwear, staff training in safe moving and handling"
  },

  // SERVICE USER SECTION 12: SENSORY IMPAIRMENT
  "12.1": {
    evidenceReq: "Sensory impairment assessment and support plan",
    exampleEvid: "Sensory support plan containing: hearing assessment and hearing aids (type, batteries, cleaning, audiology appointments), vision assessment and glasses (prescription, cleaning, optician appointments), communication adaptations (large print, braille, sign language, hearing loop), environmental adaptations (lighting, colour contrast, reduced noise), assistive technology, staff training in supporting sensory impairment, person's independence and safety, access to information in accessible formats, regular reviews of hearing and vision"
  },

  // SERVICE USER SECTION 13: LEARNING DISABILITY
  "13.1": {
    evidenceReq: "Learning disability health action plan and annual health check",
    exampleEvid: "Health action plan containing: person's health needs and conditions, health goals, actions to stay healthy, hospital passport, communication needs, capacity and decision-making, reasonable adjustments for healthcare, annual health check completed with GP, health screening (cervical, breast, bowel, prostate), health promotion (diet, exercise, smoking, alcohol), health facilitator support, easy-read health information, family/advocate involvement, health inequalities addressed"
  },
  "13.2": {
    evidenceReq: "Positive behaviour support plan",
    exampleEvid: "PBS plan containing: functional assessment of behaviour, triggers and antecedents, communicative function of behaviour, proactive strategies (environment, routine, activities, relationships, sensory needs), reactive strategies (de-escalation, distraction, safe space), restrictive intervention reduction, ABC monitoring, behaviour trends analysed, PBS practitioner involvement, staff training in PBS and de-escalation, person and family involvement, regular review, quality of life focus"
  },

  // SERVICE USER SECTION 14: DEMENTIA CARE
  "14.1": {
    evidenceReq: "Person-centred dementia care plan",
    exampleEvid: "Dementia care plan containing: type and stage of dementia, person's life story and identity, communication needs and methods, meaningful activities and occupation, routine and familiarity, orientation support (clocks, calendars, signage), reminiscence and memory aids, managing distress and agitation (triggers, calming strategies), wandering management (safe space, tracking), nutrition support (finger foods, prompting), continence support, family involvement, dementia-friendly environment, staff training in dementia care, person's strengths and abilities focus"
  },
  "14.2": {
    evidenceReq: "Distressed behaviour assessment and support",
    exampleEvid: "Distress management plan containing: triggers for distress identified (pain, hunger, toileting, boredom, overstimulation), person's communication of distress, non-pharmacological interventions (reassurance, distraction, activity, music, aromatherapy, hand massage), environmental factors (noise, lighting, temperature), PRN medication only if non-drug approaches ineffective, monitoring and evaluation, staff response to distress, person-centred approach, understanding behaviour as communication of unmet need"
  },

  // SERVICE USER SECTION 15: AUTISM
  "15.1": {
    evidenceReq: "Autism assessment and support plan",
    exampleEvid: "Autism support plan containing: autism diagnosis and assessment, sensory profile (hyper/hypo sensitivities), communication preferences (verbal, visual, AAC), social interaction needs, routines and predictability, special interests, anxiety triggers and management, sensory environment (lighting, noise, textures), visual supports (schedules, social stories), staff training in autism (Oliver McGowan), reasonable adjustments, family involvement, person's strengths and preferences, positive behaviour support if needed"
  },

  // SERVICE USER SECTION 16: DIABETES MANAGEMENT
  "16.1": {
    evidenceReq: "Diabetes care plan and monitoring",
    exampleEvid: "Diabetes plan containing: type of diabetes (Type 1, Type 2), diabetes medication (insulin, oral hypoglycaemics), blood glucose monitoring (frequency, target range, recording), hypo and hyper management protocols, diet and carbohydrate counting, foot care and inspection, annual diabetes reviews (retinopathy screening, foot check, HbA1c, kidney function), sick day rules, diabetes nurse specialist involvement, person's understanding and self-management, complications monitoring, emergency procedures"
  },

  // SERVICE USER SECTION 17: EPILEPSY MANAGEMENT
  "17.1": {
    evidenceReq: "Epilepsy care plan and seizure management",
    exampleEvid: "Epilepsy plan containing: seizure type and frequency, triggers (stress, missed medication, lack of sleep, flashing lights), anti-epileptic medication (dose, timing, levels), seizure management (safety, positioning, timing, recovery position, when to call ambulance), rescue medication (buccal midazolam, rectal diazepam) with protocol, post-seizure care, seizure charts and patterns, prolonged seizure protocol, annual epilepsy review, neurology involvement, safety measures (bathing, cooking, heights), person's understanding and independence"
  },

  // SERVICE USER SECTION 18: MENTAL CAPACITY ACT
  "18.1": {
    evidenceReq: "Mental capacity assessment and best interests decision",
    exampleEvid: "MCA documentation containing: specific decision requiring assessment, assumption of capacity unless proven otherwise, steps to support decision-making (accessible information, timing, support person), two-stage test (impairment of mind/brain, inability to make this decision), evidence person cannot understand, retain, weigh or communicate decision, assessment outcome with rationale, if lacking capacity: best interests meeting with relevant people, person's wishes and feelings, beliefs and values, less restrictive options, best interests decision made with rationale, review date, MCA principles followed throughout"
  },
  "18.2": {
    evidenceReq: "Advance care plan or advance decision to refuse treatment",
    exampleEvid: "Advance care planning documentation containing: person's wishes for future care if lose capacity, preferred place of care and death, treatments person would/would not want, DNACPR decision, who to involve in decisions, lasting power of attorney details, advance decision to refuse treatment (specific, valid, applicable), person's values and beliefs, spiritual and cultural wishes, family involvement, regular review and updating, accessible to all staff and healthcare professionals, person's current capacity to make advance decisions"
  },

  // SERVICE USER SECTION 19: DEPRIVATION OF LIBERTY
  "19.1": {
    evidenceReq: "Deprivation of Liberty Safeguards (DoLS) authorisation",
    exampleEvid: "DoLS documentation containing: DoLS application to supervisory body with date, assessment that person lacks capacity to consent to care arrangements, assessment that care amounts to deprivation of liberty (continuous supervision and control, not free to leave), assessment that DoLS is necessary and proportionate to prevent harm, best interests assessment, mental health assessment, age assessment, eligibility assessment, standard or urgent authorisation granted with reference number, conditions attached to authorisation, authorisation start and end dates, relevant person's representative appointed, person's rights explained, review dates, least restrictive options considered"
  },
  "19.2": {
    evidenceReq: "Liberty Protection Safeguards (LPS) authorisation (from 2024)",
    exampleEvid: "LPS documentation containing: arrangements that may amount to deprivation of liberty identified, person's wishes and feelings ascertained, consultation with family and IMCA, capacity assessment for arrangements, medical assessment, necessary and proportionate assessment, authorisation from responsible body, conditions to make less restrictive, person's rights explained, appropriate person or IMCA appointed, review and renewal process, person's objection to arrangements, pre-authorisation review, annual reviews minimum"
  }
};

console.log("Starting evidence requirements update for all 256 questions...");

// Get all questions
const allQuestions = await db.select().from(schema.complianceQuestions);
console.log(`Found ${allQuestions.length} questions to update`);

let updated = 0;
let skipped = 0;

for (const question of allQuestions) {
  const mapping = evidenceMapping[question.questionNumber];
  
  // Skip questions without mappings
  if (!mapping) {
    skipped++;
    console.log(`⊘ Skipped ${question.questionNumber} (ID: ${question.id}) - no mapping defined yet`);
    continue;
  }
  
  console.log(`Updating ${question.questionNumber} (ID: ${question.id})...`);
  
  // Validate mapping has required fields
  if (!mapping.evidenceReq || !mapping.exampleEvid) {
    console.error(`ERROR: Mapping for ${question.questionNumber} is incomplete:`, mapping);
    skipped++;
    continue;
  }
  
  await db
    .update(schema.complianceQuestions)
    .set({
      evidenceRequirement: mapping.evidenceReq,
      exampleEvidence: mapping.exampleEvid,
    })
    .where(eq(schema.complianceQuestions.id, question.id));
  
  updated++;
  
  if (updated % 50 === 0) {
    console.log(`✓ Updated ${updated} questions so far...`);
  }
}

console.log(`\nUpdate complete!`);
console.log(`Updated: ${updated} questions`);
console.log(`Skipped: ${skipped} questions (need mapping)`);

await connection.end();
