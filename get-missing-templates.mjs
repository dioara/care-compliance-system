import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { auditTypes, auditTemplates } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { mode: 'default' });

const result = await db.execute(sql`
  SELECT aty.id, aty.auditName, aty.templateReference,
    (SELECT COUNT(*) FROM auditTemplates WHERE auditTypeId = aty.id) as templateCount
  FROM auditTypes aty
  HAVING templateCount = 0
  ORDER BY aty.auditName
`);

console.log('Audit types without templates:\n');
result[0].forEach((row, index) => {
  console.log(`${index + 1}. ${row.auditName} (${row.templateReference})`);
});

console.log(`\nTotal: ${result[0].length} audit types need templates`);

await connection.end();
