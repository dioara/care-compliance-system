import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";
import { eq, and } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

/**
 * Add conditional logic to staff Section 1 questions
 * 
 * Logic:
 * - Questions 1.1-1.7: Always show (base questions)
 * - Questions 1.8-1.14: Show for ALL employment types (permanent staff checks)
 * - Questions 1.15-1.19: Show ONLY for "Sponsored" (visa/sponsorship questions)
 * - Questions 1.20-1.25: Show for ALL employment types (general employment questions)
 * - Questions 1.26-1.28: Show ONLY for "Agency" (agency-specific questions)
 * - Questions 1.29-1.30: Show ONLY for "Bank" (bank-specific questions)
 * - Questions 1.31-1.33: Show for ALL employment types (final checks)
 */

async function addConditionalLogic() {
  console.log("Adding conditional logic to staff Section 1 questions...\n");

  // Get Staff Section 1
  const sections = await db.select().from(schema.complianceSections)
    .where(and(
      eq(schema.complianceSections.sectionType, "staff"),
      eq(schema.complianceSections.sectionNumber, 1)
    ));

  if (sections.length === 0) {
    console.log("❌ Staff Section 1 not found");
    return;
  }

  const sectionId = sections[0].id;
  console.log(`✓ Found Staff Section 1 (ID: ${sectionId})\n`);

  // Define conditional logic rules
  const conditionalRules = [
    // Sponsored worker questions (1.15-1.19)
    { questionNumbers: ["1.15", "1.16", "1.17", "1.18", "1.19"], 
      logic: { dependsOn: "1.7", showWhen: ["Sponsored"] } },
    
    // Agency staff questions (1.26-1.28)
    { questionNumbers: ["1.26", "1.27", "1.28"], 
      logic: { dependsOn: "1.7", showWhen: ["Agency"] } },
    
    // Bank staff questions (1.29-1.30)
    { questionNumbers: ["1.29", "1.30"], 
      logic: { dependsOn: "1.7", showWhen: ["Bank"] } },
  ];

  let updatedCount = 0;

  for (const rule of conditionalRules) {
    for (const questionNumber of rule.questionNumbers) {
      const result = await db.update(schema.complianceQuestions)
        .set({ conditionalLogic: JSON.stringify(rule.logic) })
        .where(and(
          eq(schema.complianceQuestions.sectionId, sectionId),
          eq(schema.complianceQuestions.questionNumber, questionNumber)
        ));

      console.log(`✓ Updated Question ${questionNumber}: Show when employment type is ${rule.logic.showWhen.join(" or ")}`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Added conditional logic to ${updatedCount} questions`);
  console.log("\nSummary:");
  console.log("- Questions 1.1-1.14, 1.20-1.25, 1.31-1.33: Always visible");
  console.log("- Questions 1.15-1.19: Visible only for Sponsored workers");
  console.log("- Questions 1.26-1.28: Visible only for Agency staff");
  console.log("- Questions 1.29-1.30: Visible only for Bank staff");
}

await addConditionalLogic();
await connection.end();
