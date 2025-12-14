import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Deleting existing Staff Section 1 questions...');
await connection.execute(
  `DELETE FROM complianceQuestions 
   WHERE sectionId = (SELECT id FROM complianceSections WHERE sectionType = 'staff' AND sectionNumber = 1 LIMIT 1)`
);

console.log('Inserting revised Staff Section 1 questions...');

const section_staff_1 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 1]
))[0][0];

if (section_staff_1) {
  // Question 1.1: Recruitment Policy
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.1', 
    "There is an up-to-date recruitment policy and procedure in place.",
    "Copy of recruitment policy showing review date within last 12-24 months, or evidence of annual policy review schedule.",
    "Recruitment policy document dated within last 2 years, policy review log, or board meeting minutes approving updated recruitment procedures."]
  );

  // Question 1.2: Equality Act Compliance
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.2',
    "The recruitment process is in line with the Equality Act 2010.",
    "Documentation showing equal opportunities monitoring, reasonable adjustments process, and non-discriminatory selection criteria.",
    "Equal opportunities monitoring forms, interview scoring sheets with objective criteria, reasonable adjustments policy, or diversity and inclusion statement in recruitment materials."]
  );

  // Question 1.3: Application Forms
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.3',
    "There is evidence of an application form which includes full employment history and that any gaps in employment have been explored and recorded.",
    "Completed application forms (not just CVs) showing continuous employment history from leaving education, with written explanations for any gaps exceeding one month.",
    "Application form with employment history section completed in full, interview notes documenting discussion of employment gaps, or signed statement from candidate explaining gaps in employment."]
  );

  // Question 1.4: Interview Records
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.4',
    "There is a documented record of interviews having taken place and by two people who are appropriately positioned in the organisation.",
    "Interview notes or scoring sheets signed and dated by two interviewers, with evidence that interviewers hold appropriate positions (e.g., registered manager, senior care staff, or directors).",
    "Interview assessment forms with two signatures, interview question template with candidate responses recorded, or panel interview notes showing multiple interviewers' observations."]
  );

  // Question 1.5: Interview Scoring
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.5',
    "There is a scoring mechanism in place with an agreed appointment threshold.",
    "Interview scoring matrix or rubric showing how candidates are assessed against specific criteria, with documented minimum score required for appointment.",
    "Interview scoring sheet with numerical ratings for each competency, appointment threshold policy (e.g., 'candidates must score 70% or above'), or interview panel decision form showing scores and appointment recommendation."]
  );

  // Question 1.6: Identity Verification
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.6',
    "There is relevant identification documentation that has been validated (signed and dated as a true likeness).",
    "Photocopies of identity documents (passport, driving licence, or national ID card) with verifier's signature, date, and statement confirming original document seen and photograph matches applicant.",
    "Copy of passport photo page with annotation 'Original seen, true likeness verified - [signature] [date]', or identity verification checklist completed and signed by recruiting manager."]
  );

  // Question 1.7: Employment Type Classification
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.7',
    "Is this staff member employed as: (a) Permanent staff, (b) Agency staff, or (c) Bank staff?",
    "Employment contract, agency booking confirmation, or bank staff agreement clearly stating employment status.",
    "Signed contract of employment for permanent staff, agency worker profile from supplying agency, or internal bank staff registration form. Answer determines which subsequent questions apply."]
  );

  // Question 1.8: Right to Work - Employment Status (Permanent Staff)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.8',
    "For permanent staff: Is this staff member (a) a British or Irish citizen with indefinite right to work, (b) a sponsored worker on a Health and Care Worker visa, or (c) holding another visa type with limited right to work?",
    "Documentation proving right to work status - either passport showing British/Irish citizenship, share code for online right to work check, or visa/BRP card showing current immigration status.",
    "British passport, Irish passport card, Home Office share code check printout, Health and Care Worker visa in passport, or Biometric Residence Permit (BRP) card copy. Answer determines additional checks required."]
  );

  // Question 1.9: Right to Work Verification
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.9',
    "There is proof of right to work documentation in the UK that has been validated (signed and dated as the original seen).",
    "Copy of right to work documents with verifier's signature and date confirming original documents inspected and validated as genuine. For online checks, printout of share code check result.",
    "Passport copy with 'Original seen and verified - [signature] [date]', Home Office online right to work check printout with employer's records, or BRP card copy with validation statement."]
  );

  // Question 1.10: DBS Check
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.10',
    "There is an enhanced DBS prior to commencement of employment or evidence of an Adult First check with appropriate risk assessment.",
    "Copy of enhanced DBS certificate, DBS update service check record, or Adult First barred list check with risk assessment if DBS not yet received.",
    "Enhanced DBS certificate showing issue date before start date, DBS update service online check printout, or Adult First check with signed risk assessment and supervision plan pending full DBS."]
  );

  // Question 1.11: Overseas Criminal Record Check
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.11',
    "There is a certificate of good conduct/overseas police check from country of origin where applicable (if staff member has lived outside UK for 12+ consecutive months since age 18).",
    "Certificate of good conduct or overseas police check from each country where staff member resided for 12+ months, OR documented evidence of attempts to obtain with risk assessment if unobtainable.",
    "Translated and certified overseas police certificate, certificate of good conduct from embassy, or correspondence showing attempts to obtain (with risk assessment) if country does not issue such certificates."]
  );

  // Question 1.12: References
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.12',
    "There are two written references, one of which is from the most recent employer, that have been received prior to commencement of employment and have been verified. (If the referees are not from a care provider, and the candidate has previously worked in care, a reference has been sought from a care employer.)",
    "Two written references on headed paper or verified email, with evidence of verification (phone call notes, email confirmation, or verifier signature). One reference must be from most recent employer. If candidate has care experience, at least one reference must be from a care setting.",
    "Reference letters with verification notes ('Verified by phone with [name] on [date] - [signature]'), reference request and response emails, or reference verification log showing date and method of verification."]
  );

  // Question 1.13: Previous Care Employment Conduct
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.13',
    "There is satisfactory evidence of conduct in previous employment concerned with the provision of health or social care, or work with children or vulnerable adults (if applicable).",
    "References, appraisal documents, or written statements from previous care employers confirming satisfactory conduct and performance. Only applicable if staff member has previous care experience.",
    "Care employer reference stating 'conduct was professional and satisfactory throughout employment', performance appraisal showing 'meets expectations' or above, or written statement from previous care manager regarding conduct and capability."]
  );

  // Question 1.14: Professional Qualifications
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.14',
    "Evidence of appropriate qualifications (including PIN and revalidation status for registered nurses, or professional registration for social workers).",
    "Copies of qualification certificates, NMC PIN verification printout showing current registration and revalidation date, Social Work England registration, or other professional body registration as applicable to role.",
    "NVQ Level 2/3 in Health and Social Care certificate, NMC online register check showing active PIN and next revalidation date, Social Work England registration certificate, or degree certificate for graduate roles."]
  );

  // Question 1.15: Certificate of Sponsorship (Sponsored Workers Only)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.15',
    "For sponsored workers: There is evidence of a valid Certificate of Sponsorship (CoS) issued by the employer for this staff member's Health and Care Worker visa application.",
    "Copy of Certificate of Sponsorship showing CoS reference number, job title, salary, start date, and confirmation it matches the staff member's visa endorsement.",
    "Certificate of Sponsorship document from Sponsor Management System, email confirmation of CoS assignment, or CoS reference number recorded with verification that visa endorsement matches CoS details."]
  );

  // Question 1.16: Visa and Immigration Status (Sponsored Workers Only)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.16',
    "For sponsored workers: There is a copy of the staff member's current visa or Biometric Residence Permit (BRP) showing Health and Care Worker visa status, with validity dates recorded and follow-up check scheduled before expiry.",
    "Copy of visa vignette in passport or BRP card showing Health and Care Worker visa category, start and end dates, and any conditions. Diary note or system reminder set for follow-up check at least 1 month before expiry.",
    "BRP card copy (front and back) showing visa expiry date, passport page with visa vignette, and calendar reminder or HR system alert set for follow-up right to work check before visa expires."]
  );

  // Question 1.17: Overseas Criminal Record Certificate (Sponsored Workers Only)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.17',
    "For sponsored workers: There is an overseas criminal record certificate from the staff member's country of residence for the 12 months prior to their UK visa application, as required for Health and Care Worker visa.",
    "Criminal record certificate from country of residence immediately before UK entry, translated into English if necessary, and certified as genuine. This is a visa requirement so should be available.",
    "Police clearance certificate from home country dated within 6 months of visa application, certified translation if not in English, or Home Office acknowledgement that certificate was provided as part of visa application."]
  );

  // Question 1.18: TB Test Results (Sponsored Workers Only - If Applicable)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.18',
    "For sponsored workers from TB-testing required countries: There is evidence of a TB test certificate.",
    "TB test certificate from approved clinic, dated within 6 months of visa application, showing clear result. Only applicable if staff member is from a TB-testing required country (see gov.uk list).",
    "TB test certificate from approved testing centre, medical examination report showing clear TB screening, or Home Office documentation confirming TB test requirement was met for visa."]
  );

  // Question 1.19: English Language Proficiency (Sponsored Workers Only)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.19',
    "For sponsored workers: There is evidence that the sponsored worker meets the English language requirement for their Health and Care Worker visa (CEFR Level B1 or equivalent).",
    "Proof of English language qualification accepted by Home Office (IELTS, OET, or degree taught in English), OR evidence that staff member is from majority English-speaking country exempt from this requirement.",
    "IELTS certificate showing minimum B1 in all components, Occupational English Test (OET) results, degree certificate from UK university or English-taught programme, or passport from exempt country (e.g., USA, Canada, Australia)."]
  );

  // Question 1.20: Time-Limited Right to Work (Other Visa Types)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.20',
    "For staff with time-limited right to work: There is evidence that the visa has not expired, the staff member has permission for the type of work offered (including any hour restrictions), and a follow-up check is scheduled before the visa expiry date.",
    "Copy of visa or BRP showing work permissions and expiry date, verification that job role and hours comply with visa conditions, and documented follow-up check date set for at least 1 month before expiry.",
    "Student visa with term-time/vacation hour limits recorded and monitored, Skilled Worker visa showing permitted occupation code matches job role, or Graduate visa with expiry date and follow-up check scheduled."]
  );

  // Question 1.21: Visa Conditions Compliance (Other Visa Types)
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.21',
    "For staff with time-limited right to work: There is evidence that the employer is monitoring and complying with any visa conditions or restrictions (e.g., hour limits for students, occupation restrictions for Skilled Worker visa holders).",
    "System or process for monitoring visa conditions, such as timesheet reviews for hour limits, job description alignment with visa occupation code, or regular visa status checks.",
    "Timesheet monitoring log for student staff showing compliance with 20-hour term-time limit, job description matched to Skilled Worker visa occupation code, or quarterly visa status review checklist."]
  );

  // Question 1.22: Contract of Employment
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.22',
    "There is a contract of employment which has been signed by both parties.",
    "Signed contract of employment containing terms and conditions, job title, salary, working hours, and start date, with signatures from both employer and employee.",
    "Signed employment contract with both parties' signatures and dates, or electronic contract with digital signature confirmation from both parties."]
  );

  // Question 1.23: Salary Deductions Agreement
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.23',
    "Where there are agreed salary deductions (e.g., for accommodation, uniform, or training costs), these are recorded within a formal agreement signed and dated by employer and employee, and comply with National Minimum Wage regulations.",
    "Signed salary deduction agreement specifying amount, purpose, and duration of deductions, with evidence that deductions do not reduce pay below National Minimum Wage.",
    "Accommodation deduction agreement signed by both parties with calculation showing net pay remains above NMW, uniform cost recovery agreement, or training cost repayment clause in contract with NMW compliance check."]
  );

  // Question 1.24: Job Description
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.24',
    "There is a copy of the staff member's job description on their file for their current role.",
    "Job description specific to the staff member's role, outlining key responsibilities, reporting lines, and essential requirements.",
    "Signed job description with staff member's name and start date, role-specific job description filed in personnel record, or job description acknowledged in contract or induction paperwork."]
  );

  // Question 1.25: Health Declaration and Risk Assessments
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.25',
    "Where there is a relevant health concern that may impact on their employment, there is an appropriate risk assessment in place (e.g., pregnancy, musculoskeletal conditions, mental health, epilepsy).",
    "Health declaration form completed by staff member, and where health concerns are disclosed, a risk assessment addressing how the condition may impact work and what reasonable adjustments or support are in place.",
    "Completed health questionnaire, pregnancy risk assessment, manual handling risk assessment for staff with back problems, or occupational health referral and recommendations with adjustments implemented."]
  );

  // Question 1.26: Agency Staff Profile
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.26',
    "For agency staff: Staff profiles are in place which detail full name, photograph, qualifications and experience, DBS status and date, right to work verification, all mandatory and specialist training including renewal dates, PIN and NMC revalidation status (for nursing staff), and competency assessments.",
    "Agency staff profile document or file containing all required information listed above, provided by the agency and verified by the care provider.",
    "Agency worker profile pack with photo ID, DBS certificate number and date, training matrix showing mandatory training completion and renewal dates, NMC PIN verification for nurses, and competency assessment records for medication administration and moving and handling."]
  );

  // Question 1.27: Agency Staff Induction
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.27',
    "For agency staff: There is relevant induction completed by the care provider on their first shift covering ID checks, orientation of service, fire procedure and security arrangements, roles and responsibilities, and access to appropriate records.",
    "Provider-completed induction checklist signed and dated by both the agency worker and the supervising staff member, covering all required topics. Agency induction alone is not sufficient.",
    "First shift induction checklist completed and signed, site-specific orientation record, fire safety briefing sign-off, or agency worker induction log showing topics covered and signatures."]
  );

  // Question 1.28: Agency Right to Work and DBS Verification
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.28',
    "For agency staff: There is evidence that the care provider has verified the agency has conducted appropriate right to work and DBS checks for agency staff, and that these checks are current and valid.",
    "Written confirmation from agency that right to work and DBS checks have been completed, with dates and reference numbers, OR copies of the actual checks provided by the agency.",
    "Agency compliance certificate confirming checks completed, DBS certificate copy with issue date, right to work check documentation from agency, or agency contract clause requiring provision of compliance evidence with verification records."]
  );

  // Question 1.29: Bank Staff Recruitment Checks
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.29',
    "For bank staff: Bank staff have undergone the same recruitment checks as permanent staff, including DBS, references, right to work, qualifications, and identity verification.",
    "Bank staff personnel file containing all standard recruitment checks as required for permanent staff (DBS, two references, right to work, qualifications, identity verification, employment history).",
    "Bank staff file with enhanced DBS, two verified references, right to work documentation, qualification certificates, and completed application form - same standard as permanent staff files."]
  );

  // Question 1.30: Bank Staff Induction and Training
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.30',
    "For bank staff: Bank staff have completed a full induction and maintain up-to-date mandatory training in line with permanent staff requirements.",
    "Induction checklist completed for bank staff, and training matrix showing all mandatory training current with same renewal schedules as permanent staff.",
    "Bank staff induction record, training certificates for safeguarding, moving and handling, infection control, fire safety, and medication (if applicable), with renewal dates monitored."]
  );

  // Question 1.31: Volunteer Recruitment Process
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.31',
    "There is a process for the safe recruitment of volunteers (if applicable).",
    "Volunteer recruitment policy outlining checks required (proportionate to role and level of contact with service users), application process, and induction requirements.",
    "Volunteer policy document, volunteer application forms, DBS checks for volunteers with direct care contact, volunteer induction checklist, or volunteer handbook outlining expectations and safeguarding."]
  );

  // Question 1.32: Staff Absence Management
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.32',
    "There is an effective approach to managing staff absences for all staff.",
    "Absence management policy, absence recording system, and evidence of absence monitoring and return-to-work procedures.",
    "Sickness absence policy, absence tracking spreadsheet or system reports, return-to-work interview forms, or absence management meeting notes for staff with concerning absence patterns."]
  );

  // Question 1.33: Ongoing Monitoring and Compliance
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '1.33',
    "There is a system in place for ongoing monitoring of staff compliance, including DBS renewals, professional registration renewals, visa expiry dates, and mandatory training renewals.",
    "Compliance tracking system (spreadsheet, HR software, or diary system) showing renewal dates for all time-sensitive checks and training, with alerts set for upcoming renewals.",
    "Staff compliance matrix showing DBS dates, NMC revalidation dates, visa expiry dates, and training renewal dates with RAG status, or HR system automated alerts for upcoming renewals."]
  );

  console.log('  Added 33 revised questions to STAFF Section 1');
}

await connection.end();
console.log('Staff Section 1 questions updated successfully!');
