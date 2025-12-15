import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT questionNumber, questionText FROM complianceQuestions WHERE sectionId = 1 ORDER BY questionNumber'
);

console.log(`Section 1 question numbers (${rows.length} questions):\n`);

rows.forEach(row => {
  console.log(`${row.questionNumber}: ${row.questionText.substring(0, 60)}...`);
});

await conn.end();
