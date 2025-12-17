#!/usr/bin/env node
/**
 * Import ALL audit templates, sections, and questions from complete database dump
 * This ensures no templates are missing from the database
 */

import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('🚀 Starting comprehensive template import...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Read the extracted template data
    console.log('📖 Reading template data from dump file...');
    const sqlContent = readFileSync('./templates-import-data.sql', 'utf-8');
    
    // Split into individual INSERT statements
    const statements = sqlContent
      .split('\n')
      .filter(line => line.trim().startsWith('INSERT INTO'));
    
    console.log(`Found ${statements.length} INSERT statements\n`);
    
    // Count by table
    const templateCount = statements.filter(s => s.includes('auditTemplates')).length;
    const sectionCount = statements.filter(s => s.includes('auditTemplateSections')).length;
    const questionCount = statements.filter(s => s.includes('auditTemplateQuestions')).length;
    
    console.log(`📊 Data breakdown:`);
    console.log(`   - Templates: ${templateCount}`);
    console.log(`   - Sections: ${sectionCount}`);
    console.log(`   - Questions: ${questionCount}\n`);
    
    // Start transaction
    await connection.beginTransaction();
    
    console.log('🔄 Importing data (this may take a while)...\n');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const statement of statements) {
      try {
        // Use INSERT IGNORE to skip duplicates
        const ignoreSql = statement.replace('INSERT INTO', 'INSERT IGNORE INTO');
        const [result] = await connection.execute(ignoreSql);
        
        if (result.affectedRows > 0) {
          imported++;
          if (imported % 100 === 0) {
            console.log(`   ✓ Imported ${imported} records...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        if (errors < 10) {
          console.error(`   ⚠️  Error: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    console.log(`\n✅ Import complete!`);
    console.log(`   - Imported: ${imported} records`);
    console.log(`   - Skipped (duplicates): ${skipped} records`);
    console.log(`   - Errors: ${errors} records\n`);
    
    // Verify final counts
    const [templates] = await connection.execute('SELECT COUNT(*) as count FROM auditTemplates');
    const [sections] = await connection.execute('SELECT COUNT(*) as count FROM auditTemplateSections');
    const [questions] = await connection.execute('SELECT COUNT(*) as count FROM auditTemplateQuestions');
    
    console.log(`📈 Final database counts:`);
    console.log(`   - Templates: ${templates[0].count}`);
    console.log(`   - Sections: ${sections[0].count}`);
    console.log(`   - Questions: ${questions[0].count}\n`);
    
    // Check for audit types without templates
    const [missingTemplates] = await connection.execute(`
      SELECT 
        at.id,
        at.auditName,
        COUNT(atem.id) as templateCount
      FROM auditTypes at
      LEFT JOIN auditTemplates atem ON at.id = atem.auditTypeId AND atem.isActive = 1
      GROUP BY at.id, at.auditName
      HAVING templateCount = 0
      ORDER BY at.auditName
    `);
    
    if (missingTemplates.length > 0) {
      console.log(`⚠️  Audit types still missing templates:`);
      missingTemplates.forEach(row => {
        console.log(`   - ${row.auditName} (ID: ${row.id})`);
      });
      console.log('');
    } else {
      console.log(`✅ All audit types now have templates!\n`);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
