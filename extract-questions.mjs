import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [questions] = await connection.query(`
    SELECT 
      q.id,
      q.questionNumber,
      q.questionText,
      q.questionType,
      q.guidance,
      q.kloes,
      s.sectionTitle,
      t.templateName,
      at.auditName as auditTypeName
    FROM auditTemplateQuestions q
    JOIN auditTemplateSections s ON q.auditTemplateSectionId = s.id
    JOIN auditTemplates t ON s.auditTemplateId = t.id
    JOIN auditTypes at ON t.auditTypeId = at.id
    ORDER BY at.auditName, t.templateName, s.sectionNumber, q.displayOrder
  `);
  
  console.log(JSON.stringify(questions, null, 2));
  console.error(`\nTotal questions: ${questions.length}`);
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await connection.end();
}
