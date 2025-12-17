import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function exportDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('🔍 Fetching all tables...');
  const [tables] = await connection.query('SHOW TABLES');
  
  let sqlDump = '-- CCMS Database Export\n';
  sqlDump += `-- Generated: ${new Date().toISOString()}\n\n`;
  sqlDump += 'SET FOREIGN_KEY_CHECKS=0;\n\n';
  
  for (const tableRow of tables) {
    const tableName = Object.values(tableRow)[0];
    console.log(`📦 Exporting table: ${tableName}`);
    
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    
    if (rows.length > 0) {
      sqlDump += `-- Data for table ${tableName}\n`;
      
      for (const row of rows) {
        const columns = Object.keys(row).map(k => `\`${k}\``).join(', ');
        const values = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
          return v;
        }).join(', ');
        
        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      }
      sqlDump += '\n';
    }
  }
  
  sqlDump += 'SET FOREIGN_KEY_CHECKS=1;\n';
  
  fs.writeFileSync('database-export-full.sql', sqlDump);
  console.log('✅ Database exported to database-export-full.sql');
  
  await connection.end();
}

exportDatabase().catch(console.error);
