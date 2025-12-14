import { eq, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import {
  users,
  tenants,
  locations,
  roles,
  roleLocationPermissions,
  userRoles,
  type InsertUser,
  type InsertTenant,
  type InsertLocation,
  type InsertRole,
  type InsertRoleLocationPermission,
  type InsertUserRole,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  tenantId?: number;
  role?: "admin" | "quality_officer" | "manager" | "staff";
  superAdmin?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await db.insert(users).values({
    email: data.email,
    password: hashedPassword,
    name: data.name,
    tenantId: data.tenantId,
    role: data.role || "staff",
    superAdmin: data.superAdmin || false,
    twoFaEnabled: false,
    twoFaVerified: false,
  });

  return result;
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

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function updateUserRole(userId: number, role: "admin" | "quality_officer" | "manager" | "staff") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tenants).values(data);
  return result;
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

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

export async function createLocation(data: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(locations).values(data);
  return result;
}

export async function getLocationsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(locations).where(eq(locations.tenantId, tenantId));
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

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

export async function createRole(data: InsertRole) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(roles).values(data);
  return result;
}

export async function getRolesByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(roles).where(eq(roles.tenantId, tenantId));
}

export async function getRoleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateRole(id: number, data: Partial<InsertRole>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(roles).set(data).where(eq(roles.id, id));
}

export async function deleteRole(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete role-location permissions
  await db.delete(roleLocationPermissions).where(eq(roleLocationPermissions.roleId, id));
  
  // Delete user-role assignments
  await db.delete(userRoles).where(eq(userRoles.roleId, id));
  
  // Delete role
  await db.delete(roles).where(eq(roles.id, id));
}

// ============================================================================
// ROLE-LOCATION PERMISSIONS
// ============================================================================

export async function setRoleLocationPermissions(roleId: number, permissions: InsertRoleLocationPermission[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing permissions
  await db.delete(roleLocationPermissions).where(eq(roleLocationPermissions.roleId, roleId));

  // Insert new permissions
  if (permissions.length > 0) {
    await db.insert(roleLocationPermissions).values(permissions);
  }
}

export async function getRoleLocationPermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(roleLocationPermissions).where(eq(roleLocationPermissions.roleId, roleId));
}

// ============================================================================
// USER-ROLE ASSIGNMENTS
// ============================================================================

export async function assignUserToRole(userId: number, roleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userRoles).values({ userId, roleId });
}

export async function removeUserFromRole(userId: number, roleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
}

export async function getUserRoles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userRoles).where(eq(userRoles.userId, userId));
}

export async function setUserRoles(userId: number, roleIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing role assignments
  await db.delete(userRoles).where(eq(userRoles.userId, userId));

  // Insert new role assignments
  if (roleIds.length > 0) {
    const values = roleIds.map(roleId => ({ userId, roleId }));
    await db.insert(userRoles).values(values);
  }
}

// ============================================================================
// PERMISSION RESOLUTION
// ============================================================================

/**
 * Get all locations a user can access based on their assigned roles
 * Returns array of { locationId, canRead, canWrite }
 */
export async function getUserLocationPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get user's roles
  const userRolesList = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
  
  if (userRolesList.length === 0) return [];

  const roleIds = userRolesList.map(ur => ur.roleId);

  // Get all location permissions for these roles
  const permissions = await db
    .select()
    .from(roleLocationPermissions)
    .where(inArray(roleLocationPermissions.roleId, roleIds));

  // Aggregate permissions by location (if user has multiple roles, take the most permissive)
  const locationMap = new Map<number, { locationId: number; canRead: boolean; canWrite: boolean }>();

  for (const perm of permissions) {
    const existing = locationMap.get(perm.locationId);
    if (!existing) {
      locationMap.set(perm.locationId, {
        locationId: perm.locationId,
        canRead: perm.canRead,
        canWrite: perm.canWrite,
      });
    } else {
      // Take most permissive permissions
      locationMap.set(perm.locationId, {
        locationId: perm.locationId,
        canRead: existing.canRead || perm.canRead,
        canWrite: existing.canWrite || perm.canWrite,
      });
    }
  }

  return Array.from(locationMap.values());
}

/**
 * Check if user can access a specific location
 */
export async function canUserAccessLocation(userId: number, locationId: number) {
  const permissions = await getUserLocationPermissions(userId);
  return permissions.find(p => p.locationId === locationId);
}

/**
 * Check if user can write to a specific location
 */
export async function canUserWriteToLocation(userId: number, locationId: number) {
  const permission = await canUserAccessLocation(userId, locationId);
  return permission?.canWrite || false;
}
