-- ============================================================================
-- Railway Production Database Migration
-- Create Help Center Tables
-- ============================================================================
-- 
-- This SQL script creates the missing Help Center tables in Railway production.
-- 
-- Usage:
-- 1. Copy this entire file
-- 2. Go to Railway dashboard → MySQL service → Query tab
-- 3. Paste and execute
-- 
-- Or run via Codespaces:
-- node scripts/create-help-center-tables.mjs
-- ============================================================================

-- Table 1: Article Bookmarks
-- Stores user bookmarks for help articles
CREATE TABLE IF NOT EXISTS `articleBookmarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` varchar(255) NOT NULL COMMENT 'Help article identifier (e.g., "first-login")',
  `userId` int NOT NULL COMMENT 'User who bookmarked the article',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_user` (`articleId`, `userId`) COMMENT 'Fast lookup for user bookmarks'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User bookmarks for help center articles';

-- Table 2: Article Feedback
-- Stores user feedback (thumbs up/down) for help articles
CREATE TABLE IF NOT EXISTS `articleFeedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` varchar(255) NOT NULL COMMENT 'Help article identifier',
  `userId` int NOT NULL COMMENT 'User who provided feedback',
  `tenantId` int NOT NULL COMMENT 'Organization/tenant for multi-tenancy',
  `helpful` tinyint NOT NULL COMMENT '1 = thumbs up, 0 = thumbs down',
  `feedbackText` text COMMENT 'Optional text feedback from user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_user` (`articleId`, `userId`) COMMENT 'Fast lookup for user feedback'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User feedback ratings for help center articles';

-- Table 3: Support Tickets
-- Stores support requests submitted via Contact Support form
CREATE TABLE IF NOT EXISTS `supportTickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL COMMENT 'User who submitted the ticket',
  `tenantId` int NOT NULL COMMENT 'Organization/tenant for multi-tenancy',
  `subject` varchar(255) NOT NULL COMMENT 'Support ticket subject line',
  `message` text NOT NULL COMMENT 'Support ticket message body',
  `email` varchar(255) NOT NULL COMMENT 'User email for replies',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open' COMMENT 'Ticket status',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`) COMMENT 'Fast lookup by user',
  KEY `idx_tenant` (`tenantId`) COMMENT 'Fast lookup by tenant',
  KEY `idx_status` (`status`) COMMENT 'Fast filtering by status'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Support tickets submitted via help center';

-- ============================================================================
-- Verification Query
-- Run this to confirm all tables were created successfully
-- ============================================================================

SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME,
  TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND (TABLE_NAME = 'articleBookmarks' 
     OR TABLE_NAME = 'articleFeedback' 
     OR TABLE_NAME = 'supportTickets')
ORDER BY TABLE_NAME;

-- Expected output: 3 rows showing the three tables
-- If you see all 3 tables, the migration was successful!
