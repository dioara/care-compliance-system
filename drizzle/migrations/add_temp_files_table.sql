-- Add temporary files table for storing uploaded files before processing
CREATE TABLE IF NOT EXISTS temp_files (
  id VARCHAR(255) PRIMARY KEY,
  file_data MEDIUMTEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  uploaded_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX idx_expires_at (expires_at),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
