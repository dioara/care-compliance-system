#!/usr/bin/env node
/**
 * Data Migration Script: Fix Assessment Location Mismatches
 * 
 * This script corrects assessment records where the locationId doesn't match
 * the staff member's or service user's assigned location.
 * 
 * Usage:
 *   # Dry run (see what would be changed):
 *   DATABASE_URL="mysql://..." node fix-assessment-locations.mjs --dry-run
 * 
 *   # Apply changes:
 *   DATABASE_URL="mysql://..." node fix-assessment-locations.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const isDryRun = process.argv.includes('--dry-run');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('🔧 Assessment Location Mismatch Fix');
  console.log('=====================================\n');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '✅ LIVE (changes will be applied)'}\n`);

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Find staff assessments with location mismatch
    console.log('📊 Checking staff member assessments...\n');
    
    const [staffMismatches] = await connection.query(`
      SELECT 
        ca.id as assessmentId,
        ca.staffMemberId,
        s.name as staffName,
        s.locationId as correctLocationId,
        ca.locationId as currentLocationId,
        l1.name as correctLocationName,
        l2.name as currentLocationName,
        ca.questionId,
        ca.complianceStatus,
        ca.createdAt
      FROM complianceAssessments ca
      JOIN staffMembers s ON ca.staffMemberId = s.id
      LEFT JOIN locations l1 ON s.locationId = l1.id
      LEFT JOIN locations l2 ON ca.locationId = l2.id
      WHERE ca.staffMemberId IS NOT NULL
      AND ca.locationId != s.locationId
      ORDER BY s.name, ca.createdAt
    `);

    // Find service user assessments with location mismatch
    console.log('📊 Checking service user assessments...\n');
    
    const [serviceUserMismatches] = await connection.query(`
      SELECT 
        ca.id as assessmentId,
        ca.serviceUserId,
        su.name as serviceUserName,
        su.locationId as correctLocationId,
        ca.locationId as currentLocationId,
        l1.name as correctLocationName,
        l2.name as currentLocationName,
        ca.questionId,
        ca.complianceStatus,
        ca.createdAt
      FROM complianceAssessments ca
      JOIN serviceUsers su ON ca.serviceUserId = su.id
      LEFT JOIN locations l1 ON su.locationId = l1.id
      LEFT JOIN locations l2 ON ca.locationId = l2.id
      WHERE ca.serviceUserId IS NOT NULL
      AND ca.locationId != su.locationId
      ORDER BY su.name, ca.createdAt
    `);

    const totalMismatches = staffMismatches.length + serviceUserMismatches.length;

    if (totalMismatches === 0) {
      console.log('✅ No location mismatches found! All assessments have correct location IDs.\n');
      await connection.end();
      return;
    }

    console.log(`⚠️  Found ${totalMismatches} assessment(s) with location mismatches:\n`);

    // Display staff mismatches
    if (staffMismatches.length > 0) {
      console.log(`📋 Staff Member Assessments (${staffMismatches.length} mismatches):`);
      console.log('─'.repeat(100));
      
      const staffGroups = {};
      staffMismatches.forEach(row => {
        if (!staffGroups[row.staffName]) {
          staffGroups[row.staffName] = [];
        }
        staffGroups[row.staffName].push(row);
      });

      for (const [staffName, assessments] of Object.entries(staffGroups)) {
        const first = assessments[0];
        console.log(`\n👤 ${staffName} (ID: ${first.staffMemberId})`);
        console.log(`   Current Location: ${first.currentLocationName || 'Unknown'} (${first.currentLocationId})`);
        console.log(`   Correct Location: ${first.correctLocationName || 'Unknown'} (${first.correctLocationId})`);
        console.log(`   Affected Assessments: ${assessments.length}`);
      }
      console.log('\n');
    }

    // Display service user mismatches
    if (serviceUserMismatches.length > 0) {
      console.log(`📋 Service User Assessments (${serviceUserMismatches.length} mismatches):`);
      console.log('─'.repeat(100));
      
      const serviceUserGroups = {};
      serviceUserMismatches.forEach(row => {
        if (!serviceUserGroups[row.serviceUserName]) {
          serviceUserGroups[row.serviceUserName] = [];
        }
        serviceUserGroups[row.serviceUserName].push(row);
      });

      for (const [userName, assessments] of Object.entries(serviceUserGroups)) {
        const first = assessments[0];
        console.log(`\n👤 ${userName} (ID: ${first.serviceUserId})`);
        console.log(`   Current Location: ${first.currentLocationName || 'Unknown'} (${first.currentLocationId})`);
        console.log(`   Correct Location: ${first.correctLocationName || 'Unknown'} (${first.correctLocationId})`);
        console.log(`   Affected Assessments: ${assessments.length}`);
      }
      console.log('\n');
    }

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes were made.');
      console.log('💡 Run without --dry-run flag to apply these changes.\n');
    } else {
      console.log('🔧 Applying fixes...\n');

      // Fix staff assessments
      if (staffMismatches.length > 0) {
        const [staffResult] = await connection.query(`
          UPDATE complianceAssessments ca
          JOIN staffMembers s ON ca.staffMemberId = s.id
          SET ca.locationId = s.locationId
          WHERE ca.staffMemberId IS NOT NULL
          AND ca.locationId != s.locationId
        `);
        console.log(`✅ Fixed ${staffResult.affectedRows} staff assessment(s)`);
      }

      // Fix service user assessments
      if (serviceUserMismatches.length > 0) {
        const [serviceUserResult] = await connection.query(`
          UPDATE complianceAssessments ca
          JOIN serviceUsers su ON ca.serviceUserId = su.id
          SET ca.locationId = su.locationId
          WHERE ca.serviceUserId IS NOT NULL
          AND ca.locationId != su.locationId
        `);
        console.log(`✅ Fixed ${serviceUserResult.affectedRows} service user assessment(s)`);
      }

      console.log('\n✨ Migration completed successfully!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
