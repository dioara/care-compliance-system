import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Exporting all service user questions...');

// Get all service user questions
const [questions] = await connection.execute(`
  SELECT 
    cq.id,
    cs.sectionNumber,
    cq.questionNumber,
    cq.questionText,
    cq.standardDescription,
    cq.guidance
  FROM complianceQuestions cq
  JOIN complianceSections cs ON cq.sectionId = cs.id
  WHERE cs.sectionType = 'service_user'
  ORDER BY cs.sectionNumber, cq.questionNumber
`);

console.log(`Found ${questions.length} service user questions`);

// Clean and improve each question
const cleanedQuestions = questions.map(q => {
  let standardDesc = q.standardDescription || '';
  let guidance = q.guidance || '';
  
  // Remove NYCC-specific references
  standardDesc = standardDesc
    .replace(/North Yorkshire Council.*?expectation/gi, 'Best practice expectation')
    .replace(/NYC|NYCC/g, 'the local authority')
    .replace(/we would expect/gi, 'expected')
    .replace(/we would recommend/gi, 'recommended')
    .replace(/we could not evidence/gi, 'there was no evidence')
    .replace(/we evidenced/gi, 'evidence shows')
    .replace(/at the time of assessment/gi, 'on review')
    .replace(/The provider/g, 'The service')
    .replace(/Registered Manager|RM/g, 'manager');
  
  // Remove truncated sentences (ending with incomplete words)
  if (standardDesc.length > 0 && !standardDesc.match(/[.!?]$/)) {
    // If it doesn't end with punctuation, it's likely truncated - make it generic
    const firstSentence = standardDesc.split(/[.!?]/)[0];
    if (firstSentence.length > 50) {
      standardDesc = 'Evidence required: ' + firstSentence.substring(0, 100) + '...';
    } else {
      standardDesc = '';
    }
  }
  
  // If standardDescription is empty or too short, use guidance as basis
  if (!standardDesc || standardDesc.length < 20) {
    if (guidance && guidance.length > 20) {
      standardDesc = guidance;
    }
  }
  
  // Ensure guidance is clear and not just a repeat
  if (guidance === standardDesc || guidance.length < 20) {
    // Generate generic guidance from question text
    const questionLower = q.questionText.toLowerCase();
    if (questionLower.includes('evidence')) {
      guidance = q.questionText.replace(/^There is evidence that /i, '')
        .replace(/^There is evidence of /i, '')
        .replace(/\.$/, '') + ' documented on file.';
    } else {
      guidance = q.questionText;
    }
  }
  
  // Ensure British English
  standardDesc = standardDesc
    .replace(/organization/gi, 'organisation')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\blabor\b/gi, 'labour');
  
  guidance = guidance
    .replace(/organization/gi, 'organisation')
    .replace(/\bcenter\b/gi, 'centre')
    .replace(/\bfavor\b/gi, 'favour')
    .replace(/\blabor\b/gi, 'labour');
  
  return {
    ...q,
    standardDescription: standardDesc.trim(),
    guidance: guidance.trim()
  };
});

// Save to JSON for review
fs.writeFileSync(
  '/home/ubuntu/service-user-questions-cleaned.json',
  JSON.stringify(cleanedQuestions, null, 2)
);

console.log('Cleaned questions saved to /home/ubuntu/service-user-questions-cleaned.json');

// Update database with cleaned questions
console.log('Updating database with cleaned questions...');
let updateCount = 0;

for (const q of cleanedQuestions) {
  await connection.execute(
    `UPDATE complianceQuestions 
     SET standardDescription = ?, guidance = ?
     WHERE id = ?`,
    [q.standardDescription, q.guidance, q.id]
  );
  updateCount++;
}

console.log(`Updated ${updateCount} questions in database`);

await connection.end();
console.log('Service user questions cleaned successfully!');
