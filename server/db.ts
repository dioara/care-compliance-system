import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users, tenants, locations, InsertUser, InsertTenant, InsertLocation } from "../drizzle/schema";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER MANAGEMENT =====

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  tenantId?: number;
  role?: "admin" | "quality_officer" | "manager" | "staff";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [user] = await db.insert(users).values({
    email: data.email,
    password: hashedPassword,
    name: data.name || null,
    tenantId: data.tenantId || null,
    role: data.role || "staff",
    twoFaEnabled: false,
    twoFaVerified: false,
  }).$returningId();

  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function updateUserRole(userId: number, role: "admin" | "quality_officer" | "manager" | "staff") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ===== TENANT MANAGEMENT =====

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [tenant] = await db.insert(tenants).values(data).$returningId();
  return tenant;
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tenants).set(data).where(eq(tenants.id, id));
}

// ===== LOCATION MANAGEMENT =====

export async function createLocation(data: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [location] = await db.insert(locations).values(data).$returningId();
  return location;
}

export async function getLocationsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(locations).where(eq(locations.tenantId, tenantId));
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLocation(id: number, data: Partial<InsertLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(locations).set(data).where(eq(locations.id, id));
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(locations).where(eq(locations.id, id));
}
