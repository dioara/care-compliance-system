/**
 * Per-Section Ultra-Pedantic Analysis
 * Analyzes individual care plan sections in extreme detail
 */

import OpenAI from 'openai';
import type { CarePlanSection } from './care-plan-parser';

export interface SectionAnalysisIssue {
  issue_number: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  field: string;
  current_text: string;
  problems_identified: string[];
  whats_missing: string[];
  ideal_example: string;
  cqc_requirement: string;
  recommendation: string;
}

export interface SectionAnalysisResult {
  section_name: string;
  section_score: number;
  extracted_content: {
    identified_need?: string;
    planned_outcomes?: string;
    how_to_achieve?: string;
    risk?: string;
    [key: string]: string | undefined;
  };
  metadata?: {
    next_review_date?: string;
    level_of_need?: string;
    [key: string]: string | undefined;
  };
  issues: SectionAnalysisIssue[];
}

/**
 * Analyze a single section with ultra-pedantic detail
 */
export async function analyzeSingleSection(
  apiKey: string,
  section: CarePlanSection,
  clientName: string
): Promise<SectionAnalysisResult> {
  const openai = new OpenAI({ apiKey });
  
  const systemMessage = `You are an ULTRA-PEDANTIC CQC compliance expert with ZERO TOLERANCE. Analyze with extreme scrutiny.`;
  
  const userPrompt = `You are an ULTRA-PEDANTIC CQC compliance expert. Analyze this SINGLE SECTION of a care plan for ${clientName} in EXTREME DETAIL.

**SECTION NAME**: ${section.section_name}

**SECTION CONTENT**:
${section.raw_content}

**YOUR TASK**:
Analyze EVERY FIELD in this section with ZERO TOLERANCE. Find 5-10+ specific problems per field.

**OUTPUT FORMAT** (JSON):
{
  "section_score": <number 0-100>,
  "issues": [
    {
      "issue_number": 1,
      "severity": "CRITICAL|MAJOR|MINOR",
      "field": "Identified Need|Planned Outcomes|How to Achieve|Risk|etc",
      "current_text": "<exact quote from section>",
      "problems_identified": [
        "1. <specific problem with detailed explanation>",
        "2. <specific problem with detailed explanation>",
        "3. <specific problem with detailed explanation>",
        "4. <specific problem with detailed explanation>",
        "5. <specific problem with detailed explanation>",
        "... (5-10+ problems)"
      ],
      "whats_missing": [
        "<missing element 1 with explanation>",
        "<missing element 2 with explanation>",
        "<missing element 3 with explanation>",
        "... (multiple missing elements)"
      ],
      "ideal_example": "<COMPLETE rewritten version 150-300 words showing EXACTLY how it should be written with all required elements>",
      "cqc_requirement": "<specific CQC regulation reference with number>",
      "recommendation": "<clear specific action to take>"
    }
  ]
}

**CRITICAL REQUIREMENTS**:

1. **ANALYZE THESE FIELDS** (if present in section):
   - **Identified Need**: Must be first-person ("I need..."), explain WHY, describe abilities vs needs, explain impact, include personal significance
   - **Planned Outcomes**: Must be SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
   - **How to Achieve**: Must specify WHO, WHEN, WHERE, HOW, WHAT, SAFETY, PREFERENCES
   - **Risk**: Must include detailed description, contributing factors, tiered consequences (immediate/short/medium/worst-case), impact, current mitigations, monitoring plan, risk scoring

2. **FIND 5-10+ PROBLEMS PER FIELD**. Examples:
   - Third person instead of first person
   - Missing WHY explanation
   - Vague language ("as needed" instead of specific times)
   - Missing SMART criteria
   - No measurable outcomes
   - Missing safety considerations
   - No risk scoring
   - Missing personal significance
   - Generic content
   - Missing time frames
   - Incomplete WHO/WHEN/WHERE/HOW/WHAT
   - Missing monitoring plan
   - No consequences described
   - Passive voice
   - Assumptions without evidence

3. **PROVIDE COMPLETE IDEAL EXAMPLES** (150-300 words each):
   - First-person language throughout
   - All required elements (WHO/WHEN/WHERE/HOW/WHAT/SAFETY/PREFERENCES)
   - Specific details from the care plan
   - SMART goals with measurable criteria
   - Time frames and review dates
   - Risk scoring with justification (Likelihood x Impact = Score)
   - Personal significance and impact
   - Professional CQC-compliant language
   - Ready to copy and paste

4. **CQC REGULATIONS TO REFERENCE**:
   - Regulation 9: Person-centred care
   - Regulation 9(3)(a): Care must reflect service user's preferences
   - Regulation 9(3)(c): Care plans must specify in detail how needs will be met
   - Regulation 12: Safe care and treatment
   - Regulation 12(2)(a): Must do all reasonably practicable to mitigate risks
   - Regulation 17: Good governance (accurate records)

5. **SEVERITY LEVELS**:
   - **CRITICAL**: Immediate safety risk, complete absence of required information, fundamental CQC non-compliance
   - **MAJOR**: Significant gaps, vague language, missing key elements, non-SMART goals, inadequate risk assessment
   - **MINOR**: Minor wording issues, could be more specific, formatting issues

6. **SCORING**:
   - Section score: 100% only if NO issues found
   - Deduct 5-10 points per MAJOR issue
   - Deduct 15-20 points per CRITICAL issue
   - Deduct 1-3 points per MINOR issue
   - Be harsh - zero tolerance approach

Return ONLY valid JSON. No markdown, no explanations outside the JSON structure.`;

  try {
    console.log(`[Section Analyzer] Analyzing section: ${section.section_name}`);
    console.log(`[Section Analyzer] Content length: ${section.raw_content.length} characters`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000, // Enough for detailed single-section analysis
      response_format: { type: 'json_object' },
    });
    
    console.log(`[Section Analyzer] Analysis complete for: ${section.section_name}`);
    console.log(`[Section Analyzer] Token usage:`, response.usage);
    
    const resultText = response.choices[0]?.message?.content || '{}';
    const parsedResult = JSON.parse(resultText);
    
    // Construct full result with section metadata
    const result: SectionAnalysisResult = {
      section_name: section.section_name,
      section_score: parsedResult.section_score || 0,
      extracted_content: section.fields,
      metadata: section.metadata,
      issues: parsedResult.issues || [],
    };
    
    console.log(`[Section Analyzer] Section score: ${result.section_score}%`);
    console.log(`[Section Analyzer] Issues found: ${result.issues.length}`);
    
    return result;
    
  } catch (error) {
    console.error(`[Section Analyzer] ERROR analyzing section: ${section.section_name}`);
    console.error('[Section Analyzer] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
