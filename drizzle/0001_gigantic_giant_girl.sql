CREATE TABLE `aiAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`auditType` enum('care_plan','daily_notes') NOT NULL,
	`documentId` int,
	`documentName` varchar(255),
	`documentUrl` text,
	`documentKey` text,
	`status` enum('pending','processing','completed','failed') NOT NULL,
	`score` int,
	`strengths` text,
	`areasForImprovement` text,
	`recommendations` text,
	`examples` text,
	`cqcComplianceNotes` text,
	`processedAt` timestamp,
	`requestedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`auditScheduleId` int NOT NULL,
	`auditTypeId` int NOT NULL,
	`auditDate` date NOT NULL,
	`auditScore` int,
	`complianceStatus` varchar(50),
	`findings` text,
	`recommendations` text,
	`actionsRequired` text,
	`responsiblePersonId` int,
	`targetCompletionDate` date,
	`completedById` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`auditTypeId` int NOT NULL,
	`frequency` varchar(50) NOT NULL,
	`lastAuditDate` date,
	`nextAuditDue` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`action` varchar(50),
	`oldValues` text,
	`newValues` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditName` varchar(255) NOT NULL,
	`auditCategory` varchar(100) NOT NULL,
	`description` text,
	`tooltip` text,
	`processSteps` text,
	`recommendedFrequency` varchar(50),
	`isAiPowered` boolean NOT NULL DEFAULT false,
	`templateReference` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`questionId` int NOT NULL,
	`assessmentType` enum('service_user','staff') NOT NULL,
	`serviceUserId` int,
	`staffMemberId` int,
	`complianceStatus` enum('compliant','non_compliant','partial','not_assessed') NOT NULL,
	`evidenceProvided` text,
	`identifiedGaps` text,
	`actionRequired` text,
	`responsiblePersonId` int,
	`targetCompletionDate` date,
	`actualCompletionDate` date,
	`ragStatus` enum('red','amber','green') NOT NULL,
	`notes` text,
	`lastAuditDate` date,
	`nextAuditDue` date,
	`assessedById` int,
	`assessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`questionNumber` varchar(50) NOT NULL,
	`questionText` text NOT NULL,
	`standardDescription` text,
	`tooltip` text,
	`requiredDocuments` text,
	`guidance` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionNumber` int NOT NULL,
	`sectionName` varchar(255) NOT NULL,
	`sectionType` enum('service_user','staff') NOT NULL,
	`description` text,
	`tooltip` text,
	`auditFrequency` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`incidentDate` date NOT NULL,
	`incidentTime` varchar(10),
	`incidentType` varchar(100) NOT NULL,
	`locationDescription` text,
	`serviceUserId` int,
	`staffInvolved` text,
	`description` text,
	`immediateActions` text,
	`reportedToCouncil` boolean NOT NULL DEFAULT false,
	`reportedToCqc` boolean NOT NULL DEFAULT false,
	`reportedToIco` boolean NOT NULL DEFAULT false,
	`actionRequired` text,
	`assignedToId` int,
	`targetCompletionDate` date,
	`lessonsLearned` text,
	`incidentLogReference` varchar(100),
	`reportedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`managerName` varchar(255),
	`managerEmail` varchar(255),
	`numberOfServiceUsers` int,
	`numberOfStaff` int,
	`serviceType` varchar(100),
	`contactPhone` varchar(20),
	`contactEmail` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` varchar(100) NOT NULL,
	`title` varchar(255),
	`message` text,
	`relatedEntityId` int,
	`relatedEntityType` varchar(50),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`channel` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int,
	`reportType` varchar(100) NOT NULL,
	`title` varchar(255),
	`description` text,
	`dateFrom` date,
	`dateTo` date,
	`fileUrl` text,
	`fileKey` text,
	`fileFormat` varchar(20),
	`generatedById` int,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dateOfBirth` date,
	`carePackageType` varchar(100),
	`admissionDate` date,
	`supportNeeds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staffMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100),
	`employmentDate` date,
	`dbsCertificateNumber` varchar(100),
	`dbsDate` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportingDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`documentType` varchar(100),
	`documentName` varchar(255),
	`fileUrl` text,
	`fileKey` text,
	`fileSize` int,
	`mimeType` varchar(100),
	`uploadedById` int,
	`uploadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportingDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logoUrl` text,
	`address` text,
	`telephone` varchar(20),
	`email` varchar(255),
	`managerName` varchar(255),
	`managerTitle` varchar(255),
	`serviceType` varchar(100),
	`cqcInspectionDate` date,
	`cqcRating` varchar(50),
	`specialisms` text,
	`isSuspended` boolean NOT NULL DEFAULT false,
	`suspensionDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdById` int,
	`updatedById` int,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','quality_officer','manager','staff') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locationId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFaEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFaSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;