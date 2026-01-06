-- Rename column from 'longtext' to 'detailedAnalysisJson' and change type to LONGTEXT
ALTER TABLE `aiAudits` CHANGE COLUMN `longtext` `detailedAnalysisJson` LONGTEXT;
