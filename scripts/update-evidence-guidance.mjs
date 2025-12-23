#!/usr/bin/env node
/**
 * Update Evidence Guidance Script - COMPLETE VERSION
 * 
 * This script updates ALL 256 compliance questions with correct "How to Evidence" guidance.
 * Each evidence guidance is matched to the actual question text in the production database.
 * 
 * Usage: DATABASE_URL="your-connection-string" node scripts/update-evidence-guidance.mjs
 * 
 * IMPORTANT: Review this script before running. It will update the exampleEvidence field
 * for all questions in the complianceQuestions table.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================================
// COMPLETE EVIDENCE GUIDANCE MAPPINGS - ALL 256 QUESTIONS
// Matched to actual question text in production database
// ============================================================================

const evidenceUpdates = [
  // ============================================================================
  // STAFF SECTIONS (23-29) - 82 Questions Total
  // ============================================================================

  // --------------------------------------------------------------------------
  // Section 23: Recruitment & Vetting (33 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '23.1', evidence: "Provide current recruitment policy document with review date, version control, and evidence it covers safe recruitment practices including DBS, references, right to work, and interview procedures." },
  { questionNumber: '23.2', evidence: "Provide DBS certificate on file dated prior to employment start date, or Adult First check documentation with completed risk assessment if DBS was pending at start." },
  { questionNumber: '23.3', evidence: "For staff who lived outside UK for 12+ consecutive months since age 18: provide certificate of good conduct or overseas police check from relevant country, with certified translation if not in English." },
  { questionNumber: '23.4', evidence: "Provide two written references on file (one from most recent employer), dated before employment start, with evidence of verbal verification (dated notes of phone calls, email confirmations). If candidate worked in care previously, show reference from care employer." },
  { questionNumber: '23.5', evidence: "Where applicable, provide evidence of conduct enquiries from previous health/social care or children's services employers, including any disciplinary records or concerns raised." },
  { questionNumber: '23.6', evidence: "Provide copies of qualification certificates, NMC PIN verification printout with revalidation date for nurses, or professional registration confirmation for social workers." },
  { questionNumber: '23.7', evidence: "For sponsored workers: provide copy of Certificate of Sponsorship (CoS) issued by the employer for this staff member's Health and Care Worker visa application." },
  { questionNumber: '23.8', evidence: "For sponsored workers: provide copy of current visa or Biometric Residence Permit (BRP) showing Health and Care Worker visa status, with validity dates recorded and calendar reminder for follow-up check before expiry." },
  { questionNumber: '23.9', evidence: "For sponsored workers: provide overseas criminal record certificate from country of residence for 12 months prior to UK visa application, as required for Health and Care Worker visa." },
  { questionNumber: '23.10', evidence: "For sponsored workers from TB-testing required countries: provide TB test certificate showing clearance, dated appropriately for visa application." },
  { questionNumber: '23.11', evidence: "For sponsored workers: provide evidence of English language competency at CEFR Level B1 or equivalent (IELTS, OET scores, or degree taught in English)." },
  { questionNumber: '23.12', evidence: "Provide recruitment policy showing Equality Act 2010 compliance, equal opportunities monitoring forms, and evidence of non-discriminatory job adverts and selection criteria." },
  { questionNumber: '23.13', evidence: "For staff with time-limited right to work: provide current visa documentation, evidence visa permits the type of work offered, record of any hour restrictions, and scheduled follow-up check date before expiry." },
  { questionNumber: '23.14', evidence: "For staff with time-limited right to work: provide evidence of monitoring visa conditions (e.g., hour tracking for students, occupation verification for Skilled Worker visa holders), with compliance records." },
  { questionNumber: '23.15', evidence: "Provide signed contract of employment with signatures from both employer and employee, dated before or on employment start date." },
  { questionNumber: '23.16', evidence: "Where salary deductions apply: provide formal written agreement signed and dated by both parties detailing deductions for accommodation/uniform/training, with evidence of National Minimum Wage compliance calculations." },
  { questionNumber: '23.17', evidence: "Provide copy of current job description on staff file, matching the role the staff member is employed in, signed or acknowledged by the employee." },
  { questionNumber: '23.18', evidence: "Where health concerns exist: provide completed risk assessment (e.g., pregnancy, musculoskeletal, mental health, epilepsy) with control measures documented and reviewed as needed." },
  { questionNumber: '23.19', evidence: "For agency staff: provide staff profile from agency including full name, photograph, qualifications, experience, DBS status and date, right to work verification, all mandatory and specialist training with renewal dates, PIN and NMC revalidation status for nurses, and competency assessments." },
  { questionNumber: '23.20', evidence: "For agency staff: provide completed local induction checklist from first shift covering ID verification, service orientation, fire procedures, security arrangements, roles and responsibilities, and access to care records." },
  { questionNumber: '23.21', evidence: "For agency staff: provide written confirmation from agency of DBS and right to work checks, with dates verified, plus evidence of spot-checking agency compliance (e.g., audit records, verification calls)." },
  { questionNumber: '23.22', evidence: "For bank staff: provide evidence of full recruitment checks completed to same standard as permanent staff - DBS certificate, two references, right to work documents, qualification certificates, and ID verification." },
  { questionNumber: '23.23', evidence: "Provide completed application form showing full employment history with explanations for any gaps recorded and explored during interview process." },
  { questionNumber: '23.24', evidence: "For bank staff: provide completed induction checklist and training matrix showing all mandatory training completed and kept up to date in line with permanent staff requirements." },
  { questionNumber: '23.25', evidence: "If volunteers are used: provide volunteer recruitment policy and evidence of DBS checks, references, induction, and ongoing supervision for all volunteers." },
  { questionNumber: '23.26', evidence: "Provide absence management policy and evidence of its application - absence records, return to work interviews, trigger point monitoring, and support measures offered." },
  { questionNumber: '23.27', evidence: "Provide compliance monitoring system showing tracking of DBS renewal dates, professional registration renewals, visa expiry dates, and mandatory training renewals, with evidence of timely action taken." },
  { questionNumber: '23.28', evidence: "Provide interview records showing structured interview took place with two appropriately positioned interviewers, including questions asked, responses noted, and panel members identified." },
  { questionNumber: '23.29', evidence: "Provide scoring matrix or assessment criteria used in interviews, showing agreed appointment threshold and how candidates were scored against criteria." },
  { questionNumber: '23.30', evidence: "Provide copies of ID documents (passport, driving licence) with validation record showing documents were checked, signed, dated, and confirmed as true likeness by the checker." },
  { questionNumber: '23.31', evidence: "Record the staff member's employment type: (a) Permanent staff, (b) Agency staff, or (c) Bank staff - this determines which additional checks apply." },
  { questionNumber: '23.32', evidence: "For permanent staff, record their right to work status: (a) British/Irish citizen with indefinite right to work, (b) Sponsored worker on Health and Care Worker visa, or (c) Other visa type with limited right to work." },
  { questionNumber: '23.33', evidence: "Provide right to work documentation (passport, visa, BRP, share code verification) with validation record showing original documents were checked, signed, dated, and verified." },

  // --------------------------------------------------------------------------
  // Section 24: Induction & Onboarding (8 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '24.1', evidence: "Provide current whistleblowing policy with review date, including contact details for raising concerns externally (CQC, local authority, police) and protection for whistleblowers." },
  { questionNumber: '24.2', evidence: "Provide current bullying and harassment policy that references the whistleblowing policy and includes information on escalating concerns outside the organisation." },
  { questionNumber: '24.3', evidence: "Provide evidence staff have access to policies (policy folder location, intranet access, handbook) and signed confirmation sheets showing staff have read and understood key policies." },
  { questionNumber: '24.4', evidence: "Provide policy review schedule showing all policies listed with review dates, responsible person, and evidence of reviews being completed on time (typically annually or biennially)." },
  { questionNumber: '24.5', evidence: "Provide current safeguarding policy with review date, showing alignment with current legislation and local safeguarding procedures (reference local authority multiagency procedures)." },
  { questionNumber: '24.6', evidence: "Provide current health and safety policy complying with Health and Safety at Work Act 1974, including risk assessment procedures, with review date and responsible person identified." },
  { questionNumber: '24.7', evidence: "Provide current infection prevention and control policy reflecting latest guidance including COVID-19 and other infectious diseases, with review date." },
  { questionNumber: '24.8', evidence: "Provide current medication policy covering ordering, storage, administration, recording, and disposal of medicines, with review date and alignment to NICE guidance." },

  // --------------------------------------------------------------------------
  // Section 25: Training & Development (8 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '25.1', evidence: "Provide evidence staff handbook has been issued (signed receipt) or is accessible to all staff (intranet location, physical copy location), with current version date." },
  { questionNumber: '25.2', evidence: "Provide completed service induction checklist that is role-specific and comprehensive, signed and dated by both the new staff member and their supervisor/manager." },
  { questionNumber: '25.3', evidence: "Provide shadowing records showing who the new staff member shadowed, dates of shadowing, areas/tasks covered, and sign-off confirming shadowing was completed satisfactorily." },
  { questionNumber: '25.4', evidence: "For new care staff: provide completed Care Certificate workbook signed by both parties within 12 weeks of start, OR evidence of equivalent qualifications (NVQ/Diploma in Care) that exempt them." },
  { questionNumber: '25.5', evidence: "Provide records of increased supervision during probation period - supervision dates, check-in meeting notes, and documented support provided during induction period." },
  { questionNumber: '25.6', evidence: "Provide competency assessment records for key tasks (moving and handling, medication administration, safeguarding recognition) signed off before staff worked unsupervised." },
  { questionNumber: '25.7', evidence: "Provide new staff feedback forms or survey responses about their induction experience, with evidence of how feedback has been used to improve the induction process." },
  { questionNumber: '25.8', evidence: "Provide re-induction or refresher induction records for staff returning after extended absence (maternity, long-term sick) or moving to new roles, showing updated training completed." },

  // --------------------------------------------------------------------------
  // Section 26: Supervision & Appraisal (9 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '26.1', evidence: "Provide supervision records showing minimum 6 supervisions per year (up to 50% can be group/team meetings), signed and dated, covering care practice, philosophy of care, career development, practical job aspects, and Skills for Care Code of Conduct." },
  { questionNumber: '26.2', evidence: "For nursing staff: provide clinical supervision records showing minimum 6 clinical supervisions per year (up to 50% can be clinical team meetings), conducted by skilled clinical facilitator, covering reflective practice, clinical practice including team dynamics, and professional development including PIN revalidation and CPD." },
  { questionNumber: '26.3', evidence: "Provide supervision records demonstrating meaningful two-way discussions - not just tick-box checklists - covering staff wellbeing, development needs, performance feedback, and agreed actions." },
  { questionNumber: '26.4', evidence: "Provide annual appraisal records for all staff showing review of performance against previous objectives, setting of new objectives for coming year, and identification of development needs." },
  { questionNumber: '26.5', evidence: "Provide evidence that appraisal targets are reviewed during the year through supervision or performance management meetings, with records signed and dated by both parties." },
  { questionNumber: '26.6', evidence: "Provide performance management policy and evidence of its application where performance does not meet standards - support plans, improvement targets, capability procedures if needed." },
  { questionNumber: '26.7', evidence: "Provide role-specific competency assessment frameworks and completed assessments for each staff member, conducted by suitably qualified assessors, covering areas like moving and handling, specialist nursing procedures, medication administration, specialist equipment use." },
  { questionNumber: '26.8', evidence: "Provide documented direct observation records including spot checks, covering personal care delivery, medication administration, infection control practice, and communication with service users, with feedback given to staff." },
  { questionNumber: '26.9', evidence: "For staff who supervise others: provide evidence they receive supervision themselves, plus training records showing they have completed training in providing effective supervision." },

  // --------------------------------------------------------------------------
  // Section 27: Competency & Observation (9 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '27.1', evidence: "Provide training matrix or equivalent system showing all staff, all training completed with dates, and renewal/expiry dates highlighted for tracking compliance." },
  { questionNumber: '27.2', evidence: "Provide training certificates or records for all mandatory and statutory training: safeguarding adults, health and safety, fire safety, infection prevention and control, moving and handling, first aid, food hygiene (if applicable), medication administration (if applicable), and basic life support." },
  { questionNumber: '27.3', evidence: "Provide Oliver McGowan Mandatory Training certificates for all staff showing completion at appropriate tier - Tier 1 for all staff, Tier 2 for staff with regular contact with people with learning disabilities or autism." },
  { questionNumber: '27.4', evidence: "Provide specialist training certificates for conditions relevant to people supported - e.g., epilepsy, diabetes, Parkinson's, MS, dementia, mental health, physical disabilities, learning disabilities - showing training goes beyond basic awareness level." },
  { questionNumber: '27.5', evidence: "Provide evidence of blended learning approaches used - classroom training records, face-to-face sessions, e-learning completion certificates, practical skills assessments, reflective practice records." },
  { questionNumber: '27.6', evidence: "Provide training needs analysis documentation showing how individual and organisational training needs are identified based on service user needs, staff roles, and regulatory requirements." },
  { questionNumber: '27.7', evidence: "Provide training evaluation records showing how training effectiveness is measured - feedback forms, competency assessments post-training, observation of practice, knowledge checks." },
  { questionNumber: '27.8', evidence: "Provide evidence of supporting professional development beyond mandatory training - NVQ/Diploma enrolments, leadership development programmes, specialist course attendance, funding provided." },
  { questionNumber: '27.9', evidence: "Provide staff feedback (surveys, supervision notes, exit interviews) confirming induction was appropriate to their role and prepared them for their responsibilities." },

  // --------------------------------------------------------------------------
  // Section 28: Health & Wellbeing (7 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '28.1', evidence: "Provide staff feedback (surveys, supervision records, interviews) confirming they receive regular, two-way, meaningful and supportive supervisions." },
  { questionNumber: '28.2', evidence: "Provide staff survey results, feedback mechanisms, or interview records showing staff feel valued, supported, and listened to by management." },
  { questionNumber: '28.3', evidence: "Provide minutes from regular staff meetings, team meetings, handovers, or briefings showing communication, information sharing, and opportunities for staff input into service development." },
  { questionNumber: '28.4', evidence: "Provide evidence of staff consultation on service development and policy changes - consultation documents, feedback collected, evidence of staff suggestions being implemented." },
  { questionNumber: '28.5', evidence: "Provide staff survey results with analysis, and action plans developed to address concerns or implement suggestions, with evidence of actions completed." },
  { questionNumber: '28.6', evidence: "Provide exit interview process documentation and completed exit interviews with departing staff, with analysis of themes and evidence of actions taken to address retention issues." },
  { questionNumber: '28.7', evidence: "Provide evidence of staff recognition initiatives - employee of the month schemes, thank you notes, achievement celebrations, long service awards, team recognition events." },

  // --------------------------------------------------------------------------
  // Section 29: Conduct & Capability (8 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '29.1', evidence: "Provide evidence of wellbeing support available - wellbeing policy, Employee Assistance Programme (EAP) details, mental health first aiders, counselling services, and how these are communicated to staff." },
  { questionNumber: '29.2', evidence: "Provide stress risk assessments for staff, particularly those in high-pressure roles or experiencing work-related stress, with control measures and support documented." },
  { questionNumber: '29.3', evidence: "Provide evidence of work-life balance promotion - flexible working policy and approved requests, reasonable working hours monitoring, rest break compliance, annual leave uptake." },
  { questionNumber: '29.4', evidence: "Provide evidence of occupational health service access - referral process, referrals made, reasonable adjustments implemented, return to work support provided." },
  { questionNumber: '29.5', evidence: "Provide debriefing records following challenging incidents, safeguarding concerns, or traumatic events, showing support offered to affected staff." },
  { questionNumber: '29.6', evidence: "Provide sickness absence monitoring records, return to work interview forms, absence trigger point tracking, and evidence of support provided for staff with health issues." },
  { questionNumber: '29.7', evidence: "Provide lone working risk assessments and safety measures documentation - check-in procedures, communication devices, emergency protocols for staff working alone (night staff, community workers)." },
  { questionNumber: '29.8', evidence: "Provide evidence of proactive wellbeing initiatives - wellbeing days, team building activities, health promotion campaigns, mental health awareness training, fitness initiatives." },

  // ============================================================================
  // SERVICE USER SECTIONS (1-22) - 174 Questions Total
  // ============================================================================

  // --------------------------------------------------------------------------
  // Section 1: Respecting & Involving People (12 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '1.1', evidence: "Provide care and support files showing individual's views, choices, and preferences documented - include pre-admission assessment, care plans, daily notes, and life history/about me information." },
  { questionNumber: '1.2', evidence: "Provide care plans and daily notes showing how people are encouraged to maintain independence, with their choices and preferences upheld in care delivery." },
  { questionNumber: '1.3', evidence: "Provide staff interview records or supervision notes where staff explain how they respect dignity and privacy - knocking before entering, covering during personal care, using preferred names, closing doors/curtains." },
  { questionNumber: '1.4', evidence: "Provide observation records confirming people are given information in appropriate ways to make decisions about clothing, meals, activities - include evidence of accessible formats used." },
  { questionNumber: '1.5', evidence: "Provide feedback from people (surveys, reviews, interviews) confirming they feel supported by staff to make informed decisions about their care and daily life." },
  { questionNumber: '1.6', evidence: "Provide feedback from people confirming they are supported to maintain relationships, access activities, and engage with the community - include activity records and visitor logs." },
  { questionNumber: '1.7', evidence: "Provide observation records documenting positive and meaningful interactions between staff and people who use the service - quality monitoring reports, supervision observations." },
  { questionNumber: '1.8', evidence: "Provide care and support files showing involvement from the person and/or their representative in writing care plans - signed agreements where able, or evidence of consultation and person-centred content." },
  { questionNumber: '1.9', evidence: "Provide evidence of process for providing documents in other formats - easy read versions, large print, pictorial formats, translations - and records of requests fulfilled." },
  { questionNumber: '1.10', evidence: "Provide evidence that care and support files are accessible to the person and their representatives - file location, access arrangements, and appropriate format provision." },
  { questionNumber: '1.11', evidence: "Provide care and support files demonstrating privacy, dignity, and independence are addressed - personal choices, preferences, and wishes documented beyond just personal care needs." },
  { questionNumber: '1.12', evidence: "Provide feedback from people who use the service (surveys, interviews, reviews) confirming they feel treated with dignity and respect." },

  // --------------------------------------------------------------------------
  // Section 2: Consent (7 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '2.1', evidence: "Provide signed consent forms for all relevant decisions where person has capacity: 24hr care and support, medication, photographs (care and social media), information sharing, restrictive practice (sensors), key holding. N/A if no one in service can consent." },
  { questionNumber: '2.2', evidence: "Where person lacks capacity and has LPA: provide signed consent from relevant LPA (Health & Welfare for care decisions, Property & Finance for financial), plus copy of registered LPA document on file." },
  { questionNumber: '2.3', evidence: "Provide completed mental capacity assessments (decision-specific) and best interest decision records showing collaboration with person, family, advocate, and other relevant professionals." },
  { questionNumber: '2.4', evidence: "Provide DoLS applications, authorisations received, conditions documented, and evidence that least restrictive measures have been considered and conditions are being adhered to." },
  { questionNumber: '2.5', evidence: "Provide DoLS tracking system showing all applications, conditions, review dates, and expiry dates, with evidence of timely renewal applications." },
  { questionNumber: '2.6', evidence: "Provide observation records showing staff obtaining consent from people before providing care or support." },
  { questionNumber: '2.7', evidence: "Provide staff interview records or supervision notes showing staff can describe MCA principles and how they apply them in daily practice." },

  // --------------------------------------------------------------------------
  // Section 3: Care and Welfare (17 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '3.1', evidence: "Provide evidence of appropriate contact details available to people - service user guide or displayed information showing office number, out of hours contact, manager contact details." },
  { questionNumber: '3.2', evidence: "Provide completed pre-admission assessment dated before service commenced, covering all areas of care and support including risks, demonstrating provider can meet the person's needs." },
  { questionNumber: '3.3', evidence: "Provide completed life history/about me document with personal history, important events, family background, work history, hobbies, likes and dislikes." },
  { questionNumber: '3.4', evidence: "Provide relevant care and support plans covering: pain management, sight/hearing/communication, personal care and physical wellbeing, oral care, continence, skin integrity, foot care, nutrition, social interests, religious/cultural/emotional needs, carer and family involvement." },
  { questionNumber: '3.5', evidence: "Provide care and support plans written in strength-based, person-centred language that promotes independence - focusing on what person CAN do, not just deficits." },
  { questionNumber: '3.6', evidence: "Provide care and support plans with individual personalised outcomes - these may be as simple as maintaining independence in activities of daily living." },
  { questionNumber: '3.7', evidence: "Provide completed risk assessments for identified risks with clear actions recorded to mitigate each risk." },
  { questionNumber: '3.8', evidence: "Provide evidence of regular care plan reviews with changes in needs reflected - review dates, changes documented, and updated plans." },
  { questionNumber: '3.9', evidence: "Provide evidence of regular risk assessment reviews with changes reflected. Assessment tools (e.g., MUST) should be reviewed in line with national guidance - at least monthly." },
  { questionNumber: '3.10', evidence: "Provide daily records completed per shift or visit showing continuity of care recording." },
  { questionNumber: '3.11', evidence: "Provide daily entries that are factual, dated, timed, legible, and signed by staff member(s) with their job role(s) identifiable." },
  { questionNumber: '3.12', evidence: "Provide daily entries that give a reflective, person-centred account of care and support delivered and the person's health and wellbeing - not just task lists." },
  { questionNumber: '3.13', evidence: "Provide comprehensively completed intervention charts - food and fluid charts, repositioning charts, pain charts - all signed and dated." },
  { questionNumber: '3.14', evidence: "Provide records showing activity and social interactions are documented in daily notes or activity records." },
  { questionNumber: '3.15', evidence: "Provide documented evidence of involvement from other health and social care professionals - GP visits, district nurse, specialist referrals, correspondence." },
  { questionNumber: '3.16', evidence: "Provide accurately completed DNACPR/ReSPECT document signed by relevant health professional, stored in easily accessible location." },
  { questionNumber: '3.17', evidence: "Provide feedback from people confirming care and support is delivered in a way that meets their needs in line with their personal preferences." },

  // --------------------------------------------------------------------------
  // Section 4: Meeting Nutritional Needs (9 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '4.1', evidence: "Provide menus showing variety, healthy eating choices, and acknowledgement of cultural and personal preferences, with evidence of menu review with residents." },
  { questionNumber: '4.2', evidence: "Provide evidence of sufficient fresh food and fluid supplies available 24 hours - kitchen stock records, fridge/freezer contents, night-time snack availability." },
  { questionNumber: '4.3', evidence: "Provide nutritional support plans documenting food allergies, likes, dislikes, dietary restrictions, and IDDSI texture modifications where required." },
  { questionNumber: '4.4', evidence: "Where required, provide nutritional support plan detailing other dietary advice from dietician, SALT, or other specialists." },
  { questionNumber: '4.5', evidence: "Where required, provide nutritional support plan showing MUST level and specific actions to mitigate nutritional risk." },
  { questionNumber: '4.6', evidence: "Where required, provide accurately completed MUST tool reviewed in line with guidance - at least monthly or following change in need." },
  { questionNumber: '4.7', evidence: "Provide evidence of menu displayed that is visible, accurate, and current - photograph of display or confirmation of location." },
  { questionNumber: '4.8', evidence: "Provide feedback from people confirming personal food and drink requests can be accommodated - flavoured tea, decaffeinated coffee, specific preferences." },
  { questionNumber: '4.9', evidence: "Provide observation records or feedback confirming positive, person-centred mealtime experience - pleasant environment, appropriate assistance, social atmosphere." },

  // --------------------------------------------------------------------------
  // Section 5: Co-operating with Providers (3 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '5.1', evidence: "Where shared care with another provider exists: provide clear documentation of arrangements and processes for timely information sharing." },
  { questionNumber: '5.2', evidence: "Provide Must Do Care Plan/Hospital Passport that is current, accurate, and reflective of person's current needs, ready to accompany person to hospital." },
  { questionNumber: '5.3', evidence: "Provide feedback from people confirming they are supported to access other health and social care services - GP, dentist, optician, hospital appointments." },

  // --------------------------------------------------------------------------
  // Section 6: Safeguarding (14 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '6.1', evidence: "Provide current safeguarding policy that reflects the North Yorkshire multiagency safeguarding policy, with review date." },
  { questionNumber: '6.2', evidence: "Provide safeguarding notification log showing notifications submitted appropriately and within 48 hours, with acknowledgements and outcomes documented." },
  { questionNumber: '6.3', evidence: "Provide accurate, up-to-date risk notification log documenting all incidents, actions taken, and outcomes." },
  { questionNumber: '6.4', evidence: "Provide evidence risk notifications are submitted appropriately and within 48 hours." },
  { questionNumber: '6.5', evidence: "Provide accurate, up-to-date CQC notification log documenting all notifications, actions, and outcomes." },
  { questionNumber: '6.6', evidence: "Provide evidence CQC notifications are submitted appropriately and in a timely manner for all notifiable events." },
  { questionNumber: '6.7', evidence: "Where required, provide completed Herbert Protocol forms with current photograph and key information for people at risk of going missing." },
  { questionNumber: '6.8', evidence: "Provide evidence safeguarding policy and procedure are available to all staff - policy location, staff signatures confirming access and understanding." },
  { questionNumber: '6.9', evidence: "Provide evidence of safeguarding information/poster displayed or available in service with up-to-date contact information for local authority, police, CQC." },
  { questionNumber: '6.10', evidence: "Provide observation records showing staff supporting people to maintain independence and safety during transfers, nutrition and hydration support." },
  { questionNumber: '6.11', evidence: "Provide staff interview records or training evidence showing staff can explain how to identify and prevent abuse and what action to take if abuse is suspected." },
  { questionNumber: '6.12', evidence: "Provide record of DBS status verification for all visiting professionals - chiropodist, hairdresser, entertainers - with dates checked." },
  { questionNumber: '6.13', evidence: "Provide copies of current public liability insurance certificates for all visiting professionals, with expiry dates tracked." },
  { questionNumber: '6.14', evidence: "Provide accurate, up-to-date safeguarding log documenting all concerns, actions taken, outcomes, and lessons learned." },

  // --------------------------------------------------------------------------
  // Section 7: Infection Control (8 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '7.1', evidence: "Provide current Infection Prevention and Control policy and procedure with review date. If concerns about content, refer to IPC team." },
  { questionNumber: '7.2', evidence: "Provide cleaning schedules demonstrating all areas of service are regularly cleaned, with completion signatures." },
  { questionNumber: '7.3', evidence: "Provide effective systems and records showing equipment is cleaned - equipment cleaning logs, decontamination records." },
  { questionNumber: '7.4', evidence: "Provide observation records or audit results confirming environment is clean with no malodours." },
  { questionNumber: '7.5', evidence: "Provide evidence PPE is readily available throughout service and in date - gloves, aprons, masks, hand sanitiser. Include stock records or photographs of PPE stations." },
  { questionNumber: '7.6', evidence: "Provide observation records showing all staff following appropriate IPC measures including food handling and hand hygiene before and after meals." },
  { questionNumber: '7.7', evidence: "Provide staff interview records or training evidence showing staff can explain how to prevent and control spread of infection." },
  { questionNumber: '7.8', evidence: "Provide staff interview records or training evidence showing staff can explain safe waste disposal procedures." },

  // --------------------------------------------------------------------------
  // Section 8: Management of Medicine (22 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '8.1', evidence: "Provide current Medication Policy and procedure with review date, covering all aspects of medication management." },
  { questionNumber: '8.2', evidence: "Provide systems for monitoring medication stock levels and expiry dates - stock check records, expiry date tracking." },
  { questionNumber: '8.3', evidence: "Where homely remedies are held: provide stock record and generic risk assessment determining range of medicines held." },
  { questionNumber: '8.4', evidence: "Provide process documentation showing how current medication prescription is confirmed for new people to the service - GP confirmation, MAR chart verification." },
  { questionNumber: '8.5', evidence: "Provide observation records showing staff handling medicines safely, securely, and appropriately." },
  { questionNumber: '8.6', evidence: "Provide staff interview records showing staff can explain actions to take in event of medication error - minimum: report as RNR/Safeguarding, seek medical attention." },
  { questionNumber: '8.7', evidence: "Provide staff interview records showing staff can explain where to access medicine information - BNF, patient information leaflets, pharmacist advice." },
  { questionNumber: '8.8', evidence: "Provide up-to-date medication training certificates for all staff responsible for administering medication." },
  { questionNumber: '8.9', evidence: "Provide up-to-date medication competency assessments for all staff administering medication, including cream administration and CD witnessing. Assessor must have current training and competency, assessed by senior staff or Registered Manager." },
  { questionNumber: '8.10', evidence: "Provide evidence medication trolley is locked and securely tethered when not in use - photograph or observation record." },
  { questionNumber: '8.11', evidence: "Provide evidence controlled drugs are stored in line with Misuse of Drugs Act 1971 - locked cabinet within locked cabinet, CD register." },
  { questionNumber: '8.12', evidence: "Provide evidence topical medication is stored appropriately, separate from ingestible medications." },
  { questionNumber: '8.13', evidence: "Provide documented temperature checks for medication refrigerator - minimum daily checks, temperatures between 2-8 degrees, actions recorded when out of range." },
  { questionNumber: '8.14', evidence: "Provide evidence all medication is stored per manufacturer's instructions - refrigeration where required, away from heat/light." },
  { questionNumber: '8.15', evidence: "Provide evidence no food or biological items are stored in medication-only refrigerator - photograph or audit record." },
  { questionNumber: '8.16', evidence: "Provide temperature checks for designated medication room/storage area with actions taken if above 25 degrees." },
  { questionNumber: '8.17', evidence: "Provide separate, bound controlled drug register with accurate, legible recording - stock balances, administration records, witness signatures." },
  { questionNumber: '8.18', evidence: "Provide accurate, legible Medication Administration Records including TMAR (topical MAR) with no gaps or unexplained omissions." },
  { questionNumber: '8.19', evidence: "Provide current signature list of all staff who administer medication, covering EMARS, CDs, and TMARS." },
  { questionNumber: '8.20', evidence: "Provide documented self-medication assessment process for people who can and wish to safely self-administer, including risk assessment and storage arrangements." },
  { questionNumber: '8.21', evidence: "Provide person-centred PRN protocols and procedures including administration guidance, effectiveness monitoring, and review process." },
  { questionNumber: '8.22', evidence: "Provide covert medication protocols with documented input from relevant medical professionals - GP, pharmacist advice on crushing/administration." },

  // --------------------------------------------------------------------------
  // Section 9: Safety of Premises (24 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '9.1', evidence: "Provide COSHH register, risk assessments, and safety data sheets for all hazardous substances stored and used in the service." },
  { questionNumber: '9.2', evidence: "Provide programme of refurbishment and planned maintenance for the whole service, with evidence schedule is being adhered to." },
  { questionNumber: '9.3', evidence: "Provide record of identified urgent maintenance/repairs with evidence they are acted upon in a timely manner." },
  { questionNumber: '9.4', evidence: "Provide fire procedure documentation and evidence of clear, visible signage advising actions to take in event of fire." },
  { questionNumber: '9.5', evidence: "Provide evidence of appropriate signage or mechanisms to meet needs of people using the service - dementia-friendly signage, sensory impairment aids. Dementia-friendly applies where people have cognitive impairment, not just dementia specialism." },
  { questionNumber: '9.6', evidence: "Provide signing in book or digital alternative, plus evidence of appropriate security checks for all visitors." },
  { questionNumber: '9.7', evidence: "Provide evidence of appropriate, regularly reviewed security measures for service access - door codes, fobs, swipe cards, key safes." },
  { questionNumber: '9.8', evidence: "Provide evidence staff have appropriate identification - name badges, uniform. Where badges cannot be worn, provide alternative ID verification process for assessments." },
  { questionNumber: '9.9', evidence: "Where CCTV is used in communal areas, provide evidence of appropriate signage in place." },
  { questionNumber: '9.10', evidence: "Provide record of annual externally validated fire extinguisher checks with certificates." },
  { questionNumber: '9.11', evidence: "Provide record of monthly internally completed fire extinguisher checks." },
  { questionNumber: '9.12', evidence: "Provide record of externally validated emergency lighting checks with certificates." },
  { questionNumber: '9.13', evidence: "Provide external annual fire risk assessment with completion date and assessor details." },
  { questionNumber: '9.14', evidence: "Provide record of monthly internally completed emergency lighting checks." },
  { questionNumber: '9.15', evidence: "Provide record of 6-monthly fire evacuations/fire drills including night-time drills, with evacuation times and lessons learned." },
  { questionNumber: '9.16', evidence: "Provide record of weekly fire alarm checks with dates and outcomes." },
  { questionNumber: '9.17', evidence: "Provide evidence fire marshals are in place on each shift and clearly identified in the service - rota, signage, training records." },
  { questionNumber: '9.18', evidence: "Provide fire risk assessment action plan showing identified actions and evidence of completion." },
  { questionNumber: '9.19', evidence: "Provide annual external fire detection and alarm system inspection certificate with service date." },
  { questionNumber: '9.20', evidence: "Provide in-date electrical safety certificate (EICR) valid for 5 years." },
  { questionNumber: '9.21', evidence: "Provide annual in-date gas safety certificate." },
  { questionNumber: '9.22', evidence: "Provide up-to-date Legionella risk assessment certificate and water management records." },
  { questionNumber: '9.23', evidence: "Provide premises and environment risk assessments including any adaptations, with identified actions completed. For home-based support, include environmental risk assessment." },
  { questionNumber: '9.24', evidence: "Provide evidence of monthly window restrictor checks with dates and outcomes." },

  // --------------------------------------------------------------------------
  // Section 10: Safety of Equipment (7 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '10.1', evidence: "Provide documented evidence of appropriate equipment testing - PAT testing records, LOLER certificates for hoists. For home-based support, provide equipment record with supplier details and service dates." },
  { questionNumber: '10.2', evidence: "Where equipment is prescribed by qualified professional for an individual, provide evidence it is available and clearly identifiable as belonging to that person." },
  { questionNumber: '10.3', evidence: "Provide equipment calibration records for weighing scales, temperature probes, and other measuring equipment." },
  { questionNumber: '10.4', evidence: "Provide maintenance schedule for equipment in use - mattresses, pressure cushions, bed rails, assistive technology - with service records." },
  { questionNumber: '10.5', evidence: "Provide evidence equipment is stored appropriately, safely, and in line with manufacturer's instructions." },
  { questionNumber: '10.6', evidence: "Provide observation records showing staff completing visual safety and cleanliness checks on equipment prior to use." },
  { questionNumber: '10.7', evidence: "Provide observation records showing staff using equipment safely and appropriately." },

  // --------------------------------------------------------------------------
  // Section 14: Quality Monitoring (10 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '14.1', evidence: "Provide business continuity plan that manages unexpected events, with evidence of regular review and testing - practical scenarios or simulated activities." },
  { questionNumber: '14.2', evidence: "Provide evidence that lessons learned from incidents, complaints, and audits have been shared with relevant people - meeting minutes, memos, training updates." },
  { questionNumber: '14.3', evidence: "Provide evidence of food hygiene rating certificate displayed - photograph or confirmation of display location." },
  { questionNumber: '14.4', evidence: "Provide mechanisms for obtaining feedback from people, staff, professionals, and family members - surveys, feedback forms, meetings." },
  { questionNumber: '14.5', evidence: "Provide evidence feedback is analysed and acted upon - 'You Said We Did' documentation, action plans, improvements made." },
  { questionNumber: '14.6', evidence: "Provide documented evidence of planned meetings held with appropriate actions taken and minutes circulated to all parties." },
  { questionNumber: '14.7', evidence: "Provide documented audit schedule clearly identifying frequency of audits undertaken." },
  { questionNumber: '14.8', evidence: "Provide evidence of completed audits contributing to service development: care plans, medicines, daily notes, intervention charts, staff files, finances, infection control, health and safety, weight analysis, skin integrity, kitchen/catering, dining experience, manager walkabout, night visits, call bell analysis, missed/late calls, senior manager QA audit, dignity audit, NMC checks, driving licence and insurance checks." },
  { questionNumber: '14.9', evidence: "Provide action plans for all identified improvement areas showing: action to be completed, responsible person, timescale, and sign-off when completed." },
  { questionNumber: '14.10', evidence: "Provide evidence accidents and incidents are escalated appropriately with actions taken and trends identified and addressed." },

  // --------------------------------------------------------------------------
  // Section 15: Complaints (6 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '15.1', evidence: "Provide Complaints Policy that is accessible to people who use the service - easy read version, displayed location, available on request." },
  { questionNumber: '15.2', evidence: "Provide evidence of information displayed or available showing how to raise complaints with up-to-date contact details for Provider, Local Authority, CQC, and Local Government Ombudsman." },
  { questionNumber: '15.3', evidence: "Provide evidence complaints are dealt with in line with policy - acknowledgement timescales, investigation records, response timescales." },
  { questionNumber: '15.4', evidence: "Provide accurate, up-to-date complaints log documenting actions, outcomes, and lessons learned for each complaint." },
  { questionNumber: '15.5', evidence: "Provide evidence of process for supporting people to access advocacy services when required - Cloverleaf, Citizens Advice Bureau, Age UK, solicitors." },
  { questionNumber: '15.6', evidence: "Provide feedback from people confirming they are aware of how to complain or raise a concern." },

  // --------------------------------------------------------------------------
  // Section 16: Records (7 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '16.1', evidence: "Provide evidence staff have undertaken GDPR and confidentiality training, recommended to be refreshed every 2 years - training certificates, matrix." },
  { questionNumber: '16.2', evidence: "Provide evidence all documentation (electronic and hard copy) is held securely in line with Data Protection and GDPR - locked cabinets, password protection, access controls." },
  { questionNumber: '16.3', evidence: "Provide evidence all documentation remains confidential in line with Data Protection and GDPR - confidentiality policy, secure disposal, access restrictions." },
  { questionNumber: '16.4', evidence: "Provide up-to-date policies and procedures for handling people's money." },
  { questionNumber: '16.5', evidence: "Provide individual financial transaction records for each person with receipts, signed by two people where possible." },
  { questionNumber: '16.6', evidence: "Provide evidence all personal monies are stored securely and not pooled with others' money or business funds." },
  { questionNumber: '16.7', evidence: "Provide financial records that are legible, signed, and dated by the relevant person." },

  // --------------------------------------------------------------------------
  // Section 17: Financial Management (5 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '17.1', evidence: "Provide audit of financial records, receipts, authorizations, and safeguarding of service user money. Include policies and procedures for handling finances." },
  { questionNumber: '17.2', evidence: "Provide evidence service user money is kept secure and separate from business funds - separate accounts, secure storage." },
  { questionNumber: '17.3', evidence: "Provide evidence of regular audits of service user finances with documentation of findings and actions." },
  { questionNumber: '17.4', evidence: "Provide evidence staff are trained in financial safeguarding and handling of service user money - training records, competency assessments." },
  { questionNumber: '17.5', evidence: "Provide evidence service users and families are involved in financial decisions where appropriate - consent forms, meeting records, care plan documentation." },

  // --------------------------------------------------------------------------
  // Section 18: Activities and Engagement (5 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '18.1', evidence: "Provide activity programmes, individual preferences documentation, participation records, and community involvement evidence. Show activities promote wellbeing and independence." },
  { questionNumber: '18.2', evidence: "Provide evidence service users are consulted about activities and preferences are recorded in care plans or activity assessments." },
  { questionNumber: '18.3', evidence: "Provide evidence activities are accessible and adapted to meet individual needs and abilities - adapted equipment, 1:1 support, sensory activities." },
  { questionNumber: '18.4', evidence: "Provide evidence community engagement and external activities are facilitated where appropriate - outings, visitors, community links." },
  { questionNumber: '18.5', evidence: "Provide evidence activity participation is monitored and reviewed regularly - participation records, care plan reviews, feedback." },

  // --------------------------------------------------------------------------
  // Section 19: End of Life Care (5 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '19.1', evidence: "Provide advance care planning documentation, pain management records, family involvement evidence, and dignity in dying protocols. Include staff training and support records." },
  { questionNumber: '19.2', evidence: "Provide evidence pain and symptom management is effective and regularly assessed - pain charts, medication reviews, comfort assessments." },
  { questionNumber: '19.3', evidence: "Provide evidence family and loved ones are involved and supported throughout end of life care - meeting records, communication logs, support offered." },
  { questionNumber: '19.4', evidence: "Provide evidence staff are trained in end of life care and receive appropriate support - training certificates, supervision records, debriefing." },
  { questionNumber: '19.5', evidence: "Provide evidence dignity, respect, and person-centred care are maintained throughout end of life - care plans, daily records, feedback from families." },

  // --------------------------------------------------------------------------
  // Section 20: Mental Health Support (5 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '20.1', evidence: "Provide mental health assessments, support plans, evidence of access to specialist services, and staff awareness training. Show person-centred mental health care approach." },
  { questionNumber: '20.2', evidence: "Provide evidence service users have access to appropriate mental health specialist services - referral records, appointments, specialist input." },
  { questionNumber: '20.3', evidence: "Provide evidence staff are trained to recognise and respond to mental health needs - training records, competency assessments." },
  { questionNumber: '20.4', evidence: "Provide evidence mental health support is person-centred and promotes recovery and wellbeing - care plans, support strategies, outcome monitoring." },
  { questionNumber: '20.5', evidence: "Provide evidence mental health is monitored and reviewed regularly with appropriate interventions - review records, care plan updates, referrals." },

  // --------------------------------------------------------------------------
  // Section 21: Equality and Diversity (5 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '21.1', evidence: "Provide policies, staff training records, and practice evidence around protected characteristics. Show inclusive care respecting cultural, religious, and personal preferences." },
  { questionNumber: '21.2', evidence: "Provide care plans reflecting and respecting individual cultural, religious, and personal preferences - dietary needs, religious observance, cultural practices." },
  { questionNumber: '21.3', evidence: "Provide evidence staff demonstrate understanding and respect for diversity in their practice - supervision records, observations, training." },
  { questionNumber: '21.4', evidence: "Provide evidence the service actively promotes equality and challenges discrimination - policies, incident records, staff training." },
  { questionNumber: '21.5', evidence: "Provide feedback from service users and families confirming their diversity is respected and valued." },

  // --------------------------------------------------------------------------
  // Section 22: Governance and Leadership (3 questions)
  // --------------------------------------------------------------------------
  { questionNumber: '22.1', evidence: "Provide evidence of management oversight, governance meetings, accountability frameworks, and leadership quality. Confirm registered manager presence and oversight." },
  { questionNumber: '22.2', evidence: "Provide evidence registered manager is present, visible, and provides effective leadership - time on site, accessibility, staff feedback." },
  { questionNumber: '22.3', evidence: "Provide evidence quality assurance systems are in place and effective - audit schedule, action plans, improvement evidence." },
];

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

async function updateEvidenceGuidance() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.error('Usage: DATABASE_URL="your-connection-string" node scripts/update-evidence-guidance.mjs');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);
  
  console.log(`Starting evidence guidance update for ${evidenceUpdates.length} questions...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  const notFoundQuestions = [];
  
  for (const update of evidenceUpdates) {
    try {
      const [result] = await connection.execute(
        `UPDATE complianceQuestions 
         SET exampleEvidence = ? 
         WHERE questionNumber = ?`,
        [update.evidence, update.questionNumber]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✓ Updated Q${update.questionNumber}`);
        successCount++;
      } else {
        console.log(`⚠ No match found for Q${update.questionNumber}`);
        notFoundQuestions.push(update.questionNumber);
        notFoundCount++;
      }
    } catch (err) {
      console.error(`✗ Error updating Q${update.questionNumber}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Update complete!`);
  console.log(`Successfully updated: ${successCount} questions`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total in script: ${evidenceUpdates.length}`);
  console.log(`========================================\n`);
  
  if (notFoundQuestions.length > 0) {
    console.log('Questions not found in database:');
    console.log(notFoundQuestions.join(', '));
    console.log('');
  }
  
  // Verify database counts
  console.log('Verifying database counts...');
  const [totalCount] = await connection.execute(
    `SELECT COUNT(*) as count FROM complianceQuestions`
  );
  const [serviceUserCount] = await connection.execute(
    `SELECT COUNT(*) as count FROM complianceQuestions cq 
     JOIN complianceSections cs ON cq.sectionId = cs.id 
     WHERE cs.sectionType = 'service_user'`
  );
  const [staffCount] = await connection.execute(
    `SELECT COUNT(*) as count FROM complianceQuestions cq 
     JOIN complianceSections cs ON cq.sectionId = cs.id 
     WHERE cs.sectionType = 'staff'`
  );
  
  console.log(`Total questions in DB: ${totalCount[0].count}`);
  console.log(`Service User questions: ${serviceUserCount[0].count}`);
  console.log(`Staff questions: ${staffCount[0].count}`);
  
  await connection.end();
  console.log('\nDatabase connection closed.');
}

updateEvidenceGuidance().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
