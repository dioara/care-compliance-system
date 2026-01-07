/**
 * Care Notes Worker
 * Handles asynchronous care notes analysis and document generation
 */

import OpenAI from 'openai';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';

interface CareNoteAnalysis {
  date?: string;
  time?: string;
  carer?: string;
  original_note: string;
  word_count: number;
  overall_score: number;
  cqc_compliant: boolean;
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
}

interface CareNotesResult {
  analysis: { [noteId: string]: CareNoteAnalysis };
  summary: {
    totalNotes: number;
    averageScore: number;
    cqcComplianceRate: number;
    serviceUserName: string;
    auditDate: string;
  };
}

/**
 * Parse care notes from various formats
 */
function parseCareNotes(content: string): Array<{ id: string; date?: string; time?: string; carer?: string; note: string }> {
  const notes: Array<{ id: string; date?: string; time?: string; carer?: string; note: string }> = [];
  
  // Clean metadata/footers
  let cleanedContent = content
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/Created \d{2}\/\d{2}\/\d{4}.*?(?=\n|$)/gi, '')
    .replace(/©.*?(?:Ltd|Limited|Inc)\.?/gi, '')
    .replace(/Nourish Care Systems/gi, '')
    .trim();
  
  // Try to detect Nourish table format (Date | Carers involved | Clients involved | Diary entry)
  const nourishTablePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(\d{1,2}:\d{2}(?::\d{2})?)?[^\n]*?\n([^\n]+)\n([^\n]+)\n([\s\S]*?)(?=\d{1,2}\/\d{1,2}\/\d{2,4}|$)/g;
  
  // Try date-prefixed notes pattern
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:at\s*)?(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?[:\s-]*(?:by\s+)?([A-Za-z\s]+)?[:\s-]*([\s\S]*?)(?=\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|$)/gi;
  
  let matches = [...cleanedContent.matchAll(datePattern)];
  
  if (matches.length > 0) {
    matches.forEach((match, index) => {
      const [_, date, time, carer, noteText] = match;
      const cleanNote = noteText?.trim();
      if (cleanNote && cleanNote.length > 10) {
        notes.push({
          id: `note_${index + 1}`,
          date: date?.trim(),
          time: time?.trim(),
          carer: carer?.trim(),
          note: cleanNote
        });
      }
    });
  }
  
  // If no date-prefixed notes found, try splitting by common delimiters
  if (notes.length === 0) {
    // Try splitting by double newlines or horizontal rules
    const segments = cleanedContent.split(/\n{2,}|---+|___+/).filter(s => s.trim().length > 20);
    
    segments.forEach((segment, index) => {
      notes.push({
        id: `note_${index + 1}`,
        note: segment.trim()
      });
    });
  }
  
  // If still no notes, treat entire content as one note
  if (notes.length === 0 && cleanedContent.length > 20) {
    notes.push({
      id: 'note_1',
      note: cleanedContent
    });
  }
  
  return notes;
}

/**
 * Analyze care notes with progress updates
 */
export async function analyzeCareNotesWithProgress(
  apiKey: string,
  content: string,
  displayName: string,
  firstName: string,
  lastName: string,
  replaceFirstWith: string,
  replaceLastWith: string,
  keepOriginalNames: boolean,
  onProgress: (progress: string) => Promise<void>
): Promise<CareNotesResult> {
  
  const openai = new OpenAI({ apiKey });
  
  // Parse notes from content
  await onProgress('Parsing care notes...');
  const parsedNotes = parseCareNotes(content);
  console.log(`[Care Notes Worker] Parsed ${parsedNotes.length} notes`);
  
  if (parsedNotes.length === 0) {
    throw new Error('No care notes found in the document. Please ensure the document contains care notes in a recognisable format.');
  }
  
  // Analyze notes in batches to avoid token limits
  const batchSize = 5;
  const allResults: { [noteId: string]: CareNoteAnalysis } = {};
  
  for (let i = 0; i < parsedNotes.length; i += batchSize) {
    const batch = parsedNotes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(parsedNotes.length / batchSize);
    
    await onProgress(`Analysing notes batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, parsedNotes.length)} of ${parsedNotes.length})...`);
    
    const notesForPrompt = batch.map(n => ({
      id: n.id,
      date: n.date || 'Unknown',
      time: n.time || '',
      carer: n.carer || 'Unknown',
      note: n.note
    }));
    
    const prompt = `You are a CQC compliance expert analysing care notes for quality and regulatory compliance.

Analyse each of the following care notes and provide detailed feedback. Use British English spelling throughout.

CARE NOTES TO ANALYSE:
${JSON.stringify(notesForPrompt, null, 2)}

For EACH note, provide analysis in this exact JSON structure:
{
  "note_id": {
    "date": "date from note or Unknown",
    "time": "time if available",
    "carer": "carer name if available",
    "original_note": "the original note text",
    "word_count": number,
    "overall_score": 0-100,
    "cqc_compliant": true/false (true if score >= 70),
    "length_detail_score": 0-100 (minimum 50 words for good score),
    "person_centred_score": 0-100 (uses first person, mentions preferences),
    "professional_language_score": 0-100 (no slang, abbreviations explained),
    "outcome_focused_score": 0-100 (describes outcomes, not just tasks),
    "evidence_based_score": 0-100 (specific observations, measurements),
    "language_issues": [
      {
        "problematic_text": "exact quote from note",
        "explanation": "why this is problematic",
        "use_instead": "suggested replacement"
      }
    ],
    "whats_missing": ["list of missing elements"],
    "positive_aspects": ["list of good elements"],
    "improved_version": "A fully rewritten 150-200 word CQC-compliant version of this note. Must be person-centred, outcome-focused, and include specific details. Ready to copy and use.",
    "carer_feedback": "Personalised constructive feedback for the carer who wrote this note, focusing on training needs and improvement areas."
  }
}

SCORING CRITERIA:
- Length & Detail (20%): Notes should be 50+ words with specific details
- Person-Centred (20%): Written from service user's perspective, mentions preferences
- Professional Language (20%): No slang, proper terminology, no unexplained abbreviations
- Outcome Focused (20%): Describes what was achieved, not just tasks done
- Evidence Based (20%): Includes observations, measurements, specific times

COMMON ISSUES TO FLAG:
- "Fine" or "OK" without detail
- Task-only descriptions ("Gave medication")
- Missing times or measurements
- Abbreviations without explanation
- Third-person language instead of person-centred
- No mention of service user's response or mood

Return ONLY valid JSON with no markdown formatting.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a CQC compliance expert. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });
      
      let resultText = response.choices[0]?.message?.content || '{}';
      
      // Clean markdown if present
      if (resultText.startsWith('```')) {
        resultText = resultText.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parse JSON with error handling
      let batchResults: { [key: string]: CareNoteAnalysis };
      try {
        batchResults = JSON.parse(resultText);
      } catch (parseError) {
        console.error('[Care Notes Worker] JSON parse error, attempting fixes...');
        // Try to fix common JSON issues
        let fixedText = resultText
          .replace(/\\(?!["\\bfnrtu\/])/g, '\\\\')
          .replace(/,\s*([}\]])/g, '$1');
        
        try {
          batchResults = JSON.parse(fixedText);
        } catch {
          console.error('[Care Notes Worker] Could not parse batch results, using placeholder');
          batchResults = {};
          batch.forEach(n => {
            batchResults[n.id] = {
              original_note: n.note,
              word_count: n.note.split(/\s+/).length,
              overall_score: 0,
              cqc_compliant: false,
              length_detail_score: 0,
              person_centred_score: 0,
              professional_language_score: 0,
              outcome_focused_score: 0,
              evidence_based_score: 0,
              language_issues: [],
              whats_missing: ['Analysis failed - please retry'],
              positive_aspects: [],
              improved_version: 'Analysis failed - please retry',
              carer_feedback: 'Analysis failed - please retry'
            };
          });
        }
      }
      
      // Merge batch results
      Object.assign(allResults, batchResults);
      
    } catch (error) {
      console.error(`[Care Notes Worker] Error analysing batch ${batchNum}:`, error);
      // Add placeholder results for failed batch
      batch.forEach(n => {
        allResults[n.id] = {
          original_note: n.note,
          word_count: n.note.split(/\s+/).length,
          overall_score: 0,
          cqc_compliant: false,
          length_detail_score: 0,
          person_centred_score: 0,
          professional_language_score: 0,
          outcome_focused_score: 0,
          evidence_based_score: 0,
          language_issues: [],
          whats_missing: ['Analysis failed - please retry'],
          positive_aspects: [],
          improved_version: 'Analysis failed - please retry',
          carer_feedback: 'Analysis failed - please retry'
        };
      });
    }
  }
  
  // Calculate summary statistics
  await onProgress('Calculating summary statistics...');
  
  const noteKeys = Object.keys(allResults);
  const scores = noteKeys.map(key => allResults[key].overall_score || 0);
  const compliantCount = noteKeys.filter(key => allResults[key].cqc_compliant).length;
  
  const summary = {
    totalNotes: noteKeys.length,
    averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0,
    cqcComplianceRate: noteKeys.length > 0 ? Math.round(compliantCount / noteKeys.length * 100 * 10) / 10 : 0,
    serviceUserName: displayName,
    auditDate: new Date().toLocaleDateString('en-GB'),
  };
  
  return {
    analysis: allResults,
    summary
  };
}

/**
 * Generate Word document for care notes analysis
 */
export function generateCareNotesDocument(serviceUserName: string, result: CareNotesResult): Document {
  const { analysis, summary } = result;
  const children: Paragraph[] = [];
  
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Title
  children.push(
    new Paragraph({
      text: 'AI Care Notes Audit Report',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Service User: ${serviceUserName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Audit Date: ${currentDate}`,
      alignment: AlignmentType.CENTER,
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
        new TextRun({ text: 'Total Notes Analysed: ', bold: true }),
        new TextRun(`${summary.totalNotes}`),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Average Quality Score: ', bold: true }),
        new TextRun({ 
          text: `${summary.averageScore}%`,
          color: summary.averageScore >= 70 ? '008000' : summary.averageScore >= 50 ? 'FFA500' : 'FF0000'
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'CQC Compliance Rate: ', bold: true }),
        new TextRun({ 
          text: `${summary.cqcComplianceRate}%`,
          color: summary.cqcComplianceRate >= 70 ? '008000' : summary.cqcComplianceRate >= 50 ? 'FFA500' : 'FF0000'
        }),
      ],
      spacing: { after: 400 },
    })
  );
  
  // Individual Note Analysis
  children.push(
    new Paragraph({
      text: 'Individual Note Analysis',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
    })
  );
  
  const noteKeys = Object.keys(analysis);
  
  for (let i = 0; i < noteKeys.length; i++) {
    const noteId = noteKeys[i];
    const note = analysis[noteId];
    
    // Note header
    children.push(
      new Paragraph({
        text: `Note ${i + 1}${note.date ? ` - ${note.date}` : ''}${note.time ? ` at ${note.time}` : ''}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        pageBreakBefore: i > 0,
      })
    );
    
    if (note.carer) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Carer: ', bold: true }),
            new TextRun(note.carer),
          ],
          spacing: { after: 100 },
        })
      );
    }
    
    // Scores
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Overall Score: ', bold: true }),
          new TextRun({ 
            text: `${note.overall_score}%`,
            bold: true,
            color: note.overall_score >= 70 ? '008000' : note.overall_score >= 50 ? 'FFA500' : 'FF0000'
          }),
          new TextRun({ text: '  |  CQC Compliant: ', bold: true }),
          new TextRun({ 
            text: note.cqc_compliant ? 'Yes' : 'No',
            color: note.cqc_compliant ? '008000' : 'FF0000'
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Length & Detail: ', bold: true }),
          new TextRun(`${note.length_detail_score}%  |  `),
          new TextRun({ text: 'Person-Centred: ', bold: true }),
          new TextRun(`${note.person_centred_score}%  |  `),
          new TextRun({ text: 'Professional: ', bold: true }),
          new TextRun(`${note.professional_language_score}%`),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Outcome Focused: ', bold: true }),
          new TextRun(`${note.outcome_focused_score}%  |  `),
          new TextRun({ text: 'Evidence Based: ', bold: true }),
          new TextRun(`${note.evidence_based_score}%  |  `),
          new TextRun({ text: 'Word Count: ', bold: true }),
          new TextRun(`${note.word_count}`),
        ],
        spacing: { after: 200 },
      })
    );
    
    // Original Note
    children.push(
      new Paragraph({
        text: 'Original Note:',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: note.original_note,
        spacing: { after: 200 },
        shading: { fill: 'F5F5F5' },
      })
    );
    
    // Language Issues
    if (note.language_issues && note.language_issues.length > 0) {
      children.push(
        new Paragraph({
          text: 'Language Issues:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      for (const issue of note.language_issues) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Problem: ', bold: true, color: 'FF0000' }),
              new TextRun({ text: `"${issue.problematic_text}"`, italics: true }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Why: ', bold: true }),
              new TextRun(issue.explanation),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Use Instead: ', bold: true, color: '008000' }),
              new TextRun({ text: `"${issue.use_instead}"`, italics: true }),
            ],
            spacing: { after: 150 },
          })
        );
      }
    }
    
    // What's Missing
    if (note.whats_missing && note.whats_missing.length > 0) {
      children.push(
        new Paragraph({
          text: "What's Missing:",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      for (const missing of note.whats_missing) {
        children.push(
          new Paragraph({
            text: `• ${missing}`,
            spacing: { after: 50 },
          })
        );
      }
    }
    
    // Positive Aspects
    if (note.positive_aspects && note.positive_aspects.length > 0) {
      children.push(
        new Paragraph({
          text: 'Positive Aspects:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      for (const positive of note.positive_aspects) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '✓ ', color: '008000' }),
              new TextRun(positive),
            ],
            spacing: { after: 50 },
          })
        );
      }
    }
    
    // Improved Version
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Improved Version (Ready to Copy):', bold: true }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: note.improved_version,
        spacing: { after: 200 },
        shading: { fill: 'E8F5E9' },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: '4CAF50' },
        },
      })
    );
    
    // Carer Feedback
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Personalised Feedback for Carer:', bold: true }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        text: note.carer_feedback,
        spacing: { after: 300 },
        shading: { fill: 'FFF3E0' },
        border: {
          left: { style: BorderStyle.SINGLE, size: 12, color: 'FF9800' },
        },
      })
    );
  }
  
  // Footer
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
      text: 'The analysis is based on CQC guidelines and best practices for care documentation.',
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: 'All improved versions are suggestions and should be reviewed before use.',
      spacing: { after: 200 },
      italics: true,
    })
  );
  
  return new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });
}
