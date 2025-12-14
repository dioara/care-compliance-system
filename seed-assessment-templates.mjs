import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Seeding assessment templates...");

// Clear existing templates
await connection.execute("DELETE FROM templateQuestions");
await connection.execute("DELETE FROM assessmentTemplates");

// Create 4 default templates
const templates = [
  {
    name: "Residential Care Home",
    careSettingType: "residential",
    description: "Standard assessment template for residential care homes providing personal care, accommodation, and daily living support. Focuses on person-centred care, activities, nutrition, and maintaining residents' dignity and independence.",
    isDefault: true,
  },
  {
    name: "Nursing Home",
    careSettingType: "nursing",
    description: "Comprehensive assessment template for nursing homes providing 24-hour nursing care. Includes additional focus on clinical care, medication management, registered nurse requirements, health monitoring, and complex care needs.",
    isDefault: true,
  },
  {
    name: "Domiciliary Care (Home Care)",
    careSettingType: "domiciliary",
    description: "Assessment template for domiciliary care services providing care and support in people's own homes. Emphasises lone working safety, travel time, person-centred care planning, and supporting independence in familiar surroundings.",
    isDefault: true,
  },
  {
    name: "Supported Living",
    careSettingType: "supported_living",
    description: "Assessment template for supported living services helping people live independently in their own tenancies. Focuses on promoting independence, community access, life skills development, tenancy rights, and personalised support.",
    isDefault: true,
  },
];

// Insert templates
const [residentialResult] = await connection.execute(
  "INSERT INTO assessmentTemplates (name, careSettingType, description, isDefault) VALUES (?, ?, ?, ?)",
  [templates[0].name, templates[0].careSettingType, templates[0].description, templates[0].isDefault]
);
const residentialId = residentialResult.insertId;

const [nursingResult] = await connection.execute(
  "INSERT INTO assessmentTemplates (name, careSettingType, description, isDefault) VALUES (?, ?, ?, ?)",
  [templates[1].name, templates[1].careSettingType, templates[1].description, templates[1].isDefault]
);
const nursingId = nursingResult.insertId;

const [domiciliaryResult] = await connection.execute(
  "INSERT INTO assessmentTemplates (name, careSettingType, description, isDefault) VALUES (?, ?, ?, ?)",
  [templates[2].name, templates[2].careSettingType, templates[2].description, templates[2].isDefault]
);
const domiciliaryId = domiciliaryResult.insertId;

const [supportedResult] = await connection.execute(
  "INSERT INTO assessmentTemplates (name, careSettingType, description, isDefault) VALUES (?, ?, ?, ?)",
  [templates[3].name, templates[3].careSettingType, templates[3].description, templates[3].isDefault]
);
const supportedId = supportedResult.insertId;

console.log(`✅ Created 4 assessment templates`);
console.log(`   - Residential Care: ID ${residentialId}`);
console.log(`   - Nursing Home: ID ${nursingId}`);
console.log(`   - Domiciliary Care: ID ${domiciliaryId}`);
console.log(`   - Supported Living: ID ${supportedId}`);

// Get all questions - we'll include all questions in all templates
// (Organizations can customize which questions to use based on their needs)
const [allQuestions] = await connection.execute(
  "SELECT id, sectionId, questionNumber, questionText FROM complianceQuestions ORDER BY sectionId, questionNumber"
);

console.log(`\n📋 Found ${allQuestions.length} total compliance questions`);

const allQuestionIds = allQuestions.map(q => q.id);

// Helper function to add questions to a template
async function addQuestionsToTemplate(templateId, questionIds, isRequired = false, isRecommended = true) {
  for (const questionId of questionIds) {
    await connection.execute(
      "INSERT INTO templateQuestions (templateId, questionId, isRequired, isRecommended) VALUES (?, ?, ?, ?)",
      [templateId, questionId, isRequired, isRecommended]
    );
  }
}

// ALL TEMPLATES: Include all questions (organizations can customize later)
// This provides a comprehensive starting point for each care setting

await addQuestionsToTemplate(residentialId, allQuestionIds, false, true);
console.log(`\n✅ Residential Care: Added ${allQuestionIds.length} questions`);

await addQuestionsToTemplate(nursingId, allQuestionIds, false, true);
console.log(`✅ Nursing Home: Added ${allQuestionIds.length} questions`);

await addQuestionsToTemplate(domiciliaryId, allQuestionIds, false, true);
console.log(`✅ Domiciliary Care: Added ${allQuestionIds.length} questions`);

await addQuestionsToTemplate(supportedId, allQuestionIds, false, true);
console.log(`✅ Supported Living: Added ${allQuestionIds.length} questions`);

console.log("\n🎉 Assessment templates seeded successfully!");
console.log("\n📊 Summary:");
console.log(`   - 4 templates created for different care settings`);
console.log(`   - Each template includes all ${allQuestionIds.length} compliance questions as a comprehensive starting point`);
console.log(`   - Organizations can customize templates based on their specific needs`);
console.log(`   - Templates provide guidance on which questions are most relevant for each care setting type`);

await connection.end();
