import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT * FROM role_location_permissions');
console.log('Permissions:', JSON.stringify(rows, null, 2));
await conn.end();
