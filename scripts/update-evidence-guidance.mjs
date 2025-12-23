#!/usr/bin/env node
/**
 * Update Evidence Guidance Script
 * 
 * This script updates all 256 compliance questions with the correct "How to Evidence" guidance.
 * Run this from your Codespace to update the production database.
 * 
 * Usage: DATABASE_URL="your-connection-string" node scripts/update-evidence-guidance.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Evidence guidance mappings - using questionNumber only (unique across database)
const evidenceUpdates = [
  // ==========================================
  // SERVICE USER SECTIONS (Questions 1.x - 22.x)
  // ==========================================
  
  // Section 1: Respecting & Involving People (12 questions)
  { questionNumber: '1.1', evidence: "This can be evidenced by providing Care Plan entries showing the person's views, choices, and preferences. Include Pre-admission Assessment, Life History/About Me document, and any documented conversations with the person or their representatives." },
  { questionNumber: '1.2', evidence: "This can be evidenced by showing Care Plan entries detailing what the person can do independently, goals for maintaining independence, and Daily Notes demonstrating staff encouraged independence rather than doing tasks for the person." },
  { questionNumber: '1.3', evidence: "This can be evidenced by staff interview records or supervision notes where staff articulate how they protect dignity (knocking before entering, covering during personal care, using preferred names). Include dignity training records." },
  { questionNumber: '1.4', evidence: "This can be evidenced by Care Plans showing information given in accessible formats, communication passports, and evidence of using appropriate methods (large print, pictures, easy read) based on individual needs." },
  { questionNumber: '1.5', evidence: "This can be evidenced by feedback forms, resident meeting minutes, or survey responses where people confirm they feel supported. Include Care Plan reviews showing person's input." },
  { questionNumber: '1.6', evidence: "This can be evidenced by Activity Plans, Daily Notes recording participation in activities, visitor records, and evidence of supporting family contact (phone calls, video calls, visits)." },
  { questionNumber: '1.7', evidence: "This can be evidenced by observation records, quality monitoring reports, or supervision notes documenting positive interactions between staff and residents." },
  { questionNumber: '1.8', evidence: "This can be evidenced by Care Plan signature pages showing involvement from the person and/or their representatives, dated entries showing collaborative reviews." },
  { questionNumber: '1.9', evidence: "This can be evidenced by providing your Subject Access Request (SAR) policy, records of SAR requests handled, and evidence of information sharing protocols." },
  { questionNumber: '1.10', evidence: "This can be evidenced by showing how care files are stored accessibly (not locked away from person), evidence person can access their records, and policy on record access." },
  { questionNumber: '1.11', evidence: "This can be evidenced by showing Care Plan entries detailing what the person can do independently, privacy preferences documented, and how dignity is maintained during care delivery." },
  { questionNumber: '1.12', evidence: "This can be evidenced by resident satisfaction surveys, feedback forms, complaints records (or lack thereof), and quality assurance monitoring showing dignity is maintained." },

  // Section 2: Consent (7 questions)
  { questionNumber: '2.1', evidence: "This can be evidenced by signed consent forms for care delivery, medication, photographs, information sharing, and other relevant decisions. Forms should be dated and witnessed." },
  { questionNumber: '2.2', evidence: "This can be evidenced by LPA documentation on file, evidence of consulting LPA for relevant decisions, and records showing LPA involvement in care planning." },
  { questionNumber: '2.3', evidence: "This can be evidenced by completed Mental Capacity Assessments (decision-specific), Best Interest Decision records, and evidence of involving relevant parties in best interest meetings." },
  { questionNumber: '2.4', evidence: "This can be evidenced by DoLS applications submitted, authorisations received, conditions documented, and evidence of least restrictive practice being applied." },
  { questionNumber: '2.5', evidence: "This can be evidenced by DoLS tracker/log showing all applications, conditions, review dates, and expiry dates. Include evidence of timely renewals." },
  { questionNumber: '2.6', evidence: "This can be evidenced by observation records showing staff seeking consent before care tasks, documented in Daily Notes or supervision observations." },
  { questionNumber: '2.7', evidence: "This can be evidenced by staff interview records, supervision notes, or training records showing staff understanding of MCA principles and application in practice." },

  // Section 3: Care and Welfare (17 questions)
  { questionNumber: '3.1', evidence: "This can be evidenced by providing the person's care file showing provider contact details (office number, emergency number, manager contact), displayed in an accessible format." },
  { questionNumber: '3.2', evidence: "This can be evidenced by completed Pre-admission Assessment covering health needs, social needs, preferences, risks, and capacity. Should be dated before admission." },
  { questionNumber: '3.3', evidence: "This can be evidenced by providing completed Life History/About Me document with personal history, important events, family, work history, hobbies, likes/dislikes." },
  { questionNumber: '3.4', evidence: "This can be evidenced by providing Care Plans covering all identified needs: personal care, mobility, nutrition, medication, skin integrity, continence, mental health, communication, social needs." },
  { questionNumber: '3.5', evidence: "This can be evidenced by Care Plans written in strength-based language (what person CAN do, not just deficits), person-centred goals, and evidence of promoting independence." },
  { questionNumber: '3.6', evidence: "This can be evidenced by Care Plans containing SMART outcomes (Specific, Measurable, Achievable, Relevant, Time-bound) personalised to the individual, with progress reviews documented." },
  { questionNumber: '3.7', evidence: "This can be evidenced by providing completed Risk Assessments for identified risks (falls, pressure areas, nutrition, moving & handling, behaviour, choking) with clear control measures." },
  { questionNumber: '3.8', evidence: "This can be evidenced by Care Plan review records showing regular reviews (monthly or when needs change), with changes documented and signed." },
  { questionNumber: '3.9', evidence: "This can be evidenced by Risk Assessment review records showing regular reviews, updates when risks change, and clear audit trail of changes." },
  { questionNumber: '3.10', evidence: "This can be evidenced by Daily Notes completed each shift/visit, showing continuity of care recording and handover information." },
  { questionNumber: '3.11', evidence: "This can be evidenced by Daily Notes that are factual (not opinion), dated, timed, legible, and signed with staff name/initials clearly identifiable." },
  { questionNumber: '3.12', evidence: "This can be evidenced by Daily Notes providing meaningful account of care delivered, person's wellbeing, any concerns, and outcomes rather than just task completion." },
  { questionNumber: '3.13', evidence: "This can be evidenced by completed intervention charts (turning charts, food/fluid charts, bowel charts, blood glucose monitoring) that are fully completed, signed, and dated." },
  { questionNumber: '3.14', evidence: "This can be evidenced by Activity records, Daily Notes recording social interactions, and evidence of meaningful engagement documented." },
  { questionNumber: '3.15', evidence: "This can be evidenced by records of GP visits, district nurse involvement, specialist referrals, and correspondence with other health/social care professionals." },
  { questionNumber: '3.16', evidence: "This can be evidenced by completed DNACPR/ReSPECT form signed by appropriate clinician, with evidence of discussion with person/family documented." },
  { questionNumber: '3.17', evidence: "This can be evidenced by resident satisfaction surveys, feedback forms, and care reviews where the person confirms their needs are being met." },

  // Section 4: Meeting Nutritional Needs (9 questions)
  { questionNumber: '4.1', evidence: "This can be evidenced by providing menus showing variety, healthy options, cultural/religious choices, and how special diets are accommodated. Include evidence menu is reviewed with residents." },
  { questionNumber: '4.2', evidence: "This can be evidenced by kitchen stock records, fridge/freezer temperature logs, and evidence of 24-hour food availability (snacks, drinks, night-time options)." },
  { questionNumber: '4.3', evidence: "This can be evidenced by Nutritional Care Plans documenting allergies, likes/dislikes, dietary requirements, texture modifications, and any dietitian recommendations." },
  { questionNumber: '4.4', evidence: "This can be evidenced by Nutritional Care Plans containing specific dietary advice (diabetic diet, low sodium, high protein, fortified diet) with clear instructions for staff." },
  { questionNumber: '4.5', evidence: "This can be evidenced by Nutritional Care Plans showing MUST score, risk level, and specific actions to be taken (fortification, supplements, referral to dietitian, increased monitoring)." },
  { questionNumber: '4.6', evidence: "This can be evidenced by completed MUST assessments with accurate height, weight, BMI calculation, weight loss percentage, and acute disease effect score. Show monthly reviews." },
  { questionNumber: '4.7', evidence: "This can be evidenced by photographs of displayed menu, evidence menu is updated daily/weekly, and menu is in accessible format (large print, pictures if needed)." },
  { questionNumber: '4.8', evidence: "This can be evidenced by resident feedback, food request records, and evidence of accommodating individual requests (specific brands, preparation preferences, timing of meals)." },
  { questionNumber: '4.9', evidence: "This can be evidenced by mealtime observation records showing pleasant environment, appropriate assistance, social atmosphere, and person-centred approach to dining." },

  // Section 5: Co-operating with Providers (3 questions)
  { questionNumber: '5.1', evidence: "This can be evidenced by providing Memorandums of Understanding (MoU) or service agreements with other providers, clear documentation of shared care responsibilities." },
  { questionNumber: '5.2', evidence: "This can be evidenced by completed Hospital Passport/Must Do Care Plan that is current, accurate, and ready to accompany person to hospital." },
  { questionNumber: '5.3', evidence: "This can be evidenced by appointment records, referral letters, and feedback from people confirming they're supported to access GP, dentist, optician, hospital, and other services." },

  // Section 6: Safeguarding (14 questions)
  { questionNumber: '6.1', evidence: "This can be evidenced by providing current Safeguarding Policy aligned with local multiagency procedures, with evidence of regular review and staff awareness." },
  { questionNumber: '6.2', evidence: "This can be evidenced by safeguarding notification log showing timely submissions (within 48 hours), acknowledgements received, and outcomes documented." },
  { questionNumber: '6.3', evidence: "This can be evidenced by Risk Notification log with all incidents recorded, actions taken, outcomes documented, and evidence of learning from incidents." },
  { questionNumber: '6.4', evidence: "This can be evidenced by risk notification records showing timely submissions (within 48 hours), with evidence of appropriate escalation." },
  { questionNumber: '6.5', evidence: "This can be evidenced by CQC notification log showing all required notifications, dates submitted, and outcomes/responses received." },
  { questionNumber: '6.6', evidence: "This can be evidenced by CQC notification records showing timely submissions for deaths, serious injuries, safeguarding, DoLS, and other notifiable events." },
  { questionNumber: '6.7', evidence: "This can be evidenced by completed Herbert Protocol forms for people at risk of going missing, with current photographs and key information." },
  { questionNumber: '6.8', evidence: "This can be evidenced by showing policy location (physical and digital), staff signatures confirming they've read it, and evidence of policy being discussed in training/supervision." },
  { questionNumber: '6.9', evidence: "This can be evidenced by photographs of safeguarding poster displayed, showing current contact numbers for local authority, police, CQC." },
  { questionNumber: '6.10', evidence: "This can be evidenced by observation records, spot checks, or supervision notes documenting safe practice during transfers, nutrition support, and other care activities." },
  { questionNumber: '6.11', evidence: "This can be evidenced by staff interview records or supervision notes showing staff can identify abuse types, know reporting procedures, and understand whistleblowing policy." },
  { questionNumber: '6.12', evidence: "This can be evidenced by visitor log showing DBS check status verified for all visiting professionals, with dates checked and by whom." },
  { questionNumber: '6.13', evidence: "This can be evidenced by copies of public liability insurance certificates on file for all visiting professionals, with expiry dates tracked." },
  { questionNumber: '6.14', evidence: "This can be evidenced by safeguarding log showing all concerns raised, actions taken, referrals made, outcomes, and lessons learned." },

  // Section 7: Infection Control (8 questions)
  { questionNumber: '7.1', evidence: "This can be evidenced by current IPC Policy with review date, aligned with national guidance, and evidence of staff training on the policy." },
  { questionNumber: '7.2', evidence: "This can be evidenced by cleaning schedules for all areas, signed when completed, with evidence of deep cleaning schedules and audits." },
  { questionNumber: '7.3', evidence: "This can be evidenced by equipment cleaning logs, decontamination records, and evidence of single-use items being disposed of correctly." },
  { questionNumber: '7.4', evidence: "This can be evidenced by environmental audit records, cleaning audit results, and absence of odour complaints or concerns raised." },
  { questionNumber: '7.5', evidence: "This can be evidenced by PPE stock records, evidence of PPE stations throughout the building, and in-date supplies available." },
  { questionNumber: '7.6', evidence: "This can be evidenced by observation records, hand hygiene audits, and supervision notes documenting correct IPC practice." },
  { questionNumber: '7.7', evidence: "This can be evidenced by staff interview records or training records showing understanding of infection control principles and practices." },
  { questionNumber: '7.8', evidence: "This can be evidenced by waste management policy, evidence of correct waste segregation, and staff understanding of clinical waste disposal." },

  // Section 8: Management of Medicine (12 questions)
  { questionNumber: '8.1', evidence: "This can be evidenced by current Medication Policy with review date, covering all aspects of medication management including ordering, storage, administration, disposal." },
  { questionNumber: '8.2', evidence: "This can be evidenced by stock control records, medication audit results, and evidence of checking expiry dates regularly." },
  { questionNumber: '8.3', evidence: "This can be evidenced by MAR charts showing all prescribed medications, with clear instructions, and evidence of accurate recording." },
  { questionNumber: '8.4', evidence: "This can be evidenced by completed MAR charts with no gaps, correct codes used for non-administration, and staff signatures." },
  { questionNumber: '8.5', evidence: "This can be evidenced by PRN protocols for each PRN medication, showing when to give, maximum doses, and effectiveness monitoring." },
  { questionNumber: '8.6', evidence: "This can be evidenced by PRN administration records showing reason given, dose, time, effectiveness review, and within maximum limits." },
  { questionNumber: '8.7', evidence: "This can be evidenced by controlled drug register, stock checks, witness signatures, and secure storage evidence." },
  { questionNumber: '8.8', evidence: "This can be evidenced by medication competency assessments for all staff administering medication, with regular reassessment." },
  { questionNumber: '8.9', evidence: "This can be evidenced by medication audit results, error reporting records, and evidence of learning from medication incidents." },
  { questionNumber: '8.10', evidence: "This can be evidenced by medication storage audit showing correct temperatures, secure storage, separation of internal/external medications." },
  { questionNumber: '8.11', evidence: "This can be evidenced by fridge temperature logs checked daily, action taken when out of range, and calibrated thermometer used." },
  { questionNumber: '8.12', evidence: "This can be evidenced by covert medication policy, best interest decisions documented, and pharmacist advice on crushing/opening medications." },

  // Section 9: Safety of Premises (6 questions)
  { questionNumber: '9.1', evidence: "This can be evidenced by maintenance schedules, repair logs, and evidence of prompt action on maintenance issues reported." },
  { questionNumber: '9.2', evidence: "This can be evidenced by fire risk assessment (reviewed annually), fire safety equipment checks, and evidence of remedial actions completed." },
  { questionNumber: '9.3', evidence: "This can be evidenced by weekly fire alarm test records, monthly emergency lighting tests, and annual fire extinguisher servicing certificates." },
  { questionNumber: '9.4', evidence: "This can be evidenced by fire drill records (at least 6-monthly), including night drill, with evacuation times and lessons learned documented." },
  { questionNumber: '9.5', evidence: "This can be evidenced by Personal Emergency Evacuation Plans (PEEPs) for each resident, reviewed when mobility changes, and staff awareness confirmed." },
  { questionNumber: '9.6', evidence: "This can be evidenced by legionella risk assessment, water temperature monitoring records, and flushing schedules for low-use outlets." },

  // Section 10: Safety of Equipment (7 questions)
  { questionNumber: '10.1', evidence: "This can be evidenced by equipment inventory, service schedules, and evidence of regular maintenance for all care equipment." },
  { questionNumber: '10.2', evidence: "This can be evidenced by hoist service records (LOLER - 6 monthly), sling checks, and staff competency assessments for hoist use." },
  { questionNumber: '10.3', evidence: "This can be evidenced by bed and mattress checks, pressure-relieving equipment service records, and evidence of appropriate equipment for needs." },
  { questionNumber: '10.4', evidence: "This can be evidenced by wheelchair and mobility aid checks, maintenance records, and evidence of appropriate equipment for individual needs." },
  { questionNumber: '10.5', evidence: "This can be evidenced by bathing equipment service records, bath hoist LOLER certificates, and evidence of safe bathing arrangements." },
  { questionNumber: '10.6', evidence: "This can be evidenced by medical device checks (blood glucose monitors, oxygen concentrators), calibration records, and staff training evidence." },
  { questionNumber: '10.7', evidence: "This can be evidenced by equipment fault reporting system, evidence of prompt repairs/replacements, and out-of-service procedures." },

  // Section 14: Quality Monitoring (10 questions)
  { questionNumber: '14.1', evidence: "This can be evidenced by quality assurance framework/policy, audit schedule, and evidence of systematic quality monitoring." },
  { questionNumber: '14.2', evidence: "This can be evidenced by completed internal audits (medication, care plans, infection control), findings documented, and actions tracked." },
  { questionNumber: '14.3', evidence: "This can be evidenced by action plans from audits showing issues identified, actions taken, responsible persons, and completion dates." },
  { questionNumber: '14.4', evidence: "This can be evidenced by resident satisfaction surveys, analysis of results, and evidence of actions taken in response to feedback." },
  { questionNumber: '14.5', evidence: "This can be evidenced by relative/visitor feedback mechanisms, responses documented, and evidence of service improvements made." },
  { questionNumber: '14.6', evidence: "This can be evidenced by quality improvement plans, evidence of continuous improvement initiatives, and outcomes measured." },
  { questionNumber: '14.7', evidence: "This can be evidenced by benchmarking data, comparison with sector standards, and evidence of using data to drive improvement." },
  { questionNumber: '14.8', evidence: "This can be evidenced by governance meeting minutes, quality reports to management/board, and evidence of oversight." },
  { questionNumber: '14.9', evidence: "This can be evidenced by CQC rating displayed, inspection report available, and evidence of actions taken on any recommendations." },
  { questionNumber: '14.10', evidence: "This can be evidenced by key performance indicators tracked, trend analysis, and evidence of using data to improve outcomes." },

  // Section 15: Complaints (6 questions)
  { questionNumber: '15.1', evidence: "This can be evidenced by complaints policy accessible to residents/families, displayed information on how to complain, and easy-read version available." },
  { questionNumber: '15.2', evidence: "This can be evidenced by complaints log showing all complaints received, dates, nature of complaint, and acknowledgement within timescales." },
  { questionNumber: '15.3', evidence: "This can be evidenced by investigation records for each complaint, findings documented, and evidence of thorough investigation." },
  { questionNumber: '15.4', evidence: "This can be evidenced by complaint response letters, evidence of resolution within timescales, and complainant satisfaction recorded." },
  { questionNumber: '15.5', evidence: "This can be evidenced by complaints analysis reports, themes identified, and evidence of service improvements resulting from complaints." },
  { questionNumber: '15.6', evidence: "This can be evidenced by information provided about escalation routes (Local Authority, Ombudsman, CQC), and advocacy services available." },

  // Section 16: Records (7 questions)
  { questionNumber: '16.1', evidence: "This can be evidenced by records management policy, retention schedules, and evidence of secure storage (locked cabinets, password-protected systems)." },
  { questionNumber: '16.2', evidence: "This can be evidenced by care records that are legible, dated, timed, signed, and written in ink (or electronic equivalent)." },
  { questionNumber: '16.3', evidence: "This can be evidenced by evidence of accurate, contemporaneous recording, with corrections made appropriately (single line through, dated, initialled)." },
  { questionNumber: '16.4', evidence: "This can be evidenced by GDPR compliance documentation, privacy notices, data protection training records, and information governance policies." },
  { questionNumber: '16.5', evidence: "This can be evidenced by evidence of confidential information handling, secure disposal of records, and staff understanding of confidentiality." },
  { questionNumber: '16.6', evidence: "This can be evidenced by electronic records system security (access controls, audit trails, backup procedures) or secure physical storage." },
  { questionNumber: '16.7', evidence: "This can be evidenced by records available for inspection, organised filing system, and evidence of records being up to date." },

  // Section 17: Financial Management (5 questions)
  { questionNumber: '17.1', evidence: "This can be evidenced by policy for handling residents' money, signed agreements, and evidence of robust financial safeguards." },
  { questionNumber: '17.2', evidence: "This can be evidenced by individual financial records for each resident, receipts kept, and regular reconciliation documented." },
  { questionNumber: '17.3', evidence: "This can be evidenced by two-signature system for withdrawals, transaction records, and evidence of financial audits." },
  { questionNumber: '17.4', evidence: "This can be evidenced by secure storage of valuables, inventory records, and evidence of safeguarding residents' property." },
  { questionNumber: '17.5', evidence: "This can be evidenced by financial audit reports, independent checks, and evidence of transparent financial management." },

  // Section 18: Activities and Engagement (5 questions)
  { questionNumber: '18.1', evidence: "This can be evidenced by activities programme displayed, variety of activities offered, and evidence of activities matching residents' interests." },
  { questionNumber: '18.2', evidence: "This can be evidenced by individual activity assessments, preferences documented in care plans, and personalised activity options." },
  { questionNumber: '18.3', evidence: "This can be evidenced by activity records showing participation, daily notes recording engagement, and evidence of meaningful activities." },
  { questionNumber: '18.4', evidence: "This can be evidenced by evidence of community involvement, outings, visitors, and maintaining connections with local community." },
  { questionNumber: '18.5', evidence: "This can be evidenced by 1:1 activity provision for those unable to join group activities, sensory activities, and personalised engagement." },

  // Section 19: End of Life Care (5 questions)
  { questionNumber: '19.1', evidence: "This can be evidenced by end of life care policy, advance care planning documentation, and evidence of sensitive discussions with residents/families." },
  { questionNumber: '19.2', evidence: "This can be evidenced by advance care plans/advance decisions documented, preferences recorded, and evidence of regular review." },
  { questionNumber: '19.3', evidence: "This can be evidenced by DNACPR/ReSPECT forms completed appropriately, discussions documented, and forms accessible." },
  { questionNumber: '19.4', evidence: "This can be evidenced by end of life training records, staff competency in palliative care, and evidence of compassionate care delivery." },
  { questionNumber: '19.5', evidence: "This can be evidenced by bereavement support offered to families, follow-up contact documented, and staff support after deaths." },

  // Section 20: Mental Health Support (5 questions)
  { questionNumber: '20.1', evidence: "This can be evidenced by mental health assessments in care plans, support strategies documented, and evidence of person-centred mental health care." },
  { questionNumber: '20.2', evidence: "This can be evidenced by evidence of mental health training for staff, understanding of common conditions, and appropriate support strategies." },
  { questionNumber: '20.3', evidence: "This can be evidenced by referrals to mental health services, liaison with community mental health teams, and specialist input documented." },
  { questionNumber: '20.4', evidence: "This can be evidenced by behaviour support plans (where needed), positive behaviour support approaches, and evidence of least restrictive interventions." },
  { questionNumber: '20.5', evidence: "This can be evidenced by wellbeing monitoring, mood assessments, and evidence of promoting positive mental health and emotional wellbeing." },

  // Section 21: Equality and Diversity (5 questions)
  { questionNumber: '21.1', evidence: "This can be evidenced by equality and diversity policy, evidence of non-discriminatory practice, and staff training records." },
  { questionNumber: '21.2', evidence: "This can be evidenced by care plans reflecting cultural, religious, and spiritual needs, and evidence of accommodating individual preferences." },
  { questionNumber: '21.3', evidence: "This can be evidenced by evidence of accessible information, communication support, and reasonable adjustments for disabilities." },
  { questionNumber: '21.4', evidence: "This can be evidenced by evidence of respecting sexual orientation and gender identity, inclusive practices, and staff awareness training." },
  { questionNumber: '21.5', evidence: "This can be evidenced by evidence of addressing discrimination, complaints handled appropriately, and promoting inclusive environment." },

  // Section 22: Governance and Leadership (3 questions)
  { questionNumber: '22.1', evidence: "This can be evidenced by registered manager in post, registration certificate displayed, and evidence of effective leadership." },
  { questionNumber: '22.2', evidence: "This can be evidenced by governance structure documented, clear lines of accountability, and evidence of effective oversight." },
  { questionNumber: '22.3', evidence: "This can be evidenced by evidence of regulatory compliance, CQC notifications submitted, and statutory requirements met." },

  // ==========================================
  // STAFF SECTIONS (Questions 23.x - 29.x)
  // ==========================================

  // Section 23: Recruitment & Vetting (33 questions)
  { questionNumber: '23.1', evidence: "This can be evidenced by completed application form on file showing full employment history with all gaps explained and accounted for." },
  { questionNumber: '23.2', evidence: "This can be evidenced by interview records showing structured interview questions, scoring criteria, and documented decision rationale." },
  { questionNumber: '23.3', evidence: "This can be evidenced by evidence of values-based recruitment approach, interview questions assessing values, and selection criteria." },
  { questionNumber: '23.4', evidence: "This can be evidenced by DBS certificate on file (dated within 3 years or on Update Service), with risk assessment if any concerns identified." },
  { questionNumber: '23.5', evidence: "This can be evidenced by DBS Update Service check records showing annual verification, with dates and outcomes documented." },
  { questionNumber: '23.6', evidence: "This can be evidenced by two written references on file (one from most recent employer), with evidence of verbal follow-up verification." },
  { questionNumber: '23.7', evidence: "This can be evidenced by copies of ID documents (passport/driving licence), right to work evidence, and verification records on file." },
  { questionNumber: '23.8', evidence: "This can be evidenced by qualification certificates verified, professional registration checks (NMC for nurses), and copies on file." },
  { questionNumber: '23.9', evidence: "This can be evidenced by health declaration/questionnaire completed, occupational health clearance if required, and fitness to work confirmation." },
  { questionNumber: '23.10', evidence: "This can be evidenced by signed contract of employment, job description, and terms and conditions on file before start date." },
  { questionNumber: '23.11', evidence: "This can be evidenced by evidence that staff did not start work until all pre-employment checks were satisfactorily completed." },
  { questionNumber: '23.12', evidence: "This can be evidenced by recruitment checklist showing all checks completed, dates, and sign-off by appropriate manager." },
  { questionNumber: '23.13', evidence: "This can be evidenced by Certificate of Sponsorship (CoS) on file, visa documentation, and evidence of right to work checks." },
  { questionNumber: '23.14', evidence: "This can be evidenced by overseas police check/certificate of good conduct from country of origin, translated if necessary." },
  { questionNumber: '23.15', evidence: "This can be evidenced by TB screening certificate or questionnaire completed, with clearance documented before patient contact." },
  { questionNumber: '23.16', evidence: "This can be evidenced by English language competency evidence (IELTS/OET scores, or assessment records) meeting required standards." },
  { questionNumber: '23.17', evidence: "This can be evidenced by UKVI compliance records, sponsor licence duties met, and evidence of reporting requirements fulfilled." },
  { questionNumber: '23.18', evidence: "This can be evidenced by agency staff files showing agency has completed all required checks, with written confirmation on file." },
  { questionNumber: '23.19', evidence: "This can be evidenced by agency contract/agreement specifying check requirements, and evidence of spot-checking agency compliance." },
  { questionNumber: '23.20', evidence: "This can be evidenced by agency staff induction records showing local orientation completed before working independently." },
  { questionNumber: '23.21', evidence: "This can be evidenced by agency staff competency verification records, evidence of checking qualifications and experience." },
  { questionNumber: '23.22', evidence: "This can be evidenced by agency staff feedback/evaluation records, and evidence of addressing any concerns with agency." },
  { questionNumber: '23.23', evidence: "This can be evidenced by bank staff files with all required checks completed, maintained to same standard as permanent staff." },
  { questionNumber: '23.24', evidence: "This can be evidenced by bank staff training records showing mandatory training completed and kept up to date." },
  { questionNumber: '23.25', evidence: "This can be evidenced by bank staff supervision records, evidence of including bank staff in team communications." },
  { questionNumber: '23.26', evidence: "This can be evidenced by bank staff competency assessments, evidence of checking skills before allocation to shifts." },
  { questionNumber: '23.27', evidence: "This can be evidenced by recruitment policy with review date, covering all aspects of safe recruitment including equality." },
  { questionNumber: '23.28', evidence: "This can be evidenced by evidence of advertising roles appropriately, fair selection process, and equal opportunities monitoring." },
  { questionNumber: '23.29', evidence: "This can be evidenced by interview panel records, evidence of consistent approach, and appropriate panel composition." },
  { questionNumber: '23.30', evidence: "This can be evidenced by conditional offer letters clearly stating required checks, and evidence of checks completed before start." },
  { questionNumber: '23.31', evidence: "This can be evidenced by staff file audit results, evidence of regular file reviews, and action taken on any gaps." },
  { questionNumber: '23.32', evidence: "This can be evidenced by single central record (if applicable) or equivalent tracking system for all staff checks." },
  { questionNumber: '23.33', evidence: "This can be evidenced by evidence of DBS rechecks at appropriate intervals, risk-based approach to recheck frequency." },

  // Section 24: Induction & Onboarding (8 questions)
  { questionNumber: '24.1', evidence: "This can be evidenced by completed induction checklist signed by staff member and supervisor, covering all mandatory areas within first week." },
  { questionNumber: '24.2', evidence: "This can be evidenced by evidence of comprehensive induction programme covering policies, procedures, safeguarding, health & safety, and role-specific training." },
  { questionNumber: '24.3', evidence: "This can be evidenced by shadowing records showing time spent with experienced staff before working independently, signed off by supervisor." },
  { questionNumber: '24.4', evidence: "This can be evidenced by Care Certificate workbook (for new care workers), completion records within 12 weeks, and assessor sign-off." },
  { questionNumber: '24.5', evidence: "This can be evidenced by evidence of increased supervision during probation, regular check-ins documented, and support provided." },
  { questionNumber: '24.6', evidence: "This can be evidenced by competency assessments for key tasks (medication, moving & handling, personal care) signed off before working unsupervised." },
  { questionNumber: '24.7', evidence: "This can be evidenced by new staff feedback forms, evidence of asking about induction experience, and improvements made." },
  { questionNumber: '24.8', evidence: "This can be evidenced by evidence of re-induction for staff returning after long absence, or refresher for existing staff on new procedures." },

  // Section 25: Training & Development (8 questions)
  { questionNumber: '25.1', evidence: "This can be evidenced by training matrix showing all mandatory training completed with dates and renewal dates tracked for all staff." },
  { questionNumber: '25.2', evidence: "This can be evidenced by training certificates for mandatory courses: safeguarding, fire safety, first aid, moving & handling, infection control, food hygiene, MCA/DoLS." },
  { questionNumber: '25.3', evidence: "This can be evidenced by specialist training certificates relevant to service users (dementia, diabetes, epilepsy, PEG feeding, catheter care, behaviours that challenge)." },
  { questionNumber: '25.4', evidence: "This can be evidenced by Oliver McGowan Mandatory Training completion certificates for all staff, showing appropriate tier completed." },
  { questionNumber: '25.5', evidence: "This can be evidenced by evidence of blended learning approaches (classroom, e-learning, practical, shadowing) and training effectiveness evaluation." },
  { questionNumber: '25.6', evidence: "This can be evidenced by training needs analysis records, personal development plans, and evidence of supporting staff to achieve qualifications." },
  { questionNumber: '25.7', evidence: "This can be evidenced by training evaluation forms, competency assessments post-training, and evidence of applying learning in practice." },
  { questionNumber: '25.8', evidence: "This can be evidenced by evidence of supporting professional development, funding for qualifications, and career progression pathways." },

  // Section 26: Supervision & Appraisal (9 questions)
  { questionNumber: '26.1', evidence: "This can be evidenced by supervision policy showing frequency requirements (minimum 6-8 weekly), and supervision records for all staff." },
  { questionNumber: '26.2', evidence: "This can be evidenced by clinical supervision records for nursing staff, showing reflective practice and professional development discussions." },
  { questionNumber: '26.3', evidence: "This can be evidenced by supervision records demonstrating meaningful two-way discussions covering performance, wellbeing, training, and development." },
  { questionNumber: '26.4', evidence: "This can be evidenced by annual appraisal records for all staff, showing review of performance against objectives and job description." },
  { questionNumber: '26.5', evidence: "This can be evidenced by appraisal records showing SMART objectives set, with evidence of mid-year reviews and progress tracking." },
  { questionNumber: '26.6', evidence: "This can be evidenced by evidence of performance management process, support plans for underperformance, and capability procedures if needed." },
  { questionNumber: '26.7', evidence: "This can be evidenced by competency frameworks for each role, with evidence of regular competency assessments against framework." },
  { questionNumber: '26.8', evidence: "This can be evidenced by observation records, spot checks, and documented direct observations of care practice with feedback given." },
  { questionNumber: '26.9', evidence: "This can be evidenced by supervisor training records, evidence that those providing supervision have appropriate skills and training." },

  // Section 27: Competency & Observation (9 questions)
  { questionNumber: '27.1', evidence: "This can be evidenced by training matrix or equivalent system showing all staff training status, due dates, and compliance rates." },
  { questionNumber: '27.2', evidence: "This can be evidenced by evidence of appropriate mandatory training for all staff roles, with refresher training completed on time." },
  { questionNumber: '27.3', evidence: "This can be evidenced by Oliver McGowan Mandatory Training certificates for all staff, showing completion of appropriate tier." },
  { questionNumber: '27.4', evidence: "This can be evidenced by specialist training records for staff working with specific conditions or needs (dementia, autism, mental health)." },
  { questionNumber: '27.5', evidence: "This can be evidenced by evidence of varied training methods (classroom, online, practical, shadowing, coaching) to meet different learning needs." },
  { questionNumber: '27.6', evidence: "This can be evidenced by training needs analysis process, evidence of identifying gaps, and plans to address training needs." },
  { questionNumber: '27.7', evidence: "This can be evidenced by training evaluation records, feedback forms, competency assessments, and evidence of training effectiveness." },
  { questionNumber: '27.8', evidence: "This can be evidenced by evidence of supporting qualifications (NVQ/Diploma), apprenticeships, and professional development opportunities." },
  { questionNumber: '27.9', evidence: "This can be evidenced by staff feedback confirming induction was comprehensive, relevant, and prepared them for their role." },

  // Section 28: Health & Wellbeing (7 questions)
  { questionNumber: '28.1', evidence: "This can be evidenced by staff feedback confirming they receive regular, meaningful supervision that supports their wellbeing and development." },
  { questionNumber: '28.2', evidence: "This can be evidenced by staff survey results, feedback mechanisms, and evidence that staff feel valued, supported, and listened to." },
  { questionNumber: '28.3', evidence: "This can be evidenced by team meeting minutes, staff meeting records, and evidence of regular communication and consultation with staff." },
  { questionNumber: '28.4', evidence: "This can be evidenced by evidence of staff involvement in decisions, consultation on changes, and staff ideas being implemented." },
  { questionNumber: '28.5', evidence: "This can be evidenced by staff survey results, feedback analysis, and evidence of actions taken in response to staff feedback." },
  { questionNumber: '28.6', evidence: "This can be evidenced by exit interview records, analysis of reasons for leaving, and evidence of learning from feedback." },
  { questionNumber: '28.7', evidence: "This can be evidenced by staff recognition schemes, appreciation initiatives, and evidence of celebrating staff achievements." },

  // Section 29: Conduct & Capability (8 questions)
  { questionNumber: '29.1', evidence: "This can be evidenced by wellbeing policy, Employee Assistance Programme (EAP) details, mental health support available, and staff awareness." },
  { questionNumber: '29.2', evidence: "This can be evidenced by stress risk assessments for staff, particularly in high-pressure roles, with support measures documented." },
  { questionNumber: '29.3', evidence: "This can be evidenced by evidence of flexible working arrangements, work-life balance policies, and reasonable adjustments made." },
  { questionNumber: '29.4', evidence: "This can be evidenced by occupational health service access, referral records, and evidence of supporting staff health needs." },
  { questionNumber: '29.5', evidence: "This can be evidenced by debriefing records after difficult incidents, support offered, and evidence of trauma-informed approach." },
  { questionNumber: '29.6', evidence: "This can be evidenced by sickness absence monitoring records, return to work interviews, and absence management policy applied fairly." },
  { questionNumber: '29.7', evidence: "This can be evidenced by lone working risk assessments, safety procedures, check-in systems, and staff training on lone working." },
  { questionNumber: '29.8', evidence: "This can be evidenced by wellbeing initiatives offered (health checks, fitness, mindfulness), and evidence of promoting staff health." },
];

async function updateEvidenceGuidance() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.error('Usage: DATABASE_URL="your-connection-string" node scripts/update-evidence-guidance.mjs');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);
  
  console.log('Starting evidence guidance update for all questions...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  for (const update of evidenceUpdates) {
    try {
      // Update by questionNumber only - it's unique across the database
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
  
  // Verify counts by section type
  console.log('Verifying database counts...');
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
  
  console.log(`Service User questions in DB: ${serviceUserCount[0].count}`);
  console.log(`Staff questions in DB: ${staffCount[0].count}`);
  console.log(`Total questions in DB: ${parseInt(serviceUserCount[0].count) + parseInt(staffCount[0].count)}`);
  
  await connection.end();
  console.log('\nDatabase connection closed.');
}

updateEvidenceGuidance().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
