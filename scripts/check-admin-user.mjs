import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const result = await db.select().from(users).where(eq(users.email, "admin@testcarehome.com"));

console.log("User found:", result.length > 0);
if (result.length > 0) {
  const user = result[0];
  console.log("User data:");
  console.log("- ID:", user.id);
  console.log("- Email:", user.email);
  console.log("- Name:", user.name);
  console.log("- Role:", user.role);
  console.log("- Super Admin:", user.superAdmin);
  console.log("- Tenant ID:", user.tenantId);
  console.log("- Password hash exists:", !!user.password);
  console.log("- Password hash length:", user.password?.length || 0);
} else {
  console.log("User not found in database!");
}
