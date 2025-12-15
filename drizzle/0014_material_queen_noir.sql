CREATE TABLE `emailRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`recipientType` enum('manager','cqc_contact','owner','external','other') NOT NULL DEFAULT 'other',
	`isActive` boolean NOT NULL DEFAULT true,
	`receiveComplianceAlerts` boolean NOT NULL DEFAULT true,
	`receiveAuditReminders` boolean NOT NULL DEFAULT true,
	`receiveIncidentAlerts` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailRecipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`templateType` enum('compliance_alert','audit_reminder','audit_overdue','incident_alert','weekly_summary','monthly_report') NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`headerColor` varchar(7) DEFAULT '#1e40af',
	`logoUrl` text,
	`footerText` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
