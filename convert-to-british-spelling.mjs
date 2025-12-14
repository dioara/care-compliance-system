import mysql from 'mysql2/promise';
import 'dotenv/config';

async function convertToBritishSpelling() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Converting American spellings to British spellings...\n');
    
    // Define spelling conversions
    const conversions = [
      { from: 'organization', to: 'organisation' },
      { from: 'Organization', to: 'Organisation' },
      { from: 'analyzed', to: 'analysed' },
      { from: 'analyze', to: 'analyse' },
      { from: 'Analyze', to: 'Analyse' },
      { from: 'recognize', to: 'recognise' },
      { from: 'Recognize', to: 'Recognise' },
      { from: 'person-centered', to: 'person-centred' },
      { from: 'Person-centered', to: 'Person-centred' },
      { from: 'centered', to: 'centred' },
      { from: 'Centered', to: 'Centred' },
      { from: 'center', to: 'centre' },
      { from: 'Center', to: 'Centre' },
      { from: 'behavior', to: 'behaviour' },
      { from: 'Behavior', to: 'Behaviour' },
      { from: 'favor', to: 'favour' },
      { from: 'Favor', to: 'Favour' },
      { from: 'labor', to: 'labour' },
      { from: 'Labor', to: 'Labour' },
      { from: 'honor', to: 'honour' },
      { from: 'Honor', to: 'Honour' },
      { from: 'neighbor', to: 'neighbour' },
      { from: 'Neighbor', to: 'Neighbour' },
      { from: 'theater', to: 'theatre' },
      { from: 'Theater', to: 'Theatre' },
      { from: 'specialize', to: 'specialise' },
      { from: 'Specialize', to: 'Specialise' },
      { from: 'specialized', to: 'specialised' },
      { from: 'Specialized', to: 'Specialised' },
      // License as noun (keep "license" as verb)
      { from: 'driving license', to: 'driving licence' },
      { from: 'Driving license', to: 'Driving licence' },
      { from: 'DBS license', to: 'DBS licence' },
      { from: 'license and insura', to: 'licence and insura' },
    ];
    
    // Update complianceQuestions table
    console.log('Updating compliance questions...');
    for (const conv of conversions) {
      const [result] = await conn.execute(
        `UPDATE complianceQuestions 
         SET questionText = REPLACE(questionText, ?, ?),
             standardDescription = REPLACE(standardDescription, ?, ?),
             guidance = REPLACE(guidance, ?, ?)
         WHERE questionText LIKE ? 
            OR standardDescription LIKE ?
            OR guidance LIKE ?`,
        [
          conv.from, conv.to,
          conv.from, conv.to,
          conv.from, conv.to,
          `%${conv.from}%`,
          `%${conv.from}%`,
          `%${conv.from}%`
        ]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ Replaced "${conv.from}" → "${conv.to}" in ${result.affectedRows} question(s)`);
      }
    }
    
    // Update complianceSections table
    console.log('\nUpdating compliance sections...');
    for (const conv of conversions) {
      const [result] = await conn.execute(
        `UPDATE complianceSections 
         SET sectionName = REPLACE(sectionName, ?, ?),
             description = REPLACE(description, ?, ?),
             tooltip = REPLACE(tooltip, ?, ?)
         WHERE sectionName LIKE ? 
            OR description LIKE ?
            OR tooltip LIKE ?`,
        [
          conv.from, conv.to,
          conv.from, conv.to,
          conv.from, conv.to,
          `%${conv.from}%`,
          `%${conv.from}%`,
          `%${conv.from}%`
        ]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ Replaced "${conv.from}" → "${conv.to}" in ${result.affectedRows} section(s)`);
      }
    }
    
    // Update auditTypes table
    console.log('\nUpdating audit types...');
    for (const conv of conversions) {
      const [result] = await conn.execute(
        `UPDATE auditTypes 
         SET auditName = REPLACE(auditName, ?, ?),
             description = REPLACE(description, ?, ?),
             tooltip = REPLACE(tooltip, ?, ?)
         WHERE auditName LIKE ? 
            OR description LIKE ?
            OR tooltip LIKE ?`,
        [
          conv.from, conv.to,
          conv.from, conv.to,
          conv.from, conv.to,
          `%${conv.from}%`,
          `%${conv.from}%`,
          `%${conv.from}%`
        ]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ Replaced "${conv.from}" → "${conv.to}" in ${result.affectedRows} audit type(s)`);
      }
    }
    
    console.log('\n✅ Conversion complete!');
    
  } catch (error) {
    console.error('Error converting spellings:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

convertToBritishSpelling();
