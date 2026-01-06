import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, mysqlEnum, varchar, date, timestamp, text, longtext, index, json, tinyint, customType } from "drizzle-orm/mysql-core"

// Custom type for LONGBLOB
const longblob = customType<{ data: Buffer }>({ dataType() { return 'longblob'; } });
import { sql } from "drizzle-orm"

export const aiAuditSchedules = mysqlTable("aiAuditSchedules", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	serviceUserId: int(),
	auditType: mysqlEnum(['care_plan','daily_notes']).notNull(),
	scheduleName: varchar({ length: 255 }).notNull(),
	frequency: mysqlEnum(['weekly','fortnightly','monthly','quarterly','annually']).notNull(),
	dayOfWeek: int(),
	dayOfMonth: int(),
	monthOfYear: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	nextDueDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastCompletedDate: date({ mode: 'string' }),
	lastAiAuditId: int(),
	notifyEmail: varchar({ length: 255 }),
	reminderDaysBefore: int().default(3),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastReminderSent: date({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	createdById: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const aiAudits = mysqlTable("aiAudits", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	auditType: mysqlEnum(['care_plan','daily_notes']).notNull(),
	documentId: int(),
	documentName: varchar({ length: 255 }),
	documentUrl: text(),
	documentKey: text(),
	serviceUserName: varchar({ length: 255 }),
	anonymise: tinyint().default(1),
	status: mysqlEnum(['pending','processing','completed','failed']).notNull(),
	progress: varchar({ length: 255 }),
	errorMessage: text(),
	score: int(),
	strengths: text(),
	areasForImprovement: text(),
	recommendations: text(),
	examples: text(),
	cqcComplianceNotes: text(),
	detailedAnalysisJson: longtext(),
	reportDocumentUrl: text(),
	reportDocumentKey: text(),
	reportDocumentData: longblob(),
	notificationSent: tinyint().default(0),
	notificationSentAt: timestamp({ mode: 'string' }),
	processedAt: timestamp({ mode: 'string' }),
	requestedById: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	anonymizationReport: text(),
});

export const assessmentTemplates = mysqlTable("assessmentTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	careSettingType: mysqlEnum(['residential','nursing','domiciliary','supported_living']).notNull(),
	description: text(),
	isDefault: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditActionPlans = mysqlTable("auditActionPlans", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	auditInstanceId: int().notNull(),
	auditResponseId: int(),
	issueNumber: int(),
	issueDescription: text().notNull(),
	auditOrigin: varchar({ length: 255 }),
	ragStatus: mysqlEnum(['red','amber','green']).default('red').notNull(),
	responsiblePersonId: int().notNull(),
	responsiblePersonName: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	targetCompletionDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	actualCompletionDate: date({ mode: 'string' }),
	status: mysqlEnum(['not_started','in_progress','partially_completed','completed']).default('not_started').notNull(),
	actionTaken: text(),
	signedOffById: int(),
	signedOffAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditEvidence = mysqlTable("auditEvidence", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	auditInstanceId: int().notNull(),
	auditResponseId: int(),
	evidenceType: varchar({ length: 100 }),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileKey: text().notNull(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	description: text(),
	uploadedById: int().notNull(),
	uploadedAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const auditInstances = mysqlTable("auditInstances", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	auditTypeId: int().notNull(),
	auditTemplateId: int().notNull(),
	auditScheduleId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	auditDate: date({ mode: 'string' }).notNull(),
	auditTime: varchar({ length: 10 }),
	auditorId: int().notNull(),
	auditorName: varchar({ length: 255 }),
	auditorRole: varchar({ length: 100 }),
	serviceUserId: int(),
	staffMemberId: int(),
	status: mysqlEnum(['in_progress','completed','reviewed','archived']).default('in_progress').notNull(),
	overallScore: int(),
	complianceLevel: mysqlEnum(['compliant','partially_compliant','non_compliant']),
	ragStatus: mysqlEnum(['red','amber','green']),
	summary: text(),
	recommendations: text(),
	completedAt: timestamp({ mode: 'string' }),
	reviewedById: int(),
	reviewedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditResponses = mysqlTable("auditResponses", {
	id: int().autoincrement().notNull(),
	auditInstanceId: int().notNull(),
	auditTemplateQuestionId: int().notNull(),
	response: text(),
	responseValue: varchar({ length: 50 }),
	observations: text(),
	isCompliant: tinyint(),
	actionRequired: text(),
	responsiblePersonId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	targetDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	completedDate: date({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditResults = mysqlTable("auditResults", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	auditScheduleId: int().notNull(),
	auditTypeId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	auditDate: date({ mode: 'string' }).notNull(),
	auditScore: int(),
	complianceStatus: varchar({ length: 50 }),
	findings: text(),
	recommendations: text(),
	actionsRequired: text(),
	responsiblePersonId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	targetCompletionDate: date({ mode: 'string' }),
	completedById: int(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditSchedules = mysqlTable("auditSchedules", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	auditTypeId: int().notNull(),
	frequency: varchar({ length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastAuditDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	nextAuditDue: date({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	dayOfMonth: int(),
	monthOfYear: int(),
	dayOfWeek: int(),
	emailReminderDays: int().default(7),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastReminderSent: date({ mode: 'string' }),
	createdById: int(),
});

export const auditTemplateQuestions = mysqlTable("auditTemplateQuestions", {
	id: int().autoincrement().notNull(),
	auditTemplateSectionId: int().notNull(),
	questionNumber: varchar({ length: 50 }).notNull(),
	questionText: text().notNull(),
	questionType: mysqlEnum(['yes_no','yes_no_na','pass_fail','text','number','date','multiple_choice','checklist']).notNull(),
	options: text(),
	isRequired: tinyint().default(1).notNull(),
	guidance: text(),
	displayOrder: int().notNull(),
	kloes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const auditTemplateSections = mysqlTable("auditTemplateSections", {
	id: int().autoincrement().notNull(),
	auditTemplateId: int().notNull(),
	sectionNumber: int().notNull(),
	sectionTitle: varchar({ length: 255 }).notNull(),
	sectionDescription: text(),
	displayOrder: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const auditTemplates = mysqlTable("auditTemplates", {
	id: int().autoincrement().notNull(),
	auditTypeId: int().notNull(),
	templateName: varchar({ length: 255 }).notNull(),
	version: varchar({ length: 50 }).default('1.0').notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditTrail = mysqlTable("auditTrail", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	userId: int().notNull(),
	entityType: varchar({ length: 100 }),
	entityId: int(),
	action: varchar({ length: 50 }),
	oldValues: text(),
	newValues: text(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const auditTypes = mysqlTable("auditTypes", {
	id: int().autoincrement().notNull(),
	auditName: varchar({ length: 255 }).notNull(),
	auditCategory: varchar({ length: 100 }).notNull(),
	targetType: mysqlEnum(['general','staff','serviceUser']).default('general').notNull(),
	description: text(),
	tooltip: text(),
	processSteps: text(),
	recommendedFrequency: varchar({ length: 50 }),
	isAiPowered: tinyint().default(0).notNull(),
	templateReference: varchar({ length: 255 }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	serviceType: mysqlEnum(['all','domiciliary_care','supported_living','residential','nursing']).default('all').notNull(),
	serviceTypes: text(),
});

export const complianceAssessments = mysqlTable("complianceAssessments", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	questionId: int().notNull(),
	assessmentType: mysqlEnum(['service_user','staff']).notNull(),
	serviceUserId: int(),
	staffMemberId: int(),
	complianceStatus: mysqlEnum(['compliant','non_compliant','partial','not_assessed']).notNull(),
	evidenceProvided: text(),
	identifiedGaps: text(),
	actionRequired: text(),
	responsiblePersonId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	targetCompletionDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	actualCompletionDate: date({ mode: 'string' }),
	ragStatus: mysqlEnum(['red','amber','green']).notNull(),
	notes: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastAuditDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	nextAuditDue: date({ mode: 'string' }),
	assessedById: int(),
	assessedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const complianceQuestions = mysqlTable("complianceQuestions", {
	id: int().autoincrement().notNull(),
	sectionId: int().notNull(),
	questionNumber: varchar({ length: 50 }).notNull(),
	questionText: text().notNull(),
	standardDescription: text(),
	tooltip: text(),
	requiredDocuments: text(),
	guidance: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	conditionalLogic: text(),
	evidenceRequirement: text(),
	exampleEvidence: text(),
});

export const complianceSections = mysqlTable("complianceSections", {
	id: int().autoincrement().notNull(),
	sectionNumber: int().notNull(),
	sectionName: varchar({ length: 255 }).notNull(),
	sectionType: mysqlEnum(['service_user','staff']).notNull(),
	description: text(),
	tooltip: text(),
	auditFrequency: varchar({ length: 50 }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const dataExportRequests = mysqlTable("dataExportRequests", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	tenantId: int().notNull(),
	requestType: mysqlEnum(['data_export','account_deletion']).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	exportFormat: mysqlEnum(['json','csv']).default('json'),
	exportFileUrl: text(),
	exportFileKey: text(),
	completedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailRecipients = mysqlTable("emailRecipients", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	email: varchar({ length: 320 }).notNull(),
	name: varchar({ length: 255 }),
	recipientType: mysqlEnum(['manager','cqc_contact','owner','external','other']).default('other').notNull(),
	isActive: tinyint().default(1).notNull(),
	receiveComplianceAlerts: tinyint().default(1).notNull(),
	receiveAuditReminders: tinyint().default(1).notNull(),
	receiveIncidentAlerts: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailTemplates = mysqlTable("emailTemplates", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	templateType: mysqlEnum(['compliance_alert','audit_reminder','audit_overdue','incident_alert','weekly_summary','monthly_report']).notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	headerColor: varchar({ length: 7 }).default('#1e40af'),
	logoUrl: text(),
	footerText: text(),
	isDefault: tinyint().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const errorLogs = mysqlTable("errorLogs", {
	id: int().autoincrement().notNull(),
	tenantId: int(),
	userId: int(),
	errorType: varchar({ length: 100 }).notNull(),
	errorCode: varchar({ length: 50 }),
	errorMessage: text().notNull(),
	stackTrace: text(),
	url: text(),
	userAgent: text(),
	ipAddress: varchar({ length: 45 }),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	resolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const errorReports = mysqlTable("errorReports", {
	id: int().autoincrement().notNull(),
	errorLogId: int(),
	tenantId: int(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }),
	userEmail: varchar({ length: 255 }),
	userDescription: text().notNull(),
	userAction: text(),
	errorMessage: text(),
	url: text(),
	browserInfo: text(),
	screenshot: text(),
	status: mysqlEnum(['new','investigating','resolved','wont_fix']).default('new').notNull(),
	adminNotes: text(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const incidentAttachments = mysqlTable("incident_attachments", {
	id: int().autoincrement().notNull(),
	incidentId: int().notNull(),
	tenantId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileType: varchar({ length: 100 }).notNull(),
	fileSize: int().notNull(),
	fileUrl: text().notNull(),
	fileKey: text().notNull(),
	description: text(),
	uploadedById: int().notNull(),
	uploadedByName: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const incidentSignatures = mysqlTable("incident_signatures", {
	id: int().autoincrement().notNull(),
	incidentId: int().notNull(),
	tenantId: int().notNull(),
	signatureType: mysqlEnum(['manager','reviewer','witness']).notNull(),
	signedById: int().notNull(),
	signedByName: varchar({ length: 255 }).notNull(),
	signedByRole: varchar({ length: 100 }),
	signedByEmail: varchar({ length: 255 }),
	signatureData: text().notNull(),
	signatureHash: varchar({ length: 64 }),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	signedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const incidents = mysqlTable("incidents", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	incidentDate: date({ mode: 'string' }).notNull(),
	incidentTime: varchar({ length: 10 }),
	incidentType: varchar({ length: 100 }).notNull(),
	locationDescription: text(),
	serviceUserId: int(),
	staffInvolved: text(),
	description: text(),
	immediateActions: text(),
	reportedToCouncil: tinyint().default(0).notNull(),
	reportedToCqc: tinyint().default(0).notNull(),
	reportedToIco: tinyint().default(0).notNull(),
	actionRequired: text(),
	assignedToId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	targetCompletionDate: date({ mode: 'string' }),
	lessonsLearned: text(),
	incidentLogReference: varchar({ length: 100 }),
	reportedById: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	incidentNumber: varchar({ length: 50 }),
	severity: varchar({ length: 50 }),
	affectedPersonType: varchar({ length: 50 }),
	affectedStaffId: int(),
	affectedPersonName: varchar({ length: 255 }),
	witnessStatements: text(),
	councilNotifiedAt: timestamp({ mode: 'string' }),
	councilNotificationDetails: text(),
	cqcNotifiedAt: timestamp({ mode: 'string' }),
	cqcNotificationDetails: text(),
	icoNotifiedAt: timestamp({ mode: 'string' }),
	icoNotificationDetails: text(),
	reportedToPolice: tinyint().default(0),
	policeNotifiedAt: timestamp({ mode: 'string' }),
	policeNotificationDetails: text(),
	reportedToFamily: tinyint().default(0),
	familyNotifiedAt: timestamp({ mode: 'string' }),
	familyNotificationDetails: text(),
	investigationRequired: tinyint().default(0),
	investigationNotes: text(),
	investigationCompletedAt: timestamp({ mode: 'string' }),
	status: varchar({ length: 50 }).default('open'),
	reportedByName: varchar({ length: 255 }),
	closedById: int(),
	closedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("incidents_incidentNumber_unique").on(table.incidentNumber),
]);

export const locations = mysqlTable("locations", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text(),
	managerName: varchar({ length: 255 }),
	managerEmail: varchar({ length: 255 }),
	numberOfServiceUsers: int(),
	numberOfStaff: int(),
	serviceType: varchar({ length: 100 }),
	contactPhone: varchar({ length: 20 }),
	contactEmail: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	managerId: int(),
	cqcRating: varchar({ length: 50 }),
	serviceTypes: json(),
});

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	userId: int().notNull(),
	notificationType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }),
	message: text(),
	relatedEntityId: int(),
	relatedEntityType: varchar({ length: 50 }),
	isRead: tinyint().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	channel: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("token").on(table.token),
]);

export const reports = mysqlTable("reports", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int(),
	reportType: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }),
	description: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFrom: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateTo: date({ mode: 'string' }),
	fileUrl: text(),
	fileKey: text(),
	fileFormat: varchar({ length: 20 }),
	generatedById: int(),
	generatedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const roleLocationPermissions = mysqlTable("role_location_permissions", {
	id: int().autoincrement().notNull(),
	roleId: int().notNull(),
	locationId: int().notNull(),
	canRead: tinyint().default(1).notNull(),
	canWrite: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const roles = mysqlTable("roles", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const serviceUserHistory = mysqlTable("serviceUserHistory", {
	id: int().autoincrement().notNull(),
	serviceUserId: int().notNull(),
	tenantId: int().notNull(),
	changeType: varchar({ length: 50 }).notNull(),
	previousValue: varchar({ length: 255 }),
	newValue: varchar({ length: 255 }),
	changedBy: int(),
	changedByName: varchar({ length: 255 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const serviceUsers = mysqlTable("serviceUsers", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfBirth: date({ mode: 'string' }),
	carePackageType: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	admissionDate: date({ mode: 'string' }),
	supportNeeds: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	isActive: tinyint().default(1).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dischargeDate: date({ mode: 'string' }),
});

export const staffHistory = mysqlTable("staffHistory", {
	id: int().autoincrement().notNull(),
	staffId: int().notNull(),
	tenantId: int().notNull(),
	changeType: varchar({ length: 50 }).notNull(),
	previousValue: varchar({ length: 255 }),
	newValue: varchar({ length: 255 }),
	changedBy: int(),
	changedByName: varchar({ length: 255 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const staffInvitationTokens = mysqlTable("staffInvitationTokens", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	staffId: int(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	token: varchar({ length: 255 }).notNull(),
	roleIds: text(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const staffMembers = mysqlTable("staffMembers", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	locationId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	employmentDate: date({ mode: 'string' }),
	dbsCertificateNumber: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dbsDate: date({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	employmentType: mysqlEnum(['permanent_sponsored','permanent_not_sponsored','agency']).default('permanent_not_sponsored'),
});

export const supportingDocuments = mysqlTable("supportingDocuments", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	assessmentId: int().notNull(),
	documentType: varchar({ length: 100 }),
	documentName: varchar({ length: 255 }),
	fileUrl: text(),
	fileKey: text(),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	uploadedById: int(),
	uploadedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const templateQuestions = mysqlTable("templateQuestions", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull(),
	questionId: int().notNull(),
	isRequired: tinyint().default(0).notNull(),
	isRecommended: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const tenantSubscriptions = mysqlTable("tenantSubscriptions", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	stripeCustomerId: varchar({ length: 255 }),
	stripeSubscriptionId: varchar({ length: 255 }),
	status: mysqlEnum(['active','past_due','canceled','unpaid','trialing','incomplete']).default('incomplete').notNull(),
	licensesCount: int().default(0).notNull(),
	billingInterval: mysqlEnum(['monthly','annual']).default('monthly').notNull(),
	currentPeriodStart: timestamp({ mode: 'string' }),
	currentPeriodEnd: timestamp({ mode: 'string' }),
	trialEndsAt: timestamp({ mode: 'string' }),
	cancelAtPeriodEnd: tinyint().default(0).notNull(),
	canceledAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	isTrial: tinyint().default(0).notNull(),
	trialLicensesCount: int().default(0).notNull(),
},
(table) => [
	index("tenantId").on(table.tenantId),
]);

export const tenants = mysqlTable("tenants", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	logoUrl: text(),
	address: text(),
	telephone: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	managerName: varchar({ length: 255 }),
	managerTitle: varchar({ length: 255 }),
	serviceType: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	cqcInspectionDate: date({ mode: 'string' }),
	cqcRating: varchar({ length: 50 }),
	specialisms: text(),
	isSuspended: tinyint().default(0).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	suspensionDate: date({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdById: int(),
	updatedById: int(),
	careSettingType: mysqlEnum(['residential','nursing','domiciliary','supported_living']),
	openaiApiKey: varchar({ length: 255 }),
},
(table) => [
	index("tenants_slug_unique").on(table.slug),
]);

export const userConsents = mysqlTable("userConsents", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	tenantId: int().notNull(),
	consentType: mysqlEnum(['terms_of_service','privacy_policy','data_processing','marketing_emails','ai_processing']).notNull(),
	consentGiven: tinyint().default(0).notNull(),
	consentVersion: varchar({ length: 50 }).notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	consentedAt: timestamp({ mode: 'string' }),
	withdrawnAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userLicenses = mysqlTable("userLicenses", {
	id: int().autoincrement().notNull(),
	tenantId: int().notNull(),
	userId: int(),
	assignedAt: timestamp({ mode: 'string' }),
	assignedById: int(),
	isActive: tinyint().default(1).notNull(),
	deactivatedAt: timestamp({ mode: 'string' }),
	deactivatedById: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userRoles = mysqlTable("user_roles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	roleId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	name: text(),
	email: varchar({ length: 320 }).notNull(),
	role: mysqlEnum(['admin','quality_officer','manager','staff']).default('staff').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	tenantId: int(),
	locationId: int(),
	twoFaEnabled: int().notNull(),
	twoFaSecret: varchar({ length: 255 }),
	password: varchar({ length: 255 }).notNull(),
	twoFaVerified: int().default(0).notNull(),
	superAdmin: tinyint().default(0).notNull(),
	openId: varchar({ length: 255 }),
	loginMethod: varchar({ length: 50 }),
	emailVerified: tinyint().default(0).notNull(),
	emailVerificationToken: varchar({ length: 255 }),
	emailVerificationExpires: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_email_unique").on(table.email),
]);

export const supportTickets = mysqlTable("supportTickets", {
	id: int().autoincrement().primaryKey().notNull(),
	tenantId: varchar({ length: 255 }).notNull(),
	userId: varchar({ length: 255 }).notNull(),
	ticketNumber: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	message: text().notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	status: mysqlEnum(['open','in_progress','waiting_response','resolved','closed']).default('open').notNull(),
	category: varchar({ length: 100 }),
	assignedTo: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int(),
	resolutionNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const articleFeedback = mysqlTable("articleFeedback", {
	id: int().autoincrement().primaryKey().notNull(),
	articleId: varchar({ length: 100 }).notNull(),
	userId: varchar({ length: 255 }),
	tenantId: varchar({ length: 255 }),
	helpful: tinyint().notNull(),
	feedbackText: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const articleBookmarks = mysqlTable("articleBookmarks", {
	id: int().autoincrement().primaryKey().notNull(),
	articleId: varchar({ length: 100 }).notNull(),
	userId: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type RoleLocationPermission = typeof roleLocationPermissions.$inferSelect;
export type InsertRoleLocationPermission = typeof roleLocationPermissions.$inferInsert;
export type ServiceUser = typeof serviceUsers.$inferSelect;
export type InsertServiceUser = typeof serviceUsers.$inferInsert;
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = typeof staffMembers.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type AiAudit = typeof aiAudits.$inferSelect;
export type InsertAiAudit = typeof aiAudits.$inferInsert;
export type AiAuditSchedule = typeof aiAuditSchedules.$inferSelect;
export type InsertAiAuditSchedule = typeof aiAuditSchedules.$inferInsert;
export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type InsertDataExportRequest = typeof dataExportRequests.$inferInsert;
export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type ArticleFeedback = typeof articleFeedback.$inferSelect;
export type InsertArticleFeedback = typeof articleFeedback.$inferInsert;
export type ArticleBookmark = typeof articleBookmarks.$inferSelect;
export type InsertArticleBookmark = typeof articleBookmarks.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type ErrorReport = typeof errorReports.$inferSelect;
export type InsertErrorReport = typeof errorReports.$inferInsert;
