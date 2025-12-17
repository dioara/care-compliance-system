import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { users, tenants } from "./drizzle/schema";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

const [tenant] = await db.select().from(tenants).limit(1);
if (!tenant) {
  console.log("No tenant found.");
  process.exit(1);
}

const hashedPassword = await bcrypt.hash("Admin123!", 10);

await db.insert(users).values({
  email: "admin@example.com",
  password: hashedPassword,
  name: "Admin User",
  role: "admin",
  tenantId: tenant.id,
  emailVerified: true,
});

console.log("✅ Admin created: admin@example.com / Admin123!");
await connection.end();
