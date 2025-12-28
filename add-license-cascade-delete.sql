-- Migration: Add foreign key constraint to userLicenses table for automatic cleanup
-- Date: 2025-12-28
-- Description: Add CASCADE DELETE constraint so licenses are automatically removed when tenant is deleted

-- Add foreign key constraint with CASCADE DELETE
ALTER TABLE userLicenses
ADD CONSTRAINT fk_userLicenses_tenantId
FOREIGN KEY (tenantId) REFERENCES tenants(id)
ON DELETE CASCADE;

-- Note: This ensures that when a tenant is deleted, all associated licenses are automatically deleted
