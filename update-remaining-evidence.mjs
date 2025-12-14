import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Updating remaining service user questions with detailed evidence requirements...\n');

// Evidence mappings for remaining service user sections
const evidenceMappings = {
  // SECTION 4: Nutrition & Hydration (10 questions)
  '4.1': {
    evidenceReq: 'Current menu showing variety of meal options, dietary choices (vegetarian, cultural, religious), and evidence of menu planning process involving service users.',
    exampleEvid: 'Weekly menu displaying: breakfast options (cereals, cooked breakfast, continental), lunch choices (meat, fish, vegetarian), dinner selections, cultural meal options (halal, kosher), seasonal variations, and evidence of service user consultation in menu planning (feedback forms, residents\' meetings minutes).'
  },
  '4.2': {
    evidenceReq: 'Policy or procedure document confirming 24-hour access to food and fluids, kitchen accessibility arrangements, and staff training records on food preparation.',
    exampleEvid: 'Nutrition policy stating: kitchen accessible 24/7 or secure food storage in communal areas, staff trained in food hygiene and preparation, availability of snacks/drinks outside meal times, night staff access to facilities for preparing hot drinks and light meals.'
  },
  '4.3': {
    evidenceReq: 'Individual nutritional support plans containing: known allergies, food preferences, dislikes, cultural/religious dietary requirements, and IDDSI (International Dysphagia Diet Standardisation Initiative) levels where applicable.',
    exampleEvid: 'Nutritional care plan documenting: \"No known allergies\" or specific allergies listed (nuts, dairy, gluten), food preferences (likes fish, dislikes mushrooms), cultural needs (halal meat, no pork), IDDSI level if required (Level 4 pureed, Level 1 thin liquids), portion size preferences.'
  },
  '4.4': {
    evidenceReq: 'Nutritional support plans incorporating professional dietary advice from: dietician assessments, Speech and Language Therapy (SALT) recommendations, or other specialist input, with dates of assessments and review dates.',
    exampleEvid: 'Care plan section containing: dietician report dated within last 6 months with specific dietary recommendations, SALT assessment detailing swallowing difficulties and safe food/fluid consistencies, implementation plan showing how professional advice is followed in daily practice.'
  },
  '4.5': {
    evidenceReq: 'Nutritional support plans documenting MUST (Malnutrition Universal Screening Tool) score, risk category (low/medium/high), and specific actions to address identified nutritional risks.',
    exampleEvid: 'MUST assessment showing: calculated score (0=low risk, 1=medium risk, 2+=high risk), risk category clearly stated, action plan detailing: food fortification, supplement drinks, increased meal frequency, referral to dietician, weight monitoring schedule.'
  },
  '4.6': {
    evidenceReq: 'Completed MUST assessment tools for each service user requiring nutritional monitoring, showing: calculation workings, BMI, weight loss percentage, acute disease effect score, and evidence of monthly reviews or reviews following change in condition.',
    exampleEvid: 'MUST form containing: current weight and height measurements, BMI calculation, percentage weight loss over 3-6 months, acute disease score if applicable, total MUST score, date completed, staff signature, evidence of monthly review dates or re-assessment following illness/hospital admission.'
  },
  '4.7': {
    evidenceReq: 'Displayed menu that is current (showing correct week/date), clearly visible to service users and visitors, and accurately reflects meals being served.',
    exampleEvid: 'Menu board or printed menu displayed in communal dining area showing: current week dates, daily meal options matching what is actually served, special dietary options clearly marked, updated regularly to reflect seasonal changes or special occasions.'
  },
  '4.8': {
    evidenceReq: 'Service user feedback records, meeting minutes, or care plan notes evidencing that individual food and drink requests are accommodated.',
    exampleEvid: 'Residents\' meeting minutes recording discussion of menu preferences, care plan notes stating individual requests (\"prefers Earl Grey tea\", \"likes decaf coffee after 2pm\"), kitchen records showing stock of specialist items, feedback forms showing requests have been actioned.'
  },
  '4.9': {
    evidenceReq: 'Observation records or quality monitoring notes documenting mealtime experience including: dining environment, staff interaction, support provided, use of adaptive equipment, and service user engagement.',
    exampleEvid: 'Mealtime observation form noting: calm and unhurried atmosphere, appropriate music/noise levels, staff sitting with service users during meals, use of adapted cutlery/crockery where needed, show plates used for choice, table settings appropriate, staff promoting independence whilst offering assistance as needed.'
  },

  // SECTION 5: Activities (4 questions)
  '5.1': {
    evidenceReq: 'Individual activity plans showing: person\'s interests, hobbies, preferred activities, frequency of participation, and evidence of regular review.',
    exampleEvid: 'Activity care plan documenting: life history (former occupation, hobbies, interests), current activity preferences (gardening, music, reading), planned activities schedule (bingo Tuesdays, exercise class Thursdays), one-to-one activity time, community access plans, review dates showing quarterly updates.'
  },
  '5.2': {
    evidenceReq: 'Activity programme or schedule showing variety of activities offered, including: group activities, one-to-one sessions, community access, and activities suitable for different ability levels.',
    exampleEvid: 'Monthly activity calendar displaying: daily group activities (arts/crafts, quizzes, music sessions), weekly outings (garden centre, café visits), one-to-one time slots, activities for varying abilities (seated exercise, reminiscence, sensory activities), evening/weekend activities, special events.'
  },
  '5.3': {
    evidenceReq: 'Activity participation records showing: which service users attended activities, level of engagement, enjoyment observed, and any barriers to participation addressed.',
    exampleEvid: 'Activity attendance log recording: date, activity type, names of participants, engagement level (actively participated/observed/declined), notes on enjoyment (\"smiled throughout\", \"requested to do again\"), reasons for non-participation (unwell, preferred to rest), follow-up actions.'
  },
  '5.4': {
    evidenceReq: 'Service user feedback on activities through: verbal feedback records, satisfaction surveys, residents\' meeting minutes, or care plan reviews showing activities are meaningful and enjoyable.',
    exampleEvid: 'Feedback documentation showing: residents\' meeting minutes discussing activity preferences, satisfaction survey results on activity programme, care plan review notes recording service user comments (\"enjoys gardening club\", \"would like more music sessions\"), evidence of changes made based on feedback.'
  },

  // SECTION 6: Health & Wellbeing (15 questions)
  '6.1': {
    evidenceReq: 'Individual health action plans or care plans documenting: known health conditions, symptoms to monitor, healthcare professional involvement, and actions to maintain health and wellbeing.',
    exampleEvid: 'Health section of care plan containing: diagnosed conditions (diabetes, COPD, dementia), monitoring requirements (blood sugar checks, oxygen saturations), healthcare professional input (GP, district nurse, specialist consultants), preventative measures, early warning signs of deterioration.'
  },
  '6.2': {
    evidenceReq: 'Healthcare professional visit records showing: GP reviews, district nurse visits, specialist consultations, dates of visits, advice given, and actions taken.',
    exampleEvid: 'Healthcare visit log documenting: GP annual review date, district nurse wound care visits (dates and treatment provided), chiropodist appointments, optician visits, dentist check-ups, physiotherapy sessions, record of advice given and how implemented in care plan.'
  },
  '6.3': {
    evidenceReq: 'Care plans containing specific guidance on managing health conditions, including: monitoring requirements, signs of deterioration, escalation procedures, and preventative care measures.',
    exampleEvid: 'Condition-specific care plan detailing: diabetes management (blood sugar monitoring frequency, target ranges, hypo/hyper symptoms, treatment protocol), COPD management (inhaler regime, breathlessness management, when to seek medical help), dementia care (communication strategies, behaviour triggers, calming techniques).'
  },
  '6.4': {
    evidenceReq: 'Records of health monitoring including: vital signs observations (blood pressure, temperature, pulse, respirations), weight monitoring, fluid balance charts, food intake records, where clinically indicated.',
    exampleEvid: 'Monitoring charts showing: weekly weight records with trend analysis, daily fluid balance charts for at-risk individuals, food intake monitoring for nutritional concerns, vital signs observations with normal ranges indicated, dates and staff signatures, evidence of escalation when outside normal parameters.'
  },
  '6.5': {
    evidenceReq: 'Continence assessment and management plans documenting: continence status, type of products used, toileting routine, skin integrity checks, and dignity considerations.',
    exampleEvid: 'Continence care plan containing: continence assessment outcome, product type and size, toileting schedule (prompted every 2 hours), night-time routine, skin care regime, dignity measures (door closed, appropriate language), review dates, evidence of specialist continence nurse involvement if needed.'
  },
  '6.6': {
    evidenceReq: 'Tissue viability assessments and care plans for service users at risk of or with pressure damage, including: Waterlow score, repositioning schedule, pressure-relieving equipment, skin inspection routine.',
    exampleEvid: 'Pressure care plan documenting: Waterlow score calculation, risk level (low/medium/high/very high), repositioning schedule (2-hourly turns, position chart), pressure-relieving equipment in use (air mattress, cushions), skin inspection frequency, body map showing any existing pressure areas, wound care regime if applicable.'
  },
  '6.7': {
    evidenceReq: 'Falls risk assessments and falls prevention care plans showing: falls risk score, identified risk factors, preventative measures, post-falls protocol, and equipment provided.',
    exampleEvid: 'Falls care plan containing: falls risk assessment score, risk factors identified (poor mobility, postural hypotension, medication side effects), prevention strategies (walking aid provided, non-slip footwear, adequate lighting, call bell within reach), post-falls procedure, lying and standing blood pressure if indicated.'
  },
  '6.8': {
    evidenceReq: 'Mobility assessments and moving and handling care plans documenting: mobility level, equipment required, number of staff needed, transfer techniques, and physiotherapy input.',
    exampleEvid: 'Moving and handling plan detailing: mobility assessment outcome, walking aid type (Zimmer frame, walking stick), transfer method (stand aid, hoist type and sling size), number of carers required (1 person assist, 2 person transfer), specific techniques to use, physiotherapy recommendations, equipment maintenance records.'
  },
  '6.9': {
    evidenceReq: 'Oral health assessments and mouth care plans showing: dental health status, denture care requirements, mouth care routine, and dental professional involvement.',
    exampleEvid: 'Oral care plan documenting: oral health assessment findings, natural teeth or dentures, mouth care routine (frequency, products used), denture cleaning regime, dental check-up dates, referral to dentist if concerns identified, special considerations (dry mouth, swallowing difficulties affecting oral care).'
  },
  '6.10': {
    evidenceReq: 'Sensory impairment assessments and support plans for service users with hearing or visual impairments, including: aids provided, communication strategies, and specialist involvement.',
    exampleEvid: 'Sensory care plan containing: hearing assessment (hearing aid user, type and settings), visual assessment (glasses prescription, visual field limitations), communication strategies (speak clearly facing person, written information in large print), equipment (hearing aid batteries, glasses cleaning), audiology/optician visit records.'
  },
  '6.11': {
    evidenceReq: 'Mental health and wellbeing assessments and support plans documenting: mental health conditions, psychological support provided, mood monitoring, and mental health professional involvement.',
    exampleEvid: 'Mental health care plan detailing: diagnosed conditions (depression, anxiety, dementia-related distress), mood monitoring approach, psychological interventions (reminiscence therapy, validation techniques), mental health professional input (CPN, psychiatrist, psychologist), medication for mental health, activities supporting wellbeing.'
  },
  '6.12': {
    evidenceReq: 'Pain assessment and management plans showing: pain assessment tool used, pain levels recorded, pain relief provided, and effectiveness monitoring.',
    exampleEvid: 'Pain management plan documenting: pain assessment tool (Abbey Pain Scale for non-verbal, numerical rating scale), pain location and description, pain triggers and relieving factors, analgesic regime (regular and PRN medications), non-pharmacological pain relief (positioning, heat pads, distraction), effectiveness reviews.'
  },
  '6.13': {
    evidenceReq: 'End of life care plans and advance care planning documentation showing: service user wishes, DNACPR status, preferred place of care, symptom management, and family involvement.',
    exampleEvid: 'End of life care plan containing: advance care plan discussions recorded, DNACPR form (if in place), preferred place of death, spiritual/cultural wishes, symptom management plan, anticipatory medications prescribed, family contact arrangements, funeral wishes if discussed, regular review dates.'
  },
  '6.14': {
    evidenceReq: 'Hospital transfer records and hospital passports ensuring continuity of care, including: current care needs, medication list, communication needs, and important personal information.',
    exampleEvid: 'Hospital passport document containing: personal details, communication needs (hearing aid, glasses, language), mobility status, continence management, nutritional needs, current medication list, health conditions, allergies, important routines, family contact details, what matters to the person.'
  },
  '6.15': {
    evidenceReq: 'Service user feedback on health and wellbeing support through: care reviews, satisfaction surveys, or recorded conversations showing people feel their health needs are met.',
    exampleEvid: 'Feedback records showing: care plan review meetings with service user/family comments on health care, satisfaction survey responses regarding health support, recorded conversations (\"I feel well looked after\", \"staff help me with my tablets\"), evidence of concerns raised and actions taken.'
  },

  // SECTION 7: Medication Management (9 questions)
  '7.1': {
    evidenceReq: 'Up-to-date medication policy covering: ordering, receipt, storage, administration, recording, disposal, and staff competency requirements, reviewed within last 12-24 months.',
    exampleEvid: 'Medication policy document containing: policy review date within last 2 years, sections covering entire medication cycle (ordering from pharmacy, checking deliveries, storage temperatures, administration procedures, recording requirements, returns and disposal), staff competency assessment requirements, audit schedule, version control.'
  },
  '7.2': {
    evidenceReq: 'Medication Administration Records (MARs) showing: legible entries, all administrations signed, gaps explained with codes, allergies recorded, photographs present, and regular audits completed.',
    exampleEvid: 'MAR chart containing: service user photograph, known allergies clearly recorded, medication details (name, strength, dose, route, frequency), administration signatures in all boxes or explanation codes for gaps (R=refused, H=hospital, NH=not required), running balance for controlled drugs, monthly audit signature.'
  },
  '7.3': {
    evidenceReq: 'Medication storage arrangements showing: locked storage (cabinet/trolley/room), temperature monitoring records, controlled drugs register, and separation of internal/external medications.',
    exampleEvid: 'Medication storage meeting requirements: lockable medication trolley or cabinet, fridge temperature log (2-8°C checked daily), room temperature log if required, controlled drugs stored in separate locked cupboard within locked storage, CD register with running balances, clear separation of different service users\' medications.'
  },
  '7.4': {
    evidenceReq: 'Controlled drugs management records including: controlled drugs register with running balances, two-signature administration, regular stock checks, and disposal records.',
    exampleEvid: 'CD register documenting: drug name and strength, date and time of administration, dose given, two staff signatures, running balance calculated after each entry, stock check signatures (weekly minimum), disposal records with two signatures and witness details, no unexplained discrepancies.'
  },
  '7.5': {
    evidenceReq: 'PRN (as required) medication protocols specifying: circumstances for use, maximum dose/frequency, non-pharmacological interventions tried first, and effectiveness monitoring.',
    exampleEvid: 'PRN protocol for each as-required medication detailing: specific symptoms/situations requiring PRN (pain score above 3, anxiety symptoms, constipation), non-drug interventions to try first (repositioning, reassurance, offering fluids), maximum dose in 24 hours, minimum time between doses, how to assess effectiveness, when to seek medical review.'
  },
  '7.6': {
    evidenceReq: 'Covert medication administration records (if applicable) showing: mental capacity assessment, best interests decision, prescriber approval, pharmacy involvement, and regular reviews.',
    exampleEvid: 'Covert medication documentation containing: mental capacity assessment for medication decision, best interests meeting minutes with family/professionals, GP written authorisation for covert administration, pharmacist advice on suitable medications and administration method, care plan detailing how medication is disguised, monthly review of continued necessity.'
  },
  '7.7': {
    evidenceReq: 'Staff medication competency records showing: initial training, competency assessment, supervision of practice, and regular updates/refresher training.',
    exampleEvid: 'Staff training matrix showing: medication administration training completion date, competency assessment passed (observed practice, written test), supervision records (medication rounds observed by senior staff), annual refresher training, specific training for specialist administration (PEG feeding, insulin, inhalers).'
  },
  '7.8': {
    evidenceReq: 'Medication error reporting and analysis records showing: incident forms completed, investigation undertaken, learning identified, and actions to prevent recurrence.',
    exampleEvid: 'Medication error documentation containing: incident report form detailing error (missed dose, wrong time, wrong person), immediate actions taken, investigation findings, root cause analysis, learning points identified, actions implemented (additional training, procedure changes), staff meeting minutes sharing learning, follow-up audit to check improvements.'
  },
  '7.9': {
    evidenceReq: 'Medication reviews by healthcare professionals showing: GP medication reviews (at least annually), pharmacy input, medication changes documented, and care plan updates following reviews.',
    exampleEvid: 'Healthcare records showing: annual GP medication review date, pharmacy medication review if care home, record of any medication changes (started, stopped, dose altered), rationale for changes documented, MAR chart updated, care plan amended to reflect new regime, family informed of significant changes.'
  },

  // SECTION 8: Safeguarding (23 questions)
  '8.1': {
    evidenceReq: 'Up-to-date safeguarding policy reflecting current legislation (Care Act 2014), local safeguarding procedures, types of abuse, reporting procedures, and staff responsibilities.',
    exampleEvid: 'Safeguarding policy document containing: policy review date within last 12 months, reference to Care Act 2014 and local safeguarding board procedures, definitions of abuse types (physical, emotional, sexual, financial, neglect, discriminatory, institutional), clear reporting flowchart, designated safeguarding lead details, whistleblowing procedures, version control.'
  },
  '8.2': {
    evidenceReq: 'Staff safeguarding training records showing: initial induction training, level-appropriate training (Level 2 minimum for care staff), regular updates, and competency assessment.',
    exampleEvid: 'Training matrix showing: safeguarding adults training completion dates for all staff, training level achieved (Level 2 for care staff, Level 3 for managers), annual refresher training, training content (recognising abuse, reporting procedures, whistleblowing), assessment/quiz results, specific training on MCA/DoLS, financial abuse prevention.'
  },
  '8.3': {
    evidenceReq: 'Safeguarding concern records showing: concerns identified, immediate actions taken, referrals made to local authority, investigation outcomes, and lessons learned.',
    exampleEvid: 'Safeguarding incident file containing: initial concern record (date, nature of concern, person involved), immediate safeguarding actions (separation of alleged perpetrator, medical attention), local authority safeguarding referral form and submission evidence, safeguarding investigation outcome, strategy meeting minutes if held, protection plan implemented, lessons learned and service improvements.'
  },
  '8.4': {
    evidenceReq: 'Whistleblowing policy and evidence that staff know how to raise concerns, including: policy accessibility, staff training, external reporting contacts (CQC, local authority), and protection from detriment.',
    exampleEvid: 'Whistleblowing policy containing: clear definition of whistleblowing, how to raise concerns (line manager, senior management, external bodies), contact details for CQC, local authority, and independent whistleblowing helplines, protection from victimisation statement, staff handbook reference, staff meeting minutes discussing whistleblowing, staff survey showing awareness.'
  },
  '8.5': {
    evidenceReq: 'Deprivation of Liberty Safeguards (DoLS) applications and authorisations showing: DoLS assessments completed, applications submitted to local authority, current authorisations held, and conditions complied with.',
    exampleEvid: 'DoLS documentation containing: DoLS screening assessment, application form submitted to supervisory body with receipt confirmation, current DoLS authorisation certificate with expiry date, any conditions attached to authorisation, evidence conditions are met (e.g., regular reviews, family contact maintained), renewal applications submitted in timely manner.'
  },
  '8.6': {
    evidenceReq: 'Mental Capacity Act assessments showing: decision-specific capacity assessments, two-stage test applied (understand, retain, use/weigh, communicate), assessor details, and review dates.',
    exampleEvid: 'MCA assessment form documenting: specific decision being assessed (consent to care, medication, accommodation), two-stage test applied (can person understand information, retain it, use and weigh it, communicate decision), evidence supporting conclusion, assessor name and role, date of assessment, review date set, how decision will be made if person lacks capacity.'
  },
  '8.7': {
    evidenceReq: 'Best Interests decision records showing: decision required, people consulted, factors considered, least restrictive option chosen, and rationale documented.',
    exampleEvid: 'Best Interests meeting minutes/form containing: decision to be made, MCA assessment confirming lack of capacity, people consulted (family, advocates, professionals), person\'s past and present wishes considered, factors for and against options, least restrictive option selected, rationale for decision, how decision will be implemented, review date, signatures of participants.'
  },
  '8.8': {
    evidenceReq: 'Financial safeguarding procedures and records showing: appointeeship/deputyship arrangements, financial transaction records, receipt books, audit trails, and protection against financial abuse.',
    exampleEvid: 'Financial safeguarding documentation containing: appointee/deputy legal documentation, service user personal allowance records, receipts for purchases, transaction log (date, amount, item, staff signature, service user signature if able), regular financial audits, separation of duties (different staff banking money and recording), family involvement in financial decisions where appropriate.'
  },
  '8.9': {
    evidenceReq: 'Restraint and restrictive practice records showing: risk assessments, least restrictive alternatives considered, legal authority (MCA/DoLS), monitoring, and regular reviews.',
    exampleEvid: 'Restrictive practice documentation containing: risk assessment justifying restriction (bed rails, locked doors, sensor mats), alternatives considered and tried, legal authority (DoLS authorisation, best interests decision), care plan detailing restriction and monitoring requirements, incident records if restriction used, monthly review of continued necessity, reduction plan where possible.'
  },
  '8.10': {
    evidenceReq: 'Safeguarding supervision records for staff showing: regular supervision discussing safeguarding awareness, concerns raised, decision-making, and reflective practice.',
    exampleEvid: 'Supervision notes containing: safeguarding discussion agenda item, staff understanding of safeguarding procedures checked, any concerns discussed, decision-making in complex situations explored, reflective practice on safeguarding scenarios, training needs identified, documentation of supervisor guidance on safeguarding matters.'
  },
  '8.11': {
    evidenceReq: 'Safeguarding audit and quality assurance records showing: regular safeguarding audits, analysis of safeguarding data, trends identified, and service improvements implemented.',
    exampleEvid: 'Safeguarding audit report containing: audit date and scope, number of safeguarding concerns raised, types of abuse identified, outcomes of investigations, themes and trends analysis, comparison with previous periods, action plan for improvements, evidence of learning shared with staff, follow-up audit showing improvements embedded.'
  },
  '8.12': {
    evidenceReq: 'Safeguarding policies covering specific abuse types including: financial abuse prevention, sexual safety, online safety, mate crime, modern slavery, and radicalisation (Prevent).',
    exampleEvid: 'Comprehensive safeguarding framework containing: financial abuse policy (transaction monitoring, appointeeship oversight), sexual safety policy (relationships, consent, privacy), online safety guidance (internet use, social media risks), mate crime awareness, modern slavery indicators and reporting, Prevent duty awareness (radicalisation signs, Channel referral process).'
  },
  '8.13': {
    evidenceReq: 'Safeguarding partnership working records showing: engagement with local safeguarding adults board, multi-agency meetings, information sharing, and collaborative working.',
    exampleEvid: 'Partnership documentation showing: attendance at safeguarding adults board meetings or sub-groups, multi-agency safeguarding meetings for complex cases, information sharing agreements, joint working protocols with police/social services/health, safeguarding adult reviews (SAR) participation if applicable, implementation of SAR recommendations.'
  },
  '8.14': {
    evidenceReq: 'Service user safeguarding awareness and empowerment records showing: accessible safeguarding information, advocacy support, complaints procedure, and evidence people know how to raise concerns.',
    exampleEvid: 'Service user safeguarding information including: easy-read safeguarding leaflets displayed, residents\' meetings discussing safety and raising concerns, advocacy service information provided, complaints procedure in accessible formats, care plan discussions about safety and who to tell if worried, feedback showing people feel safe and know how to report concerns.'
  },
  '8.15': {
    evidenceReq: 'Visitor safeguarding procedures showing: visitor signing-in arrangements, DBS checks for regular visitors, supervision of visits where safeguarding concerns exist, and visitor code of conduct.',
    exampleEvid: 'Visitor management system containing: visitor sign-in book (name, who visiting, time in/out), DBS check records for regular volunteers/contractors, visitor policy including safeguarding responsibilities, supervised visit arrangements where protection plan requires, visitor code of conduct displayed, safeguarding information for visitors.'
  },
  '8.16': {
    evidenceReq: 'Pressure ulcer prevention and management showing this is treated as potential safeguarding concern, including: root cause analysis, safeguarding referral consideration, and prevention strategies.',
    exampleEvid: 'Pressure ulcer management protocol containing: immediate reporting procedure, root cause analysis for all grade 2+ pressure ulcers, safeguarding referral decision-making flowchart, investigation of avoidability, prevention strategies reviewed (repositioning, equipment, nutrition), learning from incidents, pressure ulcer data monitoring and trends.'
  },
  '8.17': {
    evidenceReq: 'Falls management showing serious falls treated as potential safeguarding concern, including: post-falls protocol, investigation, safeguarding consideration, and prevention review.',
    exampleEvid: 'Falls management procedure containing: post-falls assessment (injury check, vital signs, neuro observations if head injury), incident report completion, investigation for all falls causing injury, safeguarding referral consideration (especially repeated falls, unexplained injuries), falls risk assessment review, prevention strategies updated, family notification, GP referral if indicated.'
  },
  '8.18': {
    evidenceReq: 'Safeguarding concerns related to care quality showing: monitoring of care standards, investigation of poor care, safeguarding referrals for neglect/institutional abuse, and service improvements.',
    exampleEvid: 'Quality monitoring showing: care observations identifying concerns (missed care, poor interactions, dignity issues), investigation process, safeguarding referral for institutional abuse/neglect where appropriate, immediate actions (supervision, retraining, disciplinary), service improvements (policy updates, additional training, increased monitoring), follow-up audits confirming improvements.'
  },
  '8.19': {
    evidenceReq: 'Safeguarding in recruitment showing: safer recruitment practices, DBS checks, reference verification, employment history gaps explored, and barred list checks.',
    exampleEvid: 'Recruitment files containing: enhanced DBS certificates dated within last 3 years or DBS update service checks, two references verified (contact with referee confirmed), employment history gaps discussed at interview and documented, barred list check (DBS certificate shows this), proof of identity verified, right to work confirmed, conditional offer pending satisfactory checks.'
  },
  '8.20': {
    evidenceReq: 'Allegations against staff procedures showing: suspension/risk assessment, referral to local authority designated officer (LADO), investigation process, and disciplinary procedures.',
    exampleEvid: 'Allegation management documentation containing: immediate risk assessment (suspension or risk-assessed continuation), LADO referral within 24 hours, safeguarding investigation cooperation, parallel disciplinary investigation, investigation outcome, referral to DBS/professional body if substantiated, learning and service improvements, support for alleged victim.'
  },
  '8.21': {
    evidenceReq: 'Safeguarding policies addressing organisational abuse including: closed culture prevention, whistleblowing encouragement, quality monitoring, and service user involvement.',
    exampleEvid: 'Organisational safeguarding measures showing: open culture promoted (visitors welcomed, relatives encouraged, external professionals access), whistleblowing policy and awareness, regular quality audits (care observations, medication, environment), service user feedback mechanisms (meetings, surveys, advocates), management visibility and accessibility, external scrutiny welcomed (CQC, commissioners).'
  },
  '8.22': {
    evidenceReq: 'Safeguarding training effectiveness monitoring showing: training completion rates, competency assessment, scenario-based learning, and application in practice.',
    exampleEvid: 'Training effectiveness evidence including: training matrix showing 100% staff completion, post-training competency assessment (quiz, scenarios), supervision discussions applying safeguarding knowledge, safeguarding concerns appropriately identified and reported, audit showing good safeguarding practice, staff survey showing confidence in safeguarding procedures.'
  },
  '8.23': {
    evidenceReq: 'Safeguarding continuous improvement showing: lessons learned from incidents, safeguarding adult reviews, best practice implementation, and service development.',
    exampleEvid: 'Continuous improvement documentation showing: lessons learned log from safeguarding incidents, action plans implemented, SAR recommendations actioned if applicable, best practice guidance implemented (NICE, SCIE), safeguarding performance indicators monitored, year-on-year improvements demonstrated, external safeguarding reviews or peer audits, innovation in safeguarding practice.'
  },

  // SECTION 9: Environment & Safety (25 questions)
  '9.1': {
    evidenceReq: 'Health and safety policy complying with Health and Safety at Work Act 1974, covering: risk assessments, accident reporting, fire safety, infection control, and staff responsibilities, reviewed within last 12 months.',
    exampleEvid: 'Health and safety policy document containing: policy review date within last year, reference to Health and Safety at Work Act 1974, sections covering all key areas (risk assessment process, accident/incident reporting, fire safety procedures, infection prevention, COSHH, manual handling, lone working), designated health and safety lead, staff responsibilities, version control.'
  },
  '9.2': {
    evidenceReq: 'Environmental risk assessments covering: building safety, equipment safety, infection control, fire risks, and specific hazards, with control measures and review dates.',
    exampleEvid: 'Risk assessment file containing: premises risk assessment (trip hazards, lighting, flooring, windows, radiators), equipment risk assessments (hoists, baths, kitchen equipment), infection control risk assessment, fire risk assessment, Legionella risk assessment, specific hazard assessments (chemicals, sharps), control measures for each risk, responsible person assigned, review dates (annual minimum or after incidents).'
  },
  '9.3': {
    evidenceReq: 'Fire safety arrangements showing: fire risk assessment, fire detection and alarm system, emergency lighting, fire exits, evacuation plan, and Personal Emergency Evacuation Plans (PEEPs).',
    exampleEvid: 'Fire safety documentation containing: fire risk assessment completed by competent person (within last 12 months), fire alarm system servicing records (6-monthly), emergency lighting testing (monthly), fire exit checks (daily), evacuation procedure displayed, assembly point identified, PEEP for each service user (mobility, communication needs, evacuation method), fire drill records (6-monthly minimum).'
  },
  '9.4': {
    evidenceReq: 'Fire safety equipment maintenance records showing: fire extinguisher servicing, fire alarm testing, emergency lighting testing, and fire door checks.',
    exampleEvid: 'Fire equipment maintenance logs showing: fire extinguisher annual service certificates with next due date, weekly fire alarm call point testing (different call point each week, logged), monthly emergency lighting test (brief test logged), annual emergency lighting full duration test, fire door checks (self-closing mechanism, seals intact, no wedges), fire blanket in kitchen, records signed and dated.'
  },
  '9.5': {
    evidenceReq: 'Fire evacuation drills and staff fire safety training showing: regular fire drills conducted, evacuation times recorded, issues identified and addressed, and staff fire safety training.',
    exampleEvid: 'Fire drill records containing: drill date and time, scenario (day/night, location of fire), evacuation time, staff participation, issues identified (confusion over roles, delayed response), actions taken to address issues, staff fire safety training records (induction and annual refresher), fire warden training for designated staff, PEEP training for staff supporting specific individuals.'
  },
  '9.6': {
    evidenceReq: 'Infection prevention and control policy and procedures covering: hand hygiene, PPE use, cleaning schedules, waste management, and outbreak management, reflecting current guidance.',
    exampleEvid: 'IPC policy and procedures containing: policy review date, hand hygiene procedure (7-step technique), PPE guidance (when to use, donning/doffing), cleaning schedules (daily, weekly, deep clean), colour-coded cleaning equipment, waste segregation (clinical, domestic, sharps), laundry procedures, outbreak management plan, isolation procedures, reference to current guidance (NICE, PHE/UKHSA).'
  },
  '9.7': {
    evidenceReq: 'Infection control audit records showing: hand hygiene audits, environmental cleanliness audits, PPE compliance checks, and actions taken to address issues.',
    exampleEvid: 'IPC audit documentation showing: monthly hand hygiene observation audits (technique, compliance rates), environmental cleanliness audits (scores for different areas), PPE stock checks and usage monitoring, cleaning schedule compliance checks, action plans for areas scoring below target, re-audit showing improvements, infection control link worker/champion involvement.'
  },
  '9.8': {
    evidenceReq: 'Infection outbreak management records showing: outbreak identification, control measures implemented, notifications made, investigation, and learning outcomes.',
    exampleEvid: 'Outbreak management file containing: outbreak definition met (2+ linked cases), outbreak control team convened, control measures implemented (isolation, enhanced cleaning, visitor restrictions, staff cohorting), notifications to PHE/UKHSA, CQC, commissioners, outbreak investigation findings, microbiological results, outbreak declared over criteria, lessons learned and service improvements.'
  },
  '9.9': {
    evidenceReq: 'Water safety management showing: Legionella risk assessment, water temperature monitoring, system flushing records, and remedial actions.',
    exampleEvid: 'Water safety documentation containing: Legionella risk assessment by competent person (reviewed annually), water temperature monitoring logs (hot water >50°C at outlets, cold water <20°C), weekly flushing of little-used outlets, monthly shower head descaling, annual tank inspection, remedial actions for out-of-range temperatures, responsible person assigned.'
  },
  '9.10': {
    evidenceReq: 'Gas and electrical safety certificates showing: annual gas safety certificate, 5-yearly electrical installation certificate, PAT testing records, and remedial works completed.',
    exampleEvid: 'Utilities safety records containing: current gas safety certificate (annual, within last 12 months), electrical installation condition report (5-yearly, in date), PAT testing records (annual for care equipment), gas appliance servicing (boilers, cookers), electrical equipment safety checks, any remedial works identified completed promptly, certificates from qualified engineers (Gas Safe, NICEIC).'
  },
  '9.11': {
    evidenceReq: 'Maintenance and servicing records for equipment showing: hoists, profiling beds, baths, kitchen equipment, and wheelchairs serviced according to manufacturer guidance.',
    exampleEvid: 'Equipment maintenance logs showing: hoist servicing (6-monthly LOLER inspection), profiling bed servicing (annual), bath servicing (annual), kitchen equipment servicing (annual gas/electrical checks), wheelchair checks, call bell system testing, lift servicing (if applicable), maintenance contracts in place, service certificates filed, defects identified and rectified.'
  },
  '9.12': {
    evidenceReq: 'COSHH (Control of Substances Hazardous to Health) risk assessments and safety data sheets for chemicals used, with control measures and staff training.',
    exampleEvid: 'COSHH documentation containing: inventory of hazardous substances (cleaning chemicals, medications, healthcare products), COSHH risk assessment for each substance, safety data sheets filed, control measures (PPE, ventilation, storage), COSHH training for staff, locked storage for chemicals, spillage procedures, disposal procedures.'
  },
  '9.13': {
    evidenceReq: 'Accident and incident reporting records showing: incident forms completed, investigation undertaken, immediate actions, and preventative measures implemented.',
    exampleEvid: 'Incident management system showing: incident report form for all accidents/incidents (falls, medication errors, injuries, near misses), investigation completed (root cause analysis), immediate actions taken (first aid, medical review), preventative measures identified (risk assessment review, environmental changes, additional training), trends analysis, learning shared with staff, serious incidents reported to CQC.'
  },
  '9.14': {
    evidenceReq: 'Food safety management showing: food hygiene rating, temperature monitoring, cleaning schedules, staff food hygiene training, and allergen management.',
    exampleEvid: 'Food safety documentation containing: current food hygiene rating (displayed), food safety management system (Safer Food Better Business or equivalent), fridge/freezer temperature logs (daily), cooking temperature records, cleaning schedules, staff food hygiene certificates (Level 2 minimum), allergen information available, pest control contract and visit records.'
  },
  '9.15': {
    evidenceReq: 'Waste management procedures showing: clinical waste segregation, sharps disposal, domestic waste, confidential waste, and waste collection records.',
    exampleEvid: 'Waste management system containing: colour-coded waste bins (orange/yellow for clinical, black for domestic), sharps boxes (not over-filled, dated, signed when sealed), confidential waste shredding or secure collection, waste collection records, waste transfer notes, staff training on waste segregation, spillage procedures.'
  },
  '9.16': {
    evidenceReq: 'Environmental cleanliness standards showing: cleaning schedules, cleaning records, deep cleaning programme, and environmental audits.',
    exampleEvid: 'Cleaning management showing: daily cleaning schedules for all areas, cleaning record sheets signed by cleaners, weekly/monthly deep cleaning schedule, colour-coded cleaning equipment (red-bathrooms, blue-general, green-kitchen, yellow-isolation), environmental cleanliness audits, cleaning product specifications, cleaning staff training, cleaning contracts if external provider.'
  },
  '9.17': {
    evidenceReq: 'Premises maintenance records showing: planned preventative maintenance, reactive maintenance, building repairs, and safety checks.',
    exampleEvid: 'Maintenance management system showing: planned preventative maintenance schedule (annual boiler service, gutter cleaning, window cleaning, decoration), reactive maintenance log (repairs requested and completed), building safety checks (roof, gutters, external areas), contractor records, maintenance contracts, health and safety compliance checks.'
  },
  '9.18': {
    evidenceReq: 'Security arrangements showing: visitor management, door entry systems, CCTV (if used), missing person procedures, and night security.',
    exampleEvid: 'Security measures documentation containing: visitor signing-in system, door entry system/keypads, CCTV policy and signage if used, missing person procedure, night security arrangements (locked doors, staff presence, call systems), personal belongings security, cash handling procedures, lone working policy.'
  },
  '9.19': {
    evidenceReq: 'Emergency planning and business continuity showing: emergency plan covering utilities failure, severe weather, pandemic, evacuation, and staff shortages.',
    exampleEvid: 'Emergency preparedness documentation containing: business continuity plan covering scenarios (power cut, water loss, heating failure, gas leak, flood, snow, pandemic, fire evacuation, IT failure), emergency contact numbers, mutual aid arrangements, emergency supplies (torches, blankets, bottled water), staff call-in procedures, communication plan, plan tested and reviewed annually.'
  },
  '9.20': {
    evidenceReq: 'Environmental adaptations and accessibility showing: premises suitable for service users\' needs, accessibility features, and equipment provided.',
    exampleEvid: 'Premises suitability assessment showing: wheelchair accessibility (ramps, wide doorways, accessible toilets), grab rails and handrails, appropriate flooring (non-slip, suitable for walking aids), adequate lighting, call bell system in all areas, accessible bathrooms (walk-in showers, baths with hoists), signage (large print, pictorial), sensory considerations (noise, lighting, colour contrast).'
  },
  '9.21': {
    evidenceReq: 'Health and safety training records showing: staff induction health and safety training, annual refreshers, and role-specific training (fire safety, manual handling, infection control).',
    exampleEvid: 'Health and safety training matrix showing: induction health and safety training for all new staff, annual refresher training, fire safety training (annual), manual handling training (annual), infection control training (annual), first aid trained staff, health and safety responsibilities training for managers, training effectiveness assessment, competency checks.'
  },
  '9.22': {
    evidenceReq: 'Health and safety consultation and communication showing: staff health and safety meetings, risk assessment involvement, safety suggestions scheme, and safety information sharing.',
    exampleEvid: 'Health and safety consultation evidence showing: health and safety agenda item in staff meetings, staff involvement in risk assessments, safety suggestion box or scheme, health and safety notice board, safety alerts circulated to staff, health and safety representative or committee if applicable, staff survey on safety culture.'
  },
  '9.23': {
    evidenceReq: 'External health and safety inspections and compliance showing: environmental health visits, fire authority inspections, HSE inspections, and actions completed.',
    exampleEvid: 'External inspection records showing: environmental health inspection reports with food hygiene rating, fire authority inspection reports and recommendations, HSE inspection reports if applicable, improvement notices and actions completed, compliance certificates, correspondence with regulatory bodies, evidence of ongoing compliance.'
  },
  '9.24': {
    evidenceReq: 'Personal protective equipment (PPE) provision and training showing: PPE stock availability, staff training on correct use, and PPE audits.',
    exampleEvid: 'PPE management showing: adequate PPE stock (gloves, aprons, masks, eye protection), PPE storage accessible to staff, staff training on donning and doffing PPE, PPE size availability, PPE audit showing correct usage, PPE waste disposal procedures, PPE during infection outbreaks, fit testing for FFP3 masks if required.'
  },
  '9.25': {
    evidenceReq: 'Health and safety performance monitoring showing: accident/incident trends, audit results, compliance rates, and continuous improvement actions.',
    exampleEvid: 'Health and safety performance dashboard showing: accident/incident statistics (numbers, types, trends), audit compliance scores (IPC, fire safety, environmental), training compliance rates, action plan progress, year-on-year improvements, benchmarking against sector standards, board/management reporting, continuous improvement initiatives, external accreditations (e.g., RoSPA).'
  },

  // SECTION 15: Complaints & Feedback (7 questions)
  '15.1': {
    evidenceReq: 'Complaints policy and procedure accessible to service users and families, showing: how to complain, timescales, investigation process, and escalation to external bodies.',
    exampleEvid: 'Complaints policy document containing: policy review date, how to make a complaint (verbal, written, online), who to complain to (manager, provider), timescales for response (acknowledgment within 3 days, full response within 28 days), investigation process, right to escalate to Local Government Ombudsman/CQC, accessible formats available (easy read, large print), displayed prominently.'
  },
  '15.2': {
    evidenceReq: 'Complaints log showing: all complaints recorded, nature of complaint, investigation undertaken, outcome, and actions taken, with evidence of learning.',
    exampleEvid: 'Complaints register containing: complaint reference number, date received, complainant details, nature of complaint, investigation process documented, outcome (upheld, partially upheld, not upheld), response sent to complainant, actions taken to address issues, learning identified, changes implemented, timescales met, follow-up to ensure resolution.'
  },
  '15.3': {
    evidenceReq: 'Compliments and positive feedback records showing: compliments received, themes identified, and recognition of good practice.',
    exampleEvid: 'Compliments log documenting: compliments received (letters, cards, emails, verbal), date and source, nature of compliment, staff/service praised, compliments shared with staff (meetings, notice board, newsletters), themes identified (excellent care, kind staff, good food), used in recruitment/marketing with consent, staff recognition and motivation.'
  },
  '15.4': {
    evidenceReq: 'Service user and family feedback mechanisms showing: satisfaction surveys, residents\' meetings, suggestion boxes, and feedback analysis.',
    exampleEvid: 'Feedback systems including: annual satisfaction surveys (service users and families), survey results analysis, residents\' meetings (monthly minimum, minutes recorded), suggestion box available, feedback forms accessible, \"you said, we did\" displays showing actions from feedback, feedback themes identified, service improvements implemented.'
  },
  '15.5': {
    evidenceReq: 'Complaints investigation records showing: thorough investigation, evidence gathered, witness statements, findings, and fair outcomes.',
    exampleEvid: 'Investigation file containing: complaint details, investigation plan, evidence gathered (care records, rotas, witness statements, CCTV if relevant), timeline of events, findings against each complaint point, conclusion (upheld/not upheld with rationale), response letter to complainant, actions to prevent recurrence, learning shared with staff.'
  },
  '15.6': {
    evidenceReq: 'Advocacy support information showing: independent advocacy services available, how to access advocates, and evidence of advocacy involvement.',
    exampleEvid: 'Advocacy information including: advocacy service contact details displayed, advocacy leaflets available, care plans noting advocacy involvement, advocates attending care reviews/best interests meetings, advocacy referrals made when needed, advocacy support for complaints, evidence of independent advocacy for those lacking capacity.'
  },
  '15.7': {
    evidenceReq: 'Complaints trend analysis and learning showing: regular analysis of complaints, themes identified, service improvements, and governance oversight.',
    exampleEvid: 'Complaints analysis reports showing: quarterly/annual complaints analysis, themes and trends identified (staffing, communication, care quality), comparison with previous periods, root cause analysis, action plans to address recurring issues, service improvements implemented, governance reporting (board/management meetings), external reporting to commissioners/CQC, evidence of reduced complaints in problem areas.'
  },

  // SECTION 16: Quality Assurance (8 questions)
  '16.1': {
    evidenceReq: 'Quality assurance framework showing: audit schedule, quality monitoring tools, performance indicators, and governance structure.',
    exampleEvid: 'Quality assurance system containing: annual audit schedule (care plans, medication, infection control, health and safety, safeguarding), quality monitoring tools (observation frameworks, audit checklists), key performance indicators (KPIs) defined (falls, pressure ulcers, complaints, staff turnover), governance structure (quality committee, board reporting), responsibility assignments.'
  },
  '16.2': {
    evidenceReq: 'Care plan audits showing: regular audits of care planning quality, compliance with standards, issues identified, and improvements made.',
    exampleEvid: 'Care plan audit reports containing: audit date and sample size, audit tool/criteria used, compliance scores for each standard (person-centred, up-to-date, risk assessed, reviewed), issues identified (missing information, out-of-date reviews, lack of person-centredness), action plan with timescales, re-audit showing improvements, individual feedback to care plan authors.'
  },
  '16.3': {
    evidenceReq: 'Medication audits showing: regular medication administration audits, storage checks, MAR chart audits, and actions to address errors.',
    exampleEvid: 'Medication audit documentation showing: monthly MAR chart audits (signatures present, gaps explained, allergies recorded), medication storage audits (temperatures, security, stock rotation), administration observation audits, controlled drugs checks, audit findings (errors, omissions, good practice), action plans, individual staff feedback, competency reassessment if needed, re-audit confirming improvements.'
  },
  '16.4': {
    evidenceReq: 'Infection control audits showing: hand hygiene compliance, environmental cleanliness, PPE usage, and infection rates monitoring.',
    exampleEvid: 'IPC audit records showing: monthly hand hygiene audits (observation of technique and compliance), environmental cleanliness scores by area, PPE compliance checks, infection rates monitored (UTIs, respiratory, gastro, skin infections), audit results analysed, action plans for low scores, infection control link worker involvement, comparison with national benchmarks.'
  },
  '16.5': {
    evidenceReq: 'Health and safety audits showing: environmental safety checks, equipment checks, fire safety audits, and compliance monitoring.',
    exampleEvid: 'Health and safety audit programme showing: monthly environmental safety walkabouts (trip hazards, lighting, cleanliness), equipment safety checks (hoists, beds, call bells), fire safety audits (exits clear, extinguishers in date, drills completed), accident/incident analysis, audit findings and risk ratings, action plans with responsible persons and deadlines, governance reporting.'
  },
  '16.6': {
    evidenceReq: 'Service user experience monitoring showing: care observations, dignity audits, mealtime observations, and activity participation monitoring.',
    exampleEvid: 'Experience monitoring tools including: regular care observations using frameworks (e.g., observing residents\' experience tool), dignity and respect audits, mealtime experience observations, activity participation records, feedback from service users and families, observation findings (positive practice and areas for improvement), action plans, staff feedback and training.'
  },
  '16.7': {
    evidenceReq: 'Quality improvement plans showing: areas for improvement identified, SMART action plans, progress monitoring, and outcomes achieved.',
    exampleEvid: 'Quality improvement documentation containing: improvement priorities identified (from audits, feedback, incidents, CQC reports), SMART action plans (Specific, Measurable, Achievable, Relevant, Time-bound), responsible persons assigned, progress tracking (RAG rated), evidence of actions completed, outcomes measured (re-audit scores, KPI improvements, feedback improvements), governance oversight, celebration of improvements.'
  },
  '16.8': {
    evidenceReq: 'Governance and oversight records showing: management meetings, board meetings, quality reports, performance dashboards, and strategic planning.',
    exampleEvid: 'Governance documentation showing: regular management meetings (weekly/monthly) with minutes, board/trustee meetings (quarterly minimum), quality and safety reports to governance, performance dashboards (KPIs, audit results, incidents, complaints), risk register reviewed, strategic plans and business plans, external quality reviews (commissioner visits, peer reviews), CQC engagement, continuous improvement culture.'
  },

  // SECTION 20: Mental Health (5 questions)
  '20.1': {
    evidenceReq: 'Mental health assessments and support plans for service users with mental health needs, showing: assessment tools used, mental health conditions identified, support strategies, and professional involvement.',
    exampleEvid: 'Mental health care plan containing: mental health assessment (depression screening, anxiety assessment, dementia-related distress), diagnosed conditions, psychological support strategies (validation therapy, cognitive stimulation, reminiscence), mental health professional input (CPN, psychiatrist, psychologist), medication for mental health conditions, mood monitoring approach, crisis management plan.'
  },
  '20.2': {
    evidenceReq: 'Records of mental health specialist service involvement showing: referrals made, appointments attended, specialist advice received, and implementation in care plans.',
    exampleEvid: 'Mental health service records showing: referral to psychiatrist/psychologist/CPN with dates, appointment attendance records, specialist assessment reports, treatment recommendations (medication, therapy, environmental adaptations), care plan updates reflecting specialist advice, review appointments scheduled, crisis team contact details if applicable.'
  },
  '20.3': {
    evidenceReq: 'Staff training records on mental health awareness showing: training completion, content covered, competency assessment, and application in practice.',
    exampleEvid: 'Mental health training matrix showing: mental health awareness training completion, dementia care training, depression and anxiety recognition, suicide prevention awareness, de-escalation techniques, person-centred approaches to distressed behaviour, training dates and refresher schedule, competency assessment, supervision discussions on mental health care.'
  },
  '20.4': {
    evidenceReq: 'Person-centred mental health support plans showing: individual triggers, calming strategies, meaningful activities, communication approaches, and recovery-focused goals.',
    exampleEvid: 'Mental health care plan detailing: known triggers for distress (noise, crowding, certain times of day), calming strategies that work for individual (music, quiet space, familiar staff, hand massage), meaningful activities supporting wellbeing (gardening, reminiscence, pet therapy), communication approaches (calm tone, simple language, validation), recovery goals (increased social interaction, improved mood, reduced anxiety).'
  },
  '20.5': {
    evidenceReq: 'Mental health monitoring and review records showing: mood monitoring tools, behaviour charts, mental health reviews, and timely interventions when deterioration identified.',
    exampleEvid: 'Mental health monitoring documentation showing: mood monitoring charts (daily/weekly mood scores), behaviour monitoring (ABC charts - antecedent, behaviour, consequence), mental health review meetings (quarterly or more frequent if needed), evidence of timely intervention when deterioration noted (GP review, medication adjustment, increased support, crisis team involvement), family involvement in reviews.'
  },

  // SECTION 21: Equality & Diversity (5 questions)
  '21.1': {
    evidenceReq: 'Equality and diversity policy covering: protected characteristics (Equality Act 2010), inclusive practice, staff training, and monitoring of equality.',
    exampleEvid: 'Equality and diversity policy document containing: policy review date, reference to Equality Act 2010 protected characteristics (age, disability, gender reassignment, marriage/civil partnership, pregnancy/maternity, race, religion/belief, sex, sexual orientation), commitment to inclusive practice, staff training requirements, equality monitoring, discrimination reporting procedures, version control.'
  },
  '21.2': {
    evidenceReq: 'Care plans documenting individual cultural, religious, and personal preferences including: dietary requirements, religious practices, cultural traditions, language needs, and LGBTQ+ considerations.',
    exampleEvid: 'Care plan sections covering: cultural background and traditions important to person, religious practices (prayer times, religious festivals, clergy visits, religious items), dietary requirements (halal, kosher, vegetarian for religious/cultural reasons), language preferences and translation needs, LGBTQ+ identity and support needs, gender identity and pronouns, cultural approaches to personal care and modesty.'
  },
  '21.3': {
    evidenceReq: 'Evidence of staff understanding and respectful practice through: competency assessments, care observations, supervision discussions, and service user feedback.',
    exampleEvid: 'Staff competency evidence showing: equality and diversity training completion and assessment, care observations noting respectful interactions and cultural sensitivity, supervision discussions about supporting diverse needs, service user/family feedback on respectful care, staff understanding of individual preferences, appropriate use of interpreters/advocates, celebration of cultural events.'
  },
  '21.4': {
    evidenceReq: 'Equality monitoring and proactive equality promotion showing: equality data collection, analysis of service access, discrimination incident reporting, and positive action initiatives.',
    exampleEvid: 'Equality monitoring documentation showing: equality monitoring data (service user demographics by protected characteristics), analysis of service access and outcomes by equality groups, discrimination incident reports and investigations, staff equality and diversity training compliance, celebration of diversity (cultural events, Pride month, religious festivals), accessible information standard compliance, positive action to address inequalities.'
  },
  '21.5': {
    evidenceReq: 'Service user and family feedback on inclusive care showing: satisfaction with respect for diversity, cultural needs met, discrimination concerns addressed, and feeling valued.',
    exampleEvid: 'Feedback evidence showing: satisfaction survey results on respect and dignity, feedback from service users and families about cultural/religious needs being met, residents\' meeting discussions about diversity and inclusion, compliments about inclusive care, any discrimination concerns raised and actions taken, advocacy involvement for minority groups, evidence people feel their identity is respected and valued.'
  },

  // SECTION 22: Leadership & Governance (3 questions)
  '22.1': {
    evidenceReq: 'Governance structure and meeting records showing: management meetings, board/trustee meetings, accountability frameworks, decision-making processes, and strategic oversight.',
    exampleEvid: 'Governance documentation containing: organisational structure chart showing reporting lines, management meeting minutes (weekly/monthly), board/trustee meeting minutes (quarterly minimum), terms of reference for governance meetings, accountability framework (who is responsible for what), decision-making records, strategic planning documents, risk register reviewed at governance level, quality and safety reporting to board.'
  },
  '22.2': {
    evidenceReq: 'Registered manager presence and leadership evidence showing: CQC registration, visibility in service, staff supervision, leadership style, and stakeholder feedback on leadership quality.',
    exampleEvid: 'Leadership evidence showing: registered manager CQC registration certificate (current), duty rotas showing regular presence in service, staff supervision records (registered manager conducting supervisions), leadership walkabouts and visibility, staff feedback on leadership (accessible, supportive, visible), service user/family feedback on management, leadership style promoting open culture, registered manager involvement in incidents/safeguarding/quality issues.'
  },
  '22.3': {
    evidenceReq: 'Quality assurance systems and continuous improvement evidence showing: audit schedule, quality monitoring, performance indicators, improvement plans, and governance oversight of quality.',
    exampleEvid: 'Quality assurance framework containing: annual audit schedule with completion records, quality monitoring tools and results, key performance indicators tracked (falls, pressure ulcers, complaints, safeguarding, staff turnover, training compliance), quality improvement plans with progress monitoring, governance oversight of quality (board reporting, quality committee), external quality reviews (commissioner visits, peer reviews), CQC rating and improvement actions, benchmarking against sector standards, continuous improvement culture.'
  }
};

// Get all questions that need updating
const [questions] = await connection.execute(
  `SELECT id, questionNumber FROM complianceQuestions 
   WHERE questionNumber LIKE '4.%' 
   OR questionNumber LIKE '5.%'
   OR questionNumber LIKE '6.%'
   OR questionNumber LIKE '7.%'
   OR questionNumber LIKE '8.%'
   OR questionNumber LIKE '9.%'
   OR questionNumber LIKE '15.%'
   OR questionNumber LIKE '16.%'
   OR questionNumber LIKE '20.%'
   OR questionNumber LIKE '21.%'
   OR questionNumber LIKE '22.%'
   ORDER BY questionNumber`
);

let updated = 0;
let skipped = 0;

for (const question of questions) {
  const mapping = evidenceMappings[question.questionNumber];
  
  if (mapping && mapping.evidenceReq && mapping.exampleEvid) {
    await connection.execute(
      'UPDATE complianceQuestions SET evidenceRequirement = ?, exampleEvidence = ? WHERE id = ?',
      [mapping.evidenceReq, mapping.exampleEvid, question.id]
    );
    updated++;
    console.log(`✓ Updated ${question.questionNumber}`);
  } else {
    skipped++;
    console.log(`⊘ Skipped ${question.questionNumber} (no mapping)`);
  }
}

console.log(`\n✅ Update complete!`);
console.log(`   Updated: ${updated} questions`);
console.log(`   Skipped: ${skipped} questions`);

await connection.end();
