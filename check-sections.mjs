import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all templates
const [templates] = await conn.execute(`
  SELECT at.id, at.templateName, at.auditTypeId
  FROM auditTemplates at
  WHERE at.templateName LIKE '%Staff%'
`);
console.log('Templates found:', templates);

if (templates.length > 0) {
  const templateId = templates[0].id;
  
  // Get sections
  const [sections] = await conn.execute(`
    SELECT id, sectionNumber, sectionTitle, displayOrder
    FROM auditTemplateSections
    WHERE auditTemplateId = ?
    ORDER BY displayOrder
  `, [templateId]);
  
  console.log('\nSections:');
  for (const section of sections) {
    const [questions] = await conn.execute(`
      SELECT COUNT(*) as count FROM auditTemplateQuestions WHERE auditTemplateSectionId = ?
    `, [section.id]);
    console.log(`Section ${section.sectionNumber}: ${section.sectionTitle} - ${questions[0].count} questions`);
    
    // Get question numbers for this section
    const [qNums] = await conn.execute(`
      SELECT questionNumber FROM auditTemplateQuestions 
      WHERE auditTemplateSectionId = ? 
      ORDER BY displayOrder
    `, [section.id]);
    console.log(`  Question numbers: ${qNums.map(q => q.questionNumber).join(', ')}`);
  }
}

await conn.end();
