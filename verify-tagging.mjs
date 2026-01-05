import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get sample questions with KLOEs
  const [questions] = await connection.query(`
    SELECT 
      q.id,
      q.questionText,
      q.kloes,
      s.sectionTitle,
      at.auditName as auditTypeName
    FROM auditTemplateQuestions q
    JOIN auditTemplateSections s ON q.auditTemplateSectionId = s.id
    JOIN auditTemplates t ON s.auditTemplateId = t.id
    JOIN auditTypes at ON t.auditTypeId = at.id
    WHERE q.kloes IS NOT NULL AND q.kloes != ''
    ORDER BY RAND()
    LIMIT 10
  `);
  
  console.log('\n=== Sample Tagged Questions ===\n');
  questions.forEach((q, i) => {
    console.log(`${i + 1}. ${q.auditTypeName} - ${q.sectionTitle}`);
    console.log(`   Q: ${q.questionText}`);
    console.log(`   KLOEs: ${q.kloes}\n`);
  });
  
  // Get statistics
  const [stats] = await connection.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN kloes IS NOT NULL AND kloes != '' THEN 1 ELSE 0 END) as tagged,
      SUM(CASE WHEN kloes IS NULL OR kloes = '' THEN 1 ELSE 0 END) as untagged
    FROM auditTemplateQuestions
  `);
  
  console.log('=== Tagging Statistics ===');
  console.log(`Total questions: ${stats[0].total}`);
  console.log(`Tagged: ${stats[0].tagged} (${Math.round(stats[0].tagged/stats[0].total*100)}%)`);
  console.log(`Untagged: ${stats[0].untagged} (${Math.round(stats[0].untagged/stats[0].total*100)}%)`);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
