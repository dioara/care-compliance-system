import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { locations } from './drizzle/schema';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  const locs = await db.select().from(locations);
  console.log('Locations:', JSON.stringify(locs.map(l => ({ id: l.id, name: l.name })), null, 2));
  await connection.end();
}

main().catch(console.error);
