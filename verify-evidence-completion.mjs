import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get total question count
const [totalResult] = await conn.execute(
  'SELECT COUNT(*) as total FROM complianceQuestions WHERE questionNumber != "No."'
);
const total = totalResult[0].total;

// Get count with evidence requirements
const [withEvidenceResult] = await conn.execute(
  'SELECT COUNT(*) as withEvidence FROM complianceQuestions WHERE evidenceRequirement IS NOT NULL AND evidenceRequirement != "" AND questionNumber != "No."'
);
const withEvidence = withEvidenceResult[0].withEvidence;

// Get count without evidence requirements
const [withoutEvidenceResult] = await conn.execute(
  'SELECT COUNT(*) as withoutEvidence FROM complianceQuestions WHERE (evidenceRequirement IS NULL OR evidenceRequirement = "") AND questionNumber != "No."'
);
const withoutEvidence = withoutEvidenceResult[0].withoutEvidence;

// Get breakdown by section type
const [staffResult] = await conn.execute(`
  SELECT COUNT(*) as count 
  FROM complianceQuestions q
  JOIN complianceSections s ON q.sectionId = s.id
  WHERE s.sectionType = 'staff' 
  AND q.evidenceRequirement IS NOT NULL 
  AND q.evidenceRequirement != ""
  AND q.questionNumber != "No."
`);
const staffWithEvidence = staffResult[0].count;

const [serviceUserResult] = await conn.execute(`
  SELECT COUNT(*) as count 
  FROM complianceQuestions q
  JOIN complianceSections s ON q.sectionId = s.id
  WHERE s.sectionType = 'service_user' 
  AND q.evidenceRequirement IS NOT NULL 
  AND q.evidenceRequirement != ""
  AND q.questionNumber != "No."
`);
const serviceUserWithEvidence = serviceUserResult[0].count;

console.log('=== EVIDENCE REQUIREMENTS COMPLETION STATUS ===\n');
console.log(`Total Questions: ${total}`);
console.log(`Questions WITH Evidence: ${withEvidence} (${((withEvidence/total)*100).toFixed(1)}%)`);
console.log(`Questions WITHOUT Evidence: ${withoutEvidence} (${((withoutEvidence/total)*100).toFixed(1)}%)`);
console.log('\nBreakdown by Type:');
console.log(`  Staff Questions with Evidence: ${staffWithEvidence}`);
console.log(`  Service User Questions with Evidence: ${serviceUserWithEvidence}`);

if (withoutEvidence > 0) {
  console.log('\n=== Questions Still Missing Evidence ===');
  const [missing] = await conn.execute(`
    SELECT q.questionNumber, q.questionText, s.sectionType, s.sectionNumber
    FROM complianceQuestions q
    JOIN complianceSections s ON q.sectionId = s.id
    WHERE (q.evidenceRequirement IS NULL OR q.evidenceRequirement = "")
    AND q.questionNumber != "No."
    ORDER BY s.sectionType, s.sectionNumber, q.questionNumber
  `);
  
  missing.forEach(q => {
    console.log(`${q.sectionType.toUpperCase()} Section ${q.sectionNumber}, Q${q.questionNumber}: ${q.questionText.substring(0, 80)}...`);
  });
} else {
  console.log('\n✅ ALL QUESTIONS HAVE EVIDENCE REQUIREMENTS!');
}

await conn.end();
