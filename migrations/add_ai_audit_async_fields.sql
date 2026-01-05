-- Add fields to support async AI audit job queue
-- Migration: add_ai_audit_async_fields
-- Date: 2026-01-05

ALTER TABLE `aiAudits` 
ADD COLUMN `serviceUserName` VARCHAR(255) AFTER `documentKey`,
ADD COLUMN `anonymise` TINYINT(1) DEFAULT 1 AFTER `serviceUserName`,
ADD COLUMN `progress` VARCHAR(255) AFTER `status`,
ADD COLUMN `errorMessage` TEXT AFTER `progress`,
ADD COLUMN `detailedAnalysisJson` LONGTEXT AFTER `cqcComplianceNotes`,
ADD COLUMN `reportDocumentUrl` TEXT AFTER `detailedAnalysisJson`,
ADD COLUMN `reportDocumentKey` TEXT AFTER `reportDocumentUrl`,
ADD COLUMN `notificationSent` TINYINT(1) DEFAULT 0 AFTER `reportDocumentKey`,
ADD COLUMN `notificationSentAt` TIMESTAMP NULL AFTER `notificationSent`;

-- Add index for faster status queries
CREATE INDEX `idx_aiAudits_status` ON `aiAudits` (`status`);
CREATE INDEX `idx_aiAudits_tenantId_status` ON `aiAudits` (`tenantId`, `status`);
CREATE INDEX `idx_aiAudits_createdAt` ON `aiAudits` (`createdAt` DESC);
