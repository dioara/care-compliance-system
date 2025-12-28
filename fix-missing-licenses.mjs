#!/usr/bin/env node

/**
 * Migration Script: Fix Missing Licenses
 * 
 * This script assigns licenses to all existing users who don't have one
 * due to the registration bug where licenses were not automatically assigned.
 * 
 * Usage:
 *   node fix-missing-licenses.mjs [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what would be done without making changes
 */

import mysql from 'mysql2/promise';

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run');

console.log('='.repeat(80));
console.log('Migration Script: Fix Missing Licenses');
console.log('='.repeat(80));
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be applied)'}`);
console.log('');

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function main() {
  try {
    console.log('[1/5] Fetching all users...');
    const [allUsers] = await connection.query('SELECT * FROM users');
    console.log(`Found ${allUsers.length} total users`);
    console.log('');

    console.log('[2/5] Fetching all active licenses...');
    const [allLicenses] = await connection.query(
      'SELECT * FROM userLicenses WHERE isActive = 1'
    );
    console.log(`Found ${allLicenses.length} active licenses`);
    console.log('');

    // Create a set of user IDs that already have licenses
    const usersWithLicenses = new Set(
      allLicenses.filter(l => l.userId !== null).map(l => l.userId)
    );

    // Find users without licenses
    const usersWithoutLicenses = allUsers.filter(user => !usersWithLicenses.has(user.id));
    
    console.log('[3/5] Analyzing users without licenses...');
    console.log(`Found ${usersWithoutLicenses.length} users without licenses:`);
    console.log('');

    if (usersWithoutLicenses.length === 0) {
      console.log('✅ All users already have licenses assigned!');
      console.log('No action needed.');
      return;
    }

    // Group users by tenant
    const usersByTenant = {};
    for (const user of usersWithoutLicenses) {
      if (!usersByTenant[user.tenantId]) {
        usersByTenant[user.tenantId] = [];
      }
      usersByTenant[user.tenantId].push(user);
    }

    console.log('Users without licenses by tenant:');
    for (const [tenantId, tenantUsers] of Object.entries(usersByTenant)) {
      console.log(`  Tenant ${tenantId}: ${tenantUsers.length} users`);
      for (const user of tenantUsers) {
        console.log(`    - ${user.name} (${user.email}) - Role: ${user.role}, Super Admin: ${user.superAdmin ? 'Yes' : 'No'}`);
      }
    }
    console.log('');

    console.log('[4/5] Checking license availability per tenant...');
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const [tenantId, tenantUsers] of Object.entries(usersByTenant)) {
      console.log(`\nProcessing Tenant ${tenantId}...`);
      
      // Get subscription info
      const [subscriptions] = await connection.query(
        'SELECT * FROM tenantSubscriptions WHERE tenantId = ?',
        [parseInt(tenantId)]
      );
      const subscription = subscriptions[0];

      if (!subscription) {
        console.log(`  ⚠️  No subscription found for tenant ${tenantId}`);
        results.skipped.push(...tenantUsers.map(u => ({ user: u, reason: 'No subscription' })));
        continue;
      }

      console.log(`  Subscription: ${subscription.status}, Total Licenses: ${subscription.licensesCount}`);

      // Get available licenses for this tenant
      const [availableLicenses] = await connection.query(
        'SELECT * FROM userLicenses WHERE tenantId = ? AND isActive = 1 AND userId IS NULL',
        [parseInt(tenantId)]
      );

      console.log(`  Available unassigned licenses: ${availableLicenses.length}`);

      // Assign licenses to users
      let assignedCount = 0;
      for (const user of tenantUsers) {
        if (assignedCount >= availableLicenses.length) {
          console.log(`  ⚠️  No more available licenses for ${user.name} (${user.email})`);
          results.failed.push({ user, reason: 'No available licenses' });
          continue;
        }

        const license = availableLicenses[assignedCount];
        const assignedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        if (isDryRun) {
          console.log(`  [DRY RUN] Would assign license ${license.id} to ${user.name} (${user.email})`);
          results.success.push({ user, licenseId: license.id });
        } else {
          try {
            await connection.query(
              'UPDATE userLicenses SET userId = ?, assignedAt = ?, assignedById = ? WHERE id = ?',
              [user.id, assignedAt, user.id, license.id]
            );
            
            console.log(`  ✅ Assigned license ${license.id} to ${user.name} (${user.email})`);
            results.success.push({ user, licenseId: license.id });
          } catch (error) {
            console.error(`  ❌ Failed to assign license to ${user.name} (${user.email}):`, error.message);
            results.failed.push({ user, reason: error.message });
          }
        }
        
        assignedCount++;
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('[5/5] Migration Summary');
    console.log('='.repeat(80));
    console.log(`✅ Successfully assigned: ${results.success.length} licenses`);
    console.log(`❌ Failed: ${results.failed.length} assignments`);
    console.log(`⚠️  Skipped: ${results.skipped.length} users`);
    console.log('');

    if (results.success.length > 0) {
      console.log('Successfully assigned licenses to:');
      for (const { user, licenseId } of results.success) {
        console.log(`  - ${user.name} (${user.email}) - License ID: ${licenseId}`);
      }
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log('Failed to assign licenses to:');
      for (const { user, reason } of results.failed) {
        console.log(`  - ${user.name} (${user.email}) - Reason: ${reason}`);
      }
      console.log('');
    }

    if (results.skipped.length > 0) {
      console.log('Skipped users:');
      for (const { user, reason } of results.skipped) {
        console.log(`  - ${user.name} (${user.email}) - Reason: ${reason}`);
      }
      console.log('');
    }

    if (isDryRun) {
      console.log('');
      console.log('⚠️  This was a DRY RUN. No changes were made to the database.');
      console.log('Run without --dry-run to apply these changes.');
    } else {
      console.log('');
      console.log('✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
