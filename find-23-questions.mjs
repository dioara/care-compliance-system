import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find questions numbered 23.x
const [questions] = await conn.execute(`
  SELECT atq.questionNumber, atq.questionText, ats.sectionTitle, at.templateName
  FROM auditTemplateQuestions atq
  JOIN auditTemplateSections ats ON atq.auditTemplateSectionId = ats.id
  JOIN auditTemplates at ON ats.auditTemplateId = at.id
  WHERE atq.questionNumber LIKE '23.%'
  ORDER BY atq.questionNumber
  LIMIT 50
`);

console.log('Questions numbered 23.x:', questions.length);
questions.forEach(q => {
  console.log(`${q.questionNumber}: ${q.questionText?.substring(0, 60)}... (${q.templateName})`);
});

// Check what templates have section 23
const [sections] = await conn.execute(`
  SELECT DISTINCT at.id, at.templateName, ats.sectionNumber, ats.sectionTitle
  FROM auditTemplateSections ats
  JOIN auditTemplates at ON ats.auditTemplateId = at.id
  WHERE ats.sectionNumber >= 20
  ORDER BY at.templateName, ats.sectionNumber
`);

console.log('\n\nTemplates with sections >= 20:');
sections.forEach(s => {
  console.log(`Template: ${s.templateName}, Section ${s.sectionNumber}: ${s.sectionTitle}`);
});

await conn.end();
