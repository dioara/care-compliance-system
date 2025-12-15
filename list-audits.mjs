import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT id, auditName FROM auditTypes ORDER BY auditName');
console.log('All Audit Names:');
rows.forEach(row => {
  console.log(`  ${row.id}: ${row.auditName}`);
});
await connection.end();
