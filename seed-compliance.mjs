import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// 29 CQC Compliance Sections based on Health and Social Care Act 2008
const complianceSections = [
  {
    code: 'REG9',
    name: 'Person-centred care',
    description: 'Care and treatment must be appropriate and meet service users\' needs and reflect their preferences.',
    category: 'Safe',
    sortOrder: 1
  },
  {
    code: 'REG10',
    name: 'Dignity and respect',
    description: 'Service users must be treated with dignity and respect at all times.',
    category: 'Caring',
    sortOrder: 2
  },
  {
    code: 'REG11',
    name: 'Need for consent',
    description: 'Care and treatment must only be provided with the consent of the relevant person.',
    category: 'Safe',
    sortOrder: 3
  },
  {
    code: 'REG12',
    name: 'Safe care and treatment',
    description: 'Care and treatment must be provided in a safe way, including proper risk assessments.',
    category: 'Safe',
    sortOrder: 4
  },
  {
    code: 'REG13',
    name: 'Safeguarding service users from abuse',
    description: 'Service users must be protected from abuse and improper treatment.',
    category: 'Safe',
    sortOrder: 5
  },
  {
    code: 'REG14',
    name: 'Meeting nutritional and hydration needs',
    description: 'Service users must have adequate nutrition and hydration to sustain life and good health.',
    category: 'Safe',
    sortOrder: 6
  },
  {
    code: 'REG15',
    name: 'Premises and equipment',
    description: 'Premises and equipment must be clean, secure, suitable and properly maintained.',
    category: 'Safe',
    sortOrder: 7
  },
  {
    code: 'REG16',
    name: 'Receiving and acting on complaints',
    description: 'An accessible system for identifying, receiving, handling and responding to complaints must be established.',
    category: 'Responsive',
    sortOrder: 8
  },
  {
    code: 'REG17',
    name: 'Good governance',
    description: 'Systems must be established to assess, monitor and improve quality and safety.',
    category: 'Well-led',
    sortOrder: 9
  },
  {
    code: 'REG18',
    name: 'Staffing',
    description: 'Sufficient numbers of suitably qualified, competent, skilled and experienced staff must be deployed.',
    category: 'Safe',
    sortOrder: 10
  },
  {
    code: 'REG19',
    name: 'Fit and proper persons employed',
    description: 'Staff must be of good character and have the necessary qualifications, skills and experience.',
    category: 'Safe',
    sortOrder: 11
  },
  {
    code: 'REG20',
    name: 'Duty of candour',
    description: 'Providers must be open and transparent with service users about their care and treatment.',
    category: 'Well-led',
    sortOrder: 12
  },
  {
    code: 'REG20A',
    name: 'Requirement as to display of performance assessments',
    description: 'CQC ratings must be displayed prominently at the service and on the website.',
    category: 'Well-led',
    sortOrder: 13
  },
  {
    code: 'SAFE1',
    name: 'Infection prevention and control',
    description: 'Effective systems to prevent and control the spread of infections.',
    category: 'Safe',
    sortOrder: 14
  },
  {
    code: 'SAFE2',
    name: 'Medicines management',
    description: 'Safe ordering, storage, administration and disposal of medicines.',
    category: 'Safe',
    sortOrder: 15
  },
  {
    code: 'SAFE3',
    name: 'Health and safety',
    description: 'Compliance with health and safety legislation and risk management.',
    category: 'Safe',
    sortOrder: 16
  },
  {
    code: 'SAFE4',
    name: 'Fire safety',
    description: 'Fire risk assessments, equipment checks and evacuation procedures.',
    category: 'Safe',
    sortOrder: 17
  },
  {
    code: 'EFFECTIVE1',
    name: 'Assessing and monitoring care needs',
    description: 'Regular assessment and review of service users\' care and support needs.',
    category: 'Effective',
    sortOrder: 18
  },
  {
    code: 'EFFECTIVE2',
    name: 'Staff training and development',
    description: 'Staff receive appropriate training, supervision and appraisal.',
    category: 'Effective',
    sortOrder: 19
  },
  {
    code: 'EFFECTIVE3',
    name: 'Working with other agencies',
    description: 'Effective partnership working with health and social care professionals.',
    category: 'Effective',
    sortOrder: 20
  },
  {
    code: 'CARING1',
    name: 'Promoting independence',
    description: 'Supporting service users to maintain and develop their independence.',
    category: 'Caring',
    sortOrder: 21
  },
  {
    code: 'CARING2',
    name: 'Involving people in decisions',
    description: 'Service users and families are involved in planning and reviewing care.',
    category: 'Caring',
    sortOrder: 22
  },
  {
    code: 'RESPONSIVE1',
    name: 'Meeting diverse needs',
    description: 'Care is tailored to meet individual needs including cultural and religious preferences.',
    category: 'Responsive',
    sortOrder: 23
  },
  {
    code: 'RESPONSIVE2',
    name: 'Activities and social engagement',
    description: 'Meaningful activities and opportunities for social interaction.',
    category: 'Responsive',
    sortOrder: 24
  },
  {
    code: 'RESPONSIVE3',
    name: 'End of life care',
    description: 'Compassionate and dignified end of life care planning and delivery.',
    category: 'Responsive',
    sortOrder: 25
  },
  {
    code: 'WELLLED1',
    name: 'Leadership and management',
    description: 'Clear leadership, management structure and lines of accountability.',
    category: 'Well-led',
    sortOrder: 26
  },
  {
    code: 'WELLLED2',
    name: 'Quality assurance systems',
    description: 'Regular audits, monitoring and quality improvement activities.',
    category: 'Well-led',
    sortOrder: 27
  },
  {
    code: 'WELLLED3',
    name: 'Learning and improvement culture',
    description: 'Learning from incidents, feedback and best practice to drive improvement.',
    category: 'Well-led',
    sortOrder: 28
  },
  {
    code: 'WELLLED4',
    name: 'Record keeping',
    description: 'Accurate, complete and contemporaneous records maintained securely.',
    category: 'Well-led',
    sortOrder: 29
  }
];

async function seedCompliance() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log('🌱 Starting compliance sections seeding...');

    // Check if sections already exist
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM complianceSections');
    if (existing[0].count > 0) {
      console.log('⚠️  Compliance sections already exist. Skipping seed.');
      return;
    }

    console.log('\\n📋 Seeding compliance sections...');
    for (const section of complianceSections) {
      await connection.query(
        'INSERT INTO complianceSections (code, name, description, category, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [section.code, section.name, section.description, section.category, section.sortOrder]
      );
      console.log(`  ✓ Added section: ${section.code} - ${section.name}`);
    }

    console.log('\\n✅ Compliance sections seeded successfully!');
    console.log(`\\nSummary:`);
    console.log(`  - ${complianceSections.length} compliance sections added`);
    console.log(`\\nCategories:`);
    console.log(`  - Safe: ${complianceSections.filter(s => s.category === 'Safe').length} sections`);
    console.log(`  - Effective: ${complianceSections.filter(s => s.category === 'Effective').length} sections`);
    console.log(`  - Caring: ${complianceSections.filter(s => s.category === 'Caring').length} sections`);
    console.log(`  - Responsive: ${complianceSections.filter(s => s.category === 'Responsive').length} sections`);
    console.log(`  - Well-led: ${complianceSections.filter(s => s.category === 'Well-led').length} sections`);

  } catch (error) {
    console.error('❌ Error seeding compliance sections:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedCompliance();
