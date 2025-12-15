ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `twoFaEnabled` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `twoFaVerified` boolean NOT NULL;