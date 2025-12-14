import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";

const db = drizzle(process.env.DATABASE_URL);

async function createAdminUser() {
  try {
    console.log("Creating admin user and test company...");

    // Create test company
    const [tenant] = await db.execute(`
      INSERT INTO tenants (name, slug, address, telephone, email)
      VALUES ('Test Care Home', 'test-care-home-${Date.now()}', '123 Test Street, London', '020 1234 5678', 'info@testcarehome.com')
    `);

    const tenantId = tenant.insertId;
    console.log(`✓ Created company with ID: ${tenantId}`);

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    await db.execute(`
      INSERT INTO users (email, password, name, tenantId, role, twoFaEnabled, twoFaVerified)
      VALUES ('admin@testcarehome.com', '${hashedPassword}', 'Admin User', ${tenantId}, 'admin', 0, 0)
    `);

    console.log("✓ Created admin user");
    console.log("\n=== LOGIN CREDENTIALS ===");
    console.log("Email: admin@testcarehome.com");
    console.log("Password: admin123");
    console.log("=========================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
