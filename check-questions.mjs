import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(`
  SELECT atq.questionNumber, LEFT(atq.questionText, 60) as questionText 
  FROM auditTemplateQuestions atq 
  JOIN auditTemplateSections ats ON atq.auditTemplateSectionId = ats.id 
  JOIN auditTemplates at ON ats.auditTemplateId = at.id 
  WHERE at.templateName LIKE '%Staff%' OR at.templateName LIKE '%Recruitment%' 
  ORDER BY CAST(SUBSTRING_INDEX(atq.questionNumber, '.', 1) AS UNSIGNED), 
           CAST(SUBSTRING_INDEX(atq.questionNumber, '.', -1) AS UNSIGNED)
`);
console.log('Total questions:', rows.length);
console.log('\nQuestion numbers in database:');
rows.forEach(r => console.log(`${r.questionNumber}: ${r.questionText}`));
await conn.end();
