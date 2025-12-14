import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Deleting existing compliance questions...');
await connection.execute('DELETE FROM complianceQuestions');

console.log('Inserting compliance questions...');

// SERVICE_USER Section 1 (13 questions)
const section_service_user_1 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 1]
))[0][0];

if (section_service_user_1) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.1', "There is evidence that care and support files express individual\u2019s views, choices, and preferences. - Includes pre admission, care plans, daily notes and life history ", "There is evidence on file that the care plans express views, choices and preferences. For example, it states in one individuals file that they would like staff to ask him if he is ready to put his \u201cjim jams\u201d on at night support. It also documents that he would like staff to support him to put the to", " Records express peoples\u2019 views, choices, and preferences."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.2', "There is evidence that care, and support files have been written with involvement from the person and or their representative. (Where able, the documentation should be agreed and signed by the person). \nCare files can either be written in the first person (I statements) or third person. Care plans don't necessarily need to be signed by the person or rep as long as the content is detailed and person centred  ", "\tThere is evidence that care plans have been written with input from the person and their relevant representatives. They use phrases that are person centred such as \u201cjim jams\u201d and state in one person\u2019s mobility section that \u201cP can put his arms in sleeves but needs help to button shirts as he is all ", "Records evidence people\u2019s involvement i.e. care planning, risk assessments and reviews"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.3', "The provider has a process in place to ensure that relevant documentation is available upon request in other formats i.e., easy read, large print, pictorial, other languages. ", "", "The provider complies with the accessible information standard i.e. information is available in different formats upon request"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.4', "There is evidence that care, and support files are available and accessible to the person and their representatives in an appropriate format. ", "There is evidence that staff have considered how the individual would like care to be delivered in a discreet and dignified manner. Seeking consent, completing tasks that they cannot do themselves whilst protecting independence. Being mindful of dignity around continence care \u2013 ensuring the door is ", "People are able to access their care and support file (either paper based or electronic) and in a format appropriate to their needs e.g. care plan in large print or pictorial format, use of alternative communication Methods i.e. Makaton "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.5', "There is evidence that care, and support files demonstrate privacy, dignity, and independence. In line with their personal choices, prefences and wishes (not just in relation to personal care) ", "", "Care and support files promote the persons privacy and dignity."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.6', "People who use the service felt treated with dignity and respect ", "", "All people spoken with felt that they were treated with dignity and respect"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.7', "People were encouraged to maintain their independence and their choices and preferences are upheld ", "", "Observations of practice evidence that people were encouraged to maintain their independence and their choices and preferences upheld"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.8', "Staff can explain how people\u2019s dignity and privacy are respected  ", "", "All staff spoken with were able to explain how people\u2019s dignity and privacy were respected (10 dignity do\u2019s) "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.9', "Observations confirmed people are given information in an appropriate way to make decisions i.e., Clothing, meals, and activities ", "", "All observations of practice evidenced that people are given information in an appropriate way to make decisions"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.1', "People confirmed that they feel supported by staff to make informed decisions ", "", "All people spoken with felt supported by staff to make informed decisions"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.11', "People confirmed that they are supported to maintain relationships, access a variety of activities and the community ", "", "All people spoken with felt supported to maintain relationships, access a variety of activities and the community"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_1.id, '1.12', "Staff are observed to have positive and meaningful interactions with people who use the service ", "", "All staff were observed to have positive and meaningful interactions with people who use the service.  Staff are at the same eye level to aid effective communication, staff are kind, compassionate, patient and responsive to the person\u2019s needs.  "]
  );
  console.log('  Added 13 questions to SERVICE_USER Section 1');
}

// SERVICE_USER Section 2 (8 questions)
const section_service_user_2 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 2]
))[0][0];

if (section_service_user_2) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.1', "There is evidence of appropriately signed consent for all relevant decisions where the person is deemed to have capacity. For example.\n\u2022\t24hr care and support\n\u2022\tMedication\n\u2022\tPhotographs (care purposes and social media).\n\u2022\tSharing information \n\u2022\tRestrictive practice (sensors)\n\u2022\tKey holding\nNB If the service doesnt have anyone who is able to consent to any decisions, then this would not apply", "1 In the first care plan reviewed, the care plan states that the individual has an LPA in place which is his son. Consent forms had been sent to the individual to ask him to sign, but documents have not been received. This has been chased by RM and an email has been received by the individual\u2019s son ", "All appropriate consent for all decisions are in place and signed by the person . File 2, MCA and BI template sent accross"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.2', "There is evidence of appropriately signed consent by the relevant LPA (Lasting Power of Attorney) where the person is deemed not to have capacity for a specific decision and there is a copy of the LPA on file.", "Both care files reviewed referenced that they had an LPA in place, however there was no evidence of the LPA certificate or relevant checks having taken place by the provider on file. We would recommend that the provider check the legal status of an LPA which they can do via the following link:- http", "All appropriate consent for all decisions are in place and signed by the LPA (with a copy of the relevant LPA)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.3', "There is evidence of appropriate mental capacity assessments and best interest decisions where the person is deemed to not have capacity for a specific decision.  These decisions have been made in collaboration with other representatives and/or other relevant parties. For example, -\n\u2022\tPerson\n\u2022\tFamily \n\u2022\tAdvocate \n\u2022\tOther involved professionals", "The first care plan reviewed states that the individual is deemed to have capacity so this would not be applicable. The second care plan reviewed however, does not evidence BI/MCA decisions for all relevant decisions that we would expect. The care plan states that the care home he resides in have th", "All appropriate Mental Capacity assessments and best Interest decisions have been made in collaboration "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.4', "There is evidence that the service has DOLs in place as required which demonstrates that least restrictive measures have been considered and where conditions are in place these are being adhered to.", "", " Where a DOLs has been granted a copy is held on file\nWhere DOLs have been applied for and not yet been granted there is evidence of the completed application on file and receipt email from NYC \nAny identified conditions are adhered to "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.5', "There is a system in place to track, identify conditions and expiry date of DOLs.", "We did not see evidence of a system in place to track, identify conditions and expiry date of DOLs.", "There is a tracking system in place that records all relevant information e.g. person\u2019s name, date applied for, date granted, expiry date, conditions, date CQC notification sent"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.6', "Staff are observed obtaining consent from people.", "", "All staff were observed obtaining consent from people "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_2.id, '2.7', "Staff can describe how they ensure the principles of the MCA and how it is put into practice in their daily work.", "", "All staff spoken with were able to describe how they ensure the principles of the MCA and how it is put into practice in their daily work"]
  );
  console.log('  Added 8 questions to SERVICE_USER Section 2');
}

// SERVICE_USER Section 3 (18 questions)
const section_service_user_3 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 3]
))[0][0];

if (section_service_user_3) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.1', "There is evidence that people have appropriate contact details of their care and support provider including relevant out of hour contact details, e.g. contact details are documented in a service user guide.", "The provider has a normal guide and easy read service user guide which is given to clients. The guide contains appropriate contact details for the provider, but it is not clear about out of hours contact arrangements. We would recommend that this is added clearly to the guide.  ", "Up-to-date contact details are available i.e. recorded within the service user guide"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.2', "There is evidence of a fully completed pre assessment prior to the person accessing the service, covering all areas of care and support, including risk, that demonstrates the provider can meet the person\u2019s needs.", "In the first file we reviewed there was evidence of a \u201cGathering Information for the Initial Assessment\u201d plan on file. The plan refers to the individual\u2019s wife who is also in receipt of care and not the individual themselves. I discussed this with the Registered Manager to obtain the preassessment f", "Fully completed pre -admission assessment prior to the person accessing the service which covers all areas of need and risk is on file."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.3', "There is evidence of documented life history/about me information.", "In the first file viewed, there was very little information regarding the individual\u2019s life history and medical history on file for. The about me section on the Nourish system was blank and not completed. However, in the second file we reviewed, there was some good person-centred life history about ", "There is evidence that life history information is recorded in full where applicable. \nWhere there is limited information there is a recorded justification for gaps in recording "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.4', "There are relevant care and support plans in place to deliver safe and effective care, e.g.:\n\u2022\tpain management.\n\u2022\tsight, hearing and communication.\n\u2022\tpersonal care and physical well-being, including promoting healthy lifestyles including smoking and alcohol consumption.\n\u2022\toral care.\n\u2022\tcontinence care.\n\u2022\tskin integrity.\n\u2022\tfoot care.\n\u2022\tdietary preferences and nutrition.\n\u2022\tsocial interests, hobbies, and access to the community.\n\u2022\treligious, cultural, and emotional needs.\n\u2022\tcarer and family involvem", "In the first file reviewed, there was a good level of person-centred detail throughout the care plan that explained what the individual\u2019s current needs were. There was information that supported strength-based support which was good to read. The plan could be further strengthened by being clearer ar", "All relevant care and support plans are in place which are sufficiently detailed to deliver safe and effective care"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.5', "There is evidence that care, and support plans are strength based, person centred and promotes independence. ", "There is evidence in both care and support file that support should be provided in a strength-based way to promote the individual\u2019s independence. There are some good person-centred details in some areas of the care plan. This could be strengthened. For example, in one individuals religious and cultu", "Care and support plans are strength based, person centred and promotes independence"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.6', "There is evidence that care, and support plans include individual personalised outcomes. NB this may be as simple as maintaining a persons level of independence in relation to activities of daily living ", "There is evidence throughout both care and support plans reviewed that they include outcomes that are personalised. However, this could be personalised further to include personal goals as the goals set are very care/task focused. For example, in both pain management sections it states the goal is f", "All care and support plans include individual personalised outcomes that are relevant, realistic and achievable. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.7', "There is evidence of appropriate risk assessments to deliver safe and effective care, and there are actions recorded to mitigate risk. ", "Both care plans reviewed did not evidence appropriate risk assessments for all areas of risk identified. Risks were identified throughout the care plan and linked to the relevant sections. For example, under Nutrition and Hydration an identified risk was: -\n\u201cRisk of chest infection caused by poor he", "All appropriate risk assessments are in place and actions recorded to mitigate risk (which may be signposted and recorded in the support plan"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.8', "There is evidence that care and support plans are regularly reviewed and any change in needs are reflected accordingly. ", "There is evidence that support plans are reviewed regularly and within the three months we would expect, however there was a lack of evidence around how care plans are reviewed, and we could not see evidence of any documented changes, the reviews documented were just dates on the nourish system with", "Care and support plans are regularly reviewed (minimum 3 monthly or sooner if there is a change in need).  \nCare and support plans have been updated to reflect current need. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.9', "There is evidence that risk assessments are regularly reviewed and any change in needs are reflected accordingly.\nNB Assessment tools should be reviewed in line with national guidance eg MUST at least monthly ", "There is evidence that the risk assessments are reviewed in line with the support plans, but again, there was little evidence about how reviews take place and if any changes are made to risk assessments to reflect current need. Risk assessments do not adequately document mitigations and all areas of", "Where the risk level and/or actions to mitigate risk have changed these have been updated within the care and support plans Where the risk level and /or actions to mitigate risk have changed these have been updated within the care and support plans "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.1', "There is evidence that daily records are completed per shift or visit. ", "10 In the first file reviewed, there lacked evidence that daily records were completed per shift as expected. For example, 8th September I can see that the carer had attended the calls as the system entry is green and the carer who attended the calls is logged, but there are no documented notes of t", "There is an entry within the daily records for each shift/visit"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.11', "There is evidence that daily entries are factual, dated, timed, legible, and signed by the member of staff(s), including their job role(s). ", "Daily entries that were recorded were sometimes difficult to understand. For example, one care note stated, \u201cPJ and EJ were settled in bed on leaving while I told his to keep an eye on him\u201d. Not sure what this was in reference to. The entries have a recorded date and time and are legible when writte", "Daily entries are factual, dated, timed, legible, and signed by the staff members who have delivered the person care and support (including their job titles)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.12', "There is evidence that daily entries provide a reflective account of care and support delivered and the persons health and wellbeing. NB Daily notes should be person centred ", "The daily records are not completed and the notes that are completed are not consistently a reflective account of the care and support that is delivered especially around the individuals health and wellbeing. For example, some entries do not have defensible notes attached and some notes do not provi", "Daily entries provide a reflective account of care and support delivered and the persons health and wellbeing"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.13', "There is evidence that intervention charts are comprehensively completed and are signed and dated, e.g., food and fluid charts, repositioning charts, and pain charts. ", "There was evidence of intervention charts for each individual reviewed, however not for all identified areas of care. For example, in the first care file we reviewed, there was no food and fluid charts completed. The notes that are recorded don\u2019t stipulate what the person has eaten and how much. The", "Intervention charts are comprehensively completed and signed and dated"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.14', "There is evidence that activity and social interactions are recorded.", "In the first individuals file reviewed, there was little evidence of daily notes detailing activities or social interactions. I looked at notes from the 20th of August to the present date to see if I could see any meaningful activity recorded and could not evidence any such as reading his newspaper ", "There is a detailed record of all activities and social interactions (daily record, activities sheet/log)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.15', "There is documented evidence of involvement from other health and social care professionals.", "We did not evidence any documented involvement from health professionals on either file reviewed. One individual had DN and Mental Health involvement, but we could not evidence any medical information on file. ", "Records evidence that health and social care professionals have been appropriately involved and care and support plans have been updated to reflect the advice given or actions taken and that all relevant staff have been made aware (i.e. care, catering, housekeeping). "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.16', "There is evidence of an accurately completed DNACPR/ ReSPECT document signed by a relevant health professional and easily accessible.", "In the first file reviewed the individuals care plan states that he does have a DNACPR/ReSPECT form in place but there is no uploaded documentation on file and it states \u201cI have not seen this form so I am unable to select a start date\u201d There is also no information in regards to where the original is", "Accurately completed DNACPR/ReSPECT which has been signed by the relevant healthcare professional and is easily accessible"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_3.id, '3.17', "People confirmed that the care and support received is carried out in a way that meets their needs in line with their personal preferences.", "", "All people spoken with confirmed that the care and support they receive is carried out in a way that meets their needs and personal preferences. "]
  );
  console.log('  Added 18 questions to SERVICE_USER Section 3');
}

// SERVICE_USER Section 4 (10 questions)
const section_service_user_4 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 4]
))[0][0];

if (section_service_user_4) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.1', "There is evidence of a varied menu which promotes healthy eating choices and acknowledges cultural and personal preferences.", "", "The menu is varied and supports a nutritional and balanced diet that takes into account personal preferences (vegetarian options, meat, fish, selection of seasonal food and other alternatives)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.2', "There is access to sufficient supplies of fresh food and fluids over a 24 hour period.", "", "Staff confirm that food and fluids are available 24/7 i.e., staff have access and facilities to prepare food and drink outside of kitchen staff hours"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.3', "There are nutritional support plans in place that include food allergies, likes, dislikes and any dietary restrictions including IDDSI.", "Nutritional support plan did include likes and dislikes and dietary requirements. It did not document if the individual had any food allergies specifically but the plan itself states that he has no known allergies. In the second file reviewed there was information in his care plan about what he like", "Nutritional support plans include food allergies, likes, dislikes and any dietary restrictions including IDDSI"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.4', "Where required there is a nutritional support plan which details any other dietary advice e.g., dietician/SALT.", "", "Nutritional support plans detail up-to-date and accurate advice from dietician, SALT etc. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.5', "Where required there is a nutritional support plan which details the MUST level and any actions to be taken to mitigate the risk.", "", "Nutritional support plan details the MUST level and any actions to be taken to mitigate risk "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.6', "Where required there is a MUST tool for each person which is accurately completed and reviewed in line with the tool. NB to be completed at least monthly or following a change in need ", "", "MUST is accurately completed where required and regularly reviewed "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.7', "There was a menu displayed that is visible and accurate.", "", "The menu is visible and accurate  "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.8', "People confirmed that person requests of food and drinks can be accommodated e.g., flavoured tea, decaffeinated coffee.", "", "All people spoken with confirmed that individual requests of food and drink are accommodated "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_4.id, '4.9 Obs', "There was a positive person-centred mealtime experience.", "", "Observations of mealtime were a positive experience e.g. calm, relaxed, conducive, and enjoyable experience, staff engaged well, supported appropriately whilst promoting independence, use of adapted cutlery etc, show plates, appropriate table wear. "]
  );
  console.log('  Added 10 questions to SERVICE_USER Section 4');
}

// SERVICE_USER Section 5 (4 questions)
const section_service_user_5 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 5]
))[0][0];

if (section_service_user_5) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_5.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_5.id, '5.1', "Where there is shared involvement from another provider this is clearly documented and there are clear processes in place to share information in a timely manner.", "In the second file reviewed, care plans reference CMHT and District Nurse involvement but we could not evidence any information stored on file.", "Where more than one provider is supporting a person there is a clearly documented process in place to share information in a timely manner (memorandum of understanding, partnership protocol) "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_5.id, '5.2', "There is a Must do Care Plan/ Hospital Passport reflective of current need.", "There is a MUST Do Hospital Passport in place for both individuals that is reflective of their needs. Both passports references that they have a DNR in place but does not generate a copy of this or references where the original paperwork is kept in the home as this is important for health profession", "Must do care plan/hospital passport in place which is reflective of the persons need, fully completed, and reviewed"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_5.id, '5.3', "People confirmed that they are supported to access other social care/health services.", "", "All people spoken with confirmed that they are supported to access other social care/health services i.e. chiropodist, hairdresser, opticians. "]
  );
  console.log('  Added 4 questions to SERVICE_USER Section 5');
}

// SERVICE_USER Section 6 (15 questions)
const section_service_user_6 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 6]
))[0][0];

if (section_service_user_6) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.1', "There is a safeguarding policy in place that reflects the North Yorkshire multiagency safeguarding policy.", "The provider has a safeguarding policy and procedure in place. This was reviewed on the 21.08.2025 and is due for review on the 21.08.2026. This is in line with North Yorkshire\u2019s expectations. Although the policy states that the provider works with local safeguarding boards, the policy refers to Man", "There is a safeguarding policy in place that reflects the North Yorkshire multiagency safeguarding policy"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.2', "There is a record of DBS status for visiting professionals (e.g., chiropodist, hairdresser, entertainers).", "", "There is a record of DBS status for all visiting professionals (e.g., chiropodist, hairdresser, entertainers"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.3', "There is a copy of relevant public liability insurance for visiting professionals (e.g., chiropodist, hairdresser, entertainers).", "", "There is a copy of relevant up-to-date public liability insurance for visiting professionals (e.g., chiropodist, hairdresser, entertainers)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.4', "There is an accurate and up to date safeguarding log in place which includes documented actions and outcome.", "There is a safeguarding log in place this only includes the date and number and reason for sending. There were no actions and outcomes evidenced.\nRecommend adding date of incident, date submitted, type of incident, actions, open or closed, lessons learned and outcome. The log needs to be more robust", "There is an accurate and up to date safeguarding log kept which includes documented actions and outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.5', "Safeguarding notifications are submitted appropriately and in a timely way (48hrs).", "", " Safeguarding notifications are always submitted appropriately and in a timely way "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.6', "There is an accurate and up to date risk notification log kept which documents actions and outcomes.", "There was no risk notification log in place at the time of assessment. The Registered Manager appeared unclear about the Risk notification process, and this is to be sent to the provider with relevant guidance post assessment. ", "There is an accurate and up to date risk notification log kept which documents actions and outcomes"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.7', "Risk notifications are submitted appropriately and in a timely way (48hrs)", "", "Risk notifications are submitted appropriately and in a timely way (48hrs)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.8', "There is an accurate and up to date CQC log which documents actions and outcomes", "The CQC notifications and safeguarding submissions are documented on the same log. We would suggest that the logs are separated and that the log is strengthened to include date of incident, date submitted, type of incident, actions, open or closed, lessons learned and outcome. This is to capture all", "There is an accurate and up to date CQC notification log kept which documents actions and outcomes"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.9', "CQC notifications are submitted appropriately and in a timely way", "", "CQC notifications are submitted appropriately and in a timely way (ASAP)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.1', "There is evidence of completed Herbert Protocols when required", "The provider informed us that they don\u2019t support anyone currently that requires a Herbert protocol. Both individuals reviewed did not require a protocol being in place. ", "There is evidence of completed Herbert Protocols in place where required"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.11', "The safeguarding Policy and procedure are available to all staff.", "The safeguarding policy is available to all staff, however the provider is to ensure that the policy reflects North Yorkshire Council\u2019s contact details and processes. ", "The safeguarding policy and procedure is easily accessible to all staff."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.12', "There is safeguarding information / poster with up-to-date contact information on display or available in the service", "", "There is safeguarding information / poster with up-to-date contact information on display or available within the service."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.13', "Staff were observed supporting people to maintain independence and safety e.g., transfers, nutrition and hydration.", "", "Staff were observed supporting people to maintain their independence and safety e.g., transfers, nutrition, and hydration."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_6.id, '6.14', "Staff can explain how to identify and prevent abuse and what action to take if they suspect abuse has occurred.", "", "Staff can explain how to identify and prevent abuse and what action to take if they suspect abuse has occurred "]
  );
  console.log('  Added 15 questions to SERVICE_USER Section 6');
}

// SERVICE_USER Section 7 (9 questions)
const section_service_user_7 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 7]
))[0][0];

if (section_service_user_7) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.1', "There is an up-to-date Infection Prevention and Control Policy and procedure in place.NB If concerns re content of policy refer to IPC team ", "", "There is an up-to-date Infection Prevention and Control Policy and procedure in place"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.2', "There are cleaning schedules in place that demonstrates that all areas of the service are regularly cleaned.", "", "There are cleaning schedules in place that demonstrates that all areas of the service are regularly cleaned"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.3', "There are effective systems and records in place to ensure that equipment is clean.", "", "There are effective systems and records in place to ensure that equipment is clean."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.4', "The environment is clean and there are no malodours.", "", "The environment is clean and there are no malodours"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.5', "PPE is readily available throughout the service and in date (gloves, aprons, masks, hand sanitiser etc.).", "", "PPE is readily available throughout the service and in date (gloves, aprons, masks, hand sanitiser etc.)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.6 obs', "All staff were observed following appropriate IPC measures including food handling, hand hygiene of people before and after meals.", "", "All staff were observed following appropriate IPC measures including food handling, hand hygiene of people before and after meals"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.7 obs', "Staff can explain how to prevent and control the spread of infection.", "", "Staff can explain how to prevent and control the spread of infection."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_7.id, '7.8 Obs', "Staff can explain how they ensure the safe disposal of waste.", "", "Staff can explain how they ensure the safe disposal of waste."]
  );
  console.log('  Added 9 questions to SERVICE_USER Section 7');
}

// SERVICE_USER Section 8 (23 questions)
const section_service_user_8 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 8]
))[0][0];

if (section_service_user_8) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.1', "There is a Medication Policy and procedure in place.", "", "There is a Medication Policy and procedure in place."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.2', "There is a process in place that confirms the current medication prescription of a new person to the service.", "", "There is a process in place that confirms the current medication prescription of a new individual to the service. (e.g. checking with GP, checking prescription labels etc)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.3', "There is evidence that all staff who are responsible for administering medication have completed up to date medication training.", "The provider provided an up-to-date training matrix prior to assessment that evidenced that all staff were medication trained and had received an up to date medication competency assessment. However, at the time of assessment we reviewed two agency profiles and could not evidence that they had compl", "There is evidence that all staff who are responsible for administering medication have completed up to date medication training."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.4', "There is evidence that all staff who are responsible for administering medication have completed an up-to-date medication competency assessment.  This woud also include care staff responsible for admiistering creams and staff who are a second signatory/ witness for CDs  NB the person undertaing competency assessments should have up to date medication training and an indate competency assessment. Their competency assessmentcan be completed by a Senior member of staff, a peer at Registered manager", "", "There is evidence that all staff who are responsible for administering medication have completed an up-to-date medication competency assessment (including care staff responsible for administering creams"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.5', "Medication trolley is locked and securely tethered. ( When not in use)", "", "Medication trolley is locked and securely tethered (when not in use)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.6', "The Controlled drugs are stored in line with The Misuse of Drugs Act 1971.", "", "Controlled drugs are stored in line with The Misuse of Drugs Act 1971"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.7', "Topical medication is stored appropriately e.g., separate to ingestible medications. ", "", "Topical medication is stored appropriately e.g. separate to ingestible medications.\nAll medication is stored per manufacturer\u2019s instructions e.g. refrigeration"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.8', "All medication is stored per manufacturer\u2019s instructions e.g., refrigeration.", "", ""]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.9', "There are no food or biological items stored in an identified medication only refrigerator.", "", "There are no food or biological items stored in an identified medication only refrigerator"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.1', "Documented temperature checks are in place for the medication refrigerator and actions taken if it falls out of range (checks should be completed as a minimum of once per day and temperatures should indicate that medication is stored  between 2 and 8 degrees).", "", "Documented temperature checks are in place for the medication refrigerator and actions taken if it falls out of range."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.11', "Temperature checks are in place for the designated medication room (or designated storage area) and actions taken if they fall out of range (Temperatures should not go above 25 degrees).", "", "Temperature checks are in place for the designated medication room (or designated storage area) and actions taken if they fall out of range"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.12', "There is a separate controlled drug register, that is bound, and recording in it is accurate and legible.", "", "There is a separate controlled drug register that is bound and recording in it is legible"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.13', "Medication Administration Records are accurate and the recording legible. including TMAR.", "Medication is logged as part of daily notes and recorded as a task. For example, it states for one individual reviewed that Madapar was administered at 21:51 \u2013 Melatonin administered at 21:51 on the 10th September by carer GE. At the time of assessment, I discussed in depth medication administration", "Medication Administration Records are accurate and the recording legible including TMAR."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.14', "There is a current signature list of staff that administer medication.To9 include EMARS/ CDs and TMARS ", "Medications are recorded on the Nourish system and there is a digital record of staff that administer medications. We would recommend that job title is added to records for defensible recording. The provider explained that Nourish does not currently generate a MAR record, so staff have manually reco", "There is a current signature list of staff that administer medication."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.15', "There is a documented process in place to identify where a person can and wishes to safely self-administer their own medication. ", "", "There is a documented process in place to identify where a person can and wishes to safely self-administer their own medication"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.16', "There is a PRN protocol and procedure in place that is person centred and includes administration, effectiveness and review ", "In the first file we reviewed it was documented that the person was prescribed: -\n\u2022\tParacetamol \n\u2022\tQuinin sulphate 200mg tablets \nThere was no evidence of a PRN protocol in place for either medication. ", "There is a PRN protocol and procedure in place that is person centred and includes administration, effectiveness, and review."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.17', "Covert medication protocols are in place with input from relevant medical professionals.", "", "Covert medication protocols are in place with input from relevant medical professionals and are regularly reviewed"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.18', "There are systems in place to monitor medication stock levels and expiry dates.", "", "There are systems in place to monitor medication stock levels and expiry dates and actions taken."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.19', "Where the service holds homely remedies medicines, a stock record and generic risk assessment are in place to determine the range of medicines held.", "", "Where the service holds homely remedies, there is a stock record and generic risk assessment in place"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.2', "Staff were observed to handle medicines safely securely and appropriately.", "", "Staff were observed to handle medicines safely, securely and appropriately i.e. checking prescribing instructions, checking the ID of the person, using appropriate container to transfer medicines, no secondary dispensing"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.21 obs', "Staff can explain what actions they would take in the event of a medication error. NB Report as RNR /Safeguarding seek medication attention as a minimum ", "", "Staff can explain what actions they would take in the event of a medication error"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_8.id, '8.22 obs', "Staff can explain where they would access information in relation to a specific medicine e.g., its usage, side effects of drugs and contra-indications. ", "", "Staff can explain where they would access information in relation to a specific medicine e.g., its usage, side effects of drugs and contra-indications"]
  );
  console.log('  Added 23 questions to SERVICE_USER Section 8');
}

// SERVICE_USER Section 9 (25 questions)
const section_service_user_9 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 9]
))[0][0];

if (section_service_user_9) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.1', "There is COSHH register, risk assessments and data sheets in place for any storage and use of hazardous substances.", "", "There is COSHH register, risk assessments and data sheets in place for the storage and use of hazardous substances"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.2', "There is a fire procedure in place and there is clear and visible signage that advises what actions to take in the event of a fire.", "", "There is a fire procedure in place and there is clear and visible signage that advises what actions to take in the event of a fire"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.3', "There is a record of an annual externally validated fire extinguisher checks.       ", "", "There  is evidence of an upto date annual external fire extinguisher checks"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.4', "There is a record of monthly internally completed fire extingusher checks ", "", "There is a record of monthly internal fire extinguisher checks "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.5', "There is a record of an externally validated emergency lighting checks.", "", "There is evidence of up to date external  emergency lighting checks "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.6', "There is a record of monthly internally completed emergency lighting checks ", "", "There is a record of monthly internal emergency lighting checks "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.7', "There is a record of 6 monthly fire evacuations/fire drills.   ", "", "There is a record of 6 monthly fire evacuations/fire drills evident in the service and any resulting actions identified and implemented. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.8', "There is a record of weekly fire alarm checks.", "", "There are complete records of weekly fire alarm checks evident in the service."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.9', "There are fire marshals in place on each shift and they are clearly identified in the service ", "", "There are fire marshals in place on each shift, and they are clearly identified within the service."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.1', "An external annual fire risk assessment had been completed.", "", "An external annual fire risk assessment had been completed"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.11', "Actions from fire risk assessment are identified and completed.", "", "Actions from fire risk assessment are identified and completed in a timely way"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.12', "There is evidence of an annual external fire detection and alarm system inspection and service certificate ", "", "An annual external fire detection and alarm inspection and service certificate "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.13', "There is evidence of an in date electrical safety certificate (5 years).", "", "There is evidence of an in date electrical safety certificate (5 years)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.14', "There is evidence of an annual in date gas safety certificate ", "", "There is evidence of an annula in date gas safety certificate "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.15', "There is evidence of an up-to-date Legionella Certificate.", "", "There is evidence of an up-to-date Legionella Certificate."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.16', "Premises and Environment (including any adaptations) are risk assessed and any identified actions are completed .NB To include environmental risk assessment for Home based support", "We did not evidence any in-depth environmental risk assessments on at the time of assessment. ", "Premises and Environment (including any adaptations) are risk assessed and identified actions are completed "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.17', "There is evidence of monthly window restrictor checks.", "", "There is evidence of monthly window restrictor checks in service"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.18', "There is a program of refurbishment and routine(planned) maintenance for the whole of the service, and it is adhered to ", "", "There is a program of refurbishment and routine maintenance for the whole of the service and is being adhered to."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.19', "There is a record of identified(urgent) maintenance / repairs which are acted upon in a timely manner.", "", "There is a record of identified (urgent) maintenance / repairs which are acted upon in a timely manner."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.2', "There is appropriate signage or\n mechanisms in place to meet the needs of the people that use the service (e.g., Dementia friendly signage, sensory impairment ).to their \nDementia friendly does not just apply when there is a Dementia specilaism with CQC it should apply where there are people with an impairment in their cognition ", "", "There is appropriate signage in place across the whole service to meet the needs of the people that use the service (e.g., Dementia friendly signage)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.21', "There is a signing in book or digital alternative as well as appropriate security checks in place for all visitors", "", "There is a signing in book or digital alternative as well as appropriate security checks in place for all visitors"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.22', "Service access has appropriate security measures in place which are regularly reviewed, e.g., door access codes/fobs/swipe cards/key safes.", "", "Service access has appropriate security measures in place which are regularly reviewed, e.g., door access codes/fobs/swipe cards/key safes."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.23', "Where appropriate, staff have appropriate identification. Ie name badge / Uniform. \nWhere it is not appropriate for ID badges to be worn in a servce there is a process in place for staff to demonstrate their proof of identity ie for assessment purposes \n", "", "All staff have appropriate forms of identification as required for the service  "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_9.id, '9.24', "Where there is CCTV in communal areas, appropriate signage is in place.", "", "Where there is CCTV in communal areas, appropriate signage is in place where this in operation"]
  );
  console.log('  Added 25 questions to SERVICE_USER Section 9');
}

// SERVICE_USER Section 10 (8 questions)
const section_service_user_10 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 10]
))[0][0];

if (section_service_user_10) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.1', "There is documented evidence of appropriate testing of equipment, e.g., PAT, LOLER.  NB For home-based support there is a record of equipment in place which includes supplier details and when last serviced / service next due", "", "There is documented evidence of appropriate testing of equipment, e.g., PAT, LOLER"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.2', "Where a suitably qualified professional has prescribed equipment for an individual, this is available and is clearly identifiable as belonging to the individual.", "", "Prescribed equipment for a person is available and is clearly identifiable to belonging to the person. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.3', "There is a record of equipment calibration (e.g., weighing scales, temperature probe etc).", "", "There is a record of equipment calibration (e.g. weighing scales, temperature probe etc"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.4', "There is a maintenance schedule in place for equipment in use, e.g. Mattresses, Pressure Cushions, Bedrails, Assistive Technology.", "", "There is a maintenance schedule in place for all equipment in use and that it is being followed"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.5', "Equipment is stored appropriately and safely and in line with manufactures instructions.", "", "Equipment is stored appropriately and safely and in line with manufactures instructions"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.6 obs', "Staff using equipment are observed to be completing a viSual check for safety and cleanliness of equipment prior to use ", "", "Staff are observed to be completing visual checks prior to use of equipment "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_10.id, '10.7 obs ', "staff are observed using equipment safely and appropriately ", "", "Staff are observed using equipment safely and appropriately"]
  );
  console.log('  Added 8 questions to SERVICE_USER Section 10');
}

// SERVICE_USER Section 14 (11 questions)
const section_service_user_14 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 14]
))[0][0];

if (section_service_user_14) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.1', "There is a business continuity plan in place which clearly manages unexpected events, and this is regularly reviewed and tested.NB testing can include practicle scenarios or simulated activities. ", "The provider does have a BC plan in place. This was reviewed on the 21.08.2025 and due for further review on the 21.08.2026. The plan is a high-level organisational plan and is not localised with adequate detail for managing individual emergency situations. It does not cover or go into adequate deta", "BCP in place which clearly manages unexpected events, and this is regularly reviewed and tested"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.2', "There is evidence of a food hygiene ratings certificate being displayed. ", "", "Food hygiene ratings certificate displayed"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.3', "There are mechanisms in place for feedback to be obtained from people, staff, professionals, and family members.", "There was evidence of client surveys completed in September (the year completed was not stipulated). The provider had received 10 responses and there was evidence of an analysis completed. We would recommend that an action plan is implemented to so that improvements can be evidenced and shared with ", "There are mechanisms in place for feedback to be obtained from people, staff, professionals, and family members"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.4', "There is evidence that feedback sought from people, staff, professionals, and family members are analyzed and acted upon (You Said We Did).", "There is evidence that feedback has been sought from some groups that utilise the service and that the information has been analysed. However, we did not see evidence of an action plan or that information had been acted upon. We could not evidence that feedback had been shared with staff. \n", "There is evidence that feedback sought from people, staff, professionals, and family members are analysed and acted upon (You Said We Did)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.5', "There is documented evidence of planned meetings held, appropriate actions taken, and minutes circulated to all parties.", "There is evidence that meetings are undertaken regularly with staff. There was evidence of meetings taken place monthly. However, the minutes did not record the date that the meeting had taken place, just the month was recorded. They also did not list which staff had been present or any apologies. T", "There is documented evidence of meetings with people, friends, family and staff and that there is appropriate actions taken, and minutes available to all parties. (at least quarterly)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.6', "There is documented evidence of an audit schedule which clearly identifies the frequency of audits undertaken.", "We could not evidence an audit schedule being in place at the time of assessment. ", "There is a documented audit schedule in place which is adhered to"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.7', "There is evidence that a range of audits are completed which contributes to the ongoing service development/outcomes:\n\u2022\tCare plans\n\u2022\tMedicines\n\u2022\tDaily notes and intervention charts\n\u2022\tStaff files\n\u2022\tFinances\n\u2022\tInfection control\n\u2022\tHealth and safety\n\u2022\tWeight analysis\n\u2022\tSkin integrity\n\u2022\tKitchen/catering\n\u2022\tDining experience\n\u2022\tManagers walkaround\n\u2022\tNight visits\n\u2022\tCall bell analysis\n\u2022\tMissed and late calls\n\u2022\tSenior Manager Quality assurance audit\n\u2022\tDignity Audit\n\u2022\tNMC checks\n\u2022\tDriving license and insura", "At the time of assessment we did evidence some audits being carried out but not for all areas we would expect. For example: -\n\u2022\tCare plans. The system stated that 6 care files had been audited but there was no evidence or detail around what had been audited and if there were any actions as a result.", "All audits relevant to the service are undertaken as per the audit schedule "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.8', "There is evidence that all identified areas for improvement have an associated action plan which details the action to be completed, who is responsible and timescale for completion. Action is signed off when completed.", "There was some evidence that actions had been identified and listed on some audits undertaken, however there was not an overarching action plan in place to evidence continual improvement that detailed who was responsible and a timescale for completion.", "There is an action plan that covers all areas as above and meets the agreed timescales. "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.9', "Accidents and incidents, escalated appropriately with actions and trends identified.", "There was a process in place that identified Accidents and incidents, and these were logged on the electronic system. For example, and incident where a data breach had occurred was logged and relevant actions were taken. However, this requires strengthening as we could not evidence that accidents an", "Accident and incidents are appropriately recorded and escalated.  There is evidence of documented trend analysis and action taken to reduce the level of risk and this has been re-evaluated to measure the effectiveness of actions taken and if it has mitigated risk."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_14.id, '14.1', "There is clear evidence that lessons learned have been shared with relevant people ", "We did see some evidence of lesson learned being discussed in supervisions, but this requires strengthening. We would expect that as part of the organisation\u2019s governance structure, any lessons learned or improvements would be formally shared using a range of tools including supervision, action plan", "Evidence of lessons learnt and this has been shared appropriately with the relevant people"]
  );
  console.log('  Added 11 questions to SERVICE_USER Section 14');
}

// SERVICE_USER Section 15 (7 questions)
const section_service_user_15 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 15]
))[0][0];

if (section_service_user_15) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.1', "The Provider has a Complaints Policy in place and is accessible to people who use the service.", "", "The Provider has a Complaints Policy in place and is accessible to people who use the service."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.2', "There is information displayed or available within the service on how to raise a complaint with up-to-date contact details for the Provider, Local Authority, CQC, LGO.", "", "There is information displayed or available within the service on how to raise a complaint with up-to-date contact details for the Provider, Local Authority, CQC, LGO"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.3', "There is evidence that complaints received are dealt with in line with policy.", "", "There is evidence that all complaints received are dealt with in line with policy"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.4', "There is an accurate and up to date complaints log kept that document actions, outcome and lessons learned ", "", "There is an accurate and up to date complaints log kept that document actions, outcomes and lessons learned"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.5', "There is a process in place that people can be supported when required to access Advocacy Services. NB may include Cloverleaf, Citizens Advice Bureau, Age UK, Solicitors", "", "There is a process in place that people can be supported when required to access Advocacy Services"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_15.id, '15.6 obs', "People confirmed that they are aware of how to complain or raise a concern.", "", "People confirmed that they are aware of how to complain or raise a concern"]
  );
  console.log('  Added 7 questions to SERVICE_USER Section 15');
}

// SERVICE_USER Section 16 (8 questions)
const section_service_user_16 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 16]
))[0][0];

if (section_service_user_16) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.1', "There is evidence that staff have undertaken training in relation to GDPR and confidentiality. Recommended to be refreshed every 2 years ", "", "All staff have undertaken training in relation to GDPR and confidentiality "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.2', "There is evidence that all documentation/ Information (electronic and hard copy) is held securely in line with Data Protection and GDPR guidance.", "", "There is evidence that all documentation (electronic and hard copy) is held securely in line with Data Protection and GDPR guidance"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.3', "There is evidence that all documentation/Information  (electronic and hard copy) remains confidential in line with Data Protection and GDPR.", "", "There is evidence that all documentation (electronic and hard copy) remains confidential in line with Data Protection and GDPR."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.4', "There are up to date Policies and Procedures in place in relation to handling people\u2019s money.", "", "There are up to date Policies and Procedures in place in relation to handling people\u2019s money"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.5', "There is evidence that each person has individual financial transaction records with evidence of receipts and are signed by two people when possible", "", "There is evidence that each person has individual financial transaction records with evidence of receipts and signed by two people when possible"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.6', "Evidence that all personal monies are stored securely and not pooled.", "", "Evidence that all personal monies are stored securely and not pooled."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_16.id, '16.7', "All financial  records are legible, signed and dated by the relevant person.", "", "All financial records are legible, signed and dated by the relevant person."]
  );
  console.log('  Added 8 questions to SERVICE_USER Section 16');
}

// SERVICE_USER Section 17 (5 questions)
const section_service_user_17 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 17]
))[0][0];

if (section_service_user_17) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_17.id, '17.1', "Audit financial records, receipts, authorizations, and safeguarding of service user money. Check policies and procedures for handling finances.", "Financial records are maintained accurately with proper authorization and receipts.", "Financial management records and policies"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_17.id, '17.2', "Service user money is kept secure and separate from business funds.", "Individual financial records show clear separation of personal funds.", "Secure storage and separate accounting"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_17.id, '17.3', "Regular audits of service user finances are conducted and documented.", "Audit trail shows monthly reconciliation of service user accounts.", "Audit logs and reconciliation records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_17.id, '17.4', "Staff are trained in financial safeguarding and handling of service user money.", "Training records show staff have completed financial safeguarding training.", "Training certificates and competency assessments"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_17.id, '17.5', "Service users and families are involved in financial decisions where appropriate.", "Consent forms and meeting notes show involvement in financial planning.", "Consent forms and financial planning records"]
  );
  console.log('  Added 5 questions to SERVICE_USER Section 17');
}

// SERVICE_USER Section 18 (5 questions)
const section_service_user_18 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 18]
))[0][0];

if (section_service_user_18) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_18.id, '18.1', "Review activity programs, individual preferences, participation records, and community involvement. Ensure activities promote wellbeing and independence.", "Activity schedules show varied programs tailored to individual interests.", "Activity plans and participation records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_18.id, '18.2', "Service users are consulted about activities and their preferences are recorded.", "Care plans include individual activity preferences and goals.", "Person-centered activity plans"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_18.id, '18.3', "Activities are accessible and adapted to meet individual needs and abilities.", "Risk assessments show adaptations made for individual participation.", "Adapted activity plans and risk assessments"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_18.id, '18.4', "Community engagement and external activities are facilitated where appropriate.", "Records show regular community outings and external activities.", "Community engagement logs"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_18.id, '18.5', "Activity participation is monitored and reviewed regularly.", "Monthly reports show participation rates and individual engagement levels.", "Participation monitoring and review records"]
  );
  console.log('  Added 5 questions to SERVICE_USER Section 18');
}

// SERVICE_USER Section 19 (5 questions)
const section_service_user_19 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 19]
))[0][0];

if (section_service_user_19) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_19.id, '19.1', "Check advance care planning, pain management, family involvement, and dignity in dying. Review staff training and support.", "Advance care plans are in place and regularly reviewed with service users and families.", "Advance care plans and end of life care records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_19.id, '19.2', "Pain and symptom management is effective and regularly assessed.", "Pain assessment tools are used and medication is administered appropriately.", "Pain assessment records and medication charts"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_19.id, '19.3', "Family and loved ones are involved and supported throughout end of life care.", "Family meeting notes show regular communication and support offered.", "Family communication logs and support records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_19.id, '19.4', "Staff are trained in end of life care and receive appropriate support.", "Training records show end of life care training and staff supervision notes.", "Training records and staff support documentation"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_19.id, '19.5', "Dignity, respect, and person-centered care are maintained throughout end of life.", "Care records show individualized, dignified care provided according to wishes.", "End of life care records and family feedback"]
  );
  console.log('  Added 5 questions to SERVICE_USER Section 19');
}

// SERVICE_USER Section 20 (5 questions)
const section_service_user_20 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 20]
))[0][0];

if (section_service_user_20) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_20.id, '20.1', "Assess mental health assessments, support plans, access to specialist services, and staff awareness. Check for person-centered mental health care.", "Mental health assessments are completed and support plans are in place.", "Mental health assessments and support plans"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_20.id, '20.2', "Service users have access to appropriate mental health specialist services.", "Referral records show timely access to psychiatrists, psychologists, or mental health nurses.", "Specialist referral and appointment records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_20.id, '20.3', "Staff are trained to recognize and respond to mental health needs.", "Training records show mental health awareness and response training.", "Mental health training certificates"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_20.id, '20.4', "Mental health support is person-centered and promotes recovery and wellbeing.", "Care plans show individualized mental health support strategies.", "Person-centered mental health care plans"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_20.id, '20.5', "Mental health is monitored and reviewed regularly with appropriate interventions.", "Review records show regular monitoring and timely interventions.", "Mental health monitoring and review records"]
  );
  console.log('  Added 5 questions to SERVICE_USER Section 20');
}

// SERVICE_USER Section 21 (5 questions)
const section_service_user_21 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 21]
))[0][0];

if (section_service_user_21) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_21.id, '21.1', "Review policies, staff training, and practices around protected characteristics. Ensure inclusive care that respects cultural, religious, and personal preferences.", "Equality and diversity policy is in place and staff training is up to date.", "Equality and diversity policy and training records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_21.id, '21.2', "Care plans reflect and respect individual cultural, religious, and personal preferences.", "Care plans document cultural needs, dietary requirements, and religious practices.", "Person-centered care plans with cultural considerations"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_21.id, '21.3', "Staff demonstrate understanding and respect for diversity in their practice.", "Observations and feedback show respectful, inclusive care delivery.", "Staff competency assessments and feedback"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_21.id, '21.4', "The service actively promotes equality and challenges discrimination.", "Policies and incident reports show proactive approach to equality.", "Equality monitoring and incident records"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_21.id, '21.5', "Service users and families feel their diversity is respected and valued.", "Feedback and surveys show positive experiences of inclusive care.", "Service user and family feedback"]
  );
  console.log('  Added 5 questions to SERVICE_USER Section 21');
}

// SERVICE_USER Section 22 (3 questions)
const section_service_user_22 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['service_user', 22]
))[0][0];

if (section_service_user_22) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_22.id, '22.1', "Assess management oversight, governance meetings, accountability frameworks, and leadership quality. Check registered manager presence and oversight.", "Governance meetings are held regularly with clear accountability structures.", "Governance meeting minutes and accountability frameworks"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_22.id, '22.2', "Registered manager is present, visible, and provides effective leadership.", "Staff and service users report regular interaction with registered manager.", "Leadership presence and feedback"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_service_user_22.id, '22.3', "Quality assurance systems are in place and effective.", "Audit schedules show regular quality monitoring and improvement actions.", "Quality assurance records and improvement plans"]
  );
  console.log('  Added 3 questions to SERVICE_USER Section 22');
}

// STAFF Section 1 (20 questions)
const section_staff_1 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 1]
))[0][0];

if (section_staff_1) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.1', "There is an up to date recruitment policy and procedure in place.", "", "There is an up to date recruitment policy and procedure in place"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.2', "The recruitment process is in line with the Equality Act 2010.", "The provider does not send out Health Declaration forms for completion.  Although not required by law, it is considered best practice for staff to complete a Health Declaration, therefore if someone declares a health condition that may impact on their employment, appropriate risk assessments can be ", "The recruitment process is in line with the Equality Act 2010"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.3', "There is evidence of an application form which includes full employment history and that any gaps in employment have been explored and recorded ", "The provider accepts CVs; however North Yorkshire Councils expectation is to receive an application form. The provider is to ensure that the application form requests full employment history as the CV received did not include full employment history and there was no evidence to suggest that gaps in ", "There is evidence of application forms which include full employment history in service or there as evidence that gaps have been explored"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.4', "There is a documented record of interviews having taken place and by two people who are appropriately positioned in the organization. ", "There was evidence of interview notes on both individuals\u2019 files reviewed. However, interviews were conducted by one individual. It is our expectation that interviews are conducted by two individuals that are appropriately positioned within the organisation. The interview documented the first name o", "There is a documented record of interviews having taken place and by two people who are appropriately positioned in the organisation"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.5', "There is a scoring mechanism in place with an agreed appointment threshold", "There was no evidence of a scoring mechanism in place which identifies that candidates have met the required threshold for appointment.", "There is a scoring mechanism in place with an agreed appointment threshold"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.6', "There is relevant identification documentation that has been validated (signed and dated as a true likeness).", "There was evidence on both files reviewed of a passport and right to work in the UK. Both documents had not been verified as we would expect. The second file reviewed had evidence of a resident permit which had expired in December 2024. There was no evidence that the employer had requested an up-to-", "There is relevant identification documentation that has been validated (signed and dated as a true likeness)."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.7', "There is proof of right to work documentation in the UK that has been validated. ( Signed and dated as the original seen) ", "On the first file reviewed there was evidence of their passport and home office documentation, however there was no evidence that these had been validated to confirm that originals had been seen and that the photograph was a true likeness. \n\nIn the second file viewed, there was evidence of a passpor", "There is proof of right to work documentation in the UK that has been validated"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.8', "There is an enhanced DBS prior to commencement of employment or evidence of an adults first with appropriate risk assessment.", "", "There is evidence of an enhanced DBS prior to staff delivering frontline services \nThere is evidence of an adults first check prior to staff delivering frontline services with an appropriate risk assessment "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.9', "There is a certificate of good conduct/overseas police check from country of origin where applicable. ", "There was no evidence of an oversees police check on file for either staff member reviewed. If someone is applying for entry clearance to work in the health and social care sectors in the UK then a criminal record certificate is required as part of their VISA application where they have lived for 12", "There is a certificate of good conduct/overseas police check from country of origin where applicable.\nThere is evidence that the provider has made all reasonable attempts to obtain overseas police check however nothing has been received and there is an appropriate risk assessment in place"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.1', "There are two written refences one of which is from the most recent employer that have been received prior to commencement of employment and have been verified (If the referees are not from a care provider, and the candidate has previously worked in care, a reference has been sought\nVerification of references should be a telephone follow uo and signed and dated to confirm this ", "On the first staff file reviewed it states that three references have been obtained but there was only 2 evident in the folder. The second reference only states dates of employment with no evidence that this has been verified. The reference is also obtained by the admin manager and not the Registere", "There are two written references, one of which is from the candidates most recent employer that has been received prior to commencement of employment and that they have been verified\nThere is evidence the provider has sought references from care providers where this is not the candidates primary ref"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.11', "Evidence of appropriate qualifications (including pin and revalidation status) for all staff.", "", "There is documented evidence of appropriate qualifications (including pin and revalidation status) on file"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.12', "There is a contract of employment which has been signed by both parties. ", "", "There is a contract of employment which has been signed by both parties"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.13', "Where there are agreed salary deductions, these are recorded within a formal agreement signed and dated by employer and employee for all staff ", "There was evidence of an agreed salary deduction for rent on both employee\u2019s file. The deduction was for \u00a3250 per month. It was unclear if this met the requirements for the minimum wage. Provider appeared unclear as to whether this had been explored prior to agreement being signed", "Where there are agreed salary deductions, these are recorded within a formal agreement signed and dated by both parties "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.14', "There is a copy of the staff members job description on their file for their current role - NB if these are then record this as best practice. ", "In the first staff members file reviewed, there was a job description on file but his was not specific to the person or signed. There was no evidence of any job description on the second file reviewed. ", "There is a copy of the staff members job description on their file for their current role "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.15', "Wherever there is a relevant health concern that may impact on their employement there is an appropriate risk assessment in place eg pregnancy, muscular skeletal, mental health, epilepsy", "There was no evidence that health concerns had been discussed with either employee and we could not evidence a mechanism for the provider to capture this at the time of assessment. ", "Wherever there is a relevant health concern that may impact on their employment there is an appropriate risk assessment in place "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.16', "If agency staff are utilized staff profiles are in place which detail:\n\u2022\tFull name.\n\u2022\tPhotograph.\n\u2022\tQualification and experience.\n\u2022\tDBS.\n\u2022\tRight to work.\n\u2022\tAll mandatory and specialist training including renewal date.\n\u2022\tPIN and NMC revalidation status (nursing staff) for all staff.\n\u2022\tCompetency assessment ", "There was evidence of agency profiles in place for agency workers. We reviewed 2 profiles at the time of assessment. Both files did not evidence that the individuals had undertaken medication training or had their competencies checked for administration or moving and handling techniques. One individ", "There is an agency profile for all agency files viewed which included all relevant areas"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.17', "If agency staff are utilized, there is relevant induction completed on their first shift covering:\n\u2022\tID checks.\n\u2022\tOrientation of service.\n\u2022\tFire procedure and security arrangements.\n\u2022\tRoles and responsibilities.\n\u2022\tAccess to appropriate records.", "Both files evidenced that induction had been commenced and completed. However, one individuals induction had been completed by the agency and not the provider. We would expect inductions to be completed by the provider so they can assure themselves of the information provided and that the staff are ", "There is an agency induction for agency viewed which includes all relevant areas as above."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.18', "There is a process for the safe recruitment of volunteers.", "", "There is a process for the safe recruitment of volunteers in the service."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_1.id, '11.19', "There is an effective approach to managing staff absences for all staff ", "", "There is an effective approach to managing staff absences for all staff."]
  );
  console.log('  Added 20 questions to STAFF Section 1');
}

// STAFF Section 2 (4 questions)
const section_staff_2 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 2]
))[0][0];

if (section_staff_2) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, 'No.', "Quality Assessment Tool Questions", "Identified Areas  For Improvement ", "Outcome"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '13.1', "There is a Whistleblowing Policy in place", "The provider has a Whistleblowing Policy and procedure in place. This has been reviewed on the 21.08.2025 and due for review on the 21.08.2026. The policy does not give contact details of how individuals can escalate whistleblowing concerns outside of the organisation and we recommend that this is a", "There is a whistleblowing policy in place."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '13.2', "There is a Bullying and Harassment Policy in place", "The provider has a Bullying and Harassment Policy in place. This was last reviewed on the 21.08.2025 and due for further review on the 21.08.2026. Again, the Bullying and Harassment Policy should reference the whistleblowing policy and contain information on how to escalate concerns outside of the o", "There is a Bullying and Harassment policy and in place."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_2.id, '13.3', "There is evidence that all staff have access to core policies and procedures and there is confirmation that they have read and understand them ", "", "There is evidence that staff have access to core policies and procedures and there is confirmation that they have read and understood them"]
  );
  console.log('  Added 4 questions to STAFF Section 2');
}

// STAFF Section 3 (5 questions)
const section_staff_3 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 3]
))[0][0];

if (section_staff_3) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '13.4', "There is evidence that the staff handbook has been issued and or available to all staff.", "There was no evidence of a staff handbook having been issued to the employee on either staff file reviewed. ", "There is evidence that the staff handbook has been issued and/or available to all staff."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '13.5', "There is evidence of a comprehensive and role specific service induction that has been signed and dated by both parties.", "", "There is evidence of a comprehensive service induction that has been signed and dated by both parties."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '13.6', "There is evidence of staff shadowing at induction.", "There was no evidence at the time of assessment that either staff member had undertaken shadowing at induction. We would recommend that shadowing is added to the induction paperwork so that this is clearly evidenced. ", "There is evidence of staff shadowing at induction"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '13.7', "There is evidence that the care certificate has been completed in the first 12 weeks for new care and support staff into care (including evidence of workbook having been signed and agreed by both parties).", "There was evidence on the training matrix that staff had completed the care certificate, but we could not evidence this was completed within 12 weeks. The two agency profiles did not have any evidence of having completed a care certificate that we could evidence. The provider stated that individuals", "There is evidence that the care certificate has been completed in the first 12 weeks for new staff into care (including evidence of workbook having been signed and agreed by both parties).\nWhere staff have attained relevant equivalent qualifications there is evidence of this "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_3.id, '13.8', "There is evidence of a minimum of 6 recorded supervisions per annum (50% of which can be completed in a group setting/ team meeting ). that are signed and dated and in line with 13.2 of the standards and outcomes framework, including \nAll aspects of care practice.\nPhilosophy of care.\nCareer development needs.\nPractical aspects of the job role.\nAdhering to the Skills for Care Code of Conduct. \n \n", "We could not evidence a supervision matrix at the time of assessment that evidenced supervision for all staff. The provider informed us that they meet with staff every 3 months to complete a 1-1 supervision and team meetings are monthly. We evidenced a one supervision on record for both staff review", "All staff files viewed have received a minimum of 6 recorded supervisions per annum (50% of which can be completed in a group setting/ team meeting ) that are signed and dated and in line with 13.2 of the standards and outcomes framework."]
  );
  console.log('  Added 5 questions to STAFF Section 3');
}

// STAFF Section 4 (5 questions)
const section_staff_4 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 4]
))[0][0];

if (section_staff_4) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '13.9', "There is evidence of clinical supervisions for nursing staff that are signed and dated and covers the required clinical areas\nAll staff files viewed have received a minimum of 6 recorded supervisions per annum (50% of which can be completed in a clinical team meeting)\nClinical supervision should be completed by a skilled clinical facilitator and cover:\nReflective component\nFocus on clinical practice including team dynamics and communication.\nProfessional development (PIN and revalidation) includ", "", "All staff files viewed have received a minimum of 6 recorded clinical supervisions per annum (50% of which can be completed in a clinical group setting) that are signed and dated.\nClinical supervision should be completed by a skilled clinical facilitator and cover:\n Reflective component\n Focus on cl"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '13.1', "There is evidence that appraisal targets are reviewed throughout the year (during supervision/performance management). and records are signed and dated by both parties  ", "", "All staff files viewed evidence that appraisal targets are reviewed throughout the year (during supervision/performance management) and records are signed and dated by both parties."]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '13.11', "There is a clear and appropriate process for supporting and managing staff regarding performance which does not meet the service and organizations agreed standards.", "", "The Manager is able to explain the process to be followed regarding issues of staff performance"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '13.12', "There is evidence of up-to-date, robust role specific competency assessments in place and that staff have been assessed by a suitably qualified person (examples may include Moving and handling, specialist nursing procedures, catering equipment)", "There was no evidence of up-to-date, robust role specific competency assessments in place conducted by a suitably qualified person. We would expect to see competencies around Moving and handling, care practices, medication administration and infection prevention and control for example. ", "All staff have up-to-date role specific competency assessments (at least annually or sooner if required)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_4.id, '13.13', "There is evidence of documented direct observations of care practice undertaken including spot checks ", "There was some evidence of direct spot checks having taken place, but these require strengthening. It was difficult to determine what had been assessed and they were not for all areas that we would expect, for example good medication administration or manual handling practices. The spot checks mainl", "All staff files viewed evidenced direct observations of practice/spot checks (at least annually or sooner if required"]
  );
  console.log('  Added 5 questions to STAFF Section 4');
}

// STAFF Section 5 (5 questions)
const section_staff_5 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 5]
))[0][0];

if (section_staff_5) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '13.14', "There is evidence that a training matrix or equivalent is in place which documents all training undertaken, and highlights renewal dates. ", "", "Matrix or equivalent  in place which includes all information as above "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '13.15', "There is evidence that all staff have undertaken appropriate mandatory and statutory training.", "The provider has a training matrix in place which documents training undertaken and relevant dates that training requires renewal. There was no evidence that staff had undertaken Oliver McGowan training in both level 1 and 2 which is now a mandatory requirement for all social care staff. Agency staf", "All staff have undertaken appropriate mandatory and statutory training (this may include new staff who are in the process of completing training within the induction period)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '13.16', "There is evidence that all staff have undertaken any additional training required to meet the specific needs of the individual(s), ie epilepsy, Diabetes, Parkinsons and Multiple Sclerosis  and in line with CQC registration, which is more than basic awareness, e.g., Dementia, Physical Disabilities, Learning Disabilities, Mental Health. ", "The provider has a training matrix in place which documents training undertaken and relevant dates that training requires renewal. There was no evidence that staff had undertaken Oliver McGowan training in both level 1 and 2 which is now a mandatory requirement for all social care staff. Agency staf", "All staff have undertaken appropriate additional training (this may include new staff who are in the process of completing training within the induction period)"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '13.17', "There is evidence of blended learning, e.g., classroom, face to face and E- learning.", "", "There is evidence of blended learning e.g. classroom, face to face and E- learning"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_5.id, '13.18', "Staff confirm that they have received an induction which was appropriate to their role.", "", "All staff spoken with confirmed that they have received an induction that was appropriate to their role "]
  );
  console.log('  Added 5 questions to STAFF Section 5');
}

// STAFF Section 6 (3 questions)
const section_staff_6 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 6]
))[0][0];

if (section_staff_6) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '13.19 obs', "Staff confirm they receive regular, two way, meaningful and supportive supervisions.", "", "All staff spoken with confirmed that they have received regular, two way, meaningful and supportive supervisions"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '13.2 obs', "Staff confirm that they can discuss their personal development and additional training needs during supervision.", "", "All staff spoken with confirmed that they can discuss their personal development and additional training needs during supervision"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_6.id, '13.21obs', "Agency staff confirm they have received an appropriate induction into the service to be able to carry out their duties appropriately.", "", "All agency staff spoken with confirmed that they have received an appropriate induction into the service to be able to carry out their duties appropriately"]
  );
  console.log('  Added 3 questions to STAFF Section 6');
}

// STAFF Section 7 (4 questions)
const section_staff_7 = (await connection.execute(
  'SELECT id FROM complianceSections WHERE sectionType = ? AND sectionNumber = ? LIMIT 1',
  ['staff', 7]
))[0][0];

if (section_staff_7) {
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '13.22 obs', "Staff confirm how they access policies and procedures and any updates relevant to their post.", "", "All staff spoken with confirmed how they access policies and procedures and any updates relevant to their post"]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '13.23 obs', "Staff confirmed that they are supported, and any issues or concerns raised are acted upon.", "", "All staff spoken with confirmed that they are supported, and any issues or concerns raised are acted upon "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '13.24 obs', "Staff confirm that there is an open culture which enables them to raise concerns and they are aware of the Whistleblowing and Bullying & Harassment Policy. ", "", "All staff spoken with confirmed that there is an open culture which enables them to raise concerns and are aware of both policies "]
  );
  await connection.execute(
    'INSERT INTO complianceQuestions (sectionId, questionNumber, questionText, standardDescription, guidance) VALUES (?, ?, ?, ?, ?)',
    [section_staff_7.id, '13.25 obs', "Staff confirm they have the opportunity for open discussion and debrief in relation to lessons learned following an incident or concern.", "", "All staff spoken with confirmed they have the opportunity for open discussion and debrief in relation to lessons learned following an incident or concern"]
  );
  console.log('  Added 4 questions to STAFF Section 7');
}


console.log('\nTotal questions added: 233');
await connection.end();
