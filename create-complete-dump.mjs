import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
const connection = await mysql.createConnection(DATABASE_URL);

console.log('🔍 Creating complete database dump...\n');

let dump = `-- CCMS Complete Database Dump
-- Generated: ${new Date().toISOString()}
-- 
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

`;

// Get all tables
const [tables] = await connection.query('SHOW TABLES');
const tableNames = tables.map(row => Object.values(row)[0]);

console.log(`Found ${tableNames.length} tables\n`);

for (const tableName of tableNames) {
  console.log(`📦 Exporting table: ${tableName}`);
  
  // Get CREATE TABLE statement
  const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
  const createStatement = createResult[0]['Create Table'];
  
  dump += `--\n-- Table structure for \`${tableName}\`\n--\n\n`;
  dump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
  dump += createStatement + ';\n\n';
  
  // Get row count
  const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
  const rowCount = countResult[0].count;
  
  if (rowCount > 0) {
    dump += `--\n-- Dumping data for table \`${tableName}\` (${rowCount} rows)\n--\n\n`;
    
    // Get all data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    
    for (const row of rows) {
      const columns = Object.keys(row).map(k => `\`${k}\``).join(', ');
      const values = Object.values(row).map(v => {
        if (v === null) return 'NULL';
        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
        if (typeof v === 'string') return connection.escape(v);
        if (typeof v === 'boolean') return v ? '1' : '0';
        return v;
      }).join(', ');
      
      dump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
    }
    dump += '\n';
  }
}

dump += 'SET FOREIGN_KEY_CHECKS=1;\n';

fs.writeFileSync('database-complete-dump.sql', dump);
console.log('\n✅ Complete database dump created: database-complete-dump.sql');

const stats = fs.statSync('database-complete-dump.sql');
console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

await connection.end();
