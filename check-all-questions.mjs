import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all unique question number prefixes
const [questions] = await conn.execute(`
  SELECT DISTINCT SUBSTRING_INDEX(questionNumber, '.', 1) as prefix, COUNT(*) as count
  FROM auditTemplateQuestions
  GROUP BY SUBSTRING_INDEX(questionNumber, '.', 1)
  ORDER BY CAST(SUBSTRING_INDEX(questionNumber, '.', 1) AS UNSIGNED)
`);

console.log('All question number prefixes:');
questions.forEach(q => {
  console.log(`Section ${q.prefix}: ${q.count} questions`);
});

// Get total questions
const [total] = await conn.execute(`SELECT COUNT(*) as total FROM auditTemplateQuestions`);
console.log(`\nTotal questions in database: ${total[0].total}`);

await conn.end();
