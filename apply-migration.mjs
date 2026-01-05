import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log("Checking if kloes column already exists...");
  const [columns] = await connection.query(`
    SHOW COLUMNS FROM auditTemplateQuestions LIKE 'kloes'
  `);
  
  if (columns.length > 0) {
    console.log("✓ Column 'kloes' already exists. Skipping migration.");
  } else {
    console.log("Adding 'kloes' column to auditTemplateQuestions table...");
    await connection.query(`ALTER TABLE auditTemplateQuestions ADD kloes text`);
    console.log("✓ Migration applied successfully!");
  }
} catch (error) {
  console.error("✗ Error:", error.message);
  process.exit(1);
} finally {
  await connection.end();
}
