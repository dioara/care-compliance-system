import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seedData() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log('🌱 Starting data seeding...');

    // Get the tenant ID for Test Care Home (tenant 30002)
    const [tenants] = await connection.query('SELECT id FROM tenants WHERE id = 30002 LIMIT 1');
    if (tenants.length === 0) {
      console.error('No tenants found. Please create a tenant first.');
      process.exit(1);
    }
    const tenantId = tenants[0].id;
    console.log(`✓ Found tenant ID: ${tenantId}`);

    // Get the location ID (assuming there's at least one location)
    const [locations] = await connection.query('SELECT id FROM locations WHERE tenantId = ? LIMIT 1', [tenantId]);
    if (locations.length === 0) {
      console.error('No locations found. Please create a location first.');
      process.exit(1);
    }
    const locationId = locations[0].id;
    console.log(`✓ Found location ID: ${locationId}`);

    // Seed Service Users
    console.log('\\n📝 Seeding service users...');
    const serviceUsers = [
      {
        tenantId,
        locationId,
        name: 'Margaret Thompson',
        dateOfBirth: '1945-03-15',
        carePackageType: 'Residential Care',
        admissionDate: '2023-01-10',
        supportNeeds: 'Requires assistance with mobility and personal care. Dementia care support needed.'
      },
      {
        tenantId,
        locationId,
        name: 'John Davies',
        dateOfBirth: '1938-07-22',
        carePackageType: 'Nursing Care',
        admissionDate: '2022-11-05',
        supportNeeds: 'Full nursing care required. Diabetes management and medication administration.'
      },
      {
        tenantId,
        locationId,
        name: 'Elizabeth Wilson',
        dateOfBirth: '1942-12-08',
        carePackageType: 'Residential Care',
        admissionDate: '2023-06-20',
        supportNeeds: 'Assistance with daily living activities. Social engagement and activities support.'
      },
      {
        tenantId,
        locationId,
        name: 'Robert Smith',
        dateOfBirth: '1940-05-30',
        carePackageType: 'Respite Care',
        admissionDate: '2024-01-15',
        supportNeeds: 'Short-term respite care. Independent with most activities.'
      },
      {
        tenantId,
        locationId,
        name: 'Mary Johnson',
        dateOfBirth: '1948-09-12',
        carePackageType: 'Residential Care',
        admissionDate: '2023-03-25',
        supportNeeds: 'Requires support with personal care and meal preparation. Enjoys group activities.'
      }
    ];

    for (const user of serviceUsers) {
      await connection.query(
        'INSERT INTO serviceUsers (tenantId, locationId, name, dateOfBirth, carePackageType, admissionDate, supportNeeds, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [user.tenantId, user.locationId, user.name, user.dateOfBirth, user.carePackageType, user.admissionDate, user.supportNeeds]
      );
      console.log(`  ✓ Added service user: ${user.name}`);
    }

    // Seed Staff Members
    console.log('\\n👥 Seeding staff members...');
    const staffMembers = [
      {
        tenantId,
        locationId,
        name: 'Sarah Williams',
        role: 'Registered Nurse',
        employmentDate: '2020-03-01',
        dbsCertificateNumber: 'DBS123456789',
        dbsDate: '2023-06-15',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'James Brown',
        role: 'Care Assistant',
        employmentDate: '2021-09-15',
        dbsCertificateNumber: 'DBS987654321',
        dbsDate: '2023-08-20',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'Emma Taylor',
        role: 'Senior Care Assistant',
        employmentDate: '2019-05-10',
        dbsCertificateNumber: 'DBS456789123',
        dbsDate: '2023-05-10',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'Michael Anderson',
        role: 'Activities Coordinator',
        employmentDate: '2022-01-20',
        dbsCertificateNumber: 'DBS789123456',
        dbsDate: '2023-09-05',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'Lisa Martinez',
        role: 'Care Assistant',
        employmentDate: '2023-02-01',
        dbsCertificateNumber: 'DBS321654987',
        dbsDate: '2023-10-12',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'David Thompson',
        role: 'Night Care Assistant',
        employmentDate: '2020-11-15',
        dbsCertificateNumber: 'DBS654987321',
        dbsDate: '2023-07-22',
        isActive: true
      },
      {
        tenantId,
        locationId,
        name: 'Rachel Green',
        role: 'Care Manager',
        employmentDate: '2018-04-01',
        dbsCertificateNumber: 'DBS147258369',
        dbsDate: '2023-04-15',
        isActive: true
      }
    ];

    for (const staff of staffMembers) {
      await connection.query(
        'INSERT INTO staffMembers (tenantId, locationId, name, role, employmentDate, dbsCertificateNumber, dbsDate, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [staff.tenantId, staff.locationId, staff.name, staff.role, staff.employmentDate, staff.dbsCertificateNumber, staff.dbsDate, staff.isActive]
      );
      console.log(`  ✓ Added staff member: ${staff.name} (${staff.role})`);
    }

    console.log('\\n✅ Data seeding completed successfully!');
    console.log(`\\nSummary:`);
    console.log(`  - ${serviceUsers.length} service users added`);
    console.log(`  - ${staffMembers.length} staff members added`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedData();
