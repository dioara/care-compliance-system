/**
 * Document Generator for Care Plan Analysis Reports
 * Generates Word documents with detailed CQC compliance analysis
 * 
 * Updated to:
 * - Use current date as audit date
 * - Set next review date to 3 months from now
 * - Improve section structure and formatting
 * - Use British English throughout
 */

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';

interface AnalysisIssue {
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

interface AnalysisSection {
  section_name: string;
  next_review_date?: string;
  level_of_need?: string;
  section_score: number;
  extracted_content: {
    identified_need?: string;
    planned_outcomes?: string;
    how_to_achieve?: string;
    risk?: string;
    risk_likelihood?: string;
    risk_impact?: string;
    risk_score?: string;
    [key: string]: string | undefined;
  };
  metadata?: {
    next_review_date?: string;
    level_of_need?: string;
    reviewer?: string;
    review_date?: string;
    [key: string]: string | undefined;
  };
  issues: AnalysisIssue[];
}

interface AnalysisResult {
  overall_score: number;
  summary: {
    sections_analyzed: number;
    critical_issues: number;
    major_issues: number;
    minor_issues: number;
    sections_coverage?: number;
    missing_critical_sections?: number;
    missing_high_sections?: number;
    missing_medium_sections?: number;
  };
  sections: AnalysisSection[];
  missing_sections?: Array<{
    section_name: string;
    why_required: string;
    cqc_requirement: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }>;
  missing_sections_report?: string;
}

/**
 * Format date as DD/MM/YYYY (British format)
 */
function formatDateBritish(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get the next review date (3 months from now)
 */
function getNextReviewDate(): string {
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setMonth(nextReview.getMonth() + 3);
  return formatDateBritish(nextReview);
}

/**
 * Format field name for display (Title Case with proper spacing)
 */
function formatFieldName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('How To Achieve', 'How to Achieve')
    .replace('Whats Missing', "What's Missing");
}

export function generateCarePlanAnalysisDocument(
  clientName: string,
  analysisDate: string,
  analysis: AnalysisResult
): Document {
  const children: Paragraph[] = [];
  
  // Get current date and next review date
  const currentDate = formatDateBritish(new Date());
  const nextReviewDate = getNextReviewDate();

  // Title Page
  children.push(
    new Paragraph({
      text: 'CARE PLAN QUALITY AUDIT',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'REPORT',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: 'Comprehensive CQC Compliance Analysis',
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      text: 'Service User Information',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Service User: ', bold: true }),
        new TextRun(clientName),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Audit Date: ', bold: true }),
        new TextRun(currentDate),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Next Review Due: ', bold: true }),
        new TextRun(nextReviewDate),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Overall Compliance Score: ', bold: true }),
        new TextRun({
          text: `${analysis.overall_score}%`,
          color: analysis.overall_score >= 85 ? '00AA00' : analysis.overall_score >= 60 ? 'FF8800' : 'FF0000',
          bold: true,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Executive Summary
  children.push(
    new Paragraph({
      text: 'Executive Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Sections Analysed: ', bold: true }),
        new TextRun(String(analysis.summary.sections_analyzed)),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Critical Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.critical_issues), color: 'FF0000', bold: true }),
        new TextRun(' (Immediate action required)'),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Major Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.major_issues), color: 'FF8800', bold: true }),
        new TextRun(' (Action required within 7 days)'),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Minor Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.minor_issues), color: '888888', bold: true }),
        new TextRun(' (Action required within 30 days)'),
      ],
      spacing: { after: 200 },
    })
  );

  // Add section coverage if available
  if (analysis.summary.sections_coverage !== undefined) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Care Plan Coverage: ', bold: true }),
          new TextRun({ 
            text: `${analysis.summary.sections_coverage}%`, 
            color: analysis.summary.sections_coverage >= 80 ? '00AA00' : analysis.summary.sections_coverage >= 50 ? 'FF8800' : 'FF0000',
            bold: true 
          }),
          new TextRun(' of required CQC sections'),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Add missing sections summary
  if (analysis.missing_sections && analysis.missing_sections.length > 0) {
    const missingCritical = analysis.summary.missing_critical_sections || 0;
    const missingHigh = analysis.summary.missing_high_sections || 0;
    const missingMedium = analysis.summary.missing_medium_sections || 0;
    
    children.push(
      new Paragraph({
        text: 'Missing Care Plan Sections',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    if (missingCritical > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Critical Sections Missing: ', bold: true }),
            new TextRun({ text: String(missingCritical), color: 'FF0000', bold: true }),
            new TextRun(' (Must be added immediately)'),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (missingHigh > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'High Priority Sections Missing: ', bold: true }),
            new TextRun({ text: String(missingHigh), color: 'FF8800', bold: true }),
            new TextRun(' (Add within 7 days)'),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (missingMedium > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Medium Priority Sections Missing: ', bold: true }),
            new TextRun({ text: String(missingMedium), color: '888888', bold: true }),
            new TextRun(' (Add within 30 days)'),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  children.push(
    new Paragraph({
      text: '',
      spacing: { after: 200 },
    })
  );

  // Detailed Section Analysis
  children.push(
    new Paragraph({
      text: 'Detailed Section Analysis',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    })
  );

  // Process each section
  for (const section of analysis.sections) {
    // Section Header - properly formatted
    children.push(
      new Paragraph({
        text: `Section: ${section.section_name.toUpperCase()}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      })
    );

    // Section Score
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Section Score: ', bold: true }),
          new TextRun({
            text: `${section.section_score}%`,
            color: section.section_score >= 85 ? '00AA00' : section.section_score >= 60 ? 'FF8800' : 'FF0000',
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // Add Audit Date and Next Review Due for each section
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Audit Date: ', bold: true }),
          new TextRun(currentDate),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Next Review Due: ', bold: true }),
          new TextRun(nextReviewDate),
        ],
        spacing: { after: 100 },
      })
    );

    // Section Metadata (if available from parsing)
    if (section.metadata?.next_review_date) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Care Plan Review Date: ', bold: true }),
            new TextRun(section.metadata.next_review_date),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (section.metadata?.level_of_need || section.extracted_content?.level_of_need) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Level of Need: ', bold: true }),
            new TextRun(section.metadata?.level_of_need || section.extracted_content?.level_of_need || ''),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Extracted Content
    children.push(
      new Paragraph({
        text: 'Extracted Content',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      })
    );

    // Display fields in a logical order
    const fieldOrder = ['identified_need', 'planned_outcomes', 'how_to_achieve', 'risk', 'risk_likelihood', 'risk_impact', 'risk_score'];
    const displayedFields = new Set<string>();

    // First display in order
    for (const key of fieldOrder) {
      const value = section.extracted_content[key];
      if (value) {
        displayedFields.add(key);
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${formatFieldName(key)}: `, bold: true }),
            ],
            spacing: { before: 100 },
          }),
          new Paragraph({
            text: value,
            spacing: { after: 100, left: 400 },
          })
        );
      }
    }

    // Then display any remaining fields
    for (const [key, value] of Object.entries(section.extracted_content)) {
      if (value && !displayedFields.has(key) && key !== 'level_of_need') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${formatFieldName(key)}: `, bold: true }),
            ],
            spacing: { before: 100 },
          }),
          new Paragraph({
            text: value,
            spacing: { after: 100, left: 400 },
          })
        );
      }
    }

    // Issues Found
    if (section.issues.length > 0) {
      children.push(
        new Paragraph({
          text: `Issues Found (${section.issues.length})`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const issue of section.issues) {
        // Issue Header
        const severityColor = issue.severity === 'CRITICAL' ? 'FF0000' : issue.severity === 'MAJOR' ? 'FF8800' : '888888';
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Issue ${issue.issue_number}: `, bold: true }),
              new TextRun({ text: `[${issue.severity}] `, bold: true, color: severityColor }),
              new TextRun({ text: issue.field, bold: true }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );

        // Current Text
        children.push(
          new Paragraph({
            text: 'Current Text (Full):',
            bold: true,
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: issue.current_text || '-',
            spacing: { after: 100, left: 400 },
            italics: true,
          })
        );

        // Problems Identified
        if (issue.problems_identified && issue.problems_identified.length > 0) {
          children.push(
            new Paragraph({
              text: 'Problems Identified:',
              bold: true,
              spacing: { before: 100, after: 50 },
            })
          );

          for (const problem of issue.problems_identified) {
            children.push(
              new Paragraph({
                text: problem,
                spacing: { after: 50, left: 400 },
                bullet: { level: 0 },
              })
            );
          }
        }

        // What's Missing
        if (issue.whats_missing && issue.whats_missing.length > 0) {
          children.push(
            new Paragraph({
              text: "What's Missing:",
              bold: true,
              spacing: { before: 100, after: 50 },
            })
          );

          for (const missing of issue.whats_missing) {
            children.push(
              new Paragraph({
                text: missing,
                spacing: { after: 50, left: 400 },
                bullet: { level: 0 },
              })
            );
          }
        }

        // Ideal Example
        if (issue.ideal_example) {
          children.push(
            new Paragraph({
              text: '✨ COMPLETE IDEAL EXAMPLE (Ready to Copy & Customise):',
              bold: true,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: issue.ideal_example,
              spacing: { after: 200, left: 400 },
              shading: { fill: 'F0F8FF' },
            })
          );
        }

        // CQC Requirement
        if (issue.cqc_requirement) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'CQC Requirement: ', bold: true }),
                new TextRun(issue.cqc_requirement),
              ],
              spacing: { before: 100, after: 50 },
            })
          );
        }

        // Recommendation
        if (issue.recommendation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Recommendation: ', bold: true }),
                new TextRun(issue.recommendation),
              ],
              spacing: { after: 200 },
            })
          );
        }

        // Separator
        children.push(
          new Paragraph({
            text: '───────────────────────────────────────',
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
          })
        );
      }
    } else {
      // No issues found for this section
      children.push(
        new Paragraph({
          text: 'No issues identified in this section.',
          spacing: { before: 100, after: 200 },
          italics: true,
        })
      );
    }
  }

  // Missing Sections
  if (analysis.missing_sections && analysis.missing_sections.length > 0) {
    children.push(
      new Paragraph({
        text: 'Missing CQC-Required Sections',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      }),
      new Paragraph({
        text: 'The following sections are required for CQC compliance but were not found in the care plan. These must be added to ensure comprehensive, person-centred care documentation.',
        spacing: { after: 300 },
      })
    );

    // Group by priority
    const criticalMissing = analysis.missing_sections.filter(s => s.priority === 'critical');
    const highMissing = analysis.missing_sections.filter(s => s.priority === 'high');
    const mediumMissing = analysis.missing_sections.filter(s => s.priority === 'medium');
    const lowMissing = analysis.missing_sections.filter(s => s.priority === 'low' || !s.priority);

    // Critical Missing Sections
    if (criticalMissing.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'CRITICAL - Must Be Added Immediately', bold: true, color: 'FF0000' }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const missing of criticalMissing) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '⚠ ', bold: true }),
              new TextRun({ text: missing.section_name, bold: true }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Description: ', bold: true }),
              new TextRun(missing.why_required),
            ],
            spacing: { after: 50, left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'CQC Requirement: ', bold: true }),
              new TextRun(missing.cqc_requirement),
            ],
            spacing: { after: 150, left: 400 },
          })
        );
      }
    }

    // High Priority Missing Sections
    if (highMissing.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'HIGH PRIORITY - Add Within 7 Days', bold: true, color: 'FF8800' }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const missing of highMissing) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun({ text: missing.section_name, bold: true }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Description: ', bold: true }),
              new TextRun(missing.why_required),
            ],
            spacing: { after: 50, left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'CQC Requirement: ', bold: true }),
              new TextRun(missing.cqc_requirement),
            ],
            spacing: { after: 150, left: 400 },
          })
        );
      }
    }

    // Medium Priority Missing Sections
    if (mediumMissing.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'MEDIUM PRIORITY - Add Within 30 Days', bold: true, color: '888888' }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const missing of mediumMissing) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun({ text: missing.section_name, bold: true }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Description: ', bold: true }),
              new TextRun(missing.why_required),
            ],
            spacing: { after: 50, left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'CQC Requirement: ', bold: true }),
              new TextRun(missing.cqc_requirement),
            ],
            spacing: { after: 150, left: 400 },
          })
        );
      }
    }

    // Low Priority Missing Sections
    if (lowMissing.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'LOW PRIORITY - Review at Next Care Plan Update', bold: true }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      for (const missing of lowMissing) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ' }),
              new TextRun({ text: missing.section_name }),
              new TextRun({ text: ' - ' }),
              new TextRun({ text: missing.why_required, italics: true }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );
      }
    }
  }

  // Footer with audit information
  children.push(
    new Paragraph({
      text: 'Audit Information',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    }),
    new Paragraph({
      text: `This audit was conducted on ${currentDate} using AI-powered analysis.`,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `The next review of this care plan should be completed by ${nextReviewDate}.`,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: 'This report should be used as a guide for improving care plan documentation and ensuring CQC compliance. All recommendations should be reviewed by qualified care professionals before implementation.',
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: 'Generated by Care Compliance Management System',
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      italics: true,
    })
  );

  return new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
}
