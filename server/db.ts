import { eq, and, inArray, sql, desc } from "drizzle-orm";
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
  staffHistory,
  serviceUserHistory,
  staffInvitationTokens,
  complianceSections,
  complianceQuestions,
  complianceAssessments,
  supportingDocuments,
  auditTypes,
  auditTemplates,
  auditTemplateSections,
  auditTemplateQuestions,
  auditInstances,
  auditResponses,
  auditActionPlans,
  auditEvidence,
  auditSchedules,
  auditCalendarEvents,
  incidents,
  incidentAttachments,
  incidentSignatures,
  assessmentTemplates,
  templateQuestions,
  aiAudits,
  aiAuditSchedules,
  userConsents,
  dataExportRequests,
  emailRecipients,
  emailTemplates,
  passwordResetTokens,
  userLicenses,
  type InsertUser,
  type InsertPasswordResetToken,
  type InsertAiAudit,
  type InsertAiAuditSchedule,
  type InsertUserConsent,
  type InsertDataExportRequest,
  type InsertTenant,
  type InsertLocation,
  type InsertRole,
  type InsertRoleLocationPermission,
  type InsertUserRole,
  type InsertServiceUser,
  type InsertStaffMember,
  type InsertEmailRecipient,
  type InsertEmailTemplate,
  type InsertAuditCalendarEvent,
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

  // Return result with insertId
  return { insertId: (result as any)[0]?.insertId ?? (result as any).insertId };
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

// ============================================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================================

export async function update2FASecret(userId: number, secret: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ twoFaSecret: secret, twoFaVerified: false })
    .where(eq(users.id, userId));
}

export async function enable2FA(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ twoFaEnabled: true, twoFaVerified: true })
    .where(eq(users.id, userId));
}

export async function disable2FA(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ twoFaEnabled: false, twoFaVerified: false, twoFaSecret: null })
    .where(eq(users.id, userId));
}

export async function getUsersByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all users for the tenant
  const allUsers = await db.select().from(users).where(eq(users.tenantId, tenantId));
  
  // Get all active licenses for the tenant
  const activeLicenses = await db.select().from(userLicenses)
    .where(and(eq(userLicenses.tenantId, tenantId), eq(userLicenses.isActive, true)));
  
  // Create a set of user IDs that have licenses
  const licensedUserIds = new Set(activeLicenses.filter(l => l.userId).map(l => l.userId));
  
  // Add hasLicense field to each user
  return allUsers.map(user => ({
    ...user,
    hasLicense: Boolean(user.superAdmin) || licensedUserIds.has(user.id)
  }));
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
// PASSWORD RESET
// ============================================================================

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Invalidate any existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

  // Create new token
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });

  return { success: true };
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      sql`${passwordResetTokens.usedAt} IS NULL`,
      sql`${passwordResetTokens.expiresAt} > NOW()`
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(data: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user exists
  const existingUser = await getUserByOpenId(data.openId);
  
  if (existingUser) {
    // Update existing user
    await db.update(users).set({
      name: data.name ?? existingUser.name,
      loginMethod: data.loginMethod ?? existingUser.loginMethod,
      lastSignedIn: data.lastSignedIn ?? new Date(),
    }).where(eq(users.openId, data.openId));
    return existingUser;
  } else {
    // Create new user
    const email = data.email || `${data.openId}@oauth.local`;
    await db.insert(users).values({
      openId: data.openId,
      email: email,
      name: data.name,
      loginMethod: data.loginMethod,
      lastSignedIn: data.lastSignedIn ?? new Date(),
    });
    return await getUserByOpenId(data.openId);
  }
}

// ============================================================================
// TENANT MANAGEMENT
// ============================================================================

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tenants).values(data);
  // Return with id for MySQL
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId };
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Alias for getTenantById - used by PDF generation
export async function getCompanyByTenantId(tenantId: number) {
  return getTenantById(tenantId);
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

  const locs = await db.select().from(locations).where(eq(locations.tenantId, tenantId));
  
  // Calculate staff and service user counts for each location
  const locsWithCounts = await Promise.all(
    locs.map(async (loc) => {
      const staffCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(staffMembers)
        .where(eq(staffMembers.locationId, loc.id));
      
      const serviceUserCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceUsers)
        .where(eq(serviceUsers.locationId, loc.id));
      
      return {
        ...loc,
        staffCount: Number(staffCount[0]?.count || 0),
        serviceUserCount: Number(serviceUserCount[0]?.count || 0),
      };
    })
  );
  
  return locsWithCounts;
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
// STAFF HISTORY TRACKING
// ============================================================================

export async function addStaffHistory(data: {
  staffId: number;
  tenantId: number;
  changeType: string;
  previousValue?: string | null;
  newValue?: string | null;
  changedBy?: number | null;
  changedByName?: string | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(staffHistory).values(data);
}

export async function getStaffHistory(staffId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(staffHistory)
    .where(eq(staffHistory.staffId, staffId))
    .orderBy(desc(staffHistory.createdAt));
}

// ============================================================================
// SERVICE USER HISTORY TRACKING
// ============================================================================

export async function addServiceUserHistory(data: {
  serviceUserId: number;
  tenantId: number;
  changeType: string;
  previousValue?: string | null;
  newValue?: string | null;
  changedBy?: number | null;
  changedByName?: string | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(serviceUserHistory).values(data);
}

export async function getServiceUserHistory(serviceUserId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serviceUserHistory)
    .where(eq(serviceUserHistory.serviceUserId, serviceUserId))
    .orderBy(desc(serviceUserHistory.createdAt));
}

// ============================================================================
// STAFF INVITATION TOKENS
// ============================================================================

export async function createStaffInvitation(data: {
  tenantId: number;
  staffId?: number | null;
  email: string;
  name?: string | null;
  token: string;
  roleIds?: string | null;
  expiresAt: Date;
  createdBy?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(staffInvitationTokens).values(data);
}

export async function getStaffInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select().from(staffInvitationTokens)
    .where(eq(staffInvitationTokens.token, token));
  return results[0] || null;
}

export async function markInvitationUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(staffInvitationTokens)
    .set({ usedAt: new Date() })
    .where(eq(staffInvitationTokens.token, token));
}

export async function getStaffInvitationsByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(staffInvitationTokens)
    .where(eq(staffInvitationTokens.tenantId, tenantId))
    .orderBy(desc(staffInvitationTokens.createdAt));
}

// ============================================================================
// COMPLIANCE MANAGEMENT
// ============================================================================

export async function getAllComplianceSections() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complianceSections).where(eq(complianceSections.isActive, true)).orderBy(complianceSections.sectionNumber);
}

export async function getAllComplianceQuestions() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complianceQuestions).orderBy(complianceQuestions.sectionId, complianceQuestions.questionNumber);
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

// Get compliance progress for a staff member
export async function getStaffComplianceProgress(staffMemberId: number) {
  const db = await getDb();
  if (!db) return { completed: 0, total: 7, percentage: 0 };

  // Get all staff sections (7 sections)
  const staffSections = await db.select().from(complianceSections)
    .where(and(
      eq(complianceSections.sectionType, 'staff'),
      eq(complianceSections.isActive, true)
    ));

  const totalSections = staffSections.length;

  // Count completed sections (sections with at least one assessed question)
  let completedSections = 0;
  
  for (const section of staffSections) {
    const questions = await db.select().from(complianceQuestions)
      .where(eq(complianceQuestions.sectionId, section.id));
    
    if (questions.length === 0) continue;
    
    // Check if any questions in this section have been assessed for this staff member
    const assessments = await db.select().from(complianceAssessments)
      .where(and(
        eq(complianceAssessments.staffMemberId, staffMemberId),
        sql`${complianceAssessments.questionId} IN (${sql.join(questions.map(q => sql`${q.id}`), sql`, `)})`
      ))
      .limit(1);
    
    if (assessments.length > 0) {
      completedSections++;
    }
  }

  return {
    completed: completedSections,
    total: totalSections,
    percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
  };
}

// Get compliance progress for a service user
export async function getServiceUserComplianceProgress(serviceUserId: number) {
  const db = await getDb();
  if (!db) return { completed: 0, total: 19, percentage: 0 };

  // Get all service user sections (19 sections)
  const serviceUserSections = await db.select().from(complianceSections)
    .where(and(
      eq(complianceSections.sectionType, 'service_user'),
      eq(complianceSections.isActive, true)
    ));

  const totalSections = serviceUserSections.length;

  // Count completed sections (sections with at least one assessed question)
  let completedSections = 0;
  
  for (const section of serviceUserSections) {
    const questions = await db.select().from(complianceQuestions)
      .where(eq(complianceQuestions.sectionId, section.id));
    
    if (questions.length === 0) continue;
    
    // Check if any questions in this section have been assessed for this service user
    const assessments = await db.select().from(complianceAssessments)
      .where(and(
        eq(complianceAssessments.serviceUserId, serviceUserId),
        sql`${complianceAssessments.questionId} IN (${sql.join(questions.map(q => sql`${q.id}`), sql`, `)})`
      ))
      .limit(1);
    
    if (assessments.length > 0) {
      completedSections++;
    }
  }

  return {
    completed: completedSections,
    total: totalSections,
    percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
  };
}

// Get dashboard statistics for a tenant, optionally filtered by location
export async function getDashboardStats(tenantId: number, locationId?: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all assessments for this tenant, optionally filtered by location
  let assessments;
  if (locationId) {
    assessments = await db.select().from(complianceAssessments)
      .where(and(
        eq(complianceAssessments.tenantId, tenantId),
        eq(complianceAssessments.locationId, locationId)
      ));
  } else {
    assessments = await db.select().from(complianceAssessments)
      .where(eq(complianceAssessments.tenantId, tenantId));
  }

  // Get all questions to calculate total required assessments
  const allQuestions = await db.select().from(complianceQuestions);
  const totalQuestions = allQuestions.length;

  const compliantCount = assessments.filter(a => a.ragStatus === 'green').length;
  const partialCount = assessments.filter(a => a.ragStatus === 'amber').length;
  const assessedRedCount = assessments.filter(a => a.ragStatus === 'red').length;
  
  // Unassessed items are treated as non-compliant (red)
  const unassessedCount = Math.max(0, totalQuestions - assessments.length);
  const nonCompliantCount = assessedRedCount + unassessedCount;

  // Calculate overall compliance percentage based on total questions, not just assessed items
  // Only green items are considered compliant
  const overallCompliance = totalQuestions > 0 
    ? Math.round((compliantCount / totalQuestions) * 100) 
    : 0;

  // Count overdue actions (red status with past target date and no completion date)
  const today = new Date();
  const overdueActions = assessments.filter(a => 
    a.ragStatus === 'red' && 
    a.targetCompletionDate && 
    new Date(a.targetCompletionDate) < today &&
    !a.actualCompletionDate
  ).length;

  // Count total sections
  const sections = await db.select().from(complianceSections)
    .where(eq(complianceSections.isActive, true));
  const totalSections = sections.length;

  // Calculate sections with at least one compliant assessment
  const compliantSections = sections.filter(section => {
    return assessments.some(a => 
      a.ragStatus === 'green' && 
      assessments.find(ass => ass.questionId)
    );
  }).length;

  return {
    overallCompliance,
    compliantSections,
    totalSections,
    overdueActions,
    upcomingAudits: 0, // Placeholder - will be implemented when audit system is built
    recentIncidents: 0, // Placeholder - will be implemented when incident system is built
    ragStatus: {
      green: compliantCount,
      amber: partialCount,
      red: nonCompliantCount, // Includes unassessed items
    },
    unassessedCount, // Track how many items haven't been assessed yet
  };
}

// ============================================================================
// ASSESSMENT TEMPLATES
// ============================================================================

export async function getAllAssessmentTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assessmentTemplates).orderBy(assessmentTemplates.careSettingType);
}

export async function getAssessmentTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAssessmentTemplateByCareSetting(careSettingType: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessmentTemplates)
    .where(and(
      eq(assessmentTemplates.careSettingType, careSettingType as any),
      eq(assessmentTemplates.isDefault, true)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTemplateQuestions(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(templateQuestions).where(eq(templateQuestions.templateId, templateId));
}

export async function getTemplateQuestionsWithDetails(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: templateQuestions.id,
    templateId: templateQuestions.templateId,
    questionId: templateQuestions.questionId,
    isRequired: templateQuestions.isRequired,
    isRecommended: templateQuestions.isRecommended,
    questionNumber: complianceQuestions.questionNumber,
    questionText: complianceQuestions.questionText,
    sectionId: complianceQuestions.sectionId,
  })
  .from(templateQuestions)
  .innerJoin(complianceQuestions, eq(templateQuestions.questionId, complianceQuestions.id))
  .where(eq(templateQuestions.templateId, templateId))
  .orderBy(complianceQuestions.sectionId, complianceQuestions.questionNumber);
  
  return result;
}

// ============================================================================
// AUDIT MANAGEMENT
// ============================================================================

export async function getAllAuditTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditTypes).orderBy(auditTypes.auditCategory, auditTypes.auditName);
}

export async function getAuditTypeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [auditType] = await db.select().from(auditTypes).where(eq(auditTypes.id, id));
  return auditType || null;
}

export async function getAuditTemplateByAuditTypeId(auditTypeId: number) {
  const db = await getDb();
  if (!db) return null;
  const [template] = await db
    .select()
    .from(auditTemplates)
    .where(and(eq(auditTemplates.auditTypeId, auditTypeId), eq(auditTemplates.isActive, true)));
  return template || null;
}

export async function getAuditTemplateSections(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditTemplateSections)
    .where(eq(auditTemplateSections.auditTemplateId, templateId))
    .orderBy(auditTemplateSections.displayOrder);
}

export async function getAuditTemplateQuestions(sectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditTemplateQuestions)
    .where(eq(auditTemplateQuestions.auditTemplateSectionId, sectionId))
    .orderBy(auditTemplateQuestions.displayOrder);
}

export async function createAuditInstance(data: {
  tenantId: number;
  locationId: number;
  auditTypeId: number;
  auditTemplateId: number;
  auditDate: Date;
  auditorId: number;
  auditorName?: string;
  auditorRole?: string;
  serviceUserId?: number;
  staffMemberId?: number;
  status?: 'in_progress' | 'completed' | 'reviewed' | 'archived';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(auditInstances).values({
    ...data,
    status: data.status || 'in_progress',
  });
  return result.insertId;
}

export async function getAuditInstanceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [instance] = await db
    .select({
      id: auditInstances.id,
      auditTypeId: auditInstances.auditTypeId,
      auditTypeName: auditTypes.auditName,
      auditTemplateId: auditInstances.auditTemplateId,
      locationId: auditInstances.locationId,
      locationName: locations.name,
      auditorId: auditInstances.auditorId,
      auditorName: auditInstances.auditorName,
      auditDate: auditInstances.auditDate,
      completedAt: auditInstances.completedAt,
      status: auditInstances.status,
      overallScore: auditInstances.overallScore,
      summary: auditInstances.summary,
      recommendations: auditInstances.recommendations,
      createdAt: auditInstances.createdAt,
    })
    .from(auditInstances)
    .leftJoin(auditTypes, eq(auditInstances.auditTypeId, auditTypes.id))
    .leftJoin(locations, eq(auditInstances.locationId, locations.id))
    .where(eq(auditInstances.id, id));
  return instance || null;
}

export async function getAuditInstancesByLocation(locationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: auditInstances.id,
      auditTypeId: auditInstances.auditTypeId,
      auditTypeName: auditTypes.auditName,
      recommendedFrequency: auditTypes.recommendedFrequency,
      auditDate: auditInstances.auditDate,
      completedAt: auditInstances.completedAt,
      status: auditInstances.status,
      overallScore: auditInstances.overallScore,
      auditorName: auditInstances.auditorName,
    })
    .from(auditInstances)
    .leftJoin(auditTypes, eq(auditInstances.auditTypeId, auditTypes.id))
    .where(eq(auditInstances.locationId, locationId))
    .orderBy(desc(auditInstances.auditDate))
    .limit(limit);
}

export async function updateAuditInstanceStatus(
  id: number,
  status: 'in_progress' | 'completed' | 'reviewed' | 'archived',
  completedAt?: Date,
  overallScore?: number,
  summary?: string,
  recommendations?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(auditInstances)
    .set({
      status,
      completedAt,
      overallScore,
      summary,
      recommendations,
    })
    .where(eq(auditInstances.id, id));
}

export async function saveAuditResponse(data: {
  auditInstanceId: number;
  auditTemplateQuestionId: number;
  response: string;
  responseValue?: string;
  observations?: string;
  isCompliant?: boolean;
  actionRequired?: string;
  responsiblePersonId?: number;
  targetDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if response already exists
  const [existing] = await db
    .select()
    .from(auditResponses)
    .where(
      and(
        eq(auditResponses.auditInstanceId, data.auditInstanceId),
        eq(auditResponses.auditTemplateQuestionId, data.auditTemplateQuestionId)
      )
    );
  
  if (existing) {
    // Update existing response
    await db
      .update(auditResponses)
      .set(data)
      .where(eq(auditResponses.id, existing.id));
    return existing.id;
  } else {
    // Insert new response
    const [result] = await db.insert(auditResponses).values(data);
    return result.insertId;
  }
}

export async function getAuditResponses(auditInstanceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditResponses)
    .where(eq(auditResponses.auditInstanceId, auditInstanceId));
}

// Create action plan from incident follow-up
export async function createActionPlanFromIncident(data: {
  tenantId: number;
  locationId: number;
  incidentId: number;
  incidentNumber: string;
  issueDescription: string;
  responsiblePersonId?: number;
  responsiblePersonName?: string;
  targetCompletionDate: Date;
  ragStatus?: 'red' | 'amber' | 'green';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Use auditInstanceId = 0 to indicate this is from an incident, not an audit
  const [result] = await db.insert(auditActionPlans).values({
    tenantId: data.tenantId,
    locationId: data.locationId,
    auditInstanceId: 0, // 0 indicates incident-sourced action
    issueDescription: data.issueDescription,
    auditOrigin: `Incident: ${data.incidentNumber}`,
    ragStatus: data.ragStatus || 'amber',
    responsiblePersonId: data.responsiblePersonId || 0,
    responsiblePersonName: data.responsiblePersonName || 'Unassigned',
    targetCompletionDate: data.targetCompletionDate,
    status: 'not_started',
    notes: `Auto-generated from incident ${data.incidentNumber}`,
  });
  return result.insertId;
}

export async function createAuditActionPlan(data: {
  tenantId: number;
  locationId: number;
  auditInstanceId: number;
  auditResponseId?: number;
  issueDescription: string;
  auditOrigin?: string;
  ragStatus?: 'red' | 'amber' | 'green';
  responsiblePersonId: number;
  responsiblePersonName?: string;
  targetCompletionDate: Date;
  actionTaken?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(auditActionPlans).values({
    ...data,
    status: 'not_started',
  });
  return result.insertId;
}

export async function getAuditActionPlans(auditInstanceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: auditActionPlans.id,
      issueDescription: auditActionPlans.issueDescription,
      auditOrigin: auditActionPlans.auditOrigin,
      ragStatus: auditActionPlans.ragStatus,
      responsiblePersonId: auditActionPlans.responsiblePersonId,
      responsiblePersonName: auditActionPlans.responsiblePersonName,
      targetCompletionDate: auditActionPlans.targetCompletionDate,
      actualCompletionDate: auditActionPlans.actualCompletionDate,
      status: auditActionPlans.status,
      actionTaken: auditActionPlans.actionTaken,
      notes: auditActionPlans.notes,
      createdAt: auditActionPlans.createdAt,
    })
    .from(auditActionPlans)
    .where(eq(auditActionPlans.auditInstanceId, auditInstanceId))
    .orderBy(desc(auditActionPlans.createdAt));
}

export async function getAllActionPlans(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: auditActionPlans.id,
      issueNumber: auditActionPlans.issueNumber,
      issueDescription: auditActionPlans.issueDescription,
      auditOrigin: auditActionPlans.auditOrigin,
      ragStatus: auditActionPlans.ragStatus,
      responsiblePersonId: auditActionPlans.responsiblePersonId,
      responsiblePersonName: auditActionPlans.responsiblePersonName,
      targetCompletionDate: auditActionPlans.targetCompletionDate,
      actualCompletionDate: auditActionPlans.actualCompletionDate,
      status: auditActionPlans.status,
      actionTaken: auditActionPlans.actionTaken,
      notes: auditActionPlans.notes,
      locationId: auditActionPlans.locationId,
      locationName: locations.name,
      createdAt: auditActionPlans.createdAt,
    })
    .from(auditActionPlans)
    .leftJoin(locations, eq(auditActionPlans.locationId, locations.id))
    .where(eq(auditActionPlans.tenantId, tenantId))
    .orderBy(desc(auditActionPlans.createdAt));
}

export async function updateAuditActionPlanStatus(
  id: number,
  status: 'not_started' | 'in_progress' | 'partially_completed' | 'completed',
  actualCompletionDate?: Date,
  actionTaken?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(auditActionPlans)
    .set({ status, actualCompletionDate, actionTaken })
    .where(eq(auditActionPlans.id, id));
}

export async function uploadAuditEvidence(data: {
  tenantId: number;
  auditInstanceId: number;
  auditResponseId?: number;
  evidenceType?: string;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  uploadedById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(auditEvidence).values({
    ...data,
    uploadedAt: new Date(),
  });
  return result.insertId;
}

export async function getAuditEvidence(auditInstanceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditEvidence)
    .where(eq(auditEvidence.auditInstanceId, auditInstanceId));
}




// ==================== INCIDENTS ====================

export async function createIncident(data: {
  tenantId: number;
  locationId: number;
  incidentNumber: string;
  incidentDate: Date;
  incidentTime?: string;
  incidentType: string;
  severity?: string;
  locationDescription?: string;
  affectedPersonType?: string;
  serviceUserId?: number;
  affectedStaffId?: number;
  affectedPersonName?: string;
  staffInvolved?: string;
  description?: string;
  immediateActions?: string;
  witnessStatements?: string; // JSON string
  reportedById: number;
  reportedByName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(incidents).values({
    ...data,
    status: "open",
    createdAt: new Date(),
  }).$returningId();
  
  return result;
}

export async function getIncidentsByLocation(locationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(incidents)
    .where(eq(incidents.locationId, locationId))
    .orderBy(desc(incidents.incidentDate))
    .limit(limit);
}

export async function getIncidentsByTenant(tenantId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  // Use correct column names from schema
  const results = await db
    .select({
      id: incidents.id,
      tenantId: incidents.tenantId,
      locationId: incidents.locationId,
      incidentNumber: incidents.incidentNumber,
      incidentDate: incidents.incidentDate,
      incidentTime: incidents.incidentTime,
      incidentType: incidents.incidentType,
      severity: incidents.severity,
      status: incidents.status,
      locationDescription: incidents.locationDescription,
      affectedPersonType: incidents.affectedPersonType,
      serviceUserId: incidents.serviceUserId,
      affectedStaffId: incidents.affectedStaffId,
      affectedPersonName: incidents.affectedPersonName,
      staffInvolved: incidents.staffInvolved,
      description: incidents.description,
      immediateActions: incidents.immediateActions,
      witnessStatements: incidents.witnessStatements,
      reportedToCqc: incidents.reportedToCqc,
      reportedToCouncil: incidents.reportedToCouncil,
      reportedToPolice: incidents.reportedToPolice,
      reportedToFamily: incidents.reportedToFamily,
      reportedToIco: incidents.reportedToIco,
      investigationRequired: incidents.investigationRequired,
      investigationNotes: incidents.investigationNotes,
      actionRequired: incidents.actionRequired,
      lessonsLearned: incidents.lessonsLearned,
      reportedByName: incidents.reportedByName,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
      serviceUserName: serviceUsers.name,
    })
    .from(incidents)
    .leftJoin(serviceUsers, eq(incidents.serviceUserId, serviceUsers.id))
    .where(eq(incidents.tenantId, tenantId))
    .orderBy(desc(incidents.incidentDate))
    .limit(limit);
  
  return results;
}

export async function getIncidentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id));
  
  return incident;
}

export async function updateIncident(id: number, tenantId: number, data: Partial<typeof incidents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(incidents)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(incidents.id, id), eq(incidents.tenantId, tenantId)));
}

export async function updateIncidentNotification(
  id: number,
  notificationType: 'cqc' | 'council' | 'ico' | 'police' | 'family',
  details: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const updates: any = { updatedAt: now };
  
  switch (notificationType) {
    case 'cqc':
      updates.reportedToCqc = true;
      updates.cqcNotifiedAt = now;
      updates.cqcNotificationDetails = details;
      break;
    case 'council':
      updates.reportedToCouncil = true;
      updates.councilNotifiedAt = now;
      updates.councilNotificationDetails = details;
      break;
    case 'ico':
      updates.reportedToIco = true;
      updates.icoNotifiedAt = now;
      updates.icoNotificationDetails = details;
      break;
    case 'police':
      updates.reportedToPolice = true;
      updates.policeNotifiedAt = now;
      updates.policeNotificationDetails = details;
      break;
    case 'family':
      updates.reportedToFamily = true;
      updates.familyNotifiedAt = now;
      updates.familyNotificationDetails = details;
      break;
  }
  
  await db
    .update(incidents)
    .set(updates)
    .where(eq(incidents.id, id));
}

// Update notification status with toggle support
export async function updateIncidentNotificationStatus(
  id: number,
  notificationType: 'cqc' | 'council' | 'ico' | 'police' | 'family',
  notified: boolean,
  details?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const updates: any = { updatedAt: now };
  
  switch (notificationType) {
    case 'cqc':
      updates.reportedToCqc = notified;
      updates.cqcNotifiedAt = notified ? now : null;
      if (details) updates.cqcNotificationDetails = details;
      break;
    case 'council':
      updates.reportedToCouncil = notified;
      updates.councilNotifiedAt = notified ? now : null;
      if (details) updates.councilNotificationDetails = details;
      break;
    case 'ico':
      updates.reportedToIco = notified;
      updates.icoNotifiedAt = notified ? now : null;
      if (details) updates.icoNotificationDetails = details;
      break;
    case 'police':
      updates.reportedToPolice = notified;
      updates.policeNotifiedAt = notified ? now : null;
      if (details) updates.policeNotificationDetails = details;
      break;
    case 'family':
      updates.reportedToFamily = notified;
      updates.familyNotifiedAt = notified ? now : null;
      if (details) updates.familyNotificationDetails = details;
      break;
  }
  
  await db
    .update(incidents)
    .set(updates)
    .where(eq(incidents.id, id));
}

export async function closeIncident(id: number, closedById: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(incidents)
    .set({
      status: "closed",
      closedById,
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(incidents.id, id));
}

export async function getRecentIncidents(tenantId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const allIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.tenantId, tenantId))
    .orderBy(desc(incidents.incidentDate));
  
  return allIncidents.filter(i => {
    const incidentDate = new Date(i.incidentDate);
    return incidentDate >= cutoffDate;
  });
}


// ==================== AUDIT ANALYTICS ====================

export async function getAuditCompletionStats(tenantId: number, days = 90) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, inProgress: 0, completionRate: 0 };
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const allInstances = await db
    .select()
    .from(auditInstances)
    .where(eq(auditInstances.tenantId, tenantId));
  
  const recentInstances = allInstances.filter(i => {
    const createdDate = new Date(i.createdAt);
    return createdDate >= cutoffDate;
  });
  
  const completed = recentInstances.filter(i => i.status === "completed" || i.status === "reviewed").length;
  const inProgress = recentInstances.filter(i => i.status === "in_progress").length;
  const total = recentInstances.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, inProgress, completionRate };
}

export async function getAuditCompletionTrend(tenantId: number, months = 6) {
  const db = await getDb();
  if (!db) return [];
  
  const allInstances = await db
    .select()
    .from(auditInstances)
    .where(eq(auditInstances.tenantId, tenantId))
    .orderBy(auditInstances.createdAt);
  
  const trend: { month: string; completed: number; total: number }[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    
    const monthInstances = allInstances.filter(inst => {
      const instDate = new Date(inst.createdAt);
      return instDate >= monthDate && instDate < nextMonth;
    });
    
    const completed = monthInstances.filter(i => i.status === "completed" || i.status === "reviewed").length;
    
    trend.push({
      month: monthName,
      completed,
      total: monthInstances.length,
    });
  }
  
  return trend;
}

export async function getNonComplianceAreas(tenantId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  // Get audit instances for this tenant
  const instances = await db
    .select()
    .from(auditInstances)
    .where(eq(auditInstances.tenantId, tenantId));
  
  const instanceIds = instances.map(i => i.id);
  if (instanceIds.length === 0) return [];
  
  // Get all responses for these instances
  const allResponses = await db
    .select()
    .from(auditResponses);
  
  const responses = allResponses.filter(r => instanceIds.includes(r.auditInstanceId));
  
  // Group by question ID and count non-compliant responses
  const questionStats: { [key: number]: { questionId: number; question: string; nonCompliantCount: number; totalCount: number } } = {};
  
  for (const response of responses) {
    const key = response.auditTemplateQuestionId;
    if (!questionStats[key]) {
      questionStats[key] = {
        questionId: key,
        question: `Question ${key}`,
        nonCompliantCount: 0,
        totalCount: 0,
      };
    }
    
    questionStats[key].totalCount++;
    if (response.isCompliant === false) {
      questionStats[key].nonCompliantCount++;
    }
  }
  
  // Convert to array and sort by non-compliance rate
  const areas = Object.values(questionStats)
    .map(stat => ({
      ...stat,
      nonComplianceRate: stat.totalCount > 0 ? Math.round((stat.nonCompliantCount / stat.totalCount) * 100) : 0,
    }))
    .filter(stat => stat.nonCompliantCount > 0)
    .sort((a, b) => b.nonComplianceRate - a.nonComplianceRate)
    .slice(0, limit);
  
  return areas;
}

export async function getActionPlanStats(tenantId: number) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, overdue: 0, inProgress: 0 };
  
  const allActions = await db
    .select()
    .from(auditActionPlans)
    .where(eq(auditActionPlans.tenantId, tenantId));
  
  const total = allActions.length;
  const completed = allActions.filter(a => a.status === "completed").length;
  const inProgress = allActions.filter(a => a.status === "in_progress").length;
  
  const now = new Date();
  const overdue = allActions.filter(a => {
    if (a.status === "completed") return false;
    if (!a.targetCompletionDate) return false;
    return new Date(a.targetCompletionDate) < now;
  }).length;
  
  return { total, completed, overdue, inProgress };
}

export async function getAuditsByType(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const instances = await db
    .select()
    .from(auditInstances)
    .where(eq(auditInstances.tenantId, tenantId));
  
  const types: { [key: number]: { typeId: number; typeName: string; count: number; completed: number } } = {};
  
  for (const instance of instances) {
    const key = instance.auditTypeId;
    if (!types[key]) {
      types[key] = {
        typeId: key,
        typeName: `Audit Type ${key}`,
        count: 0,
        completed: 0,
      };
    }
    
    types[key].count++;
    if (instance.status === "completed" || instance.status === "reviewed") {
      types[key].completed++;
    }
  }
  
  return Object.values(types).sort((a, b) => b.count - a.count);
}


// ============================================
// Audit Schedule Management Functions
// ============================================

export async function getAuditSchedulesByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db
    .select({
      schedule: auditSchedules,
      auditType: auditTypes,
      location: locations,
    })
    .from(auditSchedules)
    .leftJoin(auditTypes, eq(auditSchedules.auditTypeId, auditTypes.id))
    .leftJoin(locations, eq(auditSchedules.locationId, locations.id))
    .where(eq(auditSchedules.tenantId, tenantId))
    .orderBy(desc(auditSchedules.createdAt));
}

export async function createAuditSchedule(data: {
  tenantId: number;
  auditTypeId: number;
  locationId: number;
  frequency: string;
  nextAuditDue: Date;
  reminderDays: number;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(auditSchedules).values(data);
  return { id: Number(result.insertId), ...data };
}

export async function updateAuditSchedule(
  scheduleId: number,
  data: {
    frequency?: string;
    nextAuditDue?: Date;
    reminderDays?: number;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db
    .update(auditSchedules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(auditSchedules.id, scheduleId));
  return { id: scheduleId, ...data };
}

export async function deleteAuditSchedule(scheduleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.delete(auditSchedules).where(eq(auditSchedules.id, scheduleId));
}


// ============================================
// Compliance Report Functions
// ============================================

export async function getComplianceReportData(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  locationIds?: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const conditions = [
    eq(auditInstances.tenantId, tenantId),
  ];

  if (locationIds && locationIds.length > 0) {
    conditions.push(inArray(auditInstances.locationId, locationIds));
  }

  return db
    .select({
      instance: auditInstances,
      template: auditTemplates,
      auditType: auditTypes,
      location: locations,
    })
    .from(auditInstances)
    .leftJoin(auditTemplates, eq(auditInstances.auditTemplateId, auditTemplates.id))
    .leftJoin(auditTypes, eq(auditTemplates.auditTypeId, auditTypes.id))
    .leftJoin(locations, eq(auditInstances.locationId, locations.id))
    .where(and(...conditions));
}

export async function getActionPlansForReport(
  tenantId: number,
  startDate: Date,
  endDate: Date,
  locationIds?: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const conditions = [
    eq(auditActionPlans.tenantId, tenantId),
  ];

  if (locationIds && locationIds.length > 0) {
    conditions.push(inArray(auditActionPlans.locationId, locationIds));
  }

  return db
    .select({
      actionPlan: auditActionPlans,
      location: locations,
      instance: auditInstances,
    })
    .from(auditActionPlans)
    .leftJoin(locations, eq(auditActionPlans.locationId, locations.id))
    .leftJoin(auditInstances, eq(auditActionPlans.auditInstanceId, auditInstances.id))
    .where(and(...conditions));
}

// ============================================================================
// AI AUDITS
// ============================================================================

export async function createAiAudit(data: Omit<InsertAiAudit, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const result = await db.insert(aiAudits).values(data);
  return Number(result[0].insertId);
}

export async function updateAiAudit(id: number, data: Partial<InsertAiAudit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db.update(aiAudits).set(data).where(eq(aiAudits.id, id));
}

export async function getAiAuditById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [audit] = await db
    .select()
    .from(aiAudits)
    .where(eq(aiAudits.id, id));

  return audit;
}

export async function getAiAuditsByTenant(tenantId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(aiAudits)
    .where(eq(aiAudits.tenantId, tenantId))
    .orderBy(desc(aiAudits.createdAt))
    .limit(limit);
}


// ============================================
// AI Audit Schedules
// ============================================


export async function createAiAuditSchedule(data: InsertAiAuditSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiAuditSchedules).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function getAiAuditSchedulesByTenant(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(aiAuditSchedules).where(eq(aiAuditSchedules.tenantId, tenantId)).orderBy(aiAuditSchedules.nextDueDate);
}

export async function getAiAuditSchedulesByLocation(tenantId: number, locationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(aiAuditSchedules)
    .where(and(eq(aiAuditSchedules.tenantId, tenantId), eq(aiAuditSchedules.locationId, locationId)))
    .orderBy(aiAuditSchedules.nextDueDate);
}

export async function getAiAuditScheduleById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(aiAuditSchedules)
    .where(and(eq(aiAuditSchedules.id, id), eq(aiAuditSchedules.tenantId, tenantId)));
  return results[0] || null;
}

export async function updateAiAuditSchedule(id: number, tenantId: number, data: Partial<InsertAiAuditSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiAuditSchedules)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(aiAuditSchedules.id, id), eq(aiAuditSchedules.tenantId, tenantId)));
  return getAiAuditScheduleById(id, tenantId);
}

export async function deleteAiAuditSchedule(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiAuditSchedules)
    .where(and(eq(aiAuditSchedules.id, id), eq(aiAuditSchedules.tenantId, tenantId)));
}

export async function getOverdueAiAuditSchedules(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = new Date().toISOString().split('T')[0];
  return db.select().from(aiAuditSchedules)
    .where(and(
      eq(aiAuditSchedules.tenantId, tenantId),
      eq(aiAuditSchedules.isActive, true),
      sql`${aiAuditSchedules.nextDueDate} <= ${today}`
    ))
    .orderBy(aiAuditSchedules.nextDueDate);
}

export async function getUpcomingAiAuditSchedules(tenantId: number, daysAhead: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  return db.select().from(aiAuditSchedules)
    .where(and(
      eq(aiAuditSchedules.tenantId, tenantId),
      eq(aiAuditSchedules.isActive, true),
      sql`${aiAuditSchedules.nextDueDate} > ${todayStr}`,
      sql`${aiAuditSchedules.nextDueDate} <= ${futureDateStr}`
    ))
    .orderBy(aiAuditSchedules.nextDueDate);
}

// ============================================
// User Consents (GDPR)
// ============================================

export async function createUserConsent(data: InsertUserConsent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userConsents).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function getUserConsents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(userConsents.consentType);
}

export async function getUserConsentByType(userId: number, consentType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(userConsents)
    .where(and(eq(userConsents.userId, userId), eq(userConsents.consentType, consentType as any)));
  return results[0] || null;
}

export async function updateUserConsent(id: number, userId: number, data: Partial<InsertUserConsent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userConsents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userConsents.id, id), eq(userConsents.userId, userId)));
}

export async function withdrawUserConsent(userId: number, consentType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userConsents)
    .set({ consentGiven: false, withdrawnAt: new Date(), updatedAt: new Date() })
    .where(and(eq(userConsents.userId, userId), eq(userConsents.consentType, consentType as any)));
}

// ============================================
// Data Export Requests (GDPR)
// ============================================

export async function createDataExportRequest(data: InsertDataExportRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataExportRequests).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function getDataExportRequestsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(dataExportRequests)
    .where(eq(dataExportRequests.userId, userId))
    .orderBy(desc(dataExportRequests.createdAt));
}

export async function getDataExportRequestById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(dataExportRequests)
    .where(and(eq(dataExportRequests.id, id), eq(dataExportRequests.userId, userId)));
  return results[0] || null;
}

export async function updateDataExportRequest(id: number, data: Partial<InsertDataExportRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dataExportRequests)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(dataExportRequests.id, id));
}

// ============================================
// AI Audit Comparison Data
// ============================================

export async function getAiAuditHistoryForServiceUser(tenantId: number, serviceUserId: number, auditType?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(aiAudits)
    .where(and(
      eq(aiAudits.tenantId, tenantId),
      eq(aiAudits.status, "completed")
    ))
    .orderBy(desc(aiAudits.createdAt));
}

export async function getAiAuditScoreTrends(tenantId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  return db.select({
    id: aiAudits.id,
    auditType: aiAudits.auditType,
    score: aiAudits.score,
    documentName: aiAudits.documentName,
    createdAt: aiAudits.createdAt,
  }).from(aiAudits)
    .where(and(
      eq(aiAudits.tenantId, tenantId),
      eq(aiAudits.status, "completed"),
      sql`DATE(${aiAudits.createdAt}) >= ${startStr}`,
      sql`DATE(${aiAudits.createdAt}) <= ${endStr}`
    ))
    .orderBy(aiAudits.createdAt);
}


// Update user
export async function updateUser(userId: number, data: Partial<{
  name: string;
  email: string;
  password: string;
  superAdmin: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(users).set(data).where(eq(users.id, userId));
}

// Update user profile (name only)
export async function updateUserProfile(userId: number, data: { name: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  return { success: true };
}

// Update user password
export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user to verify current password
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) throw new Error("User not found");
  
  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user[0].password);
  if (!isValid) throw new Error("Current password is incorrect");
  
  // Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  
  return { success: true };
}

// Delete user
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete user roles first
  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  // Delete the user
  return await db.delete(users).where(eq(users.id, userId));
}


// ============================================
// Admin Dashboard Statistics
// ============================================

export async function getAdminDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get total users count
  const usersResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.tenantId, tenantId));
  const totalUsers = usersResult[0]?.count || 0;
  
  // Get users by role
  const usersByRole = await db.select({
    role: users.role,
    count: sql<number>`COUNT(*)`
  })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .groupBy(users.role);
  
  // Get super admin count
  const superAdminResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.superAdmin, true)));
  const superAdminCount = superAdminResult[0]?.count || 0;
  
  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignupsResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      sql`${users.createdAt} >= ${sevenDaysAgo}`
    ));
  const recentSignups = recentSignupsResult[0]?.count || 0;
  
  // Get roles count
  const rolesResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(roles)
    .where(eq(roles.tenantId, tenantId));
  const totalRoles = rolesResult[0]?.count || 0;
  
  // Get locations count
  const locationsResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(locations)
    .where(eq(locations.tenantId, tenantId));
  const totalLocations = locationsResult[0]?.count || 0;
  
  // Get recent user activity (last 10 logins)
  const recentActivity = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    lastSignedIn: users.lastSignedIn,
  })
    .from(users)
    .where(and(
      eq(users.tenantId, tenantId),
      sql`${users.lastSignedIn} IS NOT NULL`
    ))
    .orderBy(desc(users.lastSignedIn))
    .limit(10);
  
  // Get all roles with user counts
  const rolesWithUserCounts = await db.select({
    id: roles.id,
    name: roles.name,
    description: roles.description,
  })
    .from(roles)
    .where(eq(roles.tenantId, tenantId));
  
  // For each role, count users
  const rolesWithCounts = await Promise.all(
    rolesWithUserCounts.map(async (role) => {
      const countResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(userRoles)
        .where(eq(userRoles.roleId, role.id));
      return {
        ...role,
        userCount: countResult[0]?.count || 0,
      };
    })
  );
  
  return {
    totalUsers,
    usersByRole,
    superAdminCount,
    recentSignups,
    totalRoles,
    totalLocations,
    recentActivity,
    rolesWithCounts,
  };
}


// ============================================
// Email Recipients Management
// ============================================

export async function getEmailRecipients(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(emailRecipients)
    .where(eq(emailRecipients.tenantId, tenantId))
    .orderBy(emailRecipients.name);
}

export async function getActiveEmailRecipients(tenantId: number, alertType?: 'compliance' | 'audit' | 'incident') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const recipients = await db.select().from(emailRecipients)
    .where(and(
      eq(emailRecipients.tenantId, tenantId),
      eq(emailRecipients.isActive, true)
    ));
  
  // Filter by alert type if specified
  if (alertType === 'compliance') {
    return recipients.filter(r => r.receiveComplianceAlerts);
  } else if (alertType === 'audit') {
    return recipients.filter(r => r.receiveAuditReminders);
  } else if (alertType === 'incident') {
    return recipients.filter(r => r.receiveIncidentAlerts);
  }
  
  return recipients;
}

export async function createEmailRecipient(data: InsertEmailRecipient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailRecipients).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function updateEmailRecipient(id: number, tenantId: number, data: Partial<InsertEmailRecipient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailRecipients)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(emailRecipients.id, id), eq(emailRecipients.tenantId, tenantId)));
}

export async function deleteEmailRecipient(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailRecipients)
    .where(and(eq(emailRecipients.id, id), eq(emailRecipients.tenantId, tenantId)));
}

// ============================================
// Email Templates Management
// ============================================

export async function getEmailTemplates(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(emailTemplates)
    .where(eq(emailTemplates.tenantId, tenantId))
    .orderBy(emailTemplates.templateType);
}

export async function getEmailTemplateByType(tenantId: number, templateType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select().from(emailTemplates)
    .where(and(
      eq(emailTemplates.tenantId, tenantId),
      eq(emailTemplates.templateType, templateType as any),
      eq(emailTemplates.isActive, true)
    ))
    .orderBy(desc(emailTemplates.isDefault))
    .limit(1);
  
  return results[0] || null;
}

export async function createEmailTemplate(data: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailTemplates).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function updateEmailTemplate(id: number, tenantId: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.tenantId, tenantId)));
}

export async function deleteEmailTemplate(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.tenantId, tenantId)));
}

// Create default templates for a tenant
export async function createDefaultEmailTemplates(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const defaultTemplates = [
    {
      tenantId,
      templateType: 'compliance_alert' as const,
      name: 'Compliance Alert',
      subject: '⚠️ Compliance Alert - {{companyName}}',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: {{headerColor}}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Compliance Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <p>Dear {{recipientName}},</p>
            <p>This is an automated compliance alert for <strong>{{companyName}}</strong>.</p>
            <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">Alert Summary</h3>
              <p><strong>Location:</strong> {{locationName}}</p>
              <p><strong>Compliance Rate:</strong> {{complianceRate}}%</p>
              <p><strong>Non-Compliant Items:</strong> {{nonCompliantCount}}</p>
              <p><strong>Overdue Actions:</strong> {{overdueCount}}</p>
            </div>
            <p>Please log in to the system to review and address these issues.</p>
            <p style="color: #6b7280; font-size: 12px;">{{footerText}}</p>
          </div>
        </div>
      `,
      isDefault: true,
      isActive: true,
    },
    {
      tenantId,
      templateType: 'audit_reminder' as const,
      name: 'Audit Reminder',
      subject: '📋 Audit Reminder - {{auditType}} Due Soon',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: {{headerColor}}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Audit Reminder</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <p>Dear {{recipientName}},</p>
            <p>This is a reminder that an audit is due soon.</p>
            <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <p><strong>Audit Type:</strong> {{auditType}}</p>
              <p><strong>Location:</strong> {{locationName}}</p>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
            </div>
            <p>Please ensure this audit is completed on time.</p>
            <p style="color: #6b7280; font-size: 12px;">{{footerText}}</p>
          </div>
        </div>
      `,
      isDefault: true,
      isActive: true,
    },
    {
      tenantId,
      templateType: 'incident_alert' as const,
      name: 'Incident Alert',
      subject: '🚨 Incident Reported - {{incidentType}}',
      bodyHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Incident Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <p>Dear {{recipientName}},</p>
            <p>A new incident has been reported that requires your attention.</p>
            <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626;">
              <p><strong>Incident Type:</strong> {{incidentType}}</p>
              <p><strong>Location:</strong> {{locationName}}</p>
              <p><strong>Date:</strong> {{incidentDate}}</p>
              <p><strong>Severity:</strong> {{severity}}</p>
            </div>
            <p>Please log in to review the full incident details and take appropriate action.</p>
            <p style="color: #6b7280; font-size: 12px;">{{footerText}}</p>
          </div>
        </div>
      `,
      isDefault: true,
      isActive: true,
    },
  ];
  
  for (const template of defaultTemplates) {
    await db.insert(emailTemplates).values(template);
  }
}


// ============ Incident Attachments ============

export async function createIncidentAttachment(data: {
  incidentId: number;
  tenantId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  fileKey: string;
  description?: string;
  uploadedById: number;
  uploadedByName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(incidentAttachments).values(data);
  return result.insertId;
}

export async function getIncidentAttachments(incidentId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(incidentAttachments)
    .where(
      and(
        eq(incidentAttachments.incidentId, incidentId),
        eq(incidentAttachments.tenantId, tenantId)
      )
    )
    .orderBy(desc(incidentAttachments.createdAt));
}

export async function deleteIncidentAttachment(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First get the attachment to return the fileKey for S3 deletion
  const [attachment] = await db
    .select()
    .from(incidentAttachments)
    .where(
      and(
        eq(incidentAttachments.id, id),
        eq(incidentAttachments.tenantId, tenantId)
      )
    );
  
  if (!attachment) return null;
  
  await db
    .delete(incidentAttachments)
    .where(
      and(
        eq(incidentAttachments.id, id),
        eq(incidentAttachments.tenantId, tenantId)
      )
    );
  
  return attachment;
}

// ============ Incident Signatures ============

export async function createIncidentSignature(data: {
  incidentId: number;
  tenantId: number;
  signatureType: "manager" | "reviewer" | "witness";
  signedById: number;
  signedByName: string;
  signedByRole?: string;
  signedByEmail?: string;
  signatureData: string;
  signatureHash?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(incidentSignatures).values(data);
  return result.insertId;
}

export async function getIncidentSignatures(incidentId: number, tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(incidentSignatures)
    .where(
      and(
        eq(incidentSignatures.incidentId, incidentId),
        eq(incidentSignatures.tenantId, tenantId)
      )
    )
    .orderBy(desc(incidentSignatures.signedAt));
}

export async function getIncidentSignatureByType(
  incidentId: number, 
  tenantId: number, 
  signatureType: "manager" | "reviewer" | "witness"
) {
  const db = await getDb();
  if (!db) return null;
  
  const [signature] = await db
    .select()
    .from(incidentSignatures)
    .where(
      and(
        eq(incidentSignatures.incidentId, incidentId),
        eq(incidentSignatures.tenantId, tenantId),
        eq(incidentSignatures.signatureType, signatureType)
      )
    );
  
  return signature;
}

export async function deleteIncidentSignature(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(incidentSignatures)
    .where(
      and(
        eq(incidentSignatures.id, id),
        eq(incidentSignatures.tenantId, tenantId)
      )
    );
}


// ============================================
// Audit Calendar Events Management
// ============================================

export async function getAuditCalendarEvents(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select({
    id: auditCalendarEvents.id,
    tenantId: auditCalendarEvents.tenantId,
    locationId: auditCalendarEvents.locationId,
    auditTypeId: auditCalendarEvents.auditTypeId,
    auditTypeName: auditCalendarEvents.auditTypeName,
    locationName: auditCalendarEvents.locationName,
    scheduledDate: auditCalendarEvents.scheduledDate,
    status: auditCalendarEvents.status,
    assignedToId: auditCalendarEvents.assignedToId,
    assignedToName: auditCalendarEvents.assignedToName,
    reminderSent: auditCalendarEvents.reminderSent,
    reminderSentAt: auditCalendarEvents.reminderSentAt,
    createdAt: auditCalendarEvents.createdAt,
  })
    .from(auditCalendarEvents)
    .where(eq(auditCalendarEvents.tenantId, tenantId))
    .orderBy(auditCalendarEvents.scheduledDate);
}

export async function createAuditCalendarEvent(data: InsertAuditCalendarEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(auditCalendarEvents).values(data);
  return { id: Number((result as any)[0].insertId), ...data };
}

export async function deleteAuditCalendarEvent(eventId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(auditCalendarEvents)
    .where(and(
      eq(auditCalendarEvents.id, eventId),
      eq(auditCalendarEvents.tenantId, tenantId)
    ));
}

export async function getUpcomingAuditCalendarEvents(tenantId: number, daysAhead: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + daysAhead);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return db.select()
    .from(auditCalendarEvents)
    .where(and(
      eq(auditCalendarEvents.tenantId, tenantId),
      eq(auditCalendarEvents.status, "scheduled"),
      eq(auditCalendarEvents.reminderSent, false),
      sql`DATE(${auditCalendarEvents.scheduledDate}) = ${tomorrowStr}`
    ));
}

export async function markReminderSent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(auditCalendarEvents)
    .set({ 
      reminderSent: true, 
      reminderSentAt: new Date() 
    })
    .where(eq(auditCalendarEvents.id, eventId));
}
