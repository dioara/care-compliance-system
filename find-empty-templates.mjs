#!/usr/bin/env node
/**
 * Find all templates with no sections/questions and audits using them
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
  console.log('🔍 Finding empty templates and affected audits...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Find templates with no sections
    const [emptyTemplates] = await connection.execute(`
      SELECT 
        t.id,
        t.templateName,
        t.auditTypeId,
        at.auditName,
        t.isActive,
        COUNT(DISTINCT s.id) as sectionCount,
        COUNT(DISTINCT q.id) as questionCount
      FROM auditTemplates t
      LEFT JOIN auditTemplateSections s ON t.id = s.auditTemplateId
      LEFT JOIN auditTemplateQuestions q ON s.id = q.auditTemplateSectionId
      LEFT JOIN auditTypes at ON t.auditTypeId = at.id
      GROUP BY t.id, t.templateName, t.auditTypeId, at.auditName, t.isActive
      HAVING sectionCount = 0
      ORDER BY t.id
    `);
    
    console.log(`📊 Found ${emptyTemplates.length} templates with no sections/questions:\n`);
    
    if (emptyTemplates.length === 0) {
      console.log('✅ All templates have sections and questions!\n');
      return;
    }
    
    const emptyTemplateIds = emptyTemplates.map(t => t.id);
    
    for (const template of emptyTemplates) {
      console.log(`❌ Template ${template.id}: ${template.templateName}`);
      console.log(`   Audit Type: ${template.auditName} (ID: ${template.auditTypeId})`);
      console.log(`   Active: ${template.isActive ? 'Yes' : 'No'}`);
      console.log(`   Sections: ${template.sectionCount}, Questions: ${template.questionCount}\n`);
    }
    
    // Find audits using these empty templates
    if (emptyTemplateIds.length > 0) {
      const placeholders = emptyTemplateIds.map(() => '?').join(',');
      const [affectedAudits] = await connection.execute(`
        SELECT 
          ai.id,
          ai.auditTemplateId,
          t.templateName,
          ai.status,
          ai.createdAt,
          at.auditName
        FROM auditInstances ai
        JOIN auditTemplates t ON ai.auditTemplateId = t.id
        JOIN auditTypes at ON ai.auditTypeId = at.id
        WHERE ai.auditTemplateId IN (${placeholders})
        ORDER BY ai.createdAt DESC
      `, emptyTemplateIds);
      
      console.log(`\n⚠️  ${affectedAudits.length} audit instances are using empty templates:\n`);
      
      if (affectedAudits.length > 0) {
        affectedAudits.forEach(audit => {
          console.log(`   - Audit #${audit.id}: ${audit.auditName}`);
          console.log(`     Template: ${audit.templateName} (ID: ${audit.auditTemplateId})`);
          console.log(`     Status: ${audit.status}`);
          console.log(`     Created: ${audit.createdAt}\n`);
        });
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Check if these templates have data in the complete dump');
    console.log('   2. If yes, re-import the template data');
    console.log('   3. If no, these templates need to be created manually\n');
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
