import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Fixing question numbers (v2) - sorting by ID (creation order)...\n');

// Get all sections
const [sections] = await conn.execute(
  'SELECT DISTINCT sectionId FROM complianceQuestions ORDER BY sectionId'
);

let totalUpdated = 0;

for (const { sectionId } of sections) {
  // Get all questions for this section, ordered by ID (creation order)
  const [questions] = await conn.execute(
    'SELECT id, questionNumber FROM complianceQuestions WHERE sectionId = ? ORDER BY id',
    [sectionId]
  );

  console.log(`Section ${sectionId}: ${questions.length} questions`);

  // Renumber sequentially
  for (let i = 0; i < questions.length; i++) {
    const newNumber = `${sectionId}.${i + 1}`;
    const oldNumber = questions[i].questionNumber;

    if (oldNumber !== newNumber) {
      await conn.execute(
        'UPDATE complianceQuestions SET questionNumber = ? WHERE id = ?',
        [newNumber, questions[i].id]
      );
      console.log(`  ${oldNumber} → ${newNumber} (ID: ${questions[i].id})`);
      totalUpdated++;
    }
  }
}

console.log(`\nTotal questions renumbered: ${totalUpdated}`);

await conn.end();
