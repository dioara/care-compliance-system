/**
 * AI Analysis Service for Care Plans and Care Notes
 * Uses exact prompts from the requirements document
 */

import OpenAI from 'openai';
import { anonymizeText, anonymizeSpecificName } from './anonymization';

interface CareNoteAnalysisResult {
  [noteId: string]: {
    length_detail_score: number;
    person_centred_score: number;
    professional_language_score: number;
    outcome_focused_score: number;
    evidence_based_score: number;
    language_issues: Array<{
      problematic_text: string;
      explanation: string;
      use_instead: string;
    }>;
    whats_missing: string[];
    positive_aspects: string[];
    improved_version: string;
    carer_feedback: string;
  };
}

interface CarePlanAnalysisResult {
  compliance_score: number;
  area_coverage: {
    area: string;
    status: 'present' | 'partial' | 'missing';
    issues?: string;
  }[];
  problems: string[];
  enhanced_version: string;
  whats_missing: string[];
  cqc_requirements: string[];
  recommendations: string[];
}

/**
 * Analyze care notes using AI with ultra-pedantic CQC compliance checking
 */
export async function analyzeCareNotes(
  apiKey: string,
  notesText: string,
  serviceUserName: string,
  anonymise: boolean = true
): Promise<{
  analysis: CareNoteAnalysisResult;
  nameMappings?: Array<{ original: string; abbreviated: string }>;
}> {
  const openai = new OpenAI({ apiKey });

  // Anonymize if requested
  let processedText = notesText;
  let nameMappings;
  let clientName = serviceUserName;

  if (anonymise) {
    const anonymized = anonymizeSpecificName(notesText, serviceUserName);
    processedText = anonymized.anonymizedText;
    clientName = anonymized.abbreviation;
    
    // Also extract other names
    const fullAnonymization = anonymizeText(processedText);
    nameMappings = fullAnonymization.nameMappings;
    processedText = fullAnonymization.anonymizedText;
  }

  // Parse notes
  const notes = parseNotes(processedText);
  const numberOfNotes = notes.length;

  // Format notes for the prompt
  const notesFormatted = notes
    .map((note, index) => {
      return `---NOTE ${index}---
Date: ${note.date || 'Unknown'}
Carer: ${note.carer || 'Unknown'}
Text: "${note.text}"
Word Count: ${note.text.split(/\s+/).length}`;
    })
    .join('\n\n');

  const systemMessage = `You are a CQC compliance expert. Return ONLY valid JSON with properly escaped strings. No markdown.`;

  const userPrompt = `You are a CQC compliance expert. Analyze ALL ${numberOfNotes} care notes for ${clientName} in EXTREME DETAIL.

${notesFormatted}

For EACH note, provide comprehensive analysis in JSON format. Return a JSON object where keys are note_id (as strings) and values contain:

1. **length_detail_score** (0-100): Based on word count and detail level
2. **person_centred_score** (0-100): Focus on person's experience, choices, preferences
3. **professional_language_score** (0-100): Avoids vague terms, power language, passive voice
4. **outcome_focused_score** (0-100): Describes outcomes, not just tasks
5. **evidence_based_score** (0-100): Includes specific observations, mood, engagement
6. **language_issues**: Array of objects with:
   - problematic_text: Exact phrase from note (escape quotes properly)
   - explanation: Why problematic for CQC
   - use_instead: Specific alternative (use ${clientName} not [name])
7. **whats_missing**: Array of SPECIFIC CQC requirements missing:
   - "Details on ${clientName}'s mood and engagement during the visit"
   - "Information on choices offered (e.g., what to wear, eat, drink)"
   - "Description of how dignity and respect were maintained"
   - "Details about hydration (e.g., water kept within reach, drinks offered)"
   - "Comfort measures taken (e.g., positioning, temperature, lighting)"
   - "Safety observations (e.g., call bell within reach, environment check)"
   - "Outcome-focused information (how ${clientName} responded to care)"
   - "Evidence of person-centred approach (preferences respected)"
8. **positive_aspects**: Array of what's good
9. **improved_version**: COMPLETE rewrite (150-200 words) that:
   - Fixes ALL language issues
   - Adds ALL missing elements
   - Uses ${clientName}'s name
   - Is CQC compliant and ready to copy/paste
10. **carer_feedback**: Personalized feedback formatted as:
Hi [carer_name], this note needs improvement for CQC compliance (Score: XX%):

What's good:
• [positive aspect]

Language issues to fix:
1. Don't use '[phrase]' - [explanation]
   Instead say: '[alternative]'

What to add:
1. [instruction]

Please see the rewritten example above and use this style in future notes.

IMPORTANT: Return ONLY valid JSON. Escape all quotes in strings properly. No markdown formatting.

Example: {"0": {"length_detail_score": 50, "language_issues": [{"problematic_text": "met fine", "explanation": "vague", "use_instead": "greeted warmly"}]}}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    
    // Clean markdown if present
    let cleanedText = resultText;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json?\s*/, '');
      cleanedText = cleanedText.replace(/\s*```$/, '');
    }

    const analysis = JSON.parse(cleanedText) as CareNoteAnalysisResult;

    return {
      analysis,
      nameMappings: anonymise ? nameMappings : undefined,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error(`Failed to analyze care notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze care plan section using AI with zero tolerance for vagueness
 */
export async function analyzeCarePlan(
  apiKey: string,
  content: string,
  serviceUserName: string = '',
  anonymise: boolean = true
): Promise<{
  analysis: CarePlanAnalysisResult;
  nameMappings?: Array<{ original: string; abbreviated: string }>;
}> {
  const openai = new OpenAI({ apiKey });

  // Anonymize if requested
  let processedContent = content;
  let nameMappings;
  const clientName = serviceUserName || 'the service user';

  if (anonymise) {
    const anonymized = anonymizeText(content);
    processedContent = anonymized.anonymizedText;
    nameMappings = anonymized.nameMappings;
  }

  const systemMessage = `You are an ultra-pedantic CQC compliance expert with zero tolerance for vagueness. Analyze care plans with the scrutiny of a council improvement officer conducting a critical inspection.`;

  const userPrompt = `You are an ultra-pedantic CQC compliance expert. Analyze this care plan for ${clientName} with ZERO TOLERANCE for vagueness or missing information.

**Current Content**:
${processedContent}

**Service User Name**: ${clientName}

Provide comprehensive analysis in JSON format with these fields:

1. **compliance_score** (0-100): Rate the care plan's overall CQC compliance
   - Deduct heavily for vague language, missing specifics, or generic content
   - Deduct for missing CQC-required areas
   - 85+ only if truly excellent with no issues

2. **area_coverage**: Array of objects checking CQC-required care plan areas:
   For EACH of these essential areas, provide:
   - **area**: Name of the CQC-required area
   - **status**: 'present' (adequately covered), 'partial' (mentioned but inadequate), or 'missing' (not addressed)
   - **issues**: If partial or missing, explain what's inadequate or absent
   
   Essential CQC Care Plan Areas to check:
   - Personal Care & Hygiene
   - Nutrition & Hydration
   - Mobility & Positioning
   - Communication Needs
   - Mental Health & Wellbeing
   - Social Needs & Activities
   - Medication Management
   - Health Conditions & Monitoring
   - Risk Assessments
   - End of Life Wishes (if applicable)
   - Cultural & Religious Needs
   - Capacity & Consent

3. **problems**: Array of NUMBERED specific problems found:
   - Quote the exact problematic text
   - Explain WHY it's problematic for CQC
   - Be ultra-specific about what's wrong
   - Example: "1. '${clientName} likes to be comfortable' - This is vague and subjective. What specifically makes ${clientName} comfortable? Temperature preferences? Pillow positioning? Lighting levels?"

4. **enhanced_version**: COMPLETE rewrite of the ENTIRE care plan that:
   - Fixes ALL problems identified
   - Uses ${clientName}'s actual name (not generic examples)
   - Adds specific details, measurements, preferences
   - Includes times, frequencies, methods
   - Uses professional CQC-compliant language
   - Is 2-3x longer than original with rich detail
   - Ready to copy/paste into care plan

5. **whats_missing**: Array of specific elements that should be added:
   - Be ultra-specific about what information is absent
   - Example: "Specific temperature preferences (e.g., room at 21°C, warm blanket)"
   - Example: "Exact positioning details (e.g., two pillows, left side preferred)"

6. **cqc_requirements**: Array of specific CQC requirements this care plan must meet:
   - Quote relevant CQC fundamental standards
   - Explain how current content fails to meet them
   - Example: "CQC Fundamental Standard 9 (Person-centred care) requires documenting individual preferences in detail, not generic statements"

7. **recommendations**: Array of specific actionable improvements:
   - Be prescriptive about what to add/change
   - Example: "Interview ${clientName} to document: (1) preferred wake-up time, (2) breakfast preferences with specific examples, (3) morning routine step-by-step"

Return ONLY valid JSON. No markdown formatting.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    
    // Clean markdown if present
    let cleanedText = resultText;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json?\s*/, '');
      cleanedText = cleanedText.replace(/\s*```$/, '');
    }

    const analysis = JSON.parse(cleanedText) as CarePlanAnalysisResult;

    return {
      analysis,
      nameMappings: anonymise ? nameMappings : undefined,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error(`Failed to analyze care plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse care notes text into structured format
 * Supports multiple formats:
 * - ---NOTE X--- markers
 * - One note per line
 * - Structured with Date/Carer/Text fields
 */
function parseNotes(text: string): Array<{
  date?: string;
  carer?: string;
  text: string;
}> {
  // Try to parse with ---NOTE--- markers first
  if (text.includes('---NOTE')) {
    const noteBlocks = text.split(/---NOTE\s+\d+---/);
    return noteBlocks
      .slice(1) // Skip first empty element
      .map(block => {
        const dateMatch = block.match(/Date:\s*(.+)/);
        const carerMatch = block.match(/Carer:\s*(.+)/);
        const textMatch = block.match(/Text:\s*"?(.+?)"?\s*(?:Word Count:|$)/s);

        return {
          date: dateMatch?.[1]?.trim(),
          carer: carerMatch?.[1]?.trim(),
          text: textMatch?.[1]?.trim() || block.trim(),
        };
      })
      .filter(note => note.text);
  }

  // Otherwise, split by newlines (one note per line)
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => ({
      text: line,
    }));
}
