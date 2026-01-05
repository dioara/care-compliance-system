/**
 * Document Generator for Care Plan Analysis Reports
 * Generates Word documents matching the 299-page detailed format
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
  };
  sections: AnalysisSection[];
  missing_sections?: Array<{
    section_name: string;
    why_required: string;
    cqc_requirement: string;
  }>;
}

export function generateCarePlanAnalysisDocument(
  clientName: string,
  analysisDate: string,
  analysis: AnalysisResult
): Document {
  const children: Paragraph[] = [];

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
      text: 'Ultra-Pedantic Zero-Tolerance Analysis',
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      text: 'Client Information',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Client Name: ', bold: true }),
        new TextRun(clientName),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Analysis Date: ', bold: true }),
        new TextRun(analysisDate),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Overall Score: ', bold: true }),
        new TextRun({
          text: `${analysis.overall_score}%`,
          color: analysis.overall_score >= 85 ? '00AA00' : analysis.overall_score >= 60 ? 'FF8800' : 'FF0000',
          bold: true,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Summary
  children.push(
    new Paragraph({
      text: 'Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Sections Analyzed: ', bold: true }),
        new TextRun(String(analysis.summary.sections_analyzed)),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Critical Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.critical_issues), color: 'FF0000' }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Major Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.major_issues), color: 'FF8800' }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Minor Issues: ', bold: true }),
        new TextRun({ text: String(analysis.summary.minor_issues), color: '888888' }),
      ],
      spacing: { after: 400 },
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
    // Section Header
    children.push(
      new Paragraph({
        text: `Section: ${section.section_name}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      })
    );

    // Section Metadata
    if (section.next_review_date) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Next Review Date: ', bold: true }),
            new TextRun(section.next_review_date),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (section.level_of_need) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Level of Need: ', bold: true }),
            new TextRun(section.level_of_need),
          ],
          spacing: { after: 100 },
        })
      );
    }

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
        spacing: { after: 200 },
      })
    );

    // Extracted Content
    children.push(
      new Paragraph({
        text: 'Extracted Content',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      })
    );

    for (const [key, value] of Object.entries(section.extracted_content)) {
      if (value) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: `, bold: true }),
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
            text: issue.current_text,
            spacing: { after: 100, left: 400 },
            italics: true,
          })
        );

        // Problems Identified
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

        // What's Missing
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

        // Ideal Example
        children.push(
          new Paragraph({
            text: '✨ COMPLETE IDEAL EXAMPLE (Ready to Copy & Customize):',
            bold: true,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: issue.ideal_example,
            spacing: { after: 200, left: 400 },
            shading: { fill: 'F0F8FF' },
          })
        );

        // CQC Requirement
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'CQC Requirement: ', bold: true }),
              new TextRun(issue.cqc_requirement),
            ],
            spacing: { before: 100, after: 50 },
          })
        );

        // Recommendation
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Recommendation: ', bold: true }),
              new TextRun(issue.recommendation),
            ],
            spacing: { after: 200 },
          })
        );

        // Separator
        children.push(
          new Paragraph({
            text: '───────────────────────────────────────',
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
          })
        );
      }
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
      })
    );

    for (const missing of analysis.missing_sections) {
      children.push(
        new Paragraph({
          text: missing.section_name,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Why Required: ', bold: true }),
            new TextRun(missing.why_required),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'CQC Requirement: ', bold: true }),
            new TextRun(missing.cqc_requirement),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  return new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
}
