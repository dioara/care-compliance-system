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
  incidents,
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

// Get dashboard statistics for a tenant
export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all assessments for this tenant
  const assessments = await db.select().from(complianceAssessments)
    .where(eq(complianceAssessments.tenantId, tenantId));

  const totalAssessments = assessments.length;
  const compliantCount = assessments.filter(a => a.ragStatus === 'green').length;
  const partialCount = assessments.filter(a => a.ragStatus === 'amber').length;
  const nonCompliantCount = assessments.filter(a => a.ragStatus === 'red').length;

  // Calculate overall compliance percentage
  const overallCompliance = totalAssessments > 0 
    ? Math.round((compliantCount / totalAssessments) * 100) 
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
      red: nonCompliantCount,
    }
  };
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
  
  return db
    .select()
    .from(incidents)
    .where(eq(incidents.tenantId, tenantId))
    .orderBy(desc(incidents.incidentDate))
    .limit(limit);
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

export async function updateIncident(id: number, data: Partial<typeof incidents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(incidents)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(incidents.id, id));
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
