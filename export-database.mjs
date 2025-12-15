import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Exporting database to SQL file...\n');

const tables = [
  'complianceSections',
  'complianceQuestions',
  'locations',
  'serviceUsers',
  'staffMembers',
  'complianceAssessments'
];

let sqlDump = `-- Care Compliance System Database Export
-- Generated: ${new Date().toISOString()}
-- 
-- This file contains the complete database schema and data
-- To restore: mysql -u username -p database_name < export.sql

SET FOREIGN_KEY_CHECKS=0;

`;

for (const table of tables) {
  console.log(`Exporting table: ${table}`);
  
  // Get table structure
  const [createTable] = await conn.query(`SHOW CREATE TABLE ${table}`);
  sqlDump += `\n-- Table: ${table}\n`;
  sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
  sqlDump += createTable[0]['Create Table'] + ';\n\n';
  
  // Get table data
  const [rows] = await conn.query(`SELECT * FROM ${table}`);
  
  if (rows.length > 0) {
    sqlDump += `-- Data for table: ${table}\n`;
    
    // Get column names
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `\`${c}\``).join(', ');
    
    // Insert data in batches
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
        return val;
      }).join(', ');
      
      sqlDump += `INSERT INTO \`${table}\` (${columnList}) VALUES (${values});\n`;
    }
    
    sqlDump += '\n';
  }
  
  console.log(`  ✓ Exported ${rows.length} rows`);
}

sqlDump += '\nSET FOREIGN_KEY_CHECKS=1;\n';

// Write to file
const filename = `database-export-${Date.now()}.sql`;
await fs.writeFile(filename, sqlDump);

console.log(`\n✅ Database exported to: ${filename}`);
console.log(`   File size: ${(sqlDump.length / 1024 / 1024).toFixed(2)} MB`);

await conn.end();
