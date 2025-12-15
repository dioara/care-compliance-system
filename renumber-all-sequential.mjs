import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Renumbering ALL questions to be sequential...\n');

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

  // Sort by numeric part of questionNumber (parse "1.10" as 1.10, not string sort)
  questions.sort((a, b) => {
    const numA = parseFloat(a.questionNumber);
    const numB = parseFloat(b.questionNumber);
    return numA - numB;
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
      const preview = questions[i].questionText.substring(0, 60);
      console.log(`  ${oldNumber} → ${newNumber}: ${preview}...`);
      totalUpdated++;
    }
  }
}

console.log(`\n✅ Total questions renumbered: ${totalUpdated}`);

await conn.end();
