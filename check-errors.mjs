import mysql from 'mysql2/promise.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(`
  SELECT id, documentName, createdAt, progress, errorMessage 
  FROM ai_audits 
  WHERE status = 'failed' 
  ORDER BY createdAt DESC 
  LIMIT 5
`);

console.log('Failed jobs:');
rows.forEach(job => {
  console.log('=====================================');
  console.log('ID:', job.id);
  console.log('Document:', job.documentName);
  console.log('Created:', job.createdAt);
  console.log('Progress:', job.progress);
  console.log('Error:', job.errorMessage);
});

await connection.end();
