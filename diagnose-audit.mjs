#!/usr/bin/env node
/**
 * Diagnose why a specific audit instance shows no questions
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const AUDIT_ID = process.argv[2] || 480003;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log(`🔍 Diagnosing audit instance ${AUDIT_ID}...\n`);
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get audit instance details
    const [audits] = await connection.execute(`
      SELECT 
        ai.*,
        at.auditName,
        at.auditCategory
      FROM auditInstances ai
      LEFT JOIN auditTypes at ON ai.auditTypeId = at.id
      WHERE ai.id = ?
    `, [AUDIT_ID]);
    
    if (audits.length === 0) {
      console.log(`❌ Audit instance ${AUDIT_ID} not found!\n`);
      return;
    }
    
    const audit = audits[0];
    console.log('📋 Audit Instance:');
    console.log(`   ID: ${audit.id}`);
    console.log(`   Audit Type: ${audit.auditName} (ID: ${audit.auditTypeId})`);
    console.log(`   Category: ${audit.auditCategory}`);
    console.log(`   Template ID: ${audit.auditTemplateId || 'NULL ❌'}`);
    console.log(`   Status: ${audit.status}`);
    console.log(`   Created: ${audit.createdAt}\n`);
    
    if (!audit.auditTemplateId) {
      console.log('❌ Problem: Audit has no template ID assigned!\n');
      
      // Check if template exists for this audit type
      const [templates] = await connection.execute(`
        SELECT id, templateName, isActive
        FROM auditTemplates
        WHERE auditTypeId = ? AND isActive = 1
      `, [audit.auditTypeId]);
      
      if (templates.length > 0) {
        console.log(`✅ Found ${templates.length} active template(s) for this audit type:`);
        templates.forEach(t => console.log(`   - Template ${t.id}: ${t.templateName}`));
        console.log('\n💡 Fix: Run `pnpm fix:audits` to assign the template\n');
      } else {
        console.log(`❌ No active templates found for audit type ${audit.auditTypeId}\n`);
      }
      return;
    }
    
    // Get template details
    const [templates] = await connection.execute(`
      SELECT *
      FROM auditTemplates
      WHERE id = ?
    `, [audit.auditTemplateId]);
    
    if (templates.length === 0) {
      console.log(`❌ Template ${audit.auditTemplateId} not found in database!\n`);
      return;
    }
    
    const template = templates[0];
    console.log('📝 Template:');
    console.log(`   ID: ${template.id}`);
    console.log(`   Name: ${template.templateName}`);
    console.log(`   Active: ${template.isActive ? 'Yes' : 'No ❌'}\n`);
    
    // Get sections
    const [sections] = await connection.execute(`
      SELECT *
      FROM auditTemplateSections
      WHERE auditTemplateId = ?
      ORDER BY displayOrder
    `, [audit.auditTemplateId]);
    
    console.log(`📑 Sections: ${sections.length}`);
    
    if (sections.length === 0) {
      console.log('   ❌ No sections found for this template!\n');
      return;
    }
    
    // Get questions for each section
    let totalQuestions = 0;
    for (const section of sections) {
      const [questions] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM auditTemplateQuestions
        WHERE auditTemplateSectionId = ?
      `, [section.id]);
      
      const questionCount = questions[0].count;
      totalQuestions += questionCount;
      console.log(`   - ${section.sectionTitle}: ${questionCount} questions`);
    }
    
    console.log(`\n📊 Total Questions: ${totalQuestions}`);
    
    if (totalQuestions === 0) {
      console.log('   ❌ No questions found in any section!\n');
    } else {
      console.log('   ✅ Template has questions!\n');
      
      // Check responses
      const [responses] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM auditResponses
        WHERE auditInstanceId = ?
      `, [AUDIT_ID]);
      
      console.log(`💬 Responses: ${responses[0].count} out of ${totalQuestions} questions answered\n`);
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
