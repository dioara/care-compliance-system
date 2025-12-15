import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT questionNumber, questionText, evidenceRequirement FROM complianceQuestions WHERE sectionId = 8 ORDER BY questionNumber'
);

console.log(`Section 8 (Medication Management) - ${rows.length} questions:\n`);

rows.forEach(row => {
  console.log(`${row.questionNumber}: ${row.questionText.substring(0, 60)}...`);
  console.log(`Evidence: ${row.evidenceRequirement?.substring(0, 80)}...`);
  console.log('---\n');
});

await conn.end();
