ALTER TABLE `aiAudits` ADD `serviceUserName` varchar(255);--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `anonymise` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `progress` varchar(255);--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `errorMessage` text;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `longtext` text;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `reportDocumentUrl` text;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `reportDocumentKey` text;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `notificationSent` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `aiAudits` ADD `notificationSentAt` timestamp;