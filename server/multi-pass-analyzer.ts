/**
 * Multi-Pass Care Plan Analyzer
 * Orchestrates section-by-section analysis for comprehensive reports
 */

import { parseCarePlanIntoSections, validateSections, type CarePlanSection } from './care-plan-parser';
import { analyzeSingleSection, type SectionAnalysisResult } from './section-analyzer';

export interface MultiPassAnalysisResult {
  overall_score: number;
  summary: {
    sections_analyzed: number;
    critical_issues: number;
    major_issues: number;
    minor_issues: number;
  };
  sections: SectionAnalysisResult[];
  missing_sections: Array<{
    section_name: string;
    why_required: string;
    cqc_requirement: string;
  }>;
}

/**
 * CQC-required sections that should be present in care plans
 */
const REQUIRED_CQC_SECTIONS = [
  { name: 'Personal Care & Hygiene', why: 'Essential for dignity and health', regulation: 'Regulation 9 - Person-centred care' },
  { name: 'Nutrition & Hydration', why: 'Fundamental to health and wellbeing', regulation: 'Regulation 14 - Meeting nutritional needs' },
  { name: 'Mobility & Positioning', why: 'Prevents pressure sores and maintains independence', regulation: 'Regulation 12 - Safe care' },
  { name: 'Communication Needs', why: 'Ensures person can express needs and preferences', regulation: 'Regulation 9 - Person-centred care' },
  { name: 'Mental Health & Wellbeing', why: 'Holistic care includes emotional and psychological needs', regulation: 'Regulation 9 - Person-centred care' },
  { name: 'Social Needs & Activities', why: 'Prevents isolation and promotes quality of life', regulation: 'Regulation 9 - Person-centred care' },
  { name: 'Medication Management', why: 'Safe administration is a legal requirement', regulation: 'Regulation 12 - Safe care' },
  { name: 'Health Conditions & Monitoring', why: 'Ongoing health management required', regulation: 'Regulation 12 - Safe care' },
  { name: 'Risk Assessments', why: 'Legal requirement to assess and mitigate risks', regulation: 'Regulation 12(2)(a) - Risk assessment' },
];

/**
 * Perform multi-pass analysis of entire care plan
 */
export async function analyzeCarePlanMultiPass(
  apiKey: string,
  carePlanContent: string,
  serviceUserName: string
): Promise<MultiPassAnalysisResult> {
  console.log('[Multi-Pass Analyzer] Starting multi-pass analysis');
  console.log('[Multi-Pass Analyzer] Content length:', carePlanContent.length, 'characters');
  console.log('[Multi-Pass Analyzer] Service user:', serviceUserName);
  
  // Step 1: Parse care plan into sections
  console.log('[Multi-Pass Analyzer] Step 1: Parsing care plan into sections');
  const sections = parseCarePlanIntoSections(carePlanContent);
  console.log(`[Multi-Pass Analyzer] Found ${sections.length} sections`);
  
  // Validate sections
  const validation = validateSections(sections);
  if (!validation.valid) {
    console.warn('[Multi-Pass Analyzer] Section validation issues:', validation.issues);
  }
  
  // Log section names
  sections.forEach((section, index) => {
    console.log(`[Multi-Pass Analyzer]   Section ${index + 1}: ${section.section_name} (${section.raw_content.length} chars)`);
  });
  
  // Step 2: Analyze each section individually
  console.log('[Multi-Pass Analyzer] Step 2: Analyzing sections individually');
  const sectionResults: SectionAnalysisResult[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`[Multi-Pass Analyzer] Analyzing section ${i + 1}/${sections.length}: ${section.section_name}`);
    
    try {
      const result = await analyzeSingleSection(apiKey, section, serviceUserName);
      sectionResults.push(result);
      console.log(`[Multi-Pass Analyzer] ✓ Section ${i + 1} complete: ${result.issues.length} issues found, score: ${result.section_score}%`);
    } catch (error) {
      console.error(`[Multi-Pass Analyzer] ✗ Failed to analyze section ${i + 1}:`, error instanceof Error ? error.message : String(error));
      // Add a placeholder result for failed sections
      sectionResults.push({
        section_name: section.section_name,
        section_score: 0,
        extracted_content: section.fields,
        metadata: section.metadata,
        issues: [{
          issue_number: 1,
          severity: 'CRITICAL',
          field: 'Analysis',
          current_text: section.raw_content.substring(0, 200) + '...',
          problems_identified: ['Analysis failed due to technical error. Please retry.'],
          whats_missing: [],
          ideal_example: 'Analysis could not be completed.',
          cqc_requirement: 'N/A',
          recommendation: 'Retry analysis or contact support.',
        }],
      });
    }
  }
  
  // Step 3: Check for missing CQC-required sections
  console.log('[Multi-Pass Analyzer] Step 3: Checking for missing CQC-required sections');
  const missingSections: MultiPassAnalysisResult['missing_sections'] = [];
  
  for (const required of REQUIRED_CQC_SECTIONS) {
    const found = sectionResults.some(section => 
      section.section_name.toLowerCase().includes(required.name.toLowerCase()) ||
      required.name.toLowerCase().includes(section.section_name.toLowerCase().split(' ')[0])
    );
    
    if (!found) {
      console.log(`[Multi-Pass Analyzer]   Missing: ${required.name}`);
      missingSections.push({
        section_name: required.name,
        why_required: required.why,
        cqc_requirement: required.regulation,
      });
    }
  }
  
  // Step 4: Calculate overall statistics
  console.log('[Multi-Pass Analyzer] Step 4: Calculating overall statistics');
  let totalScore = 0;
  let criticalCount = 0;
  let majorCount = 0;
  let minorCount = 0;
  
  for (const section of sectionResults) {
    totalScore += section.section_score;
    
    for (const issue of section.issues) {
      if (issue.severity === 'CRITICAL') criticalCount++;
      else if (issue.severity === 'MAJOR') majorCount++;
      else if (issue.severity === 'MINOR') minorCount++;
    }
  }
  
  const overallScore = sectionResults.length > 0 
    ? Math.round(totalScore / sectionResults.length)
    : 0;
  
  // Deduct for missing sections
  const missingSectionPenalty = missingSections.length * 5;
  const finalScore = Math.max(0, overallScore - missingSectionPenalty);
  
  console.log('[Multi-Pass Analyzer] Analysis complete');
  console.log(`[Multi-Pass Analyzer] Overall score: ${finalScore}%`);
  console.log(`[Multi-Pass Analyzer] Total issues: ${criticalCount + majorCount + minorCount}`);
  console.log(`[Multi-Pass Analyzer]   Critical: ${criticalCount}`);
  console.log(`[Multi-Pass Analyzer]   Major: ${majorCount}`);
  console.log(`[Multi-Pass Analyzer]   Minor: ${minorCount}`);
  console.log(`[Multi-Pass Analyzer] Missing sections: ${missingSections.length}`);
  
  return {
    overall_score: finalScore,
    summary: {
      sections_analyzed: sectionResults.length,
      critical_issues: criticalCount,
      major_issues: majorCount,
      minor_issues: minorCount,
    },
    sections: sectionResults,
    missing_sections: missingSections,
  };
}
