import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Service User questions (sections 1-22)
console.log('\n=== SERVICE USER COMPLIANCE QUESTIONS (Sample) ===\n');
const [serviceUserRows] = await connection.execute(`
  SELECT id, sectionId, questionNumber, questionText, exampleEvidence
  FROM complianceQuestions
  WHERE sectionId BETWEEN 1 AND 22
  ORDER BY sectionId, id
  LIMIT 5
`);

for (const row of serviceUserRows) {
  console.log(`--- Section ${row.sectionId} ---`);
  console.log(`Question ${row.questionNumber}: ${row.questionText.substring(0, 120)}...`);
  console.log(`HOW TO EVIDENCE: ${row.exampleEvidence || 'Not set'}`);
  console.log('');
}

// Staff questions (sections 23-29)
console.log('\n=== STAFF COMPLIANCE QUESTIONS (Sample) ===\n');
const [staffRows] = await connection.execute(`
  SELECT id, sectionId, questionNumber, questionText, exampleEvidence
  FROM complianceQuestions
  WHERE sectionId >= 23
  ORDER BY sectionId, id
  LIMIT 5
`);

for (const row of staffRows) {
  console.log(`--- Section ${row.sectionId} ---`);
  console.log(`Question ${row.questionNumber}: ${row.questionText.substring(0, 120)}...`);
  console.log(`HOW TO EVIDENCE: ${row.exampleEvidence || 'Not set'}`);
  console.log('');
}

// Count questions with evidence
const [countRows] = await connection.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN exampleEvidence IS NOT NULL AND exampleEvidence != '' THEN 1 ELSE 0 END) as withEvidence
  FROM complianceQuestions
`);
console.log(`\n=== SUMMARY ===`);
console.log(`Total questions: ${countRows[0].total}`);
console.log(`Questions with "How to Evidence": ${countRows[0].withEvidence}`);

await connection.end();
