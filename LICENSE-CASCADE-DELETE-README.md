# License Cascade Delete Migration

## Overview

This migration adds a foreign key constraint to the `userLicenses` table to automatically delete licenses when their associated tenant is deleted.

## Problem

Previously, when a tenant was deleted, their licenses remained in the database as "orphaned" records. This caused:
- Database bloat with unused license records
- Inaccurate license counts
- Potential confusion when querying license data

## Solution

Added a foreign key constraint with `ON DELETE CASCADE` to the `userLicenses.tenantId` column.

## Files

1. **add-license-cascade-delete.sql** - SQL migration to add the foreign key constraint
2. **cleanup-orphaned-licenses.mjs** - Script to clean up existing orphaned licenses

## Deployment Steps

### Step 1: Clean Up Existing Orphaned Licenses (COMPLETED ✅)

```bash
# Dry-run first
DATABASE_URL="your_url" node cleanup-orphaned-licenses.mjs --dry-run

# Apply cleanup
DATABASE_URL="your_url" node cleanup-orphaned-licenses.mjs
```

**Result:** Removed 55 orphaned licenses from 11 deleted tenants

### Step 2: Apply Database Migration

```bash
# Connect to your database
mysql -h your_host -P your_port -u your_user -p your_database

# Run the migration
source add-license-cascade-delete.sql;

# Or using command line:
mysql -h your_host -P your_port -u your_user -p your_database < add-license-cascade-delete.sql
```

### Step 3: Verify

```sql
-- Check that the foreign key was added
SHOW CREATE TABLE userLicenses;

-- You should see:
-- CONSTRAINT `fk_userLicenses_tenantId` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
```

## Testing

After applying the migration, test that it works:

```sql
-- Create a test tenant
INSERT INTO tenants (name, slug) VALUES ('Test Tenant', 'test-tenant');
SET @testTenantId = LAST_INSERT_ID();

-- Create test licenses for the tenant
INSERT INTO userLicenses (tenantId, isActive) VALUES (@testTenantId, 1);
INSERT INTO userLicenses (tenantId, isActive) VALUES (@testTenantId, 1);

-- Verify licenses were created
SELECT COUNT(*) FROM userLicenses WHERE tenantId = @testTenantId;
-- Should return 2

-- Delete the tenant
DELETE FROM tenants WHERE id = @testTenantId;

-- Verify licenses were automatically deleted
SELECT COUNT(*) FROM userLicenses WHERE tenantId = @testTenantId;
-- Should return 0 (CASCADE DELETE worked!)
```

## Impact

**Before:**
- Manual cleanup required when tenants are deleted
- Orphaned licenses accumulate over time
- Database grows unnecessarily

**After:**
- ✅ Automatic cleanup when tenants are deleted
- ✅ No orphaned licenses
- ✅ Cleaner database
- ✅ Accurate license counts

## Rollback

If you need to remove the foreign key constraint:

```sql
ALTER TABLE userLicenses DROP FOREIGN KEY fk_userLicenses_tenantId;
```

## Notes

- This migration is safe to apply on production
- No data loss - only adds a constraint
- The cleanup script has already removed orphaned licenses
- Future tenant deletions will automatically clean up licenses
