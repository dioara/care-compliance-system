CREATE TABLE `serviceUserHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceUserId` int NOT NULL,
	`tenantId` int NOT NULL,
	`changeType` varchar(50) NOT NULL,
	`previousValue` varchar(255),
	`newValue` varchar(255),
	`changedBy` int,
	`changedByName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceUserHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staffHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`tenantId` int NOT NULL,
	`changeType` varchar(50) NOT NULL,
	`previousValue` varchar(255),
	`newValue` varchar(255),
	`changedBy` int,
	`changedByName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staffHistory_id` PRIMARY KEY(`id`)
);
