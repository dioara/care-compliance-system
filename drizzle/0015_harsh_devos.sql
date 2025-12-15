ALTER TABLE `users` MODIFY COLUMN `password` varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` ADD `openId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `loginMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);