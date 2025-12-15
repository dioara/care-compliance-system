CREATE TABLE `staffInvitationTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`staffId` int,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`token` varchar(255) NOT NULL,
	`roleIds` text,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staffInvitationTokens_id` PRIMARY KEY(`id`)
);
