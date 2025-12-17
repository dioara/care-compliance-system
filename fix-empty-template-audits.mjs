#!/usr/bin/env node
/**
 * Fix audit instances using empty templates by reassigning to complete templates
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
  console.log('🔧 Fixing audits using empty templates...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    await connection.beginTransaction();
    
    // Step 1: Find empty templates
    const [emptyTemplates] = await connection.execute(`
      SELECT 
        t.id as templateId,
        t.templateName,
        t.auditTypeId,
        COUNT(DISTINCT s.id) as sectionCount
      FROM auditTemplates t
      LEFT JOIN auditTemplateSections s ON t.id = s.auditTemplateId
      WHERE t.isActive = 1
      GROUP BY t.id, t.templateName, t.auditTypeId
      HAVING sectionCount = 0
    `);
    
    console.log(`📊 Found ${emptyTemplates.length} empty templates\n`);
    
    if (emptyTemplates.length === 0) {
      console.log('✅ No empty templates found!\n');
      await connection.commit();
      return;
    }
    
    let totalFixed = 0;
    
    // Step 2: For each empty template, find a replacement
    for (const emptyTemplate of emptyTemplates) {
      console.log(`\n🔍 Processing: ${emptyTemplate.templateName} (ID: ${emptyTemplate.templateId})`);
      console.log(`   Audit Type ID: ${emptyTemplate.auditTypeId}`);
      
      // Find a complete template for the same audit type
      const [completeTemplates] = await connection.execute(`
        SELECT 
          t.id as templateId,
          t.templateName,
          COUNT(DISTINCT s.id) as sectionCount,
          COUNT(DISTINCT q.id) as questionCount
        FROM auditTemplates t
        LEFT JOIN auditTemplateSections s ON t.id = s.auditTemplateId
        LEFT JOIN auditTemplateQuestions q ON s.id = q.auditTemplateSectionId
        WHERE t.auditTypeId = ? 
          AND t.isActive = 1
          AND t.id != ?
        GROUP BY t.id, t.templateName
        HAVING sectionCount > 0
        ORDER BY t.createdAt DESC
        LIMIT 1
      `, [emptyTemplate.auditTypeId, emptyTemplate.templateId]);
      
      if (completeTemplates.length === 0) {
        console.log(`   ⚠️  No complete template found for this audit type`);
        console.log(`   💡 This template needs to be populated manually\n`);
        continue;
      }
      
      const replacement = completeTemplates[0];
      console.log(`   ✅ Found replacement: ${replacement.templateName} (ID: ${replacement.templateId})`);
      console.log(`      Sections: ${replacement.sectionCount}, Questions: ${replacement.questionCount}`);
      
      // Find audits using the empty template
      const [affectedAudits] = await connection.execute(`
        SELECT id, status, createdAt
        FROM auditInstances
        WHERE auditTemplateId = ?
      `, [emptyTemplate.templateId]);
      
      if (affectedAudits.length > 0) {
        console.log(`   📝 Updating ${affectedAudits.length} audit instance(s)...`);
        
        // Update audits to use the complete template
        const [result] = await connection.execute(`
          UPDATE auditInstances
          SET auditTemplateId = ?
          WHERE auditTemplateId = ?
        `, [replacement.templateId, emptyTemplate.templateId]);
        
        console.log(`   ✅ Updated ${result.affectedRows} audit(s)`);
        totalFixed += result.affectedRows;
        
        // Deactivate the empty template
        await connection.execute(`
          UPDATE auditTemplates
          SET isActive = 0
          WHERE id = ?
        `, [emptyTemplate.templateId]);
        
        console.log(`   🔒 Deactivated empty template ${emptyTemplate.templateId}`);
      } else {
        console.log(`   ℹ️  No audits using this template`);
        
        // Still deactivate the empty template
        await connection.execute(`
          UPDATE auditTemplates
          SET isActive = 0
          WHERE id = ?
        `, [emptyTemplate.templateId]);
        
        console.log(`   🔒 Deactivated empty template ${emptyTemplate.templateId}`);
      }
    }
    
    await connection.commit();
    
    console.log(`\n✅ Fix complete!`);
    console.log(`   - Fixed ${totalFixed} audit instance(s)`);
    console.log(`   - Deactivated ${emptyTemplates.length} empty template(s)\n`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
