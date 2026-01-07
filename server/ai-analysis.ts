/**
 * AI Analysis Service for Care Plans and Care Notes
 * Uses detailed prompts for CQC compliance analysis
 */

import OpenAI from 'openai';

interface CareNoteAnalysisResult {
  [noteId: string]: {
    date?: string;
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
 * Apply name replacement throughout text
 */
function applyNameReplacement(
  text: string,
  firstName?: string,
  lastName?: string,
  replaceFirstWith?: string,
  replaceLastWith?: string
): { text: string; displayName: string } {
  let processedText = text;
  let displayName = 'Service User';

  if (firstName && lastName && replaceFirstWith && replaceLastWith) {
    // Replace full name (various formats)
    const fullName = `${firstName} ${lastName}`;
    const replacementFullName = `${replaceFirstWith} ${replaceLastWith}`;
    
    // Case-insensitive replacements
    const patterns = [
      // Full name
      new RegExp(fullName, 'gi'),
      // Last name, First name
      new RegExp(`${lastName},?\\s*${firstName}`, 'gi'),
      // First name only (word boundary)
      new RegExp(`\\b${firstName}\\b`, 'gi'),
      // Last name only (word boundary)
      new RegExp(`\\b${lastName}\\b`, 'gi'),
      // Possessive forms
      new RegExp(`${firstName}'s`, 'gi'),
      new RegExp(`${lastName}'s`, 'gi'),
    ];
    
    const replacements = [
      replacementFullName,
      `${replaceLastWith}, ${replaceFirstWith}`,
      replaceFirstWith,
      replaceLastWith,
      `${replaceFirstWith}'s`,
      `${replaceLastWith}'s`,
    ];
    
    patterns.forEach((pattern, index) => {
      processedText = processedText.replace(pattern, replacements[index]);
    });
    
    displayName = replacementFullName;
  } else if (firstName && lastName) {
    displayName = `${firstName} ${lastName}`;
  }
  
  return { text: processedText, displayName };
}

/**
 * Parse care notes from various formats including Nourish exports
 */
function parseCareNotes(text: string): Array<{
  date?: string;
  time?: string;
  carer?: string;
  text: string;
}> {
  const notes: Array<{ date?: string; time?: string; carer?: string; text: string }> = [];
  
  // Clean metadata/footers from Nourish exports
  let cleanedText = text
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/Created\s+\d{2}\/\d{2}\/\d{4}\s*-?\s*\d{2}:\d{2}/gi, '')
    .replace(/©\s*Nourish Care Systems Ltd/gi, '')
    .replace(/Diary for \d{2}\/\d{2}\/\d{4} to \d{2}\/\d{2}\/\d{4}/gi, '')
    .trim();
  
  // Try to detect Nourish table format (has columns like "Diary entry", "Carers involved")
  const isNourishFormat = /Display from|Diary entry|Carers involved|Entry occurred/i.test(cleanedText);
  
  if (isNourishFormat) {
    // Parse Nourish diary format
    // Look for date patterns followed by note content
    const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
    const segments = cleanedText.split(datePattern);
    
    for (let i = 1; i < segments.length; i += 2) {
      const date = segments[i];
      const content = segments[i + 1] || '';
      
      // Try to extract carer name (often appears after "Note" type indicator)
      const carerMatch = content.match(/(?:Note|Entry)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      const carer = carerMatch ? carerMatch[1] : undefined;
      
      // Extract the actual note text (usually after "Date:" and time info)
      const noteMatch = content.match(/(?:Date:\s*\d{1,2}\/\d{2}\/\d{4}\s*Time:\s*[\d:]+(?:am|pm)?\s*Staff:\s*[^]+?)?(.+)/is);
      let noteText = noteMatch ? noteMatch[1].trim() : content.trim();
      
      // Clean up the note text
      noteText = noteText
        .replace(/^Note\s+/i, '')
        .replace(/Edit entry\s*Not applicable\s*Not applicable/gi, '')
        .replace(/Assigned to\s*Assigned status\s*Assigned priority/gi, '')
        .trim();
      
      if (noteText.length > 20) { // Only include substantial notes
        notes.push({ date, carer, text: noteText });
      }
    }
  }
  
  // If no notes found with Nourish format, try other patterns
  if (notes.length === 0) {
    // Try ---NOTE--- markers
    if (cleanedText.includes('---NOTE')) {
      const noteBlocks = cleanedText.split(/---NOTE\s*\d*---/i);
      noteBlocks.slice(1).forEach(block => {
        const dateMatch = block.match(/Date:\s*(.+)/i);
        const carerMatch = block.match(/Carer:\s*(.+)/i);
        const textMatch = block.match(/Text:\s*"?(.+?)"?\s*(?:Word Count:|$)/is);
        
        notes.push({
          date: dateMatch?.[1]?.trim(),
          carer: carerMatch?.[1]?.trim(),
          text: textMatch?.[1]?.trim() || block.trim(),
        });
      });
    }
    
    // Try date-prefixed notes (common in exports)
    if (notes.length === 0) {
      const dateNotePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:at\s*)?(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)?[:\s-]*(.+?)(?=\d{1,2}\/\d{1,2}\/\d{2,4}|$)/gis;
      let match;
      while ((match = dateNotePattern.exec(cleanedText)) !== null) {
        const [, date, time, noteText] = match;
        if (noteText.trim().length > 10) {
          notes.push({
            date: date.trim(),
            time: time?.trim(),
            text: noteText.trim(),
          });
        }
      }
    }
    
    // Fallback: split by double newlines
    if (notes.length === 0) {
      const paragraphs = cleanedText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      paragraphs.forEach(p => {
        notes.push({ text: p.trim() });
      });
    }
    
    // Last resort: treat entire text as one note
    if (notes.length === 0 && cleanedText.length > 20) {
      notes.push({ text: cleanedText });
    }
  }
  
  return notes;
}

/**
 * Analyze care notes using AI with ultra-pedantic CQC compliance checking
 */
export async function analyzeCareNotes(
  apiKey: string,
  notesText: string,
  serviceUserName: string,
  anonymise: boolean = true,
  serviceUserFirstName?: string,
  serviceUserLastName?: string,
  replaceFirstNameWith?: string,
  replaceLastNameWith?: string
): Promise<{
  analysis: CareNoteAnalysisResult;
  summary: {
    totalNotes: number;
    averageScore: number;
    cqcComplianceRate: number;
    serviceUserName: string;
    auditDate: string;
  };
  nameMappings?: Array<{ original: string; abbreviated: string }>;
}> {
  const openai = new OpenAI({ apiKey });

  // Apply name replacement if anonymising
  let processedText = notesText;
  let clientName = serviceUserName;
  let nameMappings;

  if (anonymise && serviceUserFirstName && serviceUserLastName && replaceFirstNameWith && replaceLastNameWith) {
    const result = applyNameReplacement(
      notesText,
      serviceUserFirstName,
      serviceUserLastName,
      replaceFirstNameWith,
      replaceLastNameWith
    );
    processedText = result.text;
    clientName = result.displayName;
    
    nameMappings = [{
      original: `${serviceUserFirstName} ${serviceUserLastName}`,
      abbreviated: clientName
    }];
  }

  // Parse notes
  const notes = parseCareNotes(processedText);
  const numberOfNotes = notes.length;

  if (numberOfNotes === 0) {
    throw new Error('No care notes could be extracted from the provided content. Please check the format.');
  }

  // Format notes for the prompt
  const notesFormatted = notes
    .map((note, index) => {
      return `---NOTE ${index}---
Date: ${note.date || 'Unknown'}
Carer: ${note.carer || 'Unknown'}
Text: "${note.text}"
Word Count: ${note.text.split(/\s+/).filter(w => w.length > 0).length}`;
    })
    .join('\n\n');

  const systemMessage = `You are a CQC compliance expert specialising in care documentation. You analyse care notes with extreme attention to detail, identifying language issues, missing elements, and providing actionable feedback for carers. Always use British English spelling (analyse, personalised, organisation, behaviour, colour, etc.). Return ONLY valid JSON with properly escaped strings. No markdown formatting.`;

  const userPrompt = `Analyse ALL ${numberOfNotes} care notes for ${clientName} with EXTREME DETAIL for CQC compliance.

${notesFormatted}

For EACH note (use note index as key), provide comprehensive analysis in JSON format:

{
  "0": {
    "date": "extracted date or Unknown",
    "carer": "extracted carer name or Unknown",
    "original_note": "the original note text",
    "word_count": number,
    "overall_score": 0-100 (average of 5 scores below),
    "cqc_compliant": true/false (true only if overall_score >= 80),
    "length_detail_score": 0-100 (based on word count: <20=30%, 20-40=50%, 40-80=70%, 80+=90%),
    "person_centred_score": 0-100 (focus on person's experience, choices, preferences, dignity),
    "professional_language_score": 0-100 (avoids vague terms like 'fine', 'ok', passive voice, power language like 'allowed'),
    "outcome_focused_score": 0-100 (describes outcomes not just tasks performed),
    "evidence_based_score": 0-100 (includes specific observations, mood, engagement, responses),
    "language_issues": [
      {
        "problematic_text": "exact phrase from note",
        "explanation": "why this is problematic for CQC (be specific)",
        "use_instead": "specific alternative using ${clientName}'s name"
      }
    ],
    "whats_missing": [
      "Details on ${clientName}'s mood and engagement during the visit",
      "Information on choices offered (e.g., what to wear, eat, drink)",
      "Description of how dignity and respect were maintained",
      "Details about hydration (e.g., water kept within reach, drinks offered)",
      "Comfort measures taken (e.g., positioning, temperature, lighting)",
      "Safety observations (e.g., call bell within reach, environment check)",
      "Outcome-focused information (how ${clientName} responded to care)",
      "Evidence of person-centred approach (preferences respected)"
    ],
    "positive_aspects": ["what the note did well - be specific"],
    "improved_version": "COMPLETE rewrite (150-200 words) that fixes ALL issues, adds ALL missing elements, uses ${clientName}'s name, is CQC compliant and ready to copy/paste",
    "carer_feedback": "Hi [carer_name], this note [needs improvement/is good but could be improved/is excellent] for CQC compliance (Score: XX%):\\n\\nWhat's good:\\n- [specific positive]\\n\\nLanguage issues to fix:\\n1. Don't use '[problematic phrase]' - [explanation]\\n   Instead say: '[alternative]'\\n\\nWhat to add:\\n1. [specific instruction]\\n\\nPlease see the rewritten example above and use this style in future notes."
  }
}

IMPORTANT RULES:
1. Analyse EVERY note - do not skip any
2. Be ULTRA-PEDANTIC - even small issues matter for CQC
3. The "improved_version" must be a COMPLETE, ready-to-use note (150-200 words)
4. Use British English spelling throughout
5. Return ONLY valid JSON - no markdown, no explanations outside JSON
6. Escape all quotes in strings properly
7. Include at least 3 items in "whats_missing" for notes scoring below 80%
8. The "carer_feedback" should be personalised and constructive`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 16000,
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    
    // Clean markdown if present
    let cleanedText = resultText;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json?\s*/, '');
      cleanedText = cleanedText.replace(/\s*```$/, '');
    }

    let analysis: CareNoteAnalysisResult;
    try {
      analysis = JSON.parse(cleanedText) as CareNoteAnalysisResult;
    } catch (parseError) {
      // Try to fix common JSON issues
      let fixedText = cleanedText;
      fixedText = fixedText.replace(/,\s*([}\]])/g, '$1');
      
      const openBraces = (fixedText.match(/{/g) || []).length;
      const closeBraces = (fixedText.match(/}/g) || []).length;
      const openBrackets = (fixedText.match(/\[/g) || []).length;
      const closeBrackets = (fixedText.match(/\]/g) || []).length;
      
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        fixedText += ']';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        fixedText += '}';
      }
      
      analysis = JSON.parse(fixedText) as CareNoteAnalysisResult;
    }

    // Calculate summary statistics
    const noteKeys = Object.keys(analysis);
    const scores = noteKeys.map(key => analysis[key].overall_score || 0);
    const compliantCount = noteKeys.filter(key => analysis[key].cqc_compliant).length;
    
    const summary = {
      totalNotes: noteKeys.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0,
      cqcComplianceRate: noteKeys.length > 0 ? Math.round(compliantCount / noteKeys.length * 100 * 10) / 10 : 0,
      serviceUserName: clientName,
      auditDate: new Date().toLocaleDateString('en-GB'),
    };

    return {
      analysis,
      summary,
      nameMappings: anonymise ? nameMappings : undefined,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error(`Failed to analyse care notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  console.log('[AI Analysis] analyzeCarePlan function called');
  console.log('[AI Analysis] Content length:', content.length, 'characters');
  console.log('[AI Analysis] Service user name:', serviceUserName);
  console.log('[AI Analysis] Anonymise:', anonymise);
  console.log('[AI Analysis] API key provided:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');
  
  const openai = new OpenAI({ apiKey });
  console.log('[AI Analysis] OpenAI client initialized');

  // Anonymize if requested
  let processedContent = content;
  let nameMappings;
  let clientName = serviceUserName || 'the service user';

  if (anonymise && serviceUserName) {
    console.log('[AI Analysis] Anonymizing content - only replacing service user name:', serviceUserName);
    const { anonymizeSpecificName } = await import('./anonymization');
    const anonymized = anonymizeSpecificName(content, serviceUserName);
    processedContent = anonymized.anonymizedText;
    clientName = anonymized.abbreviation;
    
    nameMappings = [{
      original: serviceUserName,
      abbreviated: anonymized.abbreviation
    }];
    console.log('[AI Analysis] Anonymization complete. Replaced:', serviceUserName, '->', anonymized.abbreviation);
  }

  const systemMessage = `You are an ULTRA-PEDANTIC CQC compliance expert with ZERO TOLERANCE. Analyse with extreme scrutiny. Use British English spelling throughout.`;

  const { buildCarePlanAnalysisPrompt } = await import('./care-plan-analysis-prompt');
  const userPrompt = buildCarePlanAnalysisPrompt(clientName, processedContent);

  try {
    console.log('[AI Analysis] Calling OpenAI API');
    console.log('[AI Analysis] Model: gpt-4.1-mini');
    console.log('[AI Analysis] Prompt length:', userPrompt.length, 'characters');
    console.log('[AI Analysis] Max tokens: 16000');
    
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });
    const duration = Date.now() - startTime;
    
    console.log('[AI Analysis] OpenAI API call completed in', duration, 'ms');
    console.log('[AI Analysis] Response usage:', response.usage);

    const resultText = response.choices[0]?.message?.content || '{}';
    console.log('[AI Analysis] Response content length:', resultText.length, 'characters');
    console.log('[AI Analysis] Response preview:', resultText.substring(0, 200));
    
    // Clean markdown if present
    let cleanedText = resultText;
    if (cleanedText.startsWith('```')) {
      console.log('[AI Analysis] Cleaning markdown formatting');
      cleanedText = cleanedText.replace(/^```json?\s*/, '');
      cleanedText = cleanedText.replace(/\s*```$/, '');
    }

    console.log('[AI Analysis] Parsing JSON response');
    let analysis: CarePlanAnalysisResult;
    
    try {
      analysis = JSON.parse(cleanedText) as CarePlanAnalysisResult;
      console.log('[AI Analysis] JSON parsed successfully');
    } catch (parseError) {
      console.error('[AI Analysis] JSON parse error:', parseError instanceof Error ? parseError.message : String(parseError));
      console.error('[AI Analysis] Attempting to fix common JSON issues...');
      
      let fixedText = cleanedText;
      fixedText = fixedText.replace(/,\s*([}\]])/g, '$1');
      
      const openBraces = (fixedText.match(/{/g) || []).length;
      const closeBraces = (fixedText.match(/}/g) || []).length;
      const openBrackets = (fixedText.match(/\[/g) || []).length;
      const closeBrackets = (fixedText.match(/\]/g) || []).length;
      
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        fixedText += ']';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        fixedText += '}';
      }
      
      try {
        analysis = JSON.parse(fixedText) as CarePlanAnalysisResult;
        console.log('[AI Analysis] JSON parsed successfully after fixes');
      } catch (secondError) {
        console.error('[AI Analysis] Still unable to parse JSON after fixes');
        console.error('[AI Analysis] First 500 chars:', cleanedText.substring(0, 500));
        console.error('[AI Analysis] Last 500 chars:', cleanedText.substring(cleanedText.length - 500));
        throw parseError;
      }
    }

    return {
      analysis,
      nameMappings: anonymise ? nameMappings : undefined,
    };
  } catch (error) {
    console.error('[AI Analysis] ERROR in analyzeCarePlan:');
    console.error('[AI Analysis] Error type:', error?.constructor?.name);
    console.error('[AI Analysis] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[AI Analysis] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to analyse care plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
