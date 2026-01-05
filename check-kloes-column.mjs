import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const [rows] = await connection.query("DESCRIBE auditTemplateQuestions");
console.log("auditTemplateQuestions columns:");
rows.forEach(row => console.log(`  - ${row.Field}: ${row.Type}`));

const kloesColumn = rows.find(row => row.Field === 'kloes');
if (kloesColumn) {
  console.log("\n✓ kloes column exists!");
} else {
  console.log("\n✗ kloes column does NOT exist");
}

await connection.end();
