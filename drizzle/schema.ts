import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow with role-based access control
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  locationId: int("locationId"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["admin", "quality_officer", "manager", "staff"]).default("staff").notNull(),
  superAdmin: boolean("superAdmin").default(false).notNull(),
  twoFaEnabled: int("twoFaEnabled", { mode: "boolean" }).default(false).notNull(),
  twoFaSecret: varchar("twoFaSecret", { length: 255 }),
  twoFaVerified: int("twoFaVerified", { mode: "boolean" }).default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Tenant (company) table for multi-tenant architecture
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  address: text("address"),
  telephone: varchar("telephone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  managerName: varchar("managerName", { length: 255 }),
  managerTitle: varchar("managerTitle", { length: 255 }),
  serviceType: varchar("serviceType", { length: 100 }),
  cqcInspectionDate: date("cqcInspectionDate"),
  cqcRating: varchar("cqcRating", { length: 50 }),
  specialisms: text("specialisms"), // JSON array stored as text
  isSuspended: boolean("isSuspended").default(false).notNull(),
  suspensionDate: date("suspensionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdById: int("createdById"),
  updatedById: int("updatedById"),
});

/**
 * Location table for multi-location support within each tenant
 */
export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  managerName: varchar("managerName", { length: 255 }),
  managerEmail: varchar("managerEmail", { length: 255 }),
  numberOfServiceUsers: int("numberOfServiceUsers"),
  numberOfStaff: int("numberOfStaff"),
  serviceType: varchar("serviceType", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Service users (care recipients) table
 */
export const serviceUsers = mysqlTable("serviceUsers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("dateOfBirth"),
  carePackageType: varchar("carePackageType", { length: 100 }),
  admissionDate: date("admissionDate"),
  supportNeeds: text("supportNeeds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Staff members table
 */
export const staffMembers = mysqlTable("staffMembers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  employmentDate: date("employmentDate"),
  dbsCertificateNumber: varchar("dbsCertificateNumber", { length: 100 }),
  dbsDate: date("dbsDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Compliance sections (22 service user sections + 7 staff sections)
 */
export const complianceSections = mysqlTable("complianceSections", {
  id: int("id").autoincrement().primaryKey(),
  sectionNumber: int("sectionNumber").notNull(),
  sectionName: varchar("sectionName", { length: 255 }).notNull(),
  sectionType: mysqlEnum("sectionType", ["service_user", "staff"]).notNull(),
  description: text("description"),
  tooltip: text("tooltip"),
  auditFrequency: varchar("auditFrequency", { length: 50 }), // 'monthly', 'quarterly', 'annually'
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Compliance questions within each section
 */
export const complianceQuestions = mysqlTable("complianceQuestions", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("sectionId").notNull(),
  questionNumber: varchar("questionNumber", { length: 50 }).notNull(), // e.g., '1.1', '1.2'
  questionText: text("questionText").notNull(),
  standardDescription: text("standardDescription"),
  tooltip: text("tooltip"),
  requiredDocuments: text("requiredDocuments"), // JSON array stored as text
  guidance: text("guidance"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Compliance assessments - answers to compliance questions
 */
export const complianceAssessments = mysqlTable("complianceAssessments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  questionId: int("questionId").notNull(),
  assessmentType: mysqlEnum("assessmentType", ["service_user", "staff"]).notNull(),
  serviceUserId: int("serviceUserId"),
  staffMemberId: int("staffMemberId"),
  complianceStatus: mysqlEnum("complianceStatus", ["compliant", "non_compliant", "partial", "not_assessed"]).notNull(),
  evidenceProvided: text("evidenceProvided"),
  identifiedGaps: text("identifiedGaps"),
  actionRequired: text("actionRequired"),
  responsiblePersonId: int("responsiblePersonId"),
  targetCompletionDate: date("targetCompletionDate"),
  actualCompletionDate: date("actualCompletionDate"),
  ragStatus: mysqlEnum("ragStatus", ["red", "amber", "green"]).notNull(),
  notes: text("notes"),
  lastAuditDate: date("lastAuditDate"),
  nextAuditDue: date("nextAuditDue"),
  assessedById: int("assessedById"),
  assessedAt: timestamp("assessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Supporting documents for assessments
 */
export const supportingDocuments = mysqlTable("supportingDocuments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  assessmentId: int("assessmentId").notNull(),
  documentType: varchar("documentType", { length: 100 }),
  documentName: varchar("documentName", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedById: int("uploadedById"),
  uploadedAt: timestamp("uploadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit types and templates (25 audit types)
 */
export const auditTypes = mysqlTable("auditTypes", {
  id: int("id").autoincrement().primaryKey(),
  auditName: varchar("auditName", { length: 255 }).notNull(),
  auditCategory: varchar("auditCategory", { length: 100 }).notNull(), // 'mandatory_monthly', 'quarterly', 'operational'
  description: text("description"),
  tooltip: text("tooltip"),
  processSteps: text("processSteps"), // JSON array stored as text
  recommendedFrequency: varchar("recommendedFrequency", { length: 50 }),
  isAiPowered: boolean("isAiPowered").default(false).notNull(),
  templateReference: varchar("templateReference", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit schedules for each location
 */
export const auditSchedules = mysqlTable("auditSchedules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  auditTypeId: int("auditTypeId").notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'annually'
  dayOfMonth: int("dayOfMonth"), // for monthly (1-31)
  monthOfYear: int("monthOfYear"), // for annually (1-12)
  dayOfWeek: int("dayOfWeek"), // for weekly (0-6, 0=Sunday)
  lastAuditDate: date("lastAuditDate"),
  nextAuditDue: date("nextAuditDue"),
  emailReminderDays: int("emailReminderDays").default(7), // days before due date to send reminder
  lastReminderSent: date("lastReminderSent"),
  isActive: boolean("isActive").default(true).notNull(),
  createdById: int("createdById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Audit results
 */
export const auditResults = mysqlTable("auditResults", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  auditScheduleId: int("auditScheduleId").notNull(),
  auditTypeId: int("auditTypeId").notNull(),
  auditDate: date("auditDate").notNull(),
  auditScore: int("auditScore"), // 1-10 scale
  complianceStatus: varchar("complianceStatus", { length: 50 }),
  findings: text("findings"),
  recommendations: text("recommendations"),
  actionsRequired: text("actionsRequired"),
  responsiblePersonId: int("responsiblePersonId"),
  targetCompletionDate: date("targetCompletionDate"),
  completedById: int("completedById"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Incidents table
 */
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  incidentNumber: varchar("incidentNumber", { length: 50 }).unique(),
  incidentDate: date("incidentDate").notNull(),
  incidentTime: varchar("incidentTime", { length: 10 }),
  incidentType: varchar("incidentType", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 50 }), // 'low', 'medium', 'high', 'critical'
  locationDescription: text("locationDescription"),
  
  // Affected persons
  affectedPersonType: varchar("affectedPersonType", { length: 50 }), // 'service_user', 'staff', 'visitor', 'other'
  serviceUserId: int("serviceUserId"),
  affectedStaffId: int("affectedStaffId"),
  affectedPersonName: varchar("affectedPersonName", { length: 255 }),
  staffInvolved: text("staffInvolved"),
  
  // Description and actions
  description: text("description"),
  immediateActions: text("immediateActions"),
  
  // Witnesses
  witnessStatements: text("witnessStatements"), // JSON array
  
  // Notifications
  reportedToCouncil: boolean("reportedToCouncil").default(false).notNull(),
  councilNotifiedAt: timestamp("councilNotifiedAt"),
  councilNotificationDetails: text("councilNotificationDetails"),
  
  reportedToCqc: boolean("reportedToCqc").default(false).notNull(),
  cqcNotifiedAt: timestamp("cqcNotifiedAt"),
  cqcNotificationDetails: text("cqcNotificationDetails"),
  
  reportedToIco: boolean("reportedToIco").default(false).notNull(),
  icoNotifiedAt: timestamp("icoNotifiedAt"),
  icoNotificationDetails: text("icoNotificationDetails"),
  
  reportedToPolice: boolean("reportedToPolice").default(false),
  policeNotifiedAt: timestamp("policeNotifiedAt"),
  policeNotificationDetails: text("policeNotificationDetails"),
  
  reportedToFamily: boolean("reportedToFamily").default(false),
  familyNotifiedAt: timestamp("familyNotifiedAt"),
  familyNotificationDetails: text("familyNotificationDetails"),
  
  // Investigation
  investigationRequired: boolean("investigationRequired").default(false),
  investigationNotes: text("investigationNotes"),
  investigationCompletedAt: timestamp("investigationCompletedAt"),
  
  // Actions and follow-up
  actionRequired: text("actionRequired"),
  assignedToId: int("assignedToId"),
  targetCompletionDate: date("targetCompletionDate"),
  lessonsLearned: text("lessonsLearned"),
  
  // Status
  status: varchar("status", { length: 50 }).default("open"), // 'open', 'under_investigation', 'resolved', 'closed'
  
  // Metadata
  incidentLogReference: varchar("incidentLogReference", { length: 100 }),
  reportedById: int("reportedById"),
  reportedByName: varchar("reportedByName", { length: 255 }),
  closedById: int("closedById"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * AI audits for care plans and staff notes
 */
export const aiAudits = mysqlTable("aiAudits", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  auditType: mysqlEnum("auditType", ["care_plan", "daily_notes"]).notNull(),
  documentId: int("documentId"),
  documentName: varchar("documentName", { length: 255 }),
  documentUrl: text("documentUrl"),
  documentKey: text("documentKey"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).notNull(),
  score: int("score"), // 1-10 scale
  strengths: text("strengths"),
  areasForImprovement: text("areasForImprovement"),
  recommendations: text("recommendations"),
  examples: text("examples"),
  cqcComplianceNotes: text("cqcComplianceNotes"),
  processedAt: timestamp("processedAt"),
  requestedById: int("requestedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  notificationType: varchar("notificationType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  relatedEntityId: int("relatedEntityId"),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  channel: varchar("channel", { length: 50 }), // 'in_app', 'email', 'sms'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit trail for compliance tracking
 */
export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  action: varchar("action", { length: 50 }), // 'create', 'update', 'delete'
  oldValues: text("oldValues"), // JSON stored as text
  newValues: text("newValues"), // JSON stored as text
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

/**
 * Reports table
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId"),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  dateFrom: date("dateFrom"),
  dateTo: date("dateTo"),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  fileFormat: varchar("fileFormat", { length: 20 }), // 'pdf', 'docx', 'xlsx'
  generatedById: int("generatedById"),
  generatedAt: timestamp("generatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Roles table
 * Custom roles created by super admin with specific permissions
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * Role-Location Permissions table
 * Defines which locations each role can access and permission level
 */
export const roleLocationPermissions = mysqlTable("role_location_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  locationId: int("locationId").notNull(),
  canRead: boolean("canRead").default(true).notNull(),
  canWrite: boolean("canWrite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoleLocationPermission = typeof roleLocationPermissions.$inferSelect;
export type InsertRoleLocationPermission = typeof roleLocationPermissions.$inferInsert;

/**
 * User-Roles table
 * Many-to-many relationship between users and roles
 */
export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
export type ServiceUser = typeof serviceUsers.$inferSelect;
export type InsertServiceUser = typeof serviceUsers.$inferInsert;
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = typeof staffMembers.$inferInsert;
export type ComplianceSection = typeof complianceSections.$inferSelect;
export type InsertComplianceSection = typeof complianceSections.$inferInsert;
export type ComplianceQuestion = typeof complianceQuestions.$inferSelect;
export type InsertComplianceQuestion = typeof complianceQuestions.$inferInsert;
export type ComplianceAssessment = typeof complianceAssessments.$inferSelect;
export type InsertComplianceAssessment = typeof complianceAssessments.$inferInsert;
export type SupportingDocument = typeof supportingDocuments.$inferSelect;
export type InsertSupportingDocument = typeof supportingDocuments.$inferInsert;
export type AuditType = typeof auditTypes.$inferSelect;
export type InsertAuditType = typeof auditTypes.$inferInsert;
export type AuditSchedule = typeof auditSchedules.$inferSelect;
export type InsertAuditSchedule = typeof auditSchedules.$inferInsert;
export type AuditResult = typeof auditResults.$inferSelect;
export type InsertAuditResult = typeof auditResults.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
export type AiAudit = typeof aiAudits.$inferSelect;
export type InsertAiAudit = typeof aiAudits.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Audit templates - stores the structure of each audit type with questions
 */
export const auditTemplates = mysqlTable("auditTemplates", {
  id: int("id").autoincrement().primaryKey(),
  auditTypeId: int("auditTypeId").notNull(),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).default("1.0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Audit template sections - groups questions within an audit template
 */
export const auditTemplateSections = mysqlTable("auditTemplateSections", {
  id: int("id").autoincrement().primaryKey(),
  auditTemplateId: int("auditTemplateId").notNull(),
  sectionNumber: int("sectionNumber").notNull(),
  sectionTitle: varchar("sectionTitle", { length: 255 }).notNull(),
  sectionDescription: text("sectionDescription"),
  displayOrder: int("displayOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit template questions - individual questions within audit sections
 */
export const auditTemplateQuestions = mysqlTable("auditTemplateQuestions", {
  id: int("id").autoincrement().primaryKey(),
  auditTemplateSectionId: int("auditTemplateSectionId").notNull(),
  questionNumber: varchar("questionNumber", { length: 50 }).notNull(), // e.g., '1.1', '2.3'
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["yes_no", "yes_no_na", "pass_fail", "text", "number", "date", "multiple_choice", "checklist"]).notNull(),
  options: text("options"), // JSON array for multiple_choice/checklist
  isRequired: boolean("isRequired").default(true).notNull(),
  guidance: text("guidance"),
  displayOrder: int("displayOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit instances - individual audit executions
 */
export const auditInstances = mysqlTable("auditInstances", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  auditTypeId: int("auditTypeId").notNull(),
  auditTemplateId: int("auditTemplateId").notNull(),
  auditScheduleId: int("auditScheduleId"),
  auditDate: date("auditDate").notNull(),
  auditTime: varchar("auditTime", { length: 10 }),
  auditorId: int("auditorId").notNull(), // user who conducted the audit
  auditorName: varchar("auditorName", { length: 255 }),
  auditorRole: varchar("auditorRole", { length: 100 }),
  serviceUserId: int("serviceUserId"), // if audit is for specific service user
  staffMemberId: int("staffMemberId"), // if audit is for specific staff member
  status: mysqlEnum("status", ["in_progress", "completed", "reviewed", "archived"]).default("in_progress").notNull(),
  overallScore: int("overallScore"), // percentage or total score
  complianceLevel: mysqlEnum("complianceLevel", ["compliant", "partially_compliant", "non_compliant"]),
  ragStatus: mysqlEnum("ragStatus", ["red", "amber", "green"]),
  summary: text("summary"),
  recommendations: text("recommendations"),
  completedAt: timestamp("completedAt"),
  reviewedById: int("reviewedById"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Audit responses - answers to audit template questions
 */
export const auditResponses = mysqlTable("auditResponses", {
  id: int("id").autoincrement().primaryKey(),
  auditInstanceId: int("auditInstanceId").notNull(),
  auditTemplateQuestionId: int("auditTemplateQuestionId").notNull(),
  response: text("response"), // stores the answer (yes/no, text, number, etc.)
  responseValue: varchar("responseValue", { length: 50 }), // normalized value for scoring
  observations: text("observations"), // additional notes for this question
  isCompliant: boolean("isCompliant"),
  actionRequired: text("actionRequired"),
  responsiblePersonId: int("responsiblePersonId"),
  targetDate: date("targetDate"),
  completedDate: date("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Audit evidence - documents/files uploaded as evidence for audit responses
 */
export const auditEvidence = mysqlTable("auditEvidence", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  auditInstanceId: int("auditInstanceId").notNull(),
  auditResponseId: int("auditResponseId"), // can be null if evidence is for overall audit
  evidenceType: varchar("evidenceType", { length: 100 }), // 'photo', 'document', 'certificate', etc.
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  description: text("description"),
  uploadedById: int("uploadedById").notNull(),
  uploadedAt: timestamp("uploadedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Audit action plans - tracks actions arising from audit findings
 */
export const auditActionPlans = mysqlTable("auditActionPlans", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  locationId: int("locationId").notNull(),
  auditInstanceId: int("auditInstanceId").notNull(),
  auditResponseId: int("auditResponseId"), // specific question that triggered action
  issueNumber: int("issueNumber"), // for tracking in Master Audit Action Plan
  issueDescription: text("issueDescription").notNull(),
  auditOrigin: varchar("auditOrigin", { length: 255 }), // which audit this came from
  ragStatus: mysqlEnum("ragStatus", ["red", "amber", "green"]).default("red").notNull(),
  responsiblePersonId: int("responsiblePersonId").notNull(),
  responsiblePersonName: varchar("responsiblePersonName", { length: 255 }),
  targetCompletionDate: date("targetCompletionDate").notNull(),
  actualCompletionDate: date("actualCompletionDate"),
  status: mysqlEnum("status", ["not_started", "in_progress", "partially_completed", "completed"]).default("not_started").notNull(),
  actionTaken: text("actionTaken"),
  signedOffById: int("signedOffById"),
  signedOffAt: timestamp("signedOffAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsertAuditTemplate = typeof auditTemplates.$inferInsert;
export type SelectAuditTemplate = typeof auditTemplates.$inferSelect;
export type InsertAuditTemplateSection = typeof auditTemplateSections.$inferInsert;
export type SelectAuditTemplateSection = typeof auditTemplateSections.$inferSelect;
export type InsertAuditTemplateQuestion = typeof auditTemplateQuestions.$inferInsert;
export type SelectAuditTemplateQuestion = typeof auditTemplateQuestions.$inferSelect;
export type InsertAuditInstance = typeof auditInstances.$inferInsert;
export type SelectAuditInstance = typeof auditInstances.$inferSelect;
export type InsertAuditResponse = typeof auditResponses.$inferInsert;
export type SelectAuditResponse = typeof auditResponses.$inferSelect;
export type InsertAuditEvidence = typeof auditEvidence.$inferInsert;
export type SelectAuditEvidence = typeof auditEvidence.$inferSelect;
export type InsertAuditActionPlan = typeof auditActionPlans.$inferInsert;
export type SelectAuditActionPlan = typeof auditActionPlans.$inferSelect;

export type InsertAuditSchedule = typeof auditSchedules.$inferInsert;
export type SelectAuditSchedule = typeof auditSchedules.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
export type SelectIncident = typeof incidents.$inferSelect;
