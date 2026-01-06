-- Add name anonymisation fields to aiAudits table
ALTER TABLE aiAudits
ADD COLUMN serviceUserFirstName VARCHAR(100) NULL AFTER serviceUserName,
ADD COLUMN serviceUserLastName VARCHAR(100) NULL AFTER serviceUserFirstName,
ADD COLUMN replaceFirstNameWith VARCHAR(100) NULL AFTER serviceUserLastName,
ADD COLUMN replaceLastNameWith VARCHAR(100) NULL AFTER replaceFirstNameWith,
ADD COLUMN keepOriginalNames TINYINT DEFAULT 0 AFTER replaceLastNameWith,
ADD COLUMN consentConfirmed TINYINT DEFAULT 0 AFTER keepOriginalNames;
