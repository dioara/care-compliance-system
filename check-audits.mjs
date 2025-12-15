import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT serviceTypes, COUNT(*) as cnt FROM auditTypes GROUP BY serviceTypes');
console.log('Service Types Distribution:');
rows.forEach(row => {
  console.log(`  ${row.serviceTypes || 'NULL'}: ${row.cnt} audits`);
});
await connection.end();
