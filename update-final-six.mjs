import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Updating final 6 questions with detailed evidence requirements...\n');

// Evidence mappings for the final 6 questions
const evidenceMappings = {
  '4.10': {
    evidenceReq: 'Observation records or quality monitoring notes documenting mealtime experience including: dining environment, staff interaction, support provided, use of adaptive equipment, and service user engagement.',
    exampleEvid: 'Mealtime observation form noting: calm and unhurried atmosphere, appropriate music/noise levels, staff sitting with service users during meals, use of adapted cutlery/crockery where needed, show plates used for choice, table settings appropriate, staff promoting independence whilst offering assistance as needed, positive interactions and conversation during meals.'
  },
  '5.5': {
    evidenceReq: 'Training programme documentation showing variety of learning methods used including: classroom sessions, e-learning modules, practical skills training, face-to-face coaching, and reflective practice opportunities.',
    exampleEvid: 'Training records showing: mix of delivery methods (classroom training dates, e-learning completion certificates, practical skills sessions with competency sign-off, shadowing/mentoring records, reflective practice sessions in supervision), learning styles accommodated, blended approach ensuring knowledge retention and skill application, accessibility considerations for different learning needs.'
  },
  '5.6': {
    evidenceReq: 'Training needs analysis process documentation showing: individual staff training needs identified, organisational training priorities, service user needs driving training requirements, and regulatory compliance training identified.',
    exampleEvid: 'Training needs analysis documentation containing: annual training needs analysis process, individual staff development plans identifying personal training needs, organisational training priorities based on service user population (dementia care, diabetes management, end of life care), regulatory requirements mapped (CQC fundamental standards, mandatory training), supervision discussions identifying training needs, incident/audit findings driving training requirements.'
  },
  '5.7': {
    evidenceReq: 'Training effectiveness evaluation records showing: post-training assessments, competency checks, observations of practice applying learning, and feedback from staff and service users on training impact.',
    exampleEvid: 'Training evaluation evidence showing: post-training knowledge tests/quizzes, competency assessments (observed practice applying training), supervision discussions reviewing application of learning, care observations showing improved practice, staff feedback on training usefulness, service user/family feedback on care improvements, re-audit showing improvements following training, training impact measured (reduced incidents, improved audit scores).'
  },
  '5.8': {
    evidenceReq: 'Professional development records showing: staff accessing qualifications beyond mandatory training, support provided for career development, specialist training opportunities, and leadership development programmes.',
    exampleEvid: 'Professional development evidence showing: staff enrolled on NVQ/diploma qualifications (Level 2, 3, 5 in Health and Social Care), leadership and management development programmes, specialist training (dementia champion, end of life care, mental health first aid), apprenticeship programmes, study leave granted, financial support for qualifications, career progression pathways, continuing professional development for registered professionals.'
  },
  '5.9': {
    evidenceReq: 'Staff feedback on induction quality through: induction evaluation forms, probationary reviews, supervision discussions, and staff survey responses on induction preparedness.',
    exampleEvid: 'Induction feedback documentation showing: staff induction evaluation forms completed (rating induction quality, preparedness for role), probationary review discussions about induction effectiveness, supervision notes recording staff confidence following induction, staff survey responses on induction experience, new starter feedback (\"induction prepared me well\", \"felt supported during induction\"), evidence of induction improvements based on feedback.'
  }
};

// Get the 6 questions that need updating
const [questions] = await connection.execute(
  `SELECT id, questionNumber FROM complianceQuestions 
   WHERE questionNumber IN ('4.10', '5.5', '5.6', '5.7', '5.8', '5.9')
   ORDER BY questionNumber`
);

let updated = 0;

for (const question of questions) {
  const mapping = evidenceMappings[question.questionNumber];
  
  if (mapping && mapping.evidenceReq && mapping.exampleEvid) {
    await connection.execute(
      'UPDATE complianceQuestions SET evidenceRequirement = ?, exampleEvidence = ? WHERE id = ?',
      [mapping.evidenceReq, mapping.exampleEvid, question.id]
    );
    updated++;
    console.log(`✓ Updated ${question.questionNumber}`);
  }
}

console.log(`\n✅ Final update complete!`);
console.log(`   Updated: ${updated} questions`);

await connection.end();
