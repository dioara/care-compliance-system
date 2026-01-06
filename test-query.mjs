import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const fileId = '1767719124039-7f718ff220cb3cc4';

console.log('Testing query...');
const result = await db.execute(sql`
  SELECT file_data, mime_type FROM temp_files WHERE id = ${fileId}
`);

console.log('Result type:', typeof result);
console.log('Result is array:', Array.isArray(result));
console.log('Result length:', result.length);
console.log('Result[0] type:', typeof result[0]);
console.log('Result[0] is array:', Array.isArray(result[0]));
if (Array.isArray(result[0])) {
  console.log('Result[0] length:', result[0].length);
  if (result[0].length > 0) {
    console.log('Result[0][0]:', Object.keys(result[0][0]));
  }
}

await connection.end();
