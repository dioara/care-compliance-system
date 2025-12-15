import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Fixing question numbers to be sequential within each section...\n');

// Get all sections
const [sections] = await conn.execute(
  'SELECT DISTINCT sectionId FROM complianceQuestions ORDER BY sectionId'
);

let totalUpdated = 0;

for (const { sectionId } of sections) {
  // Get all questions for this section, ordered by current questionNumber
  const [questions] = await conn.execute(
    'SELECT id, questionNumber FROM complianceQuestions WHERE sectionId = ? ORDER BY questionNumber',
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
      console.log(`  Updated ${oldNumber} → ${newNumber}`);
      totalUpdated++;
    }
  }
}

console.log(`\nTotal questions renumbered: ${totalUpdated}`);

await conn.end();
