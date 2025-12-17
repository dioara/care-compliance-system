ALTER TABLE `articleBookmarks` MODIFY COLUMN `userId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `articleFeedback` MODIFY COLUMN `userId` varchar(255);--> statement-breakpoint
ALTER TABLE `articleFeedback` MODIFY COLUMN `tenantId` varchar(255);--> statement-breakpoint
ALTER TABLE `supportTickets` MODIFY COLUMN `tenantId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `supportTickets` MODIFY COLUMN `userId` varchar(255) NOT NULL;