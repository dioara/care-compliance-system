import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tenants, InsertTenant, locations, InsertLocation } from "../drizzle/schema";
import { ENV } from './_core/env';

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

/**
 * Get or create tenant for a user during first login
 * For multi-tenant system, we create a default tenant for each new user
 */
export async function getOrCreateTenantForUser(openId: string, name: string | null, email: string | null): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  // Check if user already exists and has a tenant
  const existingUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (existingUser.length > 0 && existingUser[0] && existingUser[0].tenantId) {
    return existingUser[0].tenantId;
  }

  // Create a new tenant for this user
  const tenantName = name || email || `Company-${Date.now()}`;
  const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  
  const [tenant] = await db.insert(tenants).values({
    name: tenantName,
    slug,
  });

  return tenant.insertId;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // If tenantId is not provided, get or create one
    let tenantId = user.tenantId;
    if (!tenantId) {
      tenantId = await getOrCreateTenantForUser(user.openId, user.name ?? null, user.email ?? null);
    }

    const values: InsertUser = {
      openId: user.openId,
      tenantId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTenant(tenantId: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  await db.update(tenants).set(data).where(eq(tenants.id, tenantId));
}

export async function getLocationsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(locations).where(eq(locations.tenantId, tenantId));
}

export async function createLocation(data: InsertLocation) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  const [result] = await db.insert(locations).values(data);
  return result.insertId;
}

export async function updateLocation(locationId: number, data: Partial<InsertLocation>) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  await db.update(locations).set(data).where(eq(locations.id, locationId));
}

export async function deleteLocation(locationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  await db.delete(locations).where(eq(locations.id, locationId));
}

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function updateUserRole(userId: number, role: 'admin' | 'quality_officer' | 'manager' | 'staff') {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database not available");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}
