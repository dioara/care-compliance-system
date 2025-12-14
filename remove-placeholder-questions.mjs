import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Removing "Quality Assessment Tool Questions" placeholder rows from all sections...');

const result = await connection.execute(
  `DELETE FROM complianceQuestions 
   WHERE questionText = 'Quality Assessment Tool Questions' 
   AND questionNumber = 'No.'`
);

console.log(`Deleted ${result[0].affectedRows} placeholder rows`);

// Also check for any other common placeholder patterns
const result2 = await connection.execute(
  `DELETE FROM complianceQuestions 
   WHERE standardDescription = 'Identified Areas For Improvement' 
   AND guidance = 'Outcome'
   AND questionNumber = 'No.'`
);

console.log(`Deleted ${result2[0].affectedRows} additional placeholder rows with matching evidence fields`);

await connection.end();
console.log('Placeholder removal complete!');
