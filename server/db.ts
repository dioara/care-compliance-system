import { eq, and, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import {
  users,
  tenants,
  locations,
  roles,
  roleLocationPermissions,
  userRoles,
  serviceUsers,
  staffMembers,
  complianceSections,
  complianceQuestions,
  complianceAssessments,
  supportingDocuments,
  type InsertUser,
  type InsertTenant,
  type InsertLocation,
  type InsertRole,
  type InsertRoleLocationPermission,
  type InsertUserRole,
  type InsertServiceUser,
  type InsertStaffMember,
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

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
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

// ============================================================================
// SERVICE USERS MANAGEMENT
// ============================================================================

export async function createServiceUser(data: InsertServiceUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(serviceUsers).values(data);
  return result;
}

export async function getServiceUsersByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serviceUsers).where(eq(serviceUsers.locationId, locationId));
}

export async function getServiceUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serviceUsers).where(eq(serviceUsers.tenantId, tenantId));
}

export async function getServiceUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(serviceUsers).where(eq(serviceUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateServiceUser(id: number, data: Partial<InsertServiceUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(serviceUsers).set(data).where(eq(serviceUsers.id, id));
}

export async function deleteServiceUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(serviceUsers).where(eq(serviceUsers.id, id));
}

// ============================================================================
// STAFF MEMBERS MANAGEMENT
// ============================================================================

export async function createStaffMember(data: InsertStaffMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(staffMembers).values(data);
  return result;
}

export async function getStaffMembersByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(staffMembers).where(eq(staffMembers.locationId, locationId));
}

export async function getStaffMembersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(staffMembers).where(eq(staffMembers.tenantId, tenantId));
}

export async function getStaffMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStaffMember(id: number, data: Partial<InsertStaffMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(staffMembers).set(data).where(eq(staffMembers.id, id));
}

export async function deleteStaffMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(staffMembers).where(eq(staffMembers.id, id));
}


// ============================================================================
// COMPLIANCE MANAGEMENT
// ============================================================================

export async function getAllComplianceSections() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complianceSections).where(eq(complianceSections.isActive, true)).orderBy(complianceSections.sectionNumber);
}

export async function getComplianceSectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(complianceSections).where(eq(complianceSections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getQuestionsBySection(sectionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complianceQuestions).where(eq(complianceQuestions.sectionId, sectionId));
}

export async function getComplianceAssessmentsByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complianceAssessments).where(eq(complianceAssessments.locationId, locationId));
}

export async function getComplianceAssessmentByQuestion(locationId: number, questionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(complianceAssessments)
    .where(and(
      eq(complianceAssessments.locationId, locationId),
      eq(complianceAssessments.questionId, questionId)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateComplianceAssessment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if assessment exists
  const existing = await getComplianceAssessmentByQuestion(data.locationId, data.questionId);
  
  if (existing) {
    // Update existing
    await db.update(complianceAssessments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(complianceAssessments.id, existing.id));
    return existing.id;
  } else {
    // Create new
    const result = await db.insert(complianceAssessments).values(data);
    return result[0]?.insertId;
  }
}

export async function getSupportingDocuments(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(supportingDocuments).where(eq(supportingDocuments.assessmentId, assessmentId));
}

export async function createSupportingDocument(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(supportingDocuments).values(data);
  return result;
}

export async function deleteSupportingDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(supportingDocuments).where(eq(supportingDocuments.id, id));
}

// Get compliance summary for a location
export async function getComplianceSummaryByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return null;

  const assessments = await db.select().from(complianceAssessments)
    .where(eq(complianceAssessments.locationId, locationId));

  const total = assessments.length;
  const compliant = assessments.filter(a => a.ragStatus === 'green').length;
  const partial = assessments.filter(a => a.ragStatus === 'amber').length;
  const nonCompliant = assessments.filter(a => a.ragStatus === 'red').length;
  const notAssessed = total === 0 ? await db.select().from(complianceQuestions).then(q => q.length) : 0;

  return {
    total: total || notAssessed,
    compliant,
    partial,
    nonCompliant,
    notAssessed,
    compliancePercentage: total > 0 ? Math.round((compliant / total) * 100) : 0
  };
}

// Get overdue actions for a location
export async function getOverdueActionsByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];

  const today = new Date().toISOString().split('T')[0];
  
  return await db.select().from(complianceAssessments)
    .where(and(
      eq(complianceAssessments.locationId, locationId),
      eq(complianceAssessments.ragStatus, 'red'),
      sql`${complianceAssessments.targetCompletionDate} < ${today}`,
      sql`${complianceAssessments.actualCompletionDate} IS NULL`
    ));
}
