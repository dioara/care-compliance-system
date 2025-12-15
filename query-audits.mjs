import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, auditName, auditCategory FROM auditTypes WHERE isActive = 1 ORDER BY id');
console.log(JSON.stringify(rows, null, 2));
await conn.end();
