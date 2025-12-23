#!/usr/bin/env node
/**
 * Update Evidence Guidance Script
 * 
 * This script updates all compliance questions with the correct "How to Evidence" guidance.
 * Run this from your Codespace to update the production database.
 * 
 * Usage: node scripts/update-evidence-guidance.mjs
 * 
 * Make sure your DATABASE_URL environment variable is set to your production database.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Evidence guidance mappings - each question mapped to its correct evidence
const evidenceUpdates = [
  // Section 1: Respecting & Involving People (Service Users)
  { questionNumber: '1.1', sectionId: 1, evidence: "This can be evidenced by providing Care Plan entries showing the person's views, choices, and preferences. Include Pre-admission Assessment, Life History/About Me document, and any documented conversations with the person or their representatives." },
  { questionNumber: '1.2', sectionId: 1, evidence: "This can be evidenced by showing Care Plan entries detailing what the person can do independently, goals for maintaining independence, and Daily Notes demonstrating staff encouraged independence rather than doing tasks for the person." },
  { questionNumber: '1.3', sectionId: 1, evidence: "This can be evidenced by staff interview records or supervision notes where staff articulate how they protect dignity (knocking before entering, covering during personal care, using preferred names). Include dignity training records." },
  { questionNumber: '1.4', sectionId: 1, evidence: "This can be evidenced by Care Plans showing information given in accessible formats, communication passports, and evidence of using appropriate methods (large print, pictures, easy read) based on individual needs." },
  { questionNumber: '1.5', sectionId: 1, evidence: "This can be evidenced by feedback forms, resident meeting minutes, or survey responses where people confirm they feel supported. Include Care Plan reviews showing person's input." },
  { questionNumber: '1.6', sectionId: 1, evidence: "This can be evidenced by Activity Plans, Daily Notes recording participation in activities, visitor records, and evidence of supporting family contact (phone calls, video calls, visits)." },
  { questionNumber: '1.7', sectionId: 1, evidence: "This can be evidenced by observation records, quality monitoring reports, or supervision notes documenting positive interactions between staff and residents." },
  { questionNumber: '1.8', sectionId: 1, evidence: "This can be evidenced by Care Plan signature pages showing involvement from the person and/or their representatives, dated entries showing collaborative reviews." },
  { questionNumber: '1.9', sectionId: 1, evidence: "This can be evidenced by providing your Subject Access Request (SAR) policy, records of SAR requests handled, and evidence of information sharing protocols." },
  { questionNumber: '1.10', sectionId: 1, evidence: "This can be evidenced by showing how care files are stored accessibly (not locked away from person), evidence person can access their records, and policy on record access." },
  { questionNumber: '1.11', sectionId: 1, evidence: "This can be evidenced by showing Care Plan entries detailing what the person can do independently, privacy preferences documented, and how dignity is maintained during care delivery." },
  { questionNumber: '1.12', sectionId: 1, evidence: "This can be evidenced by resident satisfaction surveys, feedback forms, complaints records (or lack thereof), and quality assurance monitoring showing dignity is maintained." },

  // Section 2: Consent (Service Users)
  { questionNumber: '2.1', sectionId: 2, evidence: "This can be evidenced by signed consent forms for care delivery, medication, photographs, information sharing, and other relevant decisions. Forms should be dated and witnessed." },
  { questionNumber: '2.2', sectionId: 2, evidence: "This can be evidenced by LPA documentation on file, evidence of consulting LPA for relevant decisions, and records showing LPA involvement in care planning." },
  { questionNumber: '2.3', sectionId: 2, evidence: "This can be evidenced by completed Mental Capacity Assessments (decision-specific), Best Interest Decision records, and evidence of involving relevant parties in best interest meetings." },
  { questionNumber: '2.4', sectionId: 2, evidence: "This can be evidenced by DoLS applications submitted, authorisations received, conditions documented, and evidence of least restrictive practice being applied." },
  { questionNumber: '2.5', sectionId: 2, evidence: "This can be evidenced by DoLS tracker/log showing all applications, conditions, review dates, and expiry dates. Include evidence of timely renewals." },
  { questionNumber: '2.6', sectionId: 2, evidence: "This can be evidenced by observation records showing staff seeking consent before care tasks, documented in Daily Notes or supervision observations." },
  { questionNumber: '2.7', sectionId: 2, evidence: "This can be evidenced by staff interview records, supervision notes, or training records showing staff understanding of MCA principles and application in practice." },

  // Section 3: Care and Welfare (Service Users)
  { questionNumber: '3.1', sectionId: 3, evidence: "This can be evidenced by providing the person's care file showing provider contact details (office number, emergency number, manager contact), displayed in an accessible format." },
  { questionNumber: '3.2', sectionId: 3, evidence: "This can be evidenced by completed Pre-admission Assessment covering health needs, social needs, preferences, risks, and capacity. Should be dated before admission." },
  { questionNumber: '3.3', sectionId: 3, evidence: "This can be evidenced by providing completed Life History/About Me document with personal history, important events, family, work history, hobbies, likes/dislikes." },
  { questionNumber: '3.4', sectionId: 3, evidence: "This can be evidenced by providing Care Plans covering all identified needs: personal care, mobility, nutrition, medication, skin integrity, continence, mental health, communication, social needs." },
  { questionNumber: '3.5', sectionId: 3, evidence: "This can be evidenced by Care Plans written in strength-based language (what person CAN do, not just deficits), person-centred goals, and evidence of promoting independence." },
  { questionNumber: '3.6', sectionId: 3, evidence: "This can be evidenced by Care Plans containing SMART outcomes (Specific, Measurable, Achievable, Relevant, Time-bound) personalised to the individual, with progress reviews documented." },
  { questionNumber: '3.7', sectionId: 3, evidence: "This can be evidenced by providing completed Risk Assessments for identified risks (falls, pressure areas, nutrition, moving & handling, behaviour, choking) with clear control measures." },
  { questionNumber: '3.8', sectionId: 3, evidence: "This can be evidenced by Care Plan review records showing regular reviews (monthly or when needs change), with changes documented and signed." },
  { questionNumber: '3.9', sectionId: 3, evidence: "This can be evidenced by Risk Assessment review records showing regular reviews, updates when risks change, and clear audit trail of changes." },
  { questionNumber: '3.10', sectionId: 3, evidence: "This can be evidenced by Daily Notes completed each shift/visit, showing continuity of care recording and handover information." },
  { questionNumber: '3.11', sectionId: 3, evidence: "This can be evidenced by Daily Notes that are factual (not opinion), dated, timed, legible, and signed with staff name/initials clearly identifiable." },
  { questionNumber: '3.12', sectionId: 3, evidence: "This can be evidenced by Daily Notes providing meaningful account of care delivered, person's wellbeing, any concerns, and outcomes rather than just task completion." },
  { questionNumber: '3.13', sectionId: 3, evidence: "This can be evidenced by completed intervention charts (turning charts, food/fluid charts, bowel charts, blood glucose monitoring) that are fully completed, signed, and dated." },
  { questionNumber: '3.14', sectionId: 3, evidence: "This can be evidenced by Activity records, Daily Notes recording social interactions, and evidence of meaningful engagement documented." },
  { questionNumber: '3.15', sectionId: 3, evidence: "This can be evidenced by records of GP visits, district nurse involvement, specialist referrals, and correspondence with other health/social care professionals." },
  { questionNumber: '3.16', sectionId: 3, evidence: "This can be evidenced by completed DNACPR/ReSPECT form signed by appropriate clinician, with evidence of discussion with person/family documented." },
  { questionNumber: '3.17', sectionId: 3, evidence: "This can be evidenced by resident satisfaction surveys, feedback forms, and care reviews where the person confirms their needs are being met." },

  // Section 4: Meeting Nutritional Needs (Service Users)
  { questionNumber: '4.1', sectionId: 4, evidence: "This can be evidenced by providing menus showing variety, healthy options, cultural/religious choices, and how special diets are accommodated. Include evidence menu is reviewed with residents." },
  { questionNumber: '4.2', sectionId: 4, evidence: "This can be evidenced by kitchen stock records, fridge/freezer temperature logs, and evidence of 24-hour food availability (snacks, drinks, night-time options)." },
  { questionNumber: '4.3', sectionId: 4, evidence: "This can be evidenced by Nutritional Care Plans documenting allergies, likes/dislikes, dietary requirements, texture modifications, and any dietitian recommendations." },
  { questionNumber: '4.4', sectionId: 4, evidence: "This can be evidenced by Nutritional Care Plans containing specific dietary advice (diabetic diet, low sodium, high protein, fortified diet) with clear instructions for staff." },
  { questionNumber: '4.5', sectionId: 4, evidence: "This can be evidenced by Nutritional Care Plans showing MUST score, risk level, and specific actions to be taken (fortification, supplements, referral to dietitian, increased monitoring)." },
  { questionNumber: '4.6', sectionId: 4, evidence: "This can be evidenced by completed MUST assessments with accurate height, weight, BMI calculation, weight loss percentage, and acute disease effect score. Show monthly reviews." },
  { questionNumber: '4.7', sectionId: 4, evidence: "This can be evidenced by photographs of displayed menu, evidence menu is updated daily/weekly, and menu is in accessible format (large print, pictures if needed)." },
  { questionNumber: '4.8', sectionId: 4, evidence: "This can be evidenced by resident feedback, food request records, and evidence of accommodating individual requests (specific brands, preparation preferences, timing of meals)." },
  { questionNumber: '4.9', sectionId: 4, evidence: "This can be evidenced by mealtime observation records showing pleasant environment, appropriate assistance, social atmosphere, and person-centred approach to dining." },

  // Section 5: Co-operating with Providers (Service Users)
  { questionNumber: '5.1', sectionId: 5, evidence: "This can be evidenced by providing Memorandums of Understanding (MoU) or service agreements with other providers, clear documentation of shared care responsibilities." },
  { questionNumber: '5.2', sectionId: 5, evidence: "This can be evidenced by completed Hospital Passport/Must Do Care Plan that is current, accurate, and ready to accompany person to hospital." },
  { questionNumber: '5.3', sectionId: 5, evidence: "This can be evidenced by appointment records, referral letters, and feedback from people confirming they're supported to access GP, dentist, optician, hospital, and other services." },

  // Section 6: Safeguarding (Service Users)
  { questionNumber: '6.1', sectionId: 6, evidence: "This can be evidenced by providing current Safeguarding Policy aligned with local multiagency procedures, with evidence of regular review and staff awareness." },
  { questionNumber: '6.2', sectionId: 6, evidence: "This can be evidenced by safeguarding notification log showing timely submissions (within 48 hours), acknowledgements received, and outcomes documented." },
  { questionNumber: '6.3', sectionId: 6, evidence: "This can be evidenced by Risk Notification log with all incidents recorded, actions taken, outcomes documented, and evidence of learning from incidents." },
  { questionNumber: '6.4', sectionId: 6, evidence: "This can be evidenced by risk notification records showing timely submissions (within 48 hours), with evidence of appropriate escalation." },
  { questionNumber: '6.5', sectionId: 6, evidence: "This can be evidenced by CQC notification log showing all required notifications, dates submitted, and outcomes/responses received." },
  { questionNumber: '6.6', sectionId: 6, evidence: "This can be evidenced by CQC notification records showing timely submissions for deaths, serious injuries, safeguarding, DoLS, and other notifiable events." },
  { questionNumber: '6.7', sectionId: 6, evidence: "This can be evidenced by completed Herbert Protocol forms for people at risk of going missing, with current photographs and key information." },
  { questionNumber: '6.8', sectionId: 6, evidence: "This can be evidenced by showing policy location (physical and digital), staff signatures confirming they've read it, and evidence of policy being discussed in training/supervision." },
  { questionNumber: '6.9', sectionId: 6, evidence: "This can be evidenced by photographs of safeguarding poster displayed, showing current contact numbers for local authority, police, CQC." },
  { questionNumber: '6.10', sectionId: 6, evidence: "This can be evidenced by observation records, spot checks, or supervision notes documenting safe practice during transfers, nutrition support, and other care activities." },
  { questionNumber: '6.11', sectionId: 6, evidence: "This can be evidenced by staff interview records or supervision notes showing staff can identify abuse types, know reporting procedures, and understand whistleblowing policy." },
  { questionNumber: '6.12', sectionId: 6, evidence: "This can be evidenced by visitor log showing DBS check status verified for all visiting professionals, with dates checked and by whom." },
  { questionNumber: '6.13', sectionId: 6, evidence: "This can be evidenced by copies of public liability insurance certificates on file for all visiting professionals, with expiry dates tracked." },
  { questionNumber: '6.14', sectionId: 6, evidence: "This can be evidenced by safeguarding log showing all concerns raised, actions taken, referrals made, outcomes, and lessons learned." },

  // Section 7: Infection Prevention and Control (Service Users)
  { questionNumber: '7.1', sectionId: 7, evidence: "This can be evidenced by current IPC Policy with review date, aligned with national guidance, and evidence of staff training on the policy." },
  { questionNumber: '7.2', sectionId: 7, evidence: "This can be evidenced by cleaning schedules for all areas, signed when completed, with evidence of deep cleaning schedules and audits." },
  { questionNumber: '7.3', sectionId: 7, evidence: "This can be evidenced by equipment cleaning logs, decontamination records, and evidence of single-use items being disposed of correctly." },
  { questionNumber: '7.4', sectionId: 7, evidence: "This can be evidenced by environmental audit records, cleaning audit results, and absence of odour complaints or concerns raised." },
  { questionNumber: '7.5', sectionId: 7, evidence: "This can be evidenced by PPE stock records, evidence of PPE stations throughout the building, and in-date supplies available." },
  { questionNumber: '7.6', sectionId: 7, evidence: "This can be evidenced by observation records, hand hygiene audits, and supervision notes documenting correct IPC practice." },
  { questionNumber: '7.7', sectionId: 7, evidence: "This can be evidenced by staff interview records or training records showing understanding of infection control principles and practices." },
  { questionNumber: '7.8', sectionId: 7, evidence: "This can be evidenced by waste management policy, evidence of correct waste segregation, and staff understanding of clinical waste disposal." },

  // Section 8: Medication (Service Users)
  { questionNumber: '8.1', sectionId: 8, evidence: "This can be evidenced by current Medication Policy with review date, covering all aspects of medication management including ordering, storage, administration, disposal." },
  { questionNumber: '8.2', sectionId: 8, evidence: "This can be evidenced by stock control records, medication audit results, and evidence of checking expiry dates regularly." },
  { questionNumber: '8.3', sectionId: 8, evidence: "This can be evidenced by MAR charts showing all prescribed medications, with clear instructions, and evidence of accurate recording." },
  { questionNumber: '8.4', sectionId: 8, evidence: "This can be evidenced by completed MAR charts with no gaps, correct codes used for non-administration, and staff signatures." },
  { questionNumber: '8.5', sectionId: 8, evidence: "This can be evidenced by PRN protocols for each PRN medication, showing when to give, maximum doses, and effectiveness monitoring." },
  { questionNumber: '8.6', sectionId: 8, evidence: "This can be evidenced by PRN administration records showing reason given, dose, time, effectiveness review, and within maximum limits." },
  { questionNumber: '8.7', sectionId: 8, evidence: "This can be evidenced by controlled drug register, stock checks, witness signatures, and secure storage evidence." },
  { questionNumber: '8.8', sectionId: 8, evidence: "This can be evidenced by medication competency assessments for all staff administering medication, with regular reassessment." },
  { questionNumber: '8.9', sectionId: 8, evidence: "This can be evidenced by medication audit results, error reporting records, and evidence of learning from medication incidents." },
  { questionNumber: '8.10', sectionId: 8, evidence: "This can be evidenced by medication storage audit showing correct temperatures, secure storage, separation of internal/external medications." },
  { questionNumber: '8.11', sectionId: 8, evidence: "This can be evidenced by fridge temperature logs checked daily, action taken when out of range, and calibrated thermometer used." },
  { questionNumber: '8.12', sectionId: 8, evidence: "This can be evidenced by covert medication policy, best interest decisions documented, and pharmacist advice on crushing/opening medications." },

  // Section 9: Premises and Equipment (Service Users)
  { questionNumber: '9.1', sectionId: 9, evidence: "This can be evidenced by maintenance schedules, repair logs, and evidence of prompt action on maintenance issues." },
  { questionNumber: '9.2', sectionId: 9, evidence: "This can be evidenced by equipment service records, PAT testing certificates, and evidence of regular checks." },
  { questionNumber: '9.3', sectionId: 9, evidence: "This can be evidenced by fire safety records including alarm tests, fire drills, equipment checks, and staff training." },
  { questionNumber: '9.4', sectionId: 9, evidence: "This can be evidenced by legionella risk assessment, water temperature records, and flushing schedules for low-use outlets." },
  { questionNumber: '9.5', sectionId: 9, evidence: "This can be evidenced by gas safety certificate, electrical installation certificate, and lift inspection records." },
  { questionNumber: '9.6', sectionId: 9, evidence: "This can be evidenced by environmental risk assessments, health and safety audits, and action plans for identified issues." },

  // Section 10: Staffing (Staff)
  { questionNumber: '10.1', sectionId: 10, evidence: "This can be evidenced by staffing rotas showing adequate numbers for dependency levels, with evidence of how staffing is calculated." },
  { questionNumber: '10.2', sectionId: 10, evidence: "This can be evidenced by staff files containing application forms, interview records, and evidence of robust selection process." },
  { questionNumber: '10.3', sectionId: 10, evidence: "This can be evidenced by DBS certificates on file, DBS update service checks, and risk assessments for any concerns." },
  { questionNumber: '10.4', sectionId: 10, evidence: "This can be evidenced by reference requests and responses on file, with evidence of following up verbal references in writing." },
  { questionNumber: '10.5', sectionId: 10, evidence: "This can be evidenced by proof of identity documents, right to work checks, and copies held securely on file." },
  { questionNumber: '10.6', sectionId: 10, evidence: "This can be evidenced by induction records showing completion of mandatory training, shadowing, and competency sign-off." },
  { questionNumber: '10.7', sectionId: 10, evidence: "This can be evidenced by training matrix showing all staff training, completion dates, and renewal dates." },
  { questionNumber: '10.8', sectionId: 10, evidence: "This can be evidenced by supervision records showing regular 1:1 meetings, topics discussed, and actions agreed." },
  { questionNumber: '10.9', sectionId: 10, evidence: "This can be evidenced by appraisal records showing annual reviews, objectives set, and development plans." },
  { questionNumber: '10.10', sectionId: 10, evidence: "This can be evidenced by NMC PIN verification records for nurses, checked annually, with evidence of revalidation support." },

  // Staff-specific sections (11-19) - these use different section IDs
  // Section 11: Staff Recruitment (Staff)
  { questionNumber: '1.1', sectionId: 20, evidence: "This can be evidenced by completed application form on file showing full employment history with gaps explained." },
  { questionNumber: '1.2', sectionId: 20, evidence: "This can be evidenced by interview records showing structured interview questions, scoring, and decision rationale." },
  { questionNumber: '1.3', sectionId: 20, evidence: "This can be evidenced by DBS certificate on file (dated within 3 years or on Update Service), with risk assessment if any concerns." },
  { questionNumber: '1.4', sectionId: 20, evidence: "This can be evidenced by two written references on file, one from most recent employer, with evidence of verbal follow-up." },
  { questionNumber: '1.5', sectionId: 20, evidence: "This can be evidenced by copies of ID documents (passport/driving licence), right to work evidence, and verification records." },
  { questionNumber: '1.6', sectionId: 20, evidence: "This can be evidenced by health declaration form, occupational health clearance if required, and fitness to work confirmation." },
  { questionNumber: '1.7', sectionId: 20, evidence: "This can be evidenced by signed contract of employment, job description, and terms and conditions on file." },

  // Section 12: Staff Induction (Staff)
  { questionNumber: '2.1', sectionId: 21, evidence: "This can be evidenced by completed induction checklist signed by staff member and supervisor, covering all mandatory areas." },
  { questionNumber: '2.2', sectionId: 21, evidence: "This can be evidenced by Care Certificate workbook (if applicable), completion records, and assessor sign-off." },
  { questionNumber: '2.3', sectionId: 21, evidence: "This can be evidenced by shadowing records showing time spent with experienced staff before working independently." },
  { questionNumber: '2.4', sectionId: 21, evidence: "This can be evidenced by competency assessments for key tasks (medication, moving & handling) signed off by assessor." },
  { questionNumber: '2.5', sectionId: 21, evidence: "This can be evidenced by probation review records showing regular meetings, feedback given, and confirmation of passing probation." },

  // Section 13: Staff Training (Staff)
  { questionNumber: '3.1', sectionId: 22, evidence: "This can be evidenced by training matrix showing all mandatory training completed with dates and renewal dates tracked." },
  { questionNumber: '3.2', sectionId: 22, evidence: "This can be evidenced by training certificates for mandatory courses: safeguarding, fire safety, first aid, moving & handling, infection control, food hygiene." },
  { questionNumber: '3.3', sectionId: 22, evidence: "This can be evidenced by specialist training certificates relevant to service users (dementia, diabetes, epilepsy, PEG feeding, catheter care)." },
  { questionNumber: '3.4', sectionId: 22, evidence: "This can be evidenced by training needs analysis, personal development plans, and evidence of supporting staff to achieve qualifications." },
  { questionNumber: '3.5', sectionId: 22, evidence: "This can be evidenced by training evaluation forms, competency assessments post-training, and evidence of applying learning in practice." },

  // Section 14: Staff Supervision (Staff)
  { questionNumber: '4.1', sectionId: 23, evidence: "This can be evidenced by supervision policy showing frequency requirements (typically 6-8 weekly) and what should be covered." },
  { questionNumber: '4.2', sectionId: 23, evidence: "This can be evidenced by dated supervision records showing regular 1:1 meetings with topics discussed and actions agreed." },
  { questionNumber: '4.3', sectionId: 23, evidence: "This can be evidenced by supervision records covering wellbeing, performance, training needs, and professional development." },
  { questionNumber: '4.4', sectionId: 23, evidence: "This can be evidenced by supervision records showing follow-up on previous actions and evidence of support provided." },

  // Section 15: Staff Appraisal (Staff)
  { questionNumber: '5.1', sectionId: 24, evidence: "This can be evidenced by annual appraisal records showing review of performance against objectives and job description." },
  { questionNumber: '5.2', sectionId: 24, evidence: "This can be evidenced by appraisal records showing SMART objectives set for the coming year." },
  { questionNumber: '5.3', sectionId: 24, evidence: "This can be evidenced by personal development plans linked to appraisal, showing training and development goals." },
  { questionNumber: '5.4', sectionId: 24, evidence: "This can be evidenced by mid-year review records showing progress against objectives and any support needed." },

  // Section 16: Staff Competency (Staff)
  { questionNumber: '6.1', sectionId: 25, evidence: "This can be evidenced by competency framework showing required competencies for each role and how they are assessed." },
  { questionNumber: '6.2', sectionId: 25, evidence: "This can be evidenced by completed competency assessments for medication administration, signed by assessor." },
  { questionNumber: '6.3', sectionId: 25, evidence: "This can be evidenced by moving & handling competency assessments showing safe use of equipment." },
  { questionNumber: '6.4', sectionId: 25, evidence: "This can be evidenced by observation records, spot checks, and competency reassessments showing ongoing competence." },

  // Section 17: Professional Registration (Staff - for nurses)
  { questionNumber: '7.1', sectionId: 26, evidence: "This can be evidenced by NMC PIN verification records showing annual checks on NMC register." },
  { questionNumber: '7.2', sectionId: 26, evidence: "This can be evidenced by revalidation support records, CPD logs, and confirmation of successful revalidation." },
  { questionNumber: '7.3', sectionId: 26, evidence: "This can be evidenced by professional indemnity insurance evidence (if required) and registration certificates." },

  // Section 18: Staff Conduct (Staff)
  { questionNumber: '8.1', sectionId: 27, evidence: "This can be evidenced by signed code of conduct, disciplinary policy acknowledgement, and staff handbook receipt." },
  { questionNumber: '8.2', sectionId: 27, evidence: "This can be evidenced by disciplinary records (if any), investigation notes, and outcome letters." },
  { questionNumber: '8.3', sectionId: 27, evidence: "This can be evidenced by absence records, return to work interviews, and attendance management records." },

  // Section 19: Staff Wellbeing (Staff)
  { questionNumber: '9.1', sectionId: 28, evidence: "This can be evidenced by wellbeing policy, EAP (Employee Assistance Programme) details, and mental health support available." },
  { questionNumber: '9.2', sectionId: 28, evidence: "This can be evidenced by supervision records discussing wellbeing, stress risk assessments, and support provided." },
  { questionNumber: '9.3', sectionId: 28, evidence: "This can be evidenced by staff survey results, team meeting minutes, and evidence of acting on staff feedback." },
];

async function updateEvidenceGuidance() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.error('Make sure you have your .env file configured with the production database URL.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);
  
  console.log('Starting evidence guidance update...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  for (const update of evidenceUpdates) {
    try {
      const [result] = await connection.execute(
        `UPDATE complianceQuestions 
         SET exampleEvidence = ? 
         WHERE questionNumber = ? AND sectionId = ?`,
        [update.evidence, update.questionNumber, update.sectionId]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✓ Updated Q${update.questionNumber} (Section ${update.sectionId})`);
        successCount++;
      } else {
        console.log(`⚠ No match found for Q${update.questionNumber} (Section ${update.sectionId})`);
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
  console.log(`========================================\n`);
  
  await connection.end();
  console.log('Database connection closed.');
}

updateEvidenceGuidance().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
