/**
 * OpenAI Service for AI Audits
 * 
 * Uses the customer's own OpenAI API key for document analysis.
 * Documents are anonymized before processing, and only feedback is stored.
 */

import OpenAI from "openai";

export interface CarePlanAuditResult {
  score: number; // 1-10
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  examples: string[];
  cqcComplianceNotes: string;
}

export interface DailyNotesAuditResult {
  score: number; // 1-10
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  examples: string[];
  professionalismNotes: string;
}

const CARE_PLAN_AUDIT_PROMPT = `You are an expert CQC (Care Quality Commission) inspector and care quality auditor in the UK. 
Analyze the following care plan document and provide a comprehensive quality audit.

Your analysis should evaluate:
1. Person-centredness - Does the plan reflect the individual's preferences, choices, and wishes?
2. Comprehensiveness - Are all care needs addressed with clear interventions?
3. Risk assessments - Are risks identified and management strategies documented?
4. Review dates - Are regular reviews scheduled and documented?
5. CQC compliance - Does it meet CQC fundamental standards?
6. Clarity - Is the language clear and professional?
7. Outcomes focus - Are measurable outcomes defined?

Provide your response in the following JSON format:
{
  "score": <number 1-10>,
  "strengths": ["strength 1", "strength 2", ...],
  "areasForImprovement": ["area 1", "area 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "examples": ["specific example from the document showing good/poor practice"],
  "cqcComplianceNotes": "Notes on CQC compliance status and any concerns"
}

Be specific and reference the document content where possible. Use initials when referring to the person (they have been anonymized for privacy).`;

const DAILY_NOTES_AUDIT_PROMPT = `You are an expert care quality auditor specializing in daily care documentation in UK care homes.
Analyze the following daily notes and provide a comprehensive quality audit.

Your analysis should evaluate:
1. Level of detail - Are activities, observations, and interactions well documented?
2. Person-centred language - Does it reflect the individual's perspective?
3. Professional tone - Is the language appropriate and professional?
4. Care plan implementation - Is there evidence of care plan being followed?
5. Changes in needs - Are any changes or concerns documented?
6. Timeliness - Are entries made at appropriate times?
7. Accuracy - Are facts clear and unambiguous?

Provide your response in the following JSON format:
{
  "score": <number 1-10>,
  "strengths": ["strength 1", "strength 2", ...],
  "areasForImprovement": ["area 1", "area 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "examples": ["specific example from the notes showing good/poor practice"],
  "professionalismNotes": "Notes on professional standards and documentation quality"
}

Be specific and reference the document content where possible. Use initials when referring to people (they have been anonymized for privacy).`;

/**
 * Analyze a care plan document using OpenAI
 */
export async function analyzeCarePlan(
  anonymizedText: string,
  apiKey: string
): Promise<CarePlanAuditResult> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: CARE_PLAN_AUDIT_PROMPT },
      { role: "user", content: `Please analyze this care plan:\n\n${anonymizedText}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower temperature for more consistent analysis
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const result = JSON.parse(content) as CarePlanAuditResult;
    // Validate the response structure
    if (typeof result.score !== 'number' || result.score < 1 || result.score > 10) {
      result.score = 5; // Default to middle score if invalid
    }
    result.strengths = result.strengths || [];
    result.areasForImprovement = result.areasForImprovement || [];
    result.recommendations = result.recommendations || [];
    result.examples = result.examples || [];
    result.cqcComplianceNotes = result.cqcComplianceNotes || "";
    
    return result;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

/**
 * Analyze daily notes using OpenAI
 */
export async function analyzeDailyNotes(
  anonymizedText: string,
  apiKey: string
): Promise<DailyNotesAuditResult> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: DAILY_NOTES_AUDIT_PROMPT },
      { role: "user", content: `Please analyze these daily notes:\n\n${anonymizedText}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const result = JSON.parse(content) as DailyNotesAuditResult;
    // Validate the response structure
    if (typeof result.score !== 'number' || result.score < 1 || result.score > 10) {
      result.score = 5;
    }
    result.strengths = result.strengths || [];
    result.areasForImprovement = result.areasForImprovement || [];
    result.recommendations = result.recommendations || [];
    result.examples = result.examples || [];
    result.professionalismNotes = result.professionalismNotes || "";
    
    return result;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`);
  }
}

/**
 * Validate an OpenAI API key by making a simple request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey });
    // Make a minimal request to validate the key
    await openai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}
