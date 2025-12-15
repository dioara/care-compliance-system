import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Section 1 correct order based on seed file
const section1Order = [
  { num: '1.1', text: "There is evidence that care and support files express individual" },
  { num: '1.2', text: "There is evidence that care, and support files have been written with involvement" },
  { num: '1.3', text: "The provider has a process in place to ensure that relevant documentation" },
  { num: '1.4', text: "There is evidence that care, and support files are available and accessible" },
  { num: '1.5', text: "There is evidence that care, and support files demonstrate privacy, dignity" },
  { num: '1.6', text: "People who use the service felt treated with dignity and respect" },
  { num: '1.7', text: "People were encouraged to maintain their independence" },
  { num: '1.8', text: "Staff can explain how people's dignity and privacy are respected" },
  { num: '1.9', text: "Observations confirmed people are given information in an appropriate way" },
  { num: '1.10', text: "People confirmed that they feel supported by staff to make informed decisions" },
  { num: '1.11', text: "People confirmed that they are supported to maintain relationships" },
  { num: '1.12', text: "Staff are observed to have positive and meaningful interactions" },
];

const [questions] = await conn.execute(
  'SELECT id, questionNumber, questionText FROM complianceQuestions WHERE sectionId = 1'
);

console.log(`Fixing Section 1 question numbers by text matching...\n`);

let updated = 0;
for (const expected of section1Order) {
  const match = questions.find(q => q.questionText.includes(expected.text));
  if (match && match.questionNumber !== expected.num) {
    await conn.execute(
      'UPDATE complianceQuestions SET questionNumber = ? WHERE id = ?',
      [expected.num, match.id]
    );
    console.log(`${match.questionNumber} → ${expected.num}: ${expected.text.substring(0, 50)}...`);
    updated++;
  } else if (!match) {
    console.log(`⚠️  No match found for: ${expected.text.substring(0, 50)}...`);
  }
}

console.log(`\nUpdated ${updated} questions in Section 1`);

await conn.end();
