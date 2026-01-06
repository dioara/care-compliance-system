-- Rename column from 'longtext' to 'detailedAnalysisJson' and change type from TEXT to LONGTEXT
ALTER TABLE `aiAudits` CHANGE COLUMN `longtext` `detailedAnalysisJson` LONGTEXT;
