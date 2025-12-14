CREATE TABLE `auditActionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`auditInstanceId` int NOT NULL,
	`auditResponseId` int,
	`issueNumber` int,
	`issueDescription` text NOT NULL,
	`auditOrigin` varchar(255),
	`ragStatus` enum('red','amber','green') NOT NULL DEFAULT 'red',
	`responsiblePersonId` int NOT NULL,
	`responsiblePersonName` varchar(255),
	`targetCompletionDate` date NOT NULL,
	`actualCompletionDate` date,
	`status` enum('not_started','in_progress','partially_completed','completed') NOT NULL DEFAULT 'not_started',
	`actionTaken` text,
	`signedOffById` int,
	`signedOffAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditActionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`auditInstanceId` int NOT NULL,
	`auditResponseId` int,
	`evidenceType` varchar(100),
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`description` text,
	`uploadedById` int NOT NULL,
	`uploadedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`locationId` int NOT NULL,
	`auditTypeId` int NOT NULL,
	`auditTemplateId` int NOT NULL,
	`auditScheduleId` int,
	`auditDate` date NOT NULL,
	`auditTime` varchar(10),
	`auditorId` int NOT NULL,
	`auditorName` varchar(255),
	`auditorRole` varchar(100),
	`serviceUserId` int,
	`staffMemberId` int,
	`status` enum('in_progress','completed','reviewed','archived') NOT NULL DEFAULT 'in_progress',
	`overallScore` int,
	`complianceLevel` enum('compliant','partially_compliant','non_compliant'),
	`ragStatus` enum('red','amber','green'),
	`summary` text,
	`recommendations` text,
	`completedAt` timestamp,
	`reviewedById` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditInstances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditInstanceId` int NOT NULL,
	`auditTemplateQuestionId` int NOT NULL,
	`response` text,
	`responseValue` varchar(50),
	`observations` text,
	`isCompliant` boolean,
	`actionRequired` text,
	`responsiblePersonId` int,
	`targetDate` date,
	`completedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTemplateQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditTemplateSectionId` int NOT NULL,
	`questionNumber` varchar(50) NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('yes_no','pass_fail','text','number','date','multiple_choice','checklist') NOT NULL,
	`options` text,
	`isRequired` boolean NOT NULL DEFAULT true,
	`guidance` text,
	`displayOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTemplateQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTemplateSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditTemplateId` int NOT NULL,
	`sectionNumber` int NOT NULL,
	`sectionTitle` varchar(255) NOT NULL,
	`sectionDescription` text,
	`displayOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditTemplateSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditTypeId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`version` varchar(50) NOT NULL DEFAULT '1.0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auditTemplates_id` PRIMARY KEY(`id`)
);
