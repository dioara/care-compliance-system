# Railway Production Database Migration

## Create Help Center Tables in Railway

This guide will help you create the missing Help Center tables in your Railway production database using GitHub Codespaces.

---

## Prerequisites

- Access to GitHub Codespaces for the `dioara/care-compliance-system` repository
- Railway production database connection string (DATABASE_URL)

---

## Step-by-Step Instructions

### 1. Open GitHub Codespaces

1. Go to https://github.com/dioara/care-compliance-system
2. Click the green **Code** button
3. Select **Codespaces** tab
4. Click **Create codespace on main** (or open existing codespace)

### 2. Set Railway Database URL

In the Codespaces terminal, set the DATABASE_URL environment variable to your Railway production database:

```bash
export DATABASE_URL="mysql://user:password@host:port/railway"
```

**To find your Railway DATABASE_URL:**
1. Go to https://railway.app
2. Open your project
3. Click on the MySQL database service
4. Go to **Variables** tab
5. Copy the `DATABASE_URL` value

### 3. Run the Migration Script

```bash
node scripts/create-help-center-tables.mjs
```

### 4. Expected Output

You should see output like this:

```
🔗 Connecting to database...
Database: xxxxx.railway.app
✅ Connected to database successfully

📋 Creating table: articleBookmarks...
✅ articleBookmarks table created

📋 Creating table: articleFeedback...
✅ articleFeedback table created

📋 Creating table: supportTickets...
✅ supportTickets table created

🔍 Verifying tables...

✅ Tables verified:
   - articleBookmarks
   - articleFeedback
   - supportTickets

🎉 SUCCESS! All 3 Help Center tables created successfully!

The following features are now available:
  ✅ Article bookmarking
  ✅ Article feedback (thumbs up/down)
  ✅ Contact support form

🔌 Database connection closed
```

---

## What This Fixes

After running this script, the following Help Center features will work in production:

- ✅ **Bookmark articles** - Users can save articles for later
- ✅ **Article feedback** - Users can rate articles with thumbs up/down
- ✅ **Contact support** - Users can submit support tickets from help articles

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution:** Make sure you've set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="your-railway-database-url"
```

### Error: "Access denied for user"

**Solution:** Check that your DATABASE_URL has the correct username and password for Railway.

### Error: "Can't connect to MySQL server"

**Solution:** 
1. Verify the Railway database is running
2. Check that the host and port in DATABASE_URL are correct
3. Ensure your IP is whitelisted in Railway (if IP restrictions are enabled)

---

## Alternative: Manual SQL Execution

If you prefer to run the SQL manually in Railway's dashboard:

1. Go to Railway dashboard
2. Open your MySQL database service
3. Click **Query** tab
4. Copy and paste the SQL from `scripts/create-help-center-tables.sql` (see below)
5. Click **Execute**

### SQL Statements

```sql
-- Table 1: Article Bookmarks
CREATE TABLE IF NOT EXISTS `articleBookmarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_user` (`articleId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Article Feedback
CREATE TABLE IF NOT EXISTS `articleFeedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleId` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `tenantId` int NOT NULL,
  `helpful` tinyint NOT NULL,
  `feedbackText` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_user` (`articleId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Support Tickets
CREATE TABLE IF NOT EXISTS `supportTickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `tenantId` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`userId`),
  KEY `idx_tenant` (`tenantId`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND (TABLE_NAME = 'articleBookmarks' 
     OR TABLE_NAME = 'articleFeedback' 
     OR TABLE_NAME = 'supportTickets')
ORDER BY TABLE_NAME;
```

---

## After Migration

Once the tables are created, your Railway production site will have full Help Center functionality without any database errors.

**Test the features:**
1. Visit your production site
2. Go to Help Center
3. Try bookmarking an article
4. Try giving feedback (thumbs up/down)
5. Try submitting a support request

All features should work without errors!
