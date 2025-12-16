CREATE TABLE `incident_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`tenantId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`description` text,
	`uploadedById` int NOT NULL,
	`uploadedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incident_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`tenantId` int NOT NULL,
	`signatureType` enum('manager','reviewer','witness') NOT NULL,
	`signedById` int NOT NULL,
	`signedByName` varchar(255) NOT NULL,
	`signedByRole` varchar(100),
	`signedByEmail` varchar(255),
	`signatureData` text NOT NULL,
	`signatureHash` varchar(64),
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_signatures_id` PRIMARY KEY(`id`)
);
