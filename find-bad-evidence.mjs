import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find questions with problematic text patterns
const [rows] = await conn.execute(`
  SELECT questionNumber, evidenceRequirement, exampleEvidence 
  FROM complianceQuestions 
  WHERE evidenceRequirement LIKE '%In the first file%'
     OR evidenceRequirement LIKE '%we reviewed%'
     OR evidenceRequirement LIKE '%Paracetamol%'
  ORDER BY questionNumber
`);

console.log(`Found ${rows.length} questions with problematic evidence text:\n`);

rows.forEach(row => {
  console.log(`Question ${row.questionNumber}:`);
  console.log(`Evidence Requirement: ${row.evidenceRequirement?.substring(0, 150)}...`);
  console.log('---');
});

await conn.end();
