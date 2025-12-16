ALTER TABLE `tenantSubscriptions` ADD `isTrial` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenantSubscriptions` ADD `trialLicensesCount` int DEFAULT 0 NOT NULL;