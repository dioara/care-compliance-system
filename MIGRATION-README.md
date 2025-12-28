# License Migration Script

## Overview

This migration script fixes the issue where users were not automatically assigned licenses during registration due to a bug. It identifies all users without licenses and assigns available licenses to them.

## What It Does

1. Fetches all users from the database
2. Identifies users without active licenses
3. Groups users by tenant (company)
4. Checks license availability for each tenant
5. Assigns available licenses to users without them
6. Provides detailed summary of assignments

## Affected Users

Based on the dry-run, the following users need licenses assigned:

- **HR Admin** (Femmyofi@gmail.com) - Tenant 270005
- **Tolulope Olufohunsi** (tolu@abicarehealth.co.uk) - Tenant 270008

Both tenants have available licenses, so the script can successfully assign them.

## How to Run

### Prerequisites

- Access to GitHub Codespace or local development environment
- Node.js installed (already available in Codespace)
- Database connection URL

### Step 1: Open Terminal in Codespace

1. Open your GitHub repository in Codespace
2. Open a new terminal (Terminal → New Terminal)

### Step 2: Navigate to Project Directory

```bash
cd /workspaces/care-compliance-system
```

Or if you're in a different location:

```bash
cd path/to/care-compliance-system
```

### Step 3: Set Database URL

Set the production database URL as an environment variable:

```bash
export DATABASE_URL="mysql://root:FISYUOgfWNzwdeuFbMmsLqwGTddSLaKH@yamabiko.proxy.rlwy.net:29933/railway"
```

### Step 4: Run Dry-Run First (Recommended)

Always run in dry-run mode first to see what will be changed:

```bash
node fix-missing-licenses.mjs --dry-run
```

This will show you:
- How many users are without licenses
- Which users will be assigned licenses
- Which licenses will be assigned
- No actual changes will be made

### Step 5: Run Live Mode

Once you've verified the dry-run output looks correct, run in live mode:

```bash
node fix-missing-licenses.mjs
```

This will actually assign the licenses to users.

## Expected Output

### Dry-Run Mode

```
================================================================================
Migration Script: Fix Missing Licenses
================================================================================
Mode: DRY RUN (no changes will be made)

[1/5] Fetching all users...
Found 6 total users

[2/5] Fetching all active licenses...
Found 70 active licenses

[3/5] Analyzing users without licenses...
Found 2 users without licenses:

Users without licenses by tenant:
  Tenant 270005: 1 users
    - HR Admin (Femmyofi@gmail.com) - Role: admin, Super Admin: Yes
  Tenant 270008: 1 users
    - Tolulope Olufohunsi (tolu@abicarehealth.co.uk) - Role: admin, Super Admin: Yes

[4/5] Checking license availability per tenant...

Processing Tenant 270005...
  Subscription: trialing, Total Licenses: 5
  Available unassigned licenses: 4
  [DRY RUN] Would assign license 120002 to HR Admin (Femmyofi@gmail.com)

Processing Tenant 270008...
  Subscription: trialing, Total Licenses: 5
  Available unassigned licenses: 5
  [DRY RUN] Would assign license 120016 to Tolulope Olufohunsi (tolu@abicarehealth.co.uk)

================================================================================
[5/5] Migration Summary
================================================================================
✅ Successfully assigned: 2 licenses
❌ Failed: 0 assignments
⚠️  Skipped: 0 users

Successfully assigned licenses to:
  - HR Admin (Femmyofi@gmail.com) - License ID: 120002
  - Tolulope Olufohunsi (tolu@abicarehealth.co.uk) - License ID: 120016

⚠️  This was a DRY RUN. No changes were made to the database.
Run without --dry-run to apply these changes.
```

### Live Mode

Same output as above, but without the dry-run warnings, and with actual database changes applied.

## Verification

After running the script in live mode, verify the changes:

1. Log into the application
2. Go to User Management
3. Check that the affected users now have licenses assigned
4. Verify the license count has decreased appropriately

## Troubleshooting

### Error: Cannot find module 'mysql2'

If you get this error, install dependencies first:

```bash
pnpm install
```

### Error: Connection refused

Check that the DATABASE_URL is correct and that you have network access to the database.

### Error: No available licenses

If a tenant doesn't have enough available licenses, the script will skip those users and report them in the summary. You'll need to:

1. Purchase more licenses for that tenant
2. Or unassign licenses from inactive users
3. Then run the script again

## Safety Features

- **Dry-run mode**: Always test first without making changes
- **Detailed logging**: See exactly what will happen before it happens
- **Error handling**: Script continues even if some assignments fail
- **Transaction safety**: Each license assignment is a separate operation
- **Rollback**: If needed, you can manually unassign licenses from the User Management page

## One-Line Command

For convenience, here's a one-line command to run the script:

**Dry-run:**
```bash
DATABASE_URL="mysql://root:FISYUOgfWNzwdeuFbMmsLqwGTddSLaKH@yamabiko.proxy.rlwy.net:29933/railway" node fix-missing-licenses.mjs --dry-run
```

**Live:**
```bash
DATABASE_URL="mysql://root:FISYUOgfWNzwdeuFbMmsLqwGTddSLaKH@yamabiko.proxy.rlwy.net:29933/railway" node fix-missing-licenses.mjs
```

## After Running

Once the script completes successfully:

1. ✅ All affected users will have licenses assigned
2. ✅ Users can now access all features
3. ✅ License counts will be updated correctly
4. ✅ No further action needed

The script is idempotent - you can run it multiple times safely. It will only assign licenses to users who don't have them.

## Support

If you encounter any issues:

1. Check the error message in the output
2. Verify the DATABASE_URL is correct
3. Ensure you have network access to the database
4. Contact the development team if problems persist
