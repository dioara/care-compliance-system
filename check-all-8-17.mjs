import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT id, questionNumber, sectionId, evidenceRequirement FROM complianceQuestions WHERE questionNumber LIKE "8.17%"'
);

console.log(`Found ${rows.length} questions matching 8.17:\n`);

rows.forEach(row => {
  console.log(`ID: ${row.id}`);
  console.log(`Question Number: ${row.questionNumber}`);
  console.log(`Section ID: ${row.sectionId}`);
  console.log(`Evidence Req (first 100 chars): ${row.evidenceRequirement?.substring(0, 100)}`);
  console.log('---\n');
});

await conn.end();
