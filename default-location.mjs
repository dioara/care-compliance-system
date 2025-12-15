import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function defaultToMainOffice() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get the Main Office location ID for each tenant
    const [locations] = await connection.execute(`
      SELECT id, tenantId, name FROM locations WHERE name LIKE '%Main%' OR name LIKE '%Head%' OR id IN (
        SELECT MIN(id) FROM locations GROUP BY tenantId
      )
    `);
    
    console.log('Found locations:', locations);
    
    // For each tenant, get their first location (Main Office)
    const [tenantLocations] = await connection.execute(`
      SELECT tenantId, MIN(id) as locationId FROM locations GROUP BY tenantId
    `);
    
    console.log('Tenant locations:', tenantLocations);
    
    // Update staff members without a location
    for (const loc of tenantLocations) {
      const [staffResult] = await connection.execute(`
        UPDATE staffMembers SET locationId = ? WHERE tenantId = ? AND (locationId IS NULL OR locationId = 0)
      `, [loc.locationId, loc.tenantId]);
      console.log(`Updated ${staffResult.affectedRows} staff members for tenant ${loc.tenantId} to location ${loc.locationId}`);
      
      // Update service users without a location
      const [serviceUserResult] = await connection.execute(`
        UPDATE serviceUsers SET locationId = ? WHERE tenantId = ? AND (locationId IS NULL OR locationId = 0)
      `, [loc.locationId, loc.tenantId]);
      console.log(`Updated ${serviceUserResult.affectedRows} service users for tenant ${loc.tenantId} to location ${loc.locationId}`);
    }
    
    // Verify the updates
    const [staffWithoutLocation] = await connection.execute(`
      SELECT COUNT(*) as count FROM staffMembers WHERE locationId IS NULL OR locationId = 0
    `);
    console.log('Staff without location:', staffWithoutLocation[0].count);
    
    const [serviceUsersWithoutLocation] = await connection.execute(`
      SELECT COUNT(*) as count FROM serviceUsers WHERE locationId IS NULL OR locationId = 0
    `);
    console.log('Service users without location:', serviceUsersWithoutLocation[0].count);
    
    console.log('Done!');
  } finally {
    await connection.end();
  }
}

defaultToMainOffice().catch(console.error);
