/**
 * Migration Script: Create Help Center Tables in Railway Production Database
 * 
 * This script creates the missing Help Center tables (articleBookmarks, articleFeedback, supportTickets)
 * directly in the Railway production database.
 * 
 * Usage in GitHub Codespaces:
 * 1. Make sure DATABASE_URL environment variable points to Railway production database
 * 2. Run: node scripts/create-help-center-tables.mjs
 */

import mysql from 'mysql2/promise';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL to your Railway production database connection string');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
console.log(`Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);

async function createHelpCenterTables() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Connected to database successfully\n');

    // Table 1: articleBookmarks
    console.log('📋 Creating table: articleBookmarks...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`articleBookmarks\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`articleId\` varchar(255) NOT NULL,
        \`userId\` int NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_article_user\` (\`articleId\`, \`userId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ articleBookmarks table created\n');

    // Table 2: articleFeedback
    console.log('📋 Creating table: articleFeedback...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`articleFeedback\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`articleId\` varchar(255) NOT NULL,
        \`userId\` int NOT NULL,
        \`tenantId\` int NOT NULL,
        \`helpful\` tinyint NOT NULL,
        \`feedbackText\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_article_user\` (\`articleId\`, \`userId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ articleFeedback table created\n');

    // Table 3: supportTickets
    console.log('📋 Creating table: supportTickets...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`supportTickets\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`tenantId\` int NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`message\` text NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`status\` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_user\` (\`userId\`),
        KEY \`idx_tenant\` (\`tenantId\`),
        KEY \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ supportTickets table created\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND (TABLE_NAME = 'articleBookmarks' 
           OR TABLE_NAME = 'articleFeedback' 
           OR TABLE_NAME = 'supportTickets')
      ORDER BY TABLE_NAME;
    `);

    console.log('\n✅ Tables verified:');
    tables.forEach(row => {
      console.log(`   - ${row.TABLE_NAME}`);
    });

    if (tables.length === 3) {
      console.log('\n🎉 SUCCESS! All 3 Help Center tables created successfully!');
      console.log('\nThe following features are now available:');
      console.log('  ✅ Article bookmarking');
      console.log('  ✅ Article feedback (thumbs up/down)');
      console.log('  ✅ Contact support form');
    } else {
      console.log(`\n⚠️  WARNING: Expected 3 tables but found ${tables.length}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR creating tables:');
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the migration
createHelpCenterTables();
