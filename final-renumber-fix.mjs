import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Final renumbering - sorting by section.question as integers...\n');

// Get all sections
const [sections] = await conn.execute(
  'SELECT DISTINCT sectionId FROM complianceQuestions ORDER BY sectionId'
);

let totalUpdated = 0;

for (const { sectionId } of sections) {
  // Get all questions for this section
  const [questions] = await conn.execute(
    'SELECT id, questionNumber, questionText FROM complianceQuestions WHERE sectionId = ?',
    [sectionId]
  );

  // Sort by parsing both parts as integers: "1.10" -> [1, 10], "1.2" -> [1, 2]
  questions.sort((a, b) => {
    const [secA, qA] = a.questionNumber.split('.').map(Number);
    const [secB, qB] = b.questionNumber.split('.').map(Number);
    if (secA !== secB) return secA - secB;
    return qA - qB;  // This makes 1.2 come before 1.10
  });

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
      const preview = questions[i].questionText.substring(0, 50);
      console.log(`  ${oldNumber} → ${newNumber}: ${preview}...`);
      totalUpdated++;
    }
  }
}

console.log(`\n✅ Total questions renumbered: ${totalUpdated}`);

await conn.end();
