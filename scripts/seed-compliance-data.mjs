import { drizzle } from "drizzle-orm/mysql2";
import { complianceSections, complianceQuestions, auditTypes } from "../drizzle/schema.js";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

// Service User Compliance Sections (22 sections)
const serviceUserSections = [
  {
    sectionNumber: 1,
    sectionName: "Respecting & Involving People",
    sectionType: "service_user",
    description: "Ensuring person-centered care, dignity, respect, and involvement in decision-making",
    tooltip: "This section covers how well you respect service users' choices, preferences, and dignity. Focus on person-centered care practices, communication, and involvement in care planning.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 2,
    sectionName: "Consent",
    sectionType: "service_user",
    description: "Obtaining and documenting valid consent, understanding MCA and DoLS",
    tooltip: "Assess how consent is obtained and recorded. Check understanding of Mental Capacity Act (MCA), Deprivation of Liberty Safeguards (DoLS), and Lasting Power of Attorney (LPA).",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 3,
    sectionName: "Care and Welfare",
    sectionType: "service_user",
    description: "Comprehensive care planning, holistic support, and meeting individual needs",
    tooltip: "Review care plans for comprehensiveness, person-centeredness, and regular reviews. Ensure all aspects of wellbeing are addressed.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 4,
    sectionName: "Meeting Nutritional Needs",
    sectionType: "service_user",
    description: "Providing adequate nutrition, hydration, and dietary support",
    tooltip: "Check food quality, choice, hydration monitoring, dietary requirements, and nutritional risk assessments.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 5,
    sectionName: "Co-operating with Providers",
    sectionType: "service_user",
    description: "Working effectively with other healthcare and social care providers",
    tooltip: "Assess collaboration with GPs, hospitals, social workers, and other services. Check Memorandums of Understanding (MoU) and information sharing.",
    auditFrequency: "annually",
  },
  {
    sectionNumber: 6,
    sectionName: "Safeguarding",
    sectionType: "service_user",
    description: "Protecting service users from abuse, harm, and neglect",
    tooltip: "Review safeguarding policies, incident reporting, staff training, and protection procedures. Ensure all concerns are properly reported and investigated.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 7,
    sectionName: "Infection Control",
    sectionType: "service_user",
    description: "Preventing and controlling infections through proper hygiene and procedures",
    tooltip: "Check hand hygiene, PPE usage, cleaning schedules, waste disposal, and infection control policies. Review outbreak management procedures.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 8,
    sectionName: "Management of Medicine",
    sectionType: "service_user",
    description: "Safe ordering, storage, administration, and disposal of medications",
    tooltip: "Audit medication administration records (MAR), storage conditions, staff competency, and medication errors. Check PRN protocols and controlled drugs management.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 9,
    sectionName: "Safety of Premises",
    sectionType: "service_user",
    description: "Maintaining safe, accessible, and suitable premises",
    tooltip: "Assess building safety, fire safety, accessibility, maintenance, and environmental risk assessments. Check compliance with health and safety regulations.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 10,
    sectionName: "Safety of Equipment",
    sectionType: "service_user",
    description: "Ensuring all equipment is safe, maintained, and fit for purpose",
    tooltip: "Review equipment maintenance records, PAT testing, servicing schedules, and safe usage. Check hoists, beds, wheelchairs, and medical devices.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 11,
    sectionName: "Recruitment",
    sectionType: "service_user",
    description: "Safe recruitment practices including DBS checks and references",
    tooltip: "Audit recruitment files for DBS certificates, references, proof of identity, right to work checks, and employment history verification.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 12,
    sectionName: "Staff Deployment",
    sectionType: "service_user",
    description: "Appropriate staffing levels and skill mix to meet service user needs",
    tooltip: "Review rotas, dependency assessments, staff-to-service-user ratios, and skill mix. Ensure adequate coverage at all times.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 13,
    sectionName: "Supporting Staff",
    sectionType: "service_user",
    description: "Providing training, supervision, and support for staff development",
    tooltip: "Check training records, supervision frequency, appraisals, and staff wellbeing support. Ensure mandatory training is up to date.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 14,
    sectionName: "Quality Monitoring",
    sectionType: "service_user",
    description: "Regular audits, quality assurance, and continuous improvement",
    tooltip: "Review audit schedules, action plans, quality improvement initiatives, and management oversight. Check how feedback is used to improve services.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 15,
    sectionName: "Complaints",
    sectionType: "service_user",
    description: "Handling complaints effectively and learning from feedback",
    tooltip: "Audit complaints log, response times, investigation quality, and lessons learned. Ensure accessible complaints procedures.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 16,
    sectionName: "Records",
    sectionType: "service_user",
    description: "Maintaining accurate, secure, and accessible records",
    tooltip: "Check record-keeping standards, data protection compliance, storage security, and accessibility. Review care plans, daily notes, and incident records.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 17,
    sectionName: "Financial Management",
    sectionType: "service_user",
    description: "Managing service user finances safely and transparently",
    tooltip: "Audit financial records, receipts, authorizations, and safeguarding of service user money. Check policies and procedures for handling finances.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 18,
    sectionName: "Activities and Engagement",
    sectionType: "service_user",
    description: "Providing meaningful activities and social engagement",
    tooltip: "Review activity programs, individual preferences, participation records, and community involvement. Ensure activities promote wellbeing and independence.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 19,
    sectionName: "End of Life Care",
    sectionType: "service_user",
    description: "Providing dignified, compassionate end of life care",
    tooltip: "Check advance care planning, pain management, family involvement, and dignity in dying. Review staff training and support.",
    auditFrequency: "annually",
  },
  {
    sectionNumber: 20,
    sectionName: "Mental Health Support",
    sectionType: "service_user",
    description: "Supporting mental health and emotional wellbeing",
    tooltip: "Assess mental health assessments, support plans, access to specialist services, and staff awareness. Check for person-centered mental health care.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 21,
    sectionName: "Equality and Diversity",
    sectionType: "service_user",
    description: "Promoting equality, respecting diversity, and preventing discrimination",
    tooltip: "Review policies, staff training, and practices around protected characteristics. Ensure inclusive care that respects cultural, religious, and personal preferences.",
    auditFrequency: "annually",
  },
  {
    sectionNumber: 22,
    sectionName: "Governance and Leadership",
    sectionType: "service_user",
    description: "Effective leadership, governance structures, and accountability",
    tooltip: "Assess management oversight, governance meetings, accountability frameworks, and leadership quality. Check registered manager presence and oversight.",
    auditFrequency: "quarterly",
  },
];

// Staff Compliance Sections (7 sections)
const staffSections = [
  {
    sectionNumber: 1,
    sectionName: "Recruitment & Vetting",
    sectionType: "staff",
    description: "Safe recruitment practices and pre-employment checks",
    tooltip: "Ensure all staff have completed DBS checks, references, identity verification, right to work checks, and professional registration checks where applicable.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 2,
    sectionName: "Induction & Onboarding",
    sectionType: "staff",
    description: "Comprehensive induction and onboarding for new staff",
    tooltip: "Check induction programs cover Care Certificate standards, policies, procedures, and shadowing. Ensure new staff are competent before working unsupervised.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 3,
    sectionName: "Training & Development",
    sectionType: "staff",
    description: "Ongoing training and professional development",
    tooltip: "Audit mandatory training compliance (safeguarding, infection control, medication, moving and handling, etc.) and specialist training needs. Check training matrix and certificates.",
    auditFrequency: "monthly",
  },
  {
    sectionNumber: 4,
    sectionName: "Supervision & Appraisal",
    sectionType: "staff",
    description: "Regular supervision, appraisal, and performance management",
    tooltip: "Review supervision frequency (minimum every 6-8 weeks), quality of supervision records, annual appraisals, and personal development plans.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 5,
    sectionName: "Competency & Observation",
    sectionType: "staff",
    description: "Competency assessments and observational checks",
    tooltip: "Check competency assessments for medication, moving and handling, and other key tasks. Review spot checks and observational audits of practice.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 6,
    sectionName: "Health & Wellbeing",
    sectionType: "staff",
    description: "Supporting staff health, wellbeing, and fitness to practice",
    tooltip: "Review occupational health assessments, sickness absence management, stress risk assessments, and wellbeing support offered to staff.",
    auditFrequency: "quarterly",
  },
  {
    sectionNumber: 7,
    sectionName: "Conduct & Capability",
    sectionType: "staff",
    description: "Managing conduct, capability, and disciplinary issues",
    tooltip: "Audit disciplinary records, capability procedures, and professional conduct standards. Ensure fair and consistent management of performance issues.",
    auditFrequency: "annually",
  },
];

// Audit Types (25 types)
const auditTypesData = [
  // Mandatory Monthly Audits
  {
    auditName: "Care Plan Audit",
    auditCategory: "mandatory_monthly",
    description: "AI-powered quality audit of care plans to assess person-centeredness, comprehensiveness, and CQC compliance",
    tooltip: "Upload care plans for AI analysis. The system will automatically strip names to initials for GDPR compliance and provide a quality score (1-10) with specific recommendations for improvement.",
    processSteps: JSON.stringify([
      "Upload care plan documents (PDF/Word)",
      "System strips service user names to initials",
      "AI analyzes care plan quality",
      "Receive score and recommendations",
      "Implement improvements",
      "Re-audit after changes"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: true,
    templateReference: "care_plan_template",
  },
  {
    auditName: "Medication Audit",
    auditCategory: "mandatory_monthly",
    description: "Comprehensive audit of medication administration records, storage, and procedures",
    tooltip: "Check MAR charts for completeness, signatures, and errors. Review medication storage temperatures, stock levels, and controlled drugs register. Assess staff competency.",
    processSteps: JSON.stringify([
      "Review MAR charts for accuracy",
      "Check medication storage conditions",
      "Audit controlled drugs register",
      "Review PRN protocols",
      "Check staff competency records",
      "Identify and address errors"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "medication_audit_template",
  },
  {
    auditName: "Daily Notes Audit",
    auditCategory: "mandatory_monthly",
    description: "AI-powered quality audit of staff daily notes to assess detail, person-centeredness, and professionalism",
    tooltip: "Upload daily notes for AI analysis. The system will strip names to initials and evaluate note quality, detail, and compliance with record-keeping standards.",
    processSteps: JSON.stringify([
      "Upload daily notes (PDF/Word)",
      "System strips names to initials",
      "AI analyzes note quality",
      "Receive feedback on improvements",
      "Share findings with staff",
      "Provide targeted training"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: true,
    templateReference: "daily_notes_template",
  },
  {
    auditName: "Staff File Audit",
    auditCategory: "mandatory_monthly",
    description: "Audit of staff personnel files for compliance with recruitment and training requirements",
    tooltip: "Check each staff file contains: DBS certificate, references, proof of identity, right to work, professional registration, training certificates, and supervision records.",
    processSteps: JSON.stringify([
      "Select staff files to audit",
      "Check mandatory documents present",
      "Verify DBS and training dates",
      "Check supervision frequency",
      "Identify missing documents",
      "Create action plan for gaps"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "staff_file_audit_template",
  },
  {
    auditName: "Infection Control Audit",
    auditCategory: "mandatory_monthly",
    description: "Audit of infection prevention and control practices",
    tooltip: "Assess hand hygiene compliance, PPE availability and usage, cleaning schedules, waste disposal, and outbreak management procedures.",
    processSteps: JSON.stringify([
      "Observe hand hygiene practices",
      "Check PPE stocks and usage",
      "Review cleaning schedules",
      "Audit waste disposal",
      "Check infection control policies",
      "Identify improvement areas"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "infection_control_template",
  },
  
  // Important Quarterly Audits
  {
    auditName: "Health & Safety Audit",
    auditCategory: "quarterly",
    description: "Comprehensive health and safety audit of premises and practices",
    tooltip: "Review risk assessments, fire safety, COSHH, accident reporting, and health and safety policies. Check compliance with regulations.",
    processSteps: JSON.stringify([
      "Review risk assessments",
      "Check fire safety equipment",
      "Audit accident/incident logs",
      "Review COSHH assessments",
      "Check emergency procedures",
      "Create action plan"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "health_safety_template",
  },
  {
    auditName: "Safeguarding Audit",
    auditCategory: "quarterly",
    description: "Audit of safeguarding practices, reporting, and staff awareness",
    tooltip: "Review safeguarding incidents, referrals to local authority, staff training, and policies. Ensure all concerns are properly reported and investigated.",
    processSteps: JSON.stringify([
      "Review safeguarding log",
      "Check referral quality",
      "Audit staff training records",
      "Review policies and procedures",
      "Check investigation outcomes",
      "Identify training needs"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "safeguarding_audit_template",
  },
  {
    auditName: "Dignity Audit",
    auditCategory: "quarterly",
    description: "Audit of dignity in care practices and service user experience",
    tooltip: "Assess privacy, respect, choice, independence, and person-centered care. Observe staff interactions and gather service user feedback.",
    processSteps: JSON.stringify([
      "Observe staff interactions",
      "Gather service user feedback",
      "Check privacy practices",
      "Review care planning",
      "Assess choice and control",
      "Create improvement plan"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "dignity_audit_template",
  },
  {
    auditName: "Finance Audit",
    auditCategory: "quarterly",
    description: "Audit of service user finances and financial management",
    tooltip: "Check financial records, receipts, authorizations, and safeguarding of service user money. Ensure transparent and accountable financial management.",
    processSteps: JSON.stringify([
      "Review financial records",
      "Check receipts and authorizations",
      "Audit cash handling procedures",
      "Review financial policies",
      "Check safeguarding measures",
      "Identify discrepancies"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "finance_audit_template",
  },
  {
    auditName: "Complaints Audit",
    auditCategory: "quarterly",
    description: "Audit of complaints handling and learning from feedback",
    tooltip: "Review complaints log, response times, investigation quality, outcomes, and lessons learned. Ensure accessible and effective complaints procedures.",
    processSteps: JSON.stringify([
      "Review complaints log",
      "Check response times",
      "Assess investigation quality",
      "Review outcomes and actions",
      "Identify themes and trends",
      "Implement improvements"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "complaints_audit_template",
  },
  
  // Operational Audits (As Needed)
  {
    auditName: "Missed and Late Calls",
    auditCategory: "operational",
    description: "Audit of missed and late care visits (domiciliary care)",
    tooltip: "Review call monitoring systems, missed call logs, reasons for lateness, and communication with service users. Assess impact and implement improvements.",
    processSteps: JSON.stringify([
      "Review call monitoring data",
      "Analyze missed/late calls",
      "Identify root causes",
      "Check communication logs",
      "Assess impact on service users",
      "Implement preventive measures"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "missed_calls_template",
  },
  {
    auditName: "Weight Analysis",
    auditCategory: "operational",
    description: "Monitoring and analysis of service user weight changes",
    tooltip: "Track weight changes, identify significant losses or gains, review nutritional support, and escalate concerns appropriately.",
    processSteps: JSON.stringify([
      "Review weight records",
      "Identify significant changes",
      "Check nutritional assessments",
      "Review food and fluid charts",
      "Escalate concerns to GP/dietitian",
      "Implement support plans"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "weight_analysis_template",
  },
  {
    auditName: "Skin Integrity",
    auditCategory: "operational",
    description: "Audit of pressure care and skin integrity management",
    tooltip: "Review pressure ulcer risk assessments, repositioning charts, pressure-relieving equipment, and wound management. Ensure preventive measures are in place.",
    processSteps: JSON.stringify([
      "Review risk assessments",
      "Check repositioning charts",
      "Audit equipment provision",
      "Review wound care plans",
      "Check documentation quality",
      "Implement prevention strategies"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "skin_integrity_template",
  },
  {
    auditName: "Kitchen/Catering",
    auditCategory: "operational",
    description: "Audit of kitchen hygiene, food safety, and catering standards",
    tooltip: "Check food hygiene ratings, temperature monitoring, food storage, cleaning schedules, and staff food hygiene training.",
    processSteps: JSON.stringify([
      "Review food hygiene rating",
      "Check temperature logs",
      "Audit food storage",
      "Review cleaning schedules",
      "Check staff training",
      "Identify improvement areas"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "kitchen_audit_template",
  },
  {
    auditName: "Dining Experience",
    auditCategory: "operational",
    description: "Audit of mealtime experience, choice, and quality",
    tooltip: "Assess food quality, choice, presentation, mealtime environment, assistance provided, and service user satisfaction.",
    processSteps: JSON.stringify([
      "Observe mealtimes",
      "Assess food quality",
      "Check menu choice",
      "Review assistance provided",
      "Gather service user feedback",
      "Implement improvements"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "dining_experience_template",
  },
  {
    auditName: "Manager Walkabout",
    auditCategory: "operational",
    description: "Regular manager walkabout to observe practice and environment",
    tooltip: "Conduct regular walkabouts to observe staff practice, environment, service user wellbeing, and identify immediate concerns or improvements needed.",
    processSteps: JSON.stringify([
      "Observe staff interactions",
      "Check environment quality",
      "Speak with service users",
      "Identify immediate concerns",
      "Provide feedback to staff",
      "Document findings and actions"
    ]),
    recommendedFrequency: "weekly",
    isAiPowered: false,
    templateReference: "manager_walkabout_template",
  },
  {
    auditName: "Night Visits",
    auditCategory: "operational",
    description: "Night-time audit of care practices and staffing",
    tooltip: "Conduct unannounced night visits to check staffing levels, staff alertness, care practices, and service user safety during night hours.",
    processSteps: JSON.stringify([
      "Conduct unannounced visit",
      "Check staffing levels",
      "Observe care practices",
      "Review night records",
      "Check service user safety",
      "Provide feedback"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "night_visits_template",
  },
  {
    auditName: "Call Bell Analysis",
    auditCategory: "operational",
    description: "Analysis of call bell response times and patterns",
    tooltip: "Review call bell data to assess response times, peak periods, and service user satisfaction. Identify staffing or practice improvements needed.",
    processSteps: JSON.stringify([
      "Review call bell data",
      "Analyze response times",
      "Identify peak periods",
      "Assess staffing adequacy",
      "Gather service user feedback",
      "Implement improvements"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "call_bell_template",
  },
  {
    auditName: "Senior Manager QA",
    auditCategory: "operational",
    description: "Senior management quality assurance visit and audit",
    tooltip: "Comprehensive quality assurance visit by senior management to assess overall service quality, compliance, and leadership effectiveness.",
    processSteps: JSON.stringify([
      "Review key performance indicators",
      "Conduct staff interviews",
      "Review documentation",
      "Observe care practices",
      "Assess leadership quality",
      "Create action plan"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "senior_qa_template",
  },
  {
    auditName: "NMC Checks",
    auditCategory: "operational",
    description: "Nursing and Midwifery Council registration checks for nurses",
    tooltip: "Verify all nurses have current NMC registration (PIN), check revalidation dates, and ensure no restrictions or conditions on practice.",
    processSteps: JSON.stringify([
      "List all registered nurses",
      "Check NMC registration status",
      "Verify PIN numbers",
      "Check revalidation dates",
      "Identify expiring registrations",
      "Ensure compliance"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "nmc_checks_template",
  },
  {
    auditName: "Driving License & Insurance Checks",
    auditCategory: "operational",
    description: "Checks of staff driving licenses and business insurance",
    tooltip: "For staff who drive for work, verify valid driving licenses, appropriate business insurance, and vehicle roadworthiness (MOT).",
    processSteps: JSON.stringify([
      "Identify staff who drive",
      "Check driving license validity",
      "Verify business insurance",
      "Check MOT certificates",
      "Review driving policies",
      "Update records"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "driving_checks_template",
  },
  {
    auditName: "Safe Contents",
    auditCategory: "operational",
    description: "Audit of safe contents and security",
    tooltip: "Check safe contents match records, verify security procedures, and ensure proper documentation of service user valuables and controlled drugs.",
    processSteps: JSON.stringify([
      "Check safe contents",
      "Verify against records",
      "Review security procedures",
      "Check controlled drugs",
      "Review valuables log",
      "Identify discrepancies"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "safe_contents_template",
  },
  {
    auditName: "First Aid Box",
    auditCategory: "operational",
    description: "Audit of first aid box contents and expiry dates",
    tooltip: "Check first aid boxes are fully stocked, items are in date, and boxes are easily accessible. Ensure first aiders are trained and identified.",
    processSteps: JSON.stringify([
      "Check box contents",
      "Verify expiry dates",
      "Assess accessibility",
      "Check first aider training",
      "Restock as needed",
      "Update records"
    ]),
    recommendedFrequency: "monthly",
    isAiPowered: false,
    templateReference: "first_aid_template",
  },
  {
    auditName: "Body Fluid Spillage Kits",
    auditCategory: "operational",
    description: "Audit of body fluid spillage kit availability and contents",
    tooltip: "Check spillage kits are available, fully stocked, in date, and staff know how to use them. Ensure compliance with infection control standards.",
    processSteps: JSON.stringify([
      "Check kit locations",
      "Verify contents",
      "Check expiry dates",
      "Assess staff knowledge",
      "Restock as needed",
      "Update records"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "spillage_kit_template",
  },
  {
    auditName: "Burns Kit",
    auditCategory: "operational",
    description: "Audit of burns kit availability and contents",
    tooltip: "Check burns kits are available in kitchens and other high-risk areas, fully stocked, in date, and staff are trained in burn first aid.",
    processSteps: JSON.stringify([
      "Check kit locations",
      "Verify contents",
      "Check expiry dates",
      "Assess staff training",
      "Restock as needed",
      "Update records"
    ]),
    recommendedFrequency: "quarterly",
    isAiPowered: false,
    templateReference: "burns_kit_template",
  },
];

async function seedData() {
  try {
    console.log("Starting seed data insertion...");

    // Insert service user compliance sections
    console.log("Inserting service user compliance sections...");
    for (const section of serviceUserSections) {
      await db.insert(complianceSections).values(section);
    }
    console.log(`✓ Inserted ${serviceUserSections.length} service user compliance sections`);

    // Insert staff compliance sections
    console.log("Inserting staff compliance sections...");
    for (const section of staffSections) {
      await db.insert(complianceSections).values(section);
    }
    console.log(`✓ Inserted ${staffSections.length} staff compliance sections`);

    // Insert audit types
    console.log("Inserting audit types...");
    for (const auditType of auditTypesData) {
      await db.insert(auditTypes).values(auditType);
    }
    console.log(`✓ Inserted ${auditTypesData.length} audit types`);

    console.log("\n✅ Seed data insertion completed successfully!");
    console.log(`Total sections: ${serviceUserSections.length + staffSections.length}`);
    console.log(`Total audit types: ${auditTypesData.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

seedData()
  .then(() => {
    console.log("Seed script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
