#!/usr/bin/env node
/**
 * Fix audit instances that have NULL auditTemplateId
 * This happens when audits were created before templates were imported
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('🔧 Fixing audit instances with missing template IDs...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Find audit instances with NULL auditTemplateId
    const [nullTemplates] = await connection.execute(`
      SELECT 
        ai.id,
        ai.auditTypeId,
        at.auditName,
        ai.auditTemplateId
      FROM auditInstances ai
      JOIN auditTypes at ON ai.auditTypeId = at.id
      WHERE ai.auditTemplateId IS NULL
      ORDER BY ai.createdAt DESC
    `);
    
    console.log(`📊 Found ${nullTemplates.length} audit instances with missing template IDs\n`);
    
    if (nullTemplates.length === 0) {
      console.log('✅ All audit instances already have template IDs!\n');
      return;
    }
    
    // Show what will be fixed
    console.log('Audits to fix:');
    nullTemplates.forEach(audit => {
      console.log(`   - Audit #${audit.id}: ${audit.auditName} (Type ID: ${audit.auditTypeId})`);
    });
    console.log('');
    
    // Update audit instances with correct template IDs
    const [result] = await connection.execute(`
      UPDATE auditInstances ai
      JOIN auditTypes at ON ai.auditTypeId = at.id
      JOIN auditTemplates atem ON at.id = atem.auditTypeId AND atem.isActive = 1
      SET ai.auditTemplateId = atem.id
      WHERE ai.auditTemplateId IS NULL
    `);
    
    console.log(`✅ Fixed ${result.affectedRows} audit instances!\n`);
    
    // Verify the fix
    const [stillNull] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM auditInstances
      WHERE auditTemplateId IS NULL
    `);
    
    if (stillNull[0].count === 0) {
      console.log('✅ All audit instances now have template IDs!\n');
    } else {
      console.log(`⚠️  ${stillNull[0].count} audit instances still have NULL template IDs`);
      console.log('   This may be because their audit types don\'t have templates yet.\n');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
