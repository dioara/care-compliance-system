import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔄 Importing complete database dump to Railway...\n');

// Create connection with multipleStatements enabled
const connection = await mysql.createConnection({
  uri: DATABASE_URL,
  multipleStatements: true
});

// Read the SQL dump file
const sql = fs.readFileSync('database-complete-dump.sql', 'utf8');

console.log('📦 Executing SQL dump...');
console.log(`   File size: ${(sql.length / 1024 / 1024).toFixed(2)} MB\n`);

try {
  // Execute the entire SQL dump
  await connection.query(sql);
  
  console.log('✅ Database imported successfully!\n');
  
  // Verify import
  console.log('🔍 Verifying imported data...\n');
  
  const checks = [
    'tenants',
    'users',
    'locations',
    'serviceUsers',
    'staffMembers',
    'incidents',
    'auditSchedules',
    'auditResults',
    'complianceAssessments'
  ];
  
  for (const table of checks) {
    try {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      console.log(`   ✓ ${table}: ${rows[0].count} records`);
    } catch (e) {
      console.log(`   ✗ ${table}: Table doesn't exist or error`);
    }
  }
  
  console.log('\n✅ Import completed successfully!');
  
} catch (error) {
  console.error('\n❌ Import failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
