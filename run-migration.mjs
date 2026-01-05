import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log("Running migration: ALTER TABLE auditTemplateQuestions ADD kloes text");
  await connection.query("ALTER TABLE `auditTemplateQuestions` ADD `kloes` text");
  console.log("✓ Migration successful!");
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log("✓ Column 'kloes' already exists");
  } else {
    console.error("✗ Migration failed:", error.message);
  }
}

await connection.end();
