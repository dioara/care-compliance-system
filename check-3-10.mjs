import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT questionNumber, evidenceRequirement, exampleEvidence FROM complianceQuestions WHERE questionNumber = "3.10"'
);

console.log('Question 3.10 Evidence:');
console.log('\nEvidence Requirement:');
console.log(rows[0].evidenceRequirement);
console.log('\nExample Evidence:');
console.log(rows[0].exampleEvidence);
console.log('\nEvidence Requirement Length:', rows[0].evidenceRequirement?.length || 0);
console.log('Example Evidence Length:', rows[0].exampleEvidence?.length || 0);

await conn.end();
