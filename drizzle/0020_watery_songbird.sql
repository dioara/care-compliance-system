ALTER TABLE `serviceUsers` ADD `dischargeDate` date;--> statement-breakpoint
ALTER TABLE `serviceUsers` ADD `isActive` boolean DEFAULT true NOT NULL;