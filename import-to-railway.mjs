import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function importDatabase() {
  console.log('🚀 Starting database import to Railway...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Read the SQL dump file
    console.log('📖 Reading SQL dump file...');
    const sqlDump = fs.readFileSync('database-export-full.sql', 'utf-8');
    
    // Split into individual statements
    const statements = sqlDump
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.query(statement);
        successCount++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`✓ Processed ${i + 1}/${statements.length} statements...`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 10) {
          console.warn(`⚠️  Error in statement ${i + 1}: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n✅ Import completed!`);
    console.log(`   Success: ${successCount} statements`);
    console.log(`   Errors: ${errorCount} statements`);
    
    // Verify data was imported
    console.log('\n🔍 Verifying imported data...');
    const [tenants] = await connection.query('SELECT COUNT(*) as count FROM tenants');
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [serviceUsers] = await connection.query('SELECT COUNT(*) as count FROM serviceUsers');
    const [staff] = await connection.query('SELECT COUNT(*) as count FROM staff');
    
    console.log(`   Tenants: ${tenants[0].count}`);
    console.log(`   Users: ${users[0].count}`);
    console.log(`   Service Users: ${serviceUsers[0].count}`);
    console.log(`   Staff: ${staff[0].count}`);
    
    console.log('\n🎉 Database import successful!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

importDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
