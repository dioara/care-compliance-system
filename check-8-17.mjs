import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT * FROM complianceQuestions WHERE questionNumber = "8.17"'
);

if (rows.length > 0) {
  const q = rows[0];
  console.log('Question 8.17:');
  console.log('\nQuestion Text:', q.questionText);
  console.log('\nEvidence Requirement:');
  console.log(q.evidenceRequirement);
  console.log('\nExample Evidence:');
  console.log(q.exampleEvidence);
} else {
  console.log('Question 8.17 not found');
}

await conn.end();
