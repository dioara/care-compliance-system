-- Migration: Add email verification columns to users table
-- Run this on Railway production database to fix the "Unknown column 'emailVerified'" error

-- Add emailVerified column (default to 1 for existing users so they can still log in)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerified` TINYINT(1) NOT NULL DEFAULT 1;

-- Add emailVerificationToken column
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerificationToken` VARCHAR(255) DEFAULT NULL;

-- Add emailVerificationExpires column  
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerificationExpires` DATETIME DEFAULT NULL;

-- Verify the columns were added
DESCRIBE `users`;
