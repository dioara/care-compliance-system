import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { users, tenants } from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get first tenant
const [tenant] = await db.select().from(tenants).limit(1);
if (!tenant) {
  console.log("No tenant found. Please create a company first.");
  process.exit(1);
}

// Hash password
const hashedPassword = await bcrypt.hash("Admin123!", 10);

// Create admin user
const [result] = await db.insert(users).values({
  email: "admin@example.com",
  password: hashedPassword,
  name: "Admin User",
  role: "admin",
  tenantId: tenant.id,
  emailVerified: true,
});

console.log("✅ Admin user created successfully!");
console.log("Email: admin@example.com");
console.log("Password: Admin123!");
console.log("Role: admin");

await connection.end();
