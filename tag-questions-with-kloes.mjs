import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load questions
const questions = JSON.parse(fs.readFileSync('/home/ubuntu/questions.json', 'utf8'));

// CQC KLOEs
const KLOES = {
  safe: [
    { value: "safe_safeguarding", label: "Safe: Safeguarding and protection from abuse" },
    { value: "safe_managing_risks", label: "Safe: Managing risks" },
    { value: "safe_staff_cover", label: "Safe: Suitable staff and staff cover" },
    { value: "safe_medicines", label: "Safe: Medicines management" },
    { value: "safe_infection_control", label: "Safe: Infection control" },
    { value: "safe_learning", label: "Safe: Learning when things go wrong" },
  ],
  effective: [
    { value: "effective_assessing_needs", label: "Effective: Assessing needs and delivering evidence-based treatment" },
    { value: "effective_staff_skills", label: "Effective: Staff skills and knowledge" },
    { value: "effective_nutrition", label: "Effective: Nutrition and hydration" },
    { value: "effective_working_together", label: "Effective: How staff, teams and services work together" },
    { value: "effective_healthier_lives", label: "Effective: Supporting people to live healthier lives" },
    { value: "effective_accessible_premises", label: "Effective: Accessible premises" },
    { value: "effective_consent", label: "Effective: Consent to care and treatment" },
  ],
  caring: [
    { value: "caring_kindness", label: "Caring: Kindness, respect and compassion" },
    { value: "caring_involving_people", label: "Caring: Involving people in decisions about their care" },
    { value: "caring_privacy", label: "Caring: Privacy and dignity" },
  ],
  responsive: [
    { value: "responsive_person_centred", label: "Responsive: Person-centred care" },
    { value: "responsive_complaints", label: "Responsive: Concerns and complaints" },
    { value: "responsive_end_of_life", label: "Responsive: End of life care" },
  ],
  well_led: [
    { value: "well_led_vision", label: "Well-led: Vision and strategy" },
    { value: "well_led_governance", label: "Well-led: Governance and management" },
    { value: "well_led_engagement", label: "Well-led: Engagement and involvement" },
    { value: "well_led_learning", label: "Well-led: Learning, improvement and innovation" },
    { value: "well_led_partnership", label: "Well-led: Working in partnership" },
  ]
};

const allKloes = Object.values(KLOES).flat();

// Process questions in batches
const BATCH_SIZE = 20;
const results = [];

console.error(`Processing ${questions.length} questions in batches of ${BATCH_SIZE}...`);

for (let i = 0; i < questions.length; i += BATCH_SIZE) {
  const batch = questions.slice(i, i + BATCH_SIZE);
  console.error(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)}...`);
  
  const prompt = `You are a CQC (Care Quality Commission) compliance expert. Your task is to map audit questions to the appropriate CQC Key Lines of Enquiry (KLOEs).

Available KLOEs:
${allKloes.map(k => `- ${k.value}: ${k.label}`).join('\n')}

For each question below, determine which KLOE(s) it relates to. A question can relate to multiple KLOEs. Return ONLY a JSON array with objects containing "id" and "kloes" (comma-separated KLOE values).

Questions:
${batch.map(q => `ID ${q.id}: ${q.questionText} (Section: ${q.sectionTitle}, Audit: ${q.auditTypeName})`).join('\n\n')}

Return format:
[{"id": 1, "kloes": "safe_medicines,effective_staff_skills"}, ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const batchResults = JSON.parse(jsonMatch[0]);
      results.push(...batchResults);
      console.error(`✓ Tagged ${batchResults.length} questions`);
    } else {
      console.error(`✗ Failed to parse response for batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    }
  } catch (error) {
    console.error(`✗ Error processing batch: ${error.message}`);
  }
  
  // Small delay to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log(JSON.stringify(results, null, 2));
console.error(`\n✓ Completed! Tagged ${results.length} questions`);
