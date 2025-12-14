import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get all sections with their questions
  const [sections] = await connection.execute(
    'SELECT id, sectionNumber, sectionType FROM complianceSections ORDER BY sectionType, sectionNumber'
  );

  for (const section of sections) {
    // Get all questions for this section
    const [questions] = await connection.execute(
      'SELECT id FROM complianceQuestions WHERE sectionId = ? ORDER BY id',
      [section.id]
    );

    // Renumber questions: 1.1, 1.2, 1.3, etc.
    for (let i = 0; i < questions.length; i++) {
      const newQuestionNumber = `${section.sectionNumber}.${i + 1}`;
      await connection.execute(
        'UPDATE complianceQuestions SET questionNumber = ? WHERE id = ?',
        [newQuestionNumber, questions[i].id]
      );
    }

    console.log(`✓ Renumbered ${questions.length} questions for Section ${section.sectionNumber} (${section.sectionType})`);
  }

  console.log('\n✅ All questions renumbered successfully!');
} catch (error) {
  console.error('Error:', error);
} finally {
  await connection.end();
}
