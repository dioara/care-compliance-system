DROP TABLE `audit_calendar_events`;--> statement-breakpoint
ALTER TABLE `incidents` DROP INDEX `incidents_incidentNumber_unique`;--> statement-breakpoint
ALTER TABLE `passwordResetTokens` DROP INDEX `passwordResetTokens_token_unique`;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` DROP INDEX `tenantSubscriptions_tenantId_unique`;--> statement-breakpoint
ALTER TABLE `tenants` DROP INDEX `tenants_slug_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `aiAuditSchedules` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `aiAudits` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `assessmentTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditActionPlans` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditEvidence` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditInstances` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditResponses` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditResults` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditSchedules` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditTemplateQuestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditTemplateSections` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditTrail` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditTypes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `complianceAssessments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `complianceQuestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `complianceSections` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dataExportRequests` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailRecipients` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `errorLogs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `errorReports` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `incident_attachments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `incident_signatures` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `incidents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `locations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `passwordResetTokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `reports` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `role_location_permissions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `roles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `serviceUserHistory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `serviceUsers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `staffHistory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `staffInvitationTokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `staffMembers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `supportingDocuments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `templateQuestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tenants` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userConsents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userLicenses` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user_roles` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `aiAuditSchedules` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `aiAuditSchedules` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `aiAudits` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `assessmentTemplates` MODIFY COLUMN `isDefault` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `assessmentTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditActionPlans` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditEvidence` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditInstances` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditResponses` MODIFY COLUMN `isCompliant` tinyint;--> statement-breakpoint
ALTER TABLE `auditResponses` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditResults` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditSchedules` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `auditSchedules` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTemplateQuestions` MODIFY COLUMN `isRequired` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `auditTemplateQuestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTemplateSections` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTemplates` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `auditTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTrail` MODIFY COLUMN `timestamp` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTypes` MODIFY COLUMN `isAiPowered` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `auditTypes` MODIFY COLUMN `isAiPowered` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `auditTypes` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `auditTypes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `complianceAssessments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `complianceQuestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `complianceSections` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `complianceSections` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `dataExportRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailRecipients` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailRecipients` MODIFY COLUMN `receiveComplianceAlerts` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailRecipients` MODIFY COLUMN `receiveAuditReminders` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailRecipients` MODIFY COLUMN `receiveIncidentAlerts` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailRecipients` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `isDefault` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `isDefault` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `emailTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `errorLogs` MODIFY COLUMN `resolved` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `errorLogs` MODIFY COLUMN `resolved` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `errorLogs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `errorReports` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `incident_attachments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `incident_signatures` MODIFY COLUMN `signedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `incident_signatures` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToCouncil` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToCouncil` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToCqc` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToCqc` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToIco` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToIco` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToPolice` tinyint;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToPolice` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToFamily` tinyint;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `reportedToFamily` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `investigationRequired` tinyint;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `investigationRequired` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `incidents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `locations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `isRead` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `isRead` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `passwordResetTokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `role_location_permissions` MODIFY COLUMN `canRead` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `role_location_permissions` MODIFY COLUMN `canWrite` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `role_location_permissions` MODIFY COLUMN `canWrite` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `role_location_permissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `serviceUserHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `serviceUsers` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceUsers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `staffHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `staffInvitationTokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `staffMembers` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `staffMembers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `supportingDocuments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `templateQuestions` MODIFY COLUMN `isRequired` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `templateQuestions` MODIFY COLUMN `isRequired` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `templateQuestions` MODIFY COLUMN `isRecommended` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `templateQuestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` MODIFY COLUMN `isTrial` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` MODIFY COLUMN `isTrial` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` MODIFY COLUMN `cancelAtPeriodEnd` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` MODIFY COLUMN `cancelAtPeriodEnd` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `isSuspended` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `isSuspended` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userConsents` MODIFY COLUMN `consentGiven` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `userConsents` MODIFY COLUMN `consentGiven` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `userConsents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userLicenses` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `userLicenses` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `user_roles` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `superAdmin` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `superAdmin` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `twoFaEnabled` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `twoFaVerified` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `twoFaVerified` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `auditTypes` ADD `serviceType` enum('all','domiciliary_care','supported_living','residential','nursing') DEFAULT 'all' NOT NULL;--> statement-breakpoint
CREATE INDEX `incidents_incidentNumber_unique` ON `incidents` (`incidentNumber`);--> statement-breakpoint
CREATE INDEX `token` ON `passwordResetTokens` (`token`);--> statement-breakpoint
CREATE INDEX `tenantId` ON `tenantSubscriptions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE INDEX `users_email_unique` ON `users` (`email`);