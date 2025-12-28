#!/usr/bin/env node
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');

console.log('================================================================================');
console.log('Cleanup Script: Remove Orphaned Licenses');
console.log('================================================================================');
console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE (changes will be applied)'}`);
console.log('');

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Find orphaned licenses (licenses for tenants that don't exist)
    const [orphanedLicenses] = await connection.query(`
      SELECT ul.tenantId, COUNT(*) as licenseCount
      FROM userLicenses ul
      LEFT JOIN tenants t ON ul.tenantId = t.id
      WHERE t.id IS NULL
      GROUP BY ul.tenantId
      ORDER BY ul.tenantId
    `);

    if (orphanedLicenses.length === 0) {
      console.log('✅ No orphaned licenses found. Database is clean!');
      await connection.end();
      return;
    }

    console.log(`⚠️  Found orphaned licenses for ${orphanedLicenses.length} deleted tenant(s):\n`);
    
    let totalOrphanedLicenses = 0;
    orphanedLicenses.forEach(row => {
      console.log(`   Tenant ID ${row.tenantId}: ${row.licenseCount} licenses`);
      totalOrphanedLicenses += row.licenseCount;
    });

    console.log(`\n📊 Total orphaned licenses to remove: ${totalOrphanedLicenses}`);
    console.log('');

    if (!isDryRun) {
      console.log('🔧 Removing orphaned licenses...');
      
      // Delete orphaned licenses
      const [result] = await connection.query(`
        DELETE ul FROM userLicenses ul
        LEFT JOIN tenants t ON ul.tenantId = t.id
        WHERE t.id IS NULL
      `);

      console.log(`✅ Removed ${result.affectedRows} orphaned license(s)`);
      console.log('✨ Cleanup completed successfully!');
    } else {
      console.log('🔍 DRY RUN MODE - No changes were made.');
      console.log('💡 Run without --dry-run flag to apply these changes.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
