ALTER TABLE `auditSchedules` ADD `dayOfMonth` int;--> statement-breakpoint
ALTER TABLE `auditSchedules` ADD `monthOfYear` int;--> statement-breakpoint
ALTER TABLE `auditSchedules` ADD `dayOfWeek` int;--> statement-breakpoint
ALTER TABLE `auditSchedules` ADD `emailReminderDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `auditSchedules` ADD `lastReminderSent` date;--> statement-breakpoint
ALTER TABLE `auditSchedules` ADD `createdById` int;--> statement-breakpoint
ALTER TABLE `incidents` ADD `incidentNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `incidents` ADD `severity` varchar(50);--> statement-breakpoint
ALTER TABLE `incidents` ADD `affectedPersonType` varchar(50);--> statement-breakpoint
ALTER TABLE `incidents` ADD `affectedStaffId` int;--> statement-breakpoint
ALTER TABLE `incidents` ADD `affectedPersonName` varchar(255);--> statement-breakpoint
ALTER TABLE `incidents` ADD `witnessStatements` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `councilNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `councilNotificationDetails` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `cqcNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `cqcNotificationDetails` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `icoNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `icoNotificationDetails` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `reportedToPolice` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `incidents` ADD `policeNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `policeNotificationDetails` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `reportedToFamily` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `incidents` ADD `familyNotifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `familyNotificationDetails` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `investigationRequired` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `incidents` ADD `investigationNotes` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `investigationCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD `status` varchar(50) DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `incidents` ADD `reportedByName` varchar(255);--> statement-breakpoint
ALTER TABLE `incidents` ADD `closedById` int;--> statement-breakpoint
ALTER TABLE `incidents` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_incidentNumber_unique` UNIQUE(`incidentNumber`);