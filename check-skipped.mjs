import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  'SELECT questionNumber, questionText FROM complianceQuestions WHERE questionNumber IN ("4.10", "5.5", "5.6", "5.7", "5.8", "5.9") ORDER BY questionNumber'
);

console.log('Skipped questions found in database:');
console.log(JSON.stringify(rows, null, 2));
console.log(`\nTotal: ${rows.length} questions`);

await conn.end();
