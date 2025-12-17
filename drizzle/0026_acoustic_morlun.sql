CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int,
	`errorType` varchar(100) NOT NULL,
	`errorCode` varchar(50),
	`errorMessage` text NOT NULL,
	`stackTrace` text,
	`url` text,
	`userAgent` text,
	`ipAddress` varchar(45),
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `errorReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`errorLogId` int,
	`tenantId` int,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`userEmail` varchar(255),
	`userDescription` text NOT NULL,
	`userAction` text,
	`errorMessage` text,
	`url` text,
	`browserInfo` text,
	`screenshot` text,
	`status` enum('new','investigating','resolved','wont_fix') NOT NULL DEFAULT 'new',
	`adminNotes` text,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorReports_id` PRIMARY KEY(`id`)
);
