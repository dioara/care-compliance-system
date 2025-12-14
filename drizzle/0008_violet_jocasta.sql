ALTER TABLE `locations` ADD `managerId` int;--> statement-breakpoint
ALTER TABLE `locations` ADD `cqcRating` varchar(50);--> statement-breakpoint
ALTER TABLE `locations` ADD `serviceTypes` json;