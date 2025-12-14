import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Deleting existing Staff Sections 2-7 questions...');

// Delete existing questions for sections 2-7
for (let sectionNum = 2; sectionNum <= 7; sectionNum++) {
  await connection.execute(
    `DELETE FROM complianceQuestions 
     WHERE sectionId = (SELECT id FROM complianceSections WHERE sectionType = 'staff' AND sectionNumber = ? LIMIT 1)`,
    [sectionNum]
  );
}

console.log('Inserting revised Staff Sections 2-7 questions...');

// ==================== STAFF SECTION 2: Policies & Procedures ====================
const section_staff_2 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 2]
))[0][0];

if (section_staff_2) {
  // Question 2.1: Whistleblowing Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.1',
    "There is a whistleblowing policy in place that is up-to-date and includes contact details for raising concerns outside the organisation.",
    "Whistleblowing policy document dated within last 2 years, containing clear procedures for raising concerns and external contact details (CQC, local authority safeguarding team, or whistleblowing helpline).",
    "Whistleblowing policy with review date, external reporting contacts listed (CQC: 03000 616161, NSPCC Whistleblowing Helpline: 0800 028 0285), or policy document showing staff how to escalate concerns beyond management."]
  );

  // Question 2.2: Bullying and Harassment Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.2',
    "There is a bullying and harassment policy in place that references the whistleblowing policy and includes information on escalating concerns outside the organisation.",
    "Bullying and harassment policy dated within last 2 years, cross-referencing whistleblowing procedures and providing external reporting routes.",
    "Bullying and harassment policy with whistleblowing cross-reference, external escalation routes (ACAS, trade union, or safeguarding team), or policy showing staff how to report concerns confidentially."]
  );

  // Question 2.3: Staff Access to Policies
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.3',
    "There is evidence that all staff have access to core policies and procedures and there is confirmation that they have read and understood them.",
    "Policy acknowledgement forms signed by staff, induction records showing policy review, or electronic system logs showing staff have accessed and confirmed understanding of key policies.",
    "Signed policy acknowledgement sheets, induction checklist with policies reviewed section completed, or staff handbook receipt form with confirmation staff have read safeguarding, whistleblowing, health & safety, and equality policies."]
  );

  // Question 2.4: Policy Review Schedule
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.4',
    "There is a policy review schedule in place ensuring all policies are reviewed at appropriate intervals (typically annually or biennially).",
    "Policy register or schedule showing policy names, last review dates, next review dates, and responsible persons for each policy.",
    "Policy review log or register, governance meeting minutes showing policy review discussions, or policy front pages showing version control and review dates."]
  );

  // Question 2.5: Safeguarding Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.5',
    "There is an up-to-date safeguarding policy that reflects current legislation and local safeguarding procedures.",
    "Safeguarding policy dated within last 12 months, referencing Care Act 2014, local safeguarding adult board procedures, and containing local authority safeguarding contact details.",
    "Safeguarding policy with local authority safeguarding team contact details, reference to local multi-agency safeguarding procedures, or policy aligned with local safeguarding adult board guidance."]
  );

  // Question 2.6: Health and Safety Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.6',
    "There is an up-to-date health and safety policy that complies with the Health and Safety at Work Act 1974 and includes risk assessment procedures.",
    "Health and safety policy dated within last 12 months, signed by responsible person, outlining employer and employee responsibilities and risk assessment processes.",
    "Health and safety policy statement signed by manager or director, risk assessment policy and templates, or health and safety responsibilities document showing organisational structure."]
  );

  // Question 2.7: Infection Prevention and Control Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.7',
    "There is an up-to-date infection prevention and control policy that reflects current guidance (including COVID-19 and other infectious diseases).",
    "Infection prevention and control policy dated within last 12 months, reflecting current Public Health England or UK Health Security Agency guidance on infection control practices.",
    "Infection control policy with PPE guidance, hand hygiene protocols, outbreak management procedures, or policy reflecting current national infection control guidance."]
  );

  // Question 2.8: Medication Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '2.8',
    "There is an up-to-date medication policy that covers ordering, storage, administration, recording, and disposal of medicines.",
    "Medication policy dated within last 2 years, covering all aspects of the medication cycle from ordering to disposal, including covert administration and self-administration where applicable.",
    "Medication policy covering MAR charts, controlled drugs procedures, medication errors reporting, covert administration (with mental capacity assessment), or self-administration risk assessment procedures."]
  );

  console.log('  Added 8 questions to STAFF Section 2');
}

// ==================== STAFF SECTION 3: Induction & Care Certificate ====================
const section_staff_3 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 3]
))[0][0];

if (section_staff_3) {
  // Question 3.1: Staff Handbook
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.1',
    "There is evidence that the staff handbook has been issued and/or is available to all staff.",
    "Staff handbook receipt forms signed by staff, or induction records showing staff handbook issued and reviewed.",
    "Signed staff handbook receipt form, induction checklist with 'staff handbook issued' section completed, or staff file containing copy of handbook with acknowledgement signature."]
  );

  // Question 3.2: Comprehensive Induction
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.2',
    "There is evidence of a comprehensive and role-specific service induction that has been signed and dated by both parties.",
    "Induction checklist or programme specific to the staff member's role, completed and signed by both the new staff member and their supervisor/manager, with dates recorded.",
    "Completed induction checklist signed by staff and manager, role-specific induction plan showing topics covered (fire safety, safeguarding, policies, care practices), or induction schedule with sign-off dates."]
  );

  // Question 3.3: Shadowing at Induction
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.3',
    "There is evidence of staff shadowing at induction, with records showing who was shadowed, dates, and areas covered.",
    "Shadowing log or induction record showing dates of shadowing shifts, names of experienced staff shadowed, and areas of practice observed (personal care, medication, mealtimes, activities).",
    "Shadowing record with dates and signatures, induction checklist with shadowing section completed showing shifts worked alongside experienced staff, or supervision notes discussing shadowing experience."]
  );

  // Question 3.4: Care Certificate Completion
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.4',
    "There is evidence that the Care Certificate has been completed within the first 12 weeks for new care and support staff entering care (including evidence of workbook having been signed and agreed by both parties), OR evidence that staff hold equivalent qualifications.",
    "Completed Care Certificate workbook signed by staff and assessor with completion date within 12 weeks of start date, OR evidence of equivalent qualification (NVQ Level 2 in Health & Social Care or higher) accepted in lieu of Care Certificate.",
    "Care Certificate portfolio with all 15 standards completed and signed within 12 weeks, Care Certificate completion certificate, or NVQ Level 2/3 in Health & Social Care certificate accepted as equivalent qualification."]
  );

  // Question 3.5: Induction Period Supervision
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.5',
    "There is evidence of increased supervision and support during the induction period (probationary period), with regular check-ins documented.",
    "Supervision records showing more frequent meetings during probation (e.g., weekly or fortnightly), induction review meetings at 4, 8, and 12 weeks, or probation review documentation.",
    "Probation supervision notes at regular intervals, induction review meetings documented, or probation assessment form completed at end of probationary period with recommendation for confirmation of employment."]
  );

  // Question 3.6: Competency Sign-Off
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.6',
    "There is evidence that new staff have been assessed as competent in key areas before working unsupervised (e.g., moving and handling, medication administration, safeguarding recognition).",
    "Competency assessment records signed by qualified assessor confirming staff member is competent to work unsupervised in specific areas, with dates recorded.",
    "Moving and handling competency sign-off, medication administration competency assessment, or induction competency checklist showing staff assessed as competent in key tasks before working alone."]
  );

  // Question 3.7: Induction Feedback
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.7',
    "There is evidence that new staff are asked for feedback on their induction experience, and this feedback is used to improve the induction process.",
    "Induction feedback forms completed by new staff, or end-of-induction review meetings where staff feedback is recorded and acted upon.",
    "Induction evaluation form completed by new staff, probation review meeting notes including staff feedback on induction, or induction improvement log showing changes made based on staff feedback."]
  );

  // Question 3.8: Induction for Returning Staff
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '3.8',
    "There is a process for re-induction or refresher induction for staff returning after extended absence (e.g., maternity leave, long-term sickness) or moving to a new role.",
    "Re-induction checklist or return-to-work induction plan for staff returning after extended leave, covering policy updates, changes in practice, and refresher training.",
    "Return-to-work induction checklist, re-induction plan for staff returning after 6+ months absence, or role change induction for internal promotions or transfers."]
  );

  console.log('  Added 8 questions to STAFF Section 3');
}

// ==================== STAFF SECTION 4: Supervision, Appraisal & Performance ====================
const section_staff_4 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 4]
))[0][0];

if (section_staff_4) {
  // Question 4.1: Supervision Frequency
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.1',
    "There is evidence of a minimum of 6 recorded supervisions per annum (50% of which can be completed in a group setting/team meeting), that are signed and dated and cover all aspects of care practice, philosophy of care, career development needs, practical aspects of the job role, and adhering to the Skills for Care Code of Conduct.",
    "Supervision matrix or log showing all staff have received at least 6 supervisions per year, with supervision records signed by both parties and covering required topics.",
    "Supervision matrix showing 6+ sessions per staff member per year, signed supervision notes covering care practice, development, and conduct, or team meeting minutes counted towards group supervision (maximum 3 of 6 sessions)."]
  );

  // Question 4.2: Clinical Supervision for Nurses
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.2',
    "There is evidence of clinical supervisions for nursing staff that are signed and dated and cover the required clinical areas. All nursing staff have received a minimum of 6 recorded clinical supervisions per annum (50% of which can be completed in a clinical team meeting). Clinical supervision should be completed by a skilled clinical facilitator and cover: reflective component, focus on clinical practice including team dynamics and communication, professional development (PIN and revalidation) including CPD.",
    "Clinical supervision records for all nursing staff showing 6+ sessions per year, facilitated by qualified clinical supervisor, covering reflection, clinical practice, and NMC revalidation requirements.",
    "Clinical supervision notes signed by clinical facilitator and nurse, reflective practice discussions documented, NMC revalidation progress reviewed in supervision, or clinical team meeting minutes counted towards group clinical supervision."]
  );

  // Question 4.3: Supervision Quality
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.3',
    "Supervision records demonstrate meaningful, two-way discussions that support staff wellbeing, development, and performance improvement (not just task-focused checklists).",
    "Supervision notes showing discussion of staff wellbeing, reflections on practice, development goals, and actions agreed by both parties - evidence of dialogue rather than one-way instruction.",
    "Supervision notes with staff reflections recorded, wellbeing check-ins documented, development goals set collaboratively, or evidence that staff contribute to supervision agenda and discussions."]
  );

  // Question 4.4: Appraisal System
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.4',
    "There is evidence that all staff receive an annual appraisal that reviews performance, sets objectives for the coming year, and identifies development needs.",
    "Annual appraisal records for all staff, signed by both parties, reviewing previous year's objectives and setting new goals aligned with role and organisational objectives.",
    "Completed annual appraisal forms signed and dated, appraisal schedule showing all staff appraised within last 12 months, or appraisal documentation with SMART objectives set for next year."]
  );

  // Question 4.5: Appraisal Target Review
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.5',
    "There is evidence that appraisal targets are reviewed throughout the year (during supervision/performance management) and records are signed and dated by both parties.",
    "Supervision notes showing review of appraisal objectives and progress towards goals, with updates recorded and signed by both staff member and supervisor.",
    "Supervision records referencing appraisal objectives, progress reviews documented in supervision notes, or mid-year appraisal review meetings held to assess progress towards annual goals."]
  );

  // Question 4.6: Performance Management Process
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.6',
    "There is a clear and appropriate process for supporting and managing staff regarding performance which does not meet the service and organisation's agreed standards.",
    "Performance management policy outlining stages of support (informal discussion, formal performance improvement plan, disciplinary process), or evidence that managers can explain the performance management process.",
    "Performance management policy, capability procedure document, or evidence of performance improvement plans used with clear targets, support offered, and review dates set."]
  );

  // Question 4.7: Role-Specific Competency Assessments
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.7',
    "There is evidence of up-to-date, robust role-specific competency assessments in place and that staff have been assessed by a suitably qualified person (examples may include moving and handling, specialist nursing procedures, medication administration, use of specialist equipment).",
    "Competency assessment records for all staff in role-specific areas, completed at least annually or after training, signed by qualified assessor confirming competence.",
    "Moving and handling competency assessment signed by trainer, medication administration competency signed by senior nurse or manager, specialist equipment competency (e.g., hoist, syringe driver) assessed by qualified person, or annual competency review schedule."]
  );

  // Question 4.8: Direct Observations and Spot Checks
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.8',
    "There is evidence of documented direct observations of care practice undertaken including spot checks, covering areas such as personal care, medication administration, infection control, and communication with service users.",
    "Observation records or spot check forms completed by managers or senior staff, documenting observations of care practice with feedback given to staff.",
    "Spot check forms for medication administration, personal care observation records, infection control practice observations, or unannounced observations of care practice with feedback recorded."]
  );

  // Question 4.9: Supervision for Supervisors
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '4.9',
    "There is evidence that staff who provide supervision to others (e.g., senior care staff, team leaders) receive supervision themselves and have received training in providing effective supervision.",
    "Supervision records for supervisors showing they receive regular supervision, and evidence of supervision skills training or competency in providing supervision.",
    "Supervision records for team leaders and senior staff, supervision skills training certificates, or evidence that registered manager supervises those who supervise others."]
  );

  console.log('  Added 9 questions to STAFF Section 4');
}

// ==================== STAFF SECTION 5: Training & Development ====================
const section_staff_5 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 5]
))[0][0];

if (section_staff_5) {
  // Question 5.1: Training Matrix
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.1',
    "There is evidence that a training matrix or equivalent is in place which documents all training undertaken and highlights renewal dates.",
    "Training matrix or database showing all staff training records, including course names, completion dates, expiry dates, and renewal due dates.",
    "Training matrix spreadsheet with all staff and training courses, training database printout showing compliance status, or training tracker with RAG rating for renewals due."]
  );

  // Question 5.2: Mandatory Training
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.2',
    "There is evidence that all staff have undertaken appropriate mandatory and statutory training, including: safeguarding adults, health and safety, fire safety, infection prevention and control, moving and handling, first aid, food hygiene (if applicable), medication administration (if applicable), and basic life support.",
    "Training records showing all staff have completed core mandatory training within required timeframes (typically annually or every 3 years depending on topic), with certificates or training logs as evidence.",
    "Training certificates for mandatory topics, training matrix showing 100% compliance for mandatory training, or e-learning completion records for statutory training courses."]
  );

  // Question 5.3: Oliver McGowan Training
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.3',
    "There is evidence that all staff have completed the Oliver McGowan Mandatory Training on Learning Disability and Autism at the appropriate tier (Tier 1 for all staff, Tier 2 for staff with regular contact with people with learning disabilities or autism).",
    "Training certificates or completion records showing staff have completed Oliver McGowan training at Tier 1 (all staff) and Tier 2 (relevant staff), as this is now a statutory requirement for all health and social care staff.",
    "Oliver McGowan Tier 1 training certificates for all staff, Tier 2 certificates for care staff and managers, or e-learning completion records from approved Oliver McGowan training provider."]
  );

  // Question 5.4: Specialist Training
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.4',
    "There is evidence that all staff have undertaken any additional training required to meet the specific needs of the individuals supported (e.g., epilepsy, diabetes, Parkinson's, multiple sclerosis, dementia, mental health, physical disabilities, learning disabilities) and in line with CQC registration, which is more than basic awareness.",
    "Training records showing staff have completed condition-specific training relevant to the needs of service users, going beyond basic awareness to practical skills and knowledge.",
    "Dementia care training certificates (beyond awareness level), diabetes management training for staff supporting diabetic service users, epilepsy awareness and seizure management training, or mental health training for staff in mental health services."]
  );

  // Question 5.5: Blended Learning Approach
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.5',
    "There is evidence of blended learning approaches (e.g., classroom, face-to-face, e-learning, practical skills sessions, reflective practice) to ensure effective learning and skill development.",
    "Training records showing variety of learning methods used, including face-to-face training, e-learning courses, practical skills sessions, and reflective practice discussions.",
    "Mix of e-learning certificates and face-to-face training attendance records, practical skills training with competency assessments, or reflective practice sessions documented in supervision."]
  );

  // Question 5.6: Training Needs Analysis
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.6',
    "There is evidence of a training needs analysis process that identifies individual and organisational training needs based on service user needs, staff roles, and regulatory requirements.",
    "Training needs analysis document or process showing how training needs are identified from appraisals, supervision, service user needs assessments, and regulatory changes.",
    "Annual training needs analysis report, training plan based on identified needs, or appraisal forms with training needs section completed and fed into training planning."]
  );

  // Question 5.7: Training Effectiveness Evaluation
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.7',
    "There is evidence that training effectiveness is evaluated (e.g., through post-training assessments, competency checks, observations of practice, or feedback from staff and service users).",
    "Training evaluation forms, post-training competency assessments, or evidence that learning from training is applied in practice and monitored.",
    "Training evaluation forms completed by staff, post-training competency assessments showing knowledge gained, or supervision notes discussing application of training in practice."]
  );

  // Question 5.8: Professional Development Opportunities
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.8',
    "There is evidence that staff are supported to access professional development opportunities beyond mandatory training (e.g., NVQ/diploma qualifications, leadership development, specialist courses).",
    "Records of staff undertaking vocational qualifications, leadership training, or specialist courses, with evidence of organisational support (time off, funding, mentoring).",
    "Staff enrolled on NVQ Level 2/3/5 in Health & Social Care, leadership and management training for senior staff, or specialist qualification support (e.g., end of life care, mental health)."]
  );

  // Question 5.9: Induction Training Confirmation
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '5.9',
    "Staff confirm that they have received an induction which was appropriate to their role and prepared them for their responsibilities.",
    "Staff feedback forms, induction evaluation surveys, or documented discussions in supervision where staff confirm their induction was adequate and role-appropriate.",
    "Induction feedback forms with positive responses, end-of-probation reviews where staff confirm induction adequacy, or staff survey results showing satisfaction with induction process."]
  );

  console.log('  Added 9 questions to STAFF Section 5');
}

// ==================== STAFF SECTION 6: Staff Feedback & Engagement ====================
const section_staff_6 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 6]
))[0][0];

if (section_staff_6) {
  // Question 6.1: Regular Supervision Feedback
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.1',
    "Staff confirm they receive regular, two-way, meaningful and supportive supervisions.",
    "Staff feedback from surveys, supervision evaluations, or documented discussions where staff confirm supervision frequency and quality meet their needs.",
    "Staff survey results on supervision satisfaction, supervision feedback forms completed by staff, or documented discussions in team meetings about supervision quality."]
  );

  // Question 6.2: Staff Feeling Valued and Supported
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.2',
    "Staff confirm they feel valued, supported, and listened to by management.",
    "Staff survey results, exit interview feedback, or documented evidence from staff meetings showing staff feel valued and supported.",
    "Annual staff satisfaction survey results, staff meeting minutes showing staff voice is heard, or positive feedback from staff interviews or focus groups."]
  );

  // Question 6.3: Staff Meetings
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.3',
    "There is evidence of regular staff meetings (team meetings, handovers, or briefings) that facilitate communication, information sharing, and staff input into service development.",
    "Staff meeting minutes showing regular meetings held (at least monthly), with attendance records, agenda items, and actions arising documented.",
    "Team meeting minutes with dates and attendees, handover records showing information sharing, or staff briefing notes circulated to all staff."]
  );

  // Question 6.4: Staff Consultation and Involvement
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.4',
    "There is evidence that staff are consulted on and involved in service development, policy changes, and decision-making processes.",
    "Consultation records, staff feedback on proposed changes, or evidence that staff suggestions have been implemented.",
    "Staff consultation meeting notes, policy review feedback from staff, staff suggestion scheme with evidence of ideas implemented, or staff representation on quality improvement groups."]
  );

  // Question 6.5: Staff Survey
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.5',
    "There is evidence of regular staff surveys or feedback mechanisms, with results analysed and action plans developed to address concerns or suggestions.",
    "Staff survey results from last 12 months, analysis of findings, and action plan showing how feedback has been addressed.",
    "Annual staff survey report with results and action plan, staff feedback analysis with themes identified, or evidence of improvements made in response to staff feedback."]
  );

  // Question 6.6: Exit Interviews
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.6',
    "There is a process for conducting exit interviews with departing staff, and feedback is used to identify retention issues and improve working conditions.",
    "Exit interview records, analysis of reasons for leaving, and evidence that exit interview feedback informs retention strategies.",
    "Exit interview forms completed for leavers, exit interview analysis report identifying themes, or evidence of changes made based on exit interview feedback (e.g., improved induction, better supervision)."]
  );

  // Question 6.7: Staff Recognition and Appreciation
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '6.7',
    "There is evidence of staff recognition and appreciation initiatives (e.g., employee of the month, thank you notes, celebration of achievements, long service awards).",
    "Records of staff recognition schemes, thank you cards or messages to staff, celebration of staff achievements in meetings or newsletters.",
    "Employee of the month certificates, thank you notes to staff in personnel files, long service awards records, or staff achievements celebrated in team meetings or newsletters."]
  );

  console.log('  Added 7 questions to STAFF Section 6');
}

// ==================== STAFF SECTION 7: Staff Wellbeing & Support ====================
const section_staff_7 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 7]
))[0][0];

if (section_staff_7) {
  // Question 7.1: Staff Wellbeing Support
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.1',
    "There is evidence that the organisation actively supports staff wellbeing, including access to wellbeing resources, mental health support, or employee assistance programmes.",
    "Information about wellbeing support available to staff, employee assistance programme details, or records of wellbeing initiatives offered.",
    "Employee assistance programme information provided to staff, wellbeing resources available (e.g., mental health first aiders, counselling access), or staff wellbeing policy."]
  );

  // Question 7.2: Stress Risk Assessments
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.2',
    "There is evidence of stress risk assessments for staff, particularly those in high-pressure roles or experiencing work-related stress.",
    "Stress risk assessment forms completed for staff reporting stress, or organisational stress risk assessment identifying stressors and control measures.",
    "Individual stress risk assessments for staff on sickness absence due to stress, organisational stress risk assessment using HSE Management Standards, or wellbeing action plans for staff experiencing stress."]
  );

  // Question 7.3: Work-Life Balance
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.3',
    "There is evidence that the organisation promotes work-life balance through flexible working arrangements, reasonable working hours, and adequate rest breaks.",
    "Flexible working policy, evidence of flexible working requests granted, or staff rotas showing reasonable working hours and adequate breaks.",
    "Flexible working policy and requests granted, rotas showing compliance with Working Time Regulations (48-hour week, rest breaks), or evidence of part-time and flexible working arrangements."]
  );

  // Question 7.4: Occupational Health Access
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.4',
    "There is evidence that staff have access to occupational health services for work-related health concerns, sickness absence management, and reasonable adjustments.",
    "Occupational health service provider details, referral records, or occupational health reports with recommendations implemented.",
    "Occupational health referral forms, occupational health reports with recommendations for adjustments, or evidence of reasonable adjustments made following occupational health advice."]
  );

  // Question 7.5: Debriefing After Incidents
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.5',
    "There is evidence that staff receive debriefing and support following challenging incidents, safeguarding concerns, or traumatic events.",
    "Debriefing records following incidents, evidence of support offered to staff involved in safeguarding investigations, or access to counselling after traumatic events.",
    "Incident debriefing notes, staff support offered after safeguarding investigations documented, or reflective practice sessions following challenging incidents."]
  );

  // Question 7.6: Staff Sickness Absence Monitoring
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.6',
    "There is evidence of effective sickness absence monitoring and management, including return-to-work interviews, absence triggers, and support for staff with health issues.",
    "Sickness absence records, return-to-work interview forms, and evidence of support offered to staff with recurring absence or long-term sickness.",
    "Sickness absence tracking system, return-to-work interview forms completed after every absence, occupational health referrals for staff with concerning absence patterns, or phased return-to-work plans."]
  );

  // Question 7.7: Lone Working Risk Assessments
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.7',
    "There is evidence of lone working risk assessments and safety measures for staff who work alone (e.g., night staff, community care workers).",
    "Lone working risk assessments, lone working policy, and safety measures in place (e.g., check-in procedures, personal alarms, mobile phones).",
    "Lone working risk assessment for night staff, lone working policy with check-in procedures, or personal safety devices provided to lone workers (alarms, mobile phones)."]
  );

  // Question 7.8: Staff Wellbeing Initiatives
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '7.8',
    "There is evidence of proactive wellbeing initiatives offered to staff (e.g., wellbeing days, team-building activities, health promotion, mental health awareness training).",
    "Records of wellbeing activities or initiatives offered to staff, such as wellbeing days, team events, health checks, or mental health awareness sessions.",
    "Wellbeing day event records, team-building activity photos or feedback, mental health awareness training attendance, or health promotion initiatives (e.g., flu jabs, health checks)."]
  );

  console.log('  Added 8 questions to STAFF Section 7');
}

await connection.end();
console.log('Staff Sections 2-7 questions updated successfully!');
console.log('Total new questions added: 49 (across sections 2-7)');
