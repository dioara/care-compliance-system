import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { roleLocationPermissions } from './drizzle/schema';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  const perms = await db.select().from(roleLocationPermissions);
  console.log('Permissions:', JSON.stringify(perms, null, 2));
  await connection.end();
}

main().catch(console.error);
