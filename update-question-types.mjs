import { getDb } from "./server/db.ts";
import { auditTemplateQuestions } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (db) {
  const result = await db
    .update(auditTemplateQuestions)
    .set({ questionType: "yes_no_na" })
    .where(eq(auditTemplateQuestions.questionType, "yes_no"));
  
  console.log("✅ Updated all yes_no questions to yes_no_na");
  console.log("Rows affected:", result.rowsAffected || "unknown");
} else {
  console.error("❌ Database not initialized");
}

process.exit(0);
