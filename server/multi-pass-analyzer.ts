/**
 * Multi-Pass Care Plan Analyzer
 * Orchestrates section-by-section analysis for comprehensive reports
 * 
 * Updated to use comprehensive care plan sections definition
 * based on Nourish template + CQC requirements
 */

import { parseCarePlanIntoSections, validateSections, type CarePlanSection } from './care-plan-parser';
import { analyzeSingleSection, type SectionAnalysisResult } from './section-analyzer';
import { 
  ALL_CARE_PLAN_SECTIONS, 
  detectPresentSections, 
  generateMissingSectionsReport,
  type CarePlanSectionDefinition 
} from './care-plan-sections';

export interface MultiPassAnalysisResult {
  overall_score: number;
  summary: {
    sections_analyzed: number;
    critical_issues: number;
    major_issues: number;
    minor_issues: number;
    sections_coverage: number;
    missing_critical_sections: number;
    missing_high_sections: number;
    missing_medium_sections: number;
  };
  sections: SectionAnalysisResult[];
  missing_sections: Array<{
    section_name: string;
    why_required: string;
    cqc_requirement: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
  missing_sections_report: string;
}

/**
 * Check if a section definition is covered by the parsed sections
 */
function isSectionCovered(
  sectionDef: CarePlanSectionDefinition,
  parsedSections: CarePlanSection[],
  fullText: string
): boolean {
  const textLower = fullText.toLowerCase();
  
  // Check if any keywords are present in the full text
  const hasKeyword = sectionDef.keywords.some(keyword => 
    textLower.includes(keyword.toLowerCase())
  );
  
  // Check if any parsed section name matches
  const hasMatchingSection = parsedSections.some(section => {
    const sectionNameLower = section.section_name.toLowerCase();
    return sectionDef.keywords.some(keyword => 
      sectionNameLower.includes(keyword.toLowerCase())
    ) || sectionDef.aliases.some(alias =>
      sectionNameLower.includes(alias.toLowerCase())
    );
  });
  
  return hasKeyword || hasMatchingSection;
}

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
  
  // Step 3: Check for missing CQC-required sections using comprehensive definition
  console.log('[Multi-Pass Analyzer] Step 3: Checking for missing CQC-required sections');
  const missingSections: MultiPassAnalysisResult['missing_sections'] = [];
  
  // Check each required section against the parsed content
  for (const sectionDef of ALL_CARE_PLAN_SECTIONS) {
    const isCovered = isSectionCovered(sectionDef, sections, carePlanContent);
    
    if (!isCovered) {
      console.log(`[Multi-Pass Analyzer]   Missing [${sectionDef.priority.toUpperCase()}]: ${sectionDef.name}`);
      missingSections.push({
        section_name: sectionDef.name,
        why_required: sectionDef.description,
        cqc_requirement: sectionDef.cqcRegulation,
        priority: sectionDef.priority,
      });
    }
  }
  
  // Sort missing sections by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  missingSections.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Count missing by priority
  const missingCritical = missingSections.filter(s => s.priority === 'critical').length;
  const missingHigh = missingSections.filter(s => s.priority === 'high').length;
  const missingMedium = missingSections.filter(s => s.priority === 'medium').length;
  
  // Generate missing sections report
  const missingSectionDefs = missingSections.map(ms => 
    ALL_CARE_PLAN_SECTIONS.find(def => def.name === ms.section_name)!
  ).filter(Boolean);
  const missingSectionsReport = generateMissingSectionsReport(missingSectionDefs);
  
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
  
  // Calculate section coverage
  const totalRequiredSections = ALL_CARE_PLAN_SECTIONS.length;
  const coveredSections = totalRequiredSections - missingSections.length;
  const sectionsCoverage = Math.round((coveredSections / totalRequiredSections) * 100);
  
  // Deduct for missing sections (weighted by priority)
  const missingSectionPenalty = 
    (missingCritical * 10) + // Critical sections: 10 points each
    (missingHigh * 5) +      // High priority: 5 points each
    (missingMedium * 2);     // Medium priority: 2 points each
  
  const finalScore = Math.max(0, overallScore - missingSectionPenalty);
  
  console.log('[Multi-Pass Analyzer] Analysis complete');
  console.log(`[Multi-Pass Analyzer] Overall score: ${finalScore}%`);
  console.log(`[Multi-Pass Analyzer] Section coverage: ${sectionsCoverage}%`);
  console.log(`[Multi-Pass Analyzer] Total issues: ${criticalCount + majorCount + minorCount}`);
  console.log(`[Multi-Pass Analyzer]   Critical: ${criticalCount}`);
  console.log(`[Multi-Pass Analyzer]   Major: ${majorCount}`);
  console.log(`[Multi-Pass Analyzer]   Minor: ${minorCount}`);
  console.log(`[Multi-Pass Analyzer] Missing sections: ${missingSections.length}`);
  console.log(`[Multi-Pass Analyzer]   Critical: ${missingCritical}`);
  console.log(`[Multi-Pass Analyzer]   High: ${missingHigh}`);
  console.log(`[Multi-Pass Analyzer]   Medium: ${missingMedium}`);
  
  return {
    overall_score: finalScore,
    summary: {
      sections_analyzed: sectionResults.length,
      critical_issues: criticalCount,
      major_issues: majorCount,
      minor_issues: minorCount,
      sections_coverage: sectionsCoverage,
      missing_critical_sections: missingCritical,
      missing_high_sections: missingHigh,
      missing_medium_sections: missingMedium,
    },
    sections: sectionResults,
    missing_sections: missingSections,
    missing_sections_report: missingSectionsReport,
  };
}
