CREATE TABLE `tenantSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`status` enum('active','past_due','canceled','unpaid','trialing','incomplete') NOT NULL DEFAULT 'incomplete',
	`licensesCount` int NOT NULL DEFAULT 0,
	`billingInterval` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`trialEndsAt` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenantSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenantSubscriptions_tenantId_unique` UNIQUE(`tenantId`)
);
--> statement-breakpoint
CREATE TABLE `userLicenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`assignedAt` timestamp,
	`assignedById` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`deactivatedAt` timestamp,
	`deactivatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLicenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditTypes` ADD `serviceTypes` text;--> statement-breakpoint
ALTER TABLE `auditTypes` DROP COLUMN `serviceType`;