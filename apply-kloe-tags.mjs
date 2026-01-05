import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Load the KLOE mappings
const mappings = JSON.parse(fs.readFileSync('/home/ubuntu/kloe-mappings-clean.json', 'utf8'));

console.log(`Loaded ${mappings.length} KLOE mappings`);

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Starting database updates...\n');
  
  let updated = 0;
  let failed = 0;
  
  for (const mapping of mappings) {
    try {
      await connection.query(
        'UPDATE auditTemplateQuestions SET kloes = ? WHERE id = ?',
        [mapping.kloes, mapping.id]
      );
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`✓ Updated ${updated}/${mappings.length} questions...`);
      }
    } catch (error) {
      console.error(`✗ Failed to update question ${mapping.id}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n✓ Complete!`);
  console.log(`  - Successfully updated: ${updated} questions`);
  console.log(`  - Failed: ${failed} questions`);
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
