CREATE TABLE `aiAuditSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`serviceUserId` int,
	`auditType` enum('care_plan','daily_notes') NOT NULL,
	`scheduleName` varchar(255) NOT NULL,
	`frequency` enum('weekly','fortnightly','monthly','quarterly','annually') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`monthOfYear` int,
	`nextDueDate` date NOT NULL,
	`lastCompletedDate` date,
	`lastAiAuditId` int,
	`notifyEmail` varchar(255),
	`reminderDaysBefore` int DEFAULT 3,
	`lastReminderSent` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiAuditSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataExportRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`requestType` enum('data_export','account_deletion') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`exportFormat` enum('json','csv') DEFAULT 'json',
	`exportFileUrl` text,
	`exportFileKey` text,
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataExportRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`consentType` enum('terms_of_service','privacy_policy','data_processing','marketing_emails','ai_processing') NOT NULL,
	`consentGiven` boolean NOT NULL DEFAULT false,
	`consentVersion` varchar(50) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`consentedAt` timestamp,
	`withdrawnAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userConsents_id` PRIMARY KEY(`id`)
);
