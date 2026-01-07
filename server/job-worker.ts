/**
 * Background Job Worker for AI Care Plan Audits
 * 
 * This worker:
 * 1. Polls the database for pending jobs
 * 2. Processes jobs one at a time (or in parallel with concurrency control)
 * 3. Updates job status and progress in real-time
 * 4. Stores results and generated documents
 * 5. Sends notifications when complete
 * 6. Handles errors gracefully with retries
 */

import * as dbModule from './db';
import { aiAudits } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { analyzeCarePlanMultiPass } from './multi-pass-analyzer';
import { parseFile } from './file-parser';
import { generateCarePlanAnalysisDocument } from './document-generator';
import { Packer } from 'docx';
import { sendEmail } from './email';
import { toMySQLDatetime, now } from './utils/datetime';

interface JobContext {
  jobId: number;
  tenantId: number;
  locationId: number;
  auditType: 'care_plan' | 'daily_notes';
  documentUrl: string;
  documentKey: string;
  documentName: string;
  serviceUserName: string;
  serviceUserFirstName: string | null;
  serviceUserLastName: string | null;
  replaceFirstNameWith: string | null;
  replaceLastNameWith: string | null;
  keepOriginalNames: boolean;
  anonymise: boolean;
  requestedById: number;
  openaiApiKey: string;
}

// Worker status tracking
let workerStatus = {
  isRunning: false,
  startedAt: null as Date | null,
  lastPollAt: null as Date | null,
  jobsProcessed: 0,
  currentJobId: null as number | null,
  lastError: null as string | null,
};

/**
 * Get current worker status
 */
export function getWorkerStatus() {
  return {
    ...workerStatus,
    uptime: workerStatus.startedAt ? Date.now() - workerStatus.startedAt.getTime() : 0,
  };
}

/**
 * Main worker loop
 */
export async function startJobWorker() {
  console.log('[Job Worker] Starting AI audit job worker');
  console.log('[Job Worker] Polling interval: 5 seconds');
  console.log('[Job Worker] Max concurrent jobs: 1');
  
  // Update worker status
  workerStatus.isRunning = true;
  workerStatus.startedAt = new Date();
  
  let isProcessing = false;
  
  // Poll for jobs every 5 seconds
  setInterval(async () => {
    workerStatus.lastPollAt = new Date();
    
    if (isProcessing) {
      return; // Skip if already processing a job
    }
    
    try {
      isProcessing = true;
      await processNextJob();
      isProcessing = false;
    } catch (error) {
      console.error('[Job Worker] Error in main loop:', error);
      workerStatus.lastError = error instanceof Error ? error.message : String(error);
      isProcessing = false;
    }
  }, 5000);
  
  console.log('[Job Worker] Worker started successfully');
}

/**
 * Process the next pending job
 */
async function processNextJob() {
  try {
    // Find the oldest pending job
    const db = await dbModule.getDb();
    if (!db) {
      console.error('[Job Worker] Database not available');
      return;
    }
    
    const pendingJobs = await db
      .select()
      .from(aiAudits)
      .where(eq(aiAudits.status, 'pending'))
      .orderBy(aiAudits.createdAt)
      .limit(1);
    
    if (pendingJobs.length === 0) {
      return; // No pending jobs
    }
    
    const job = pendingJobs[0];
    console.log(`[Job Worker] Found pending job: ${job.id}`);
    
    // Update worker status
    workerStatus.currentJobId = job.id;
    
    // Mark as processing
    await db
      .update(aiAudits)
      .set({
        status: 'processing',
        progress: 'Starting analysis...',
        updatedAt: now(),
      })
      .where(eq(aiAudits.id, job.id));
    
    console.log(`[Job Worker] Job ${job.id} marked as processing`);
    
    // Get company/tenant info for API key
    const { getCompanyByTenantId } = await import('./db');
    const company = await getCompanyByTenantId(job.tenantId);
    
    if (!company?.openaiApiKey) {
      throw new Error('OpenAI API key not configured for this organization');
    }
    
    // Build job context with new name fields
    const context: JobContext = {
      jobId: job.id,
      tenantId: job.tenantId,
      locationId: job.locationId,
      auditType: job.auditType as 'care_plan' | 'daily_notes',
      documentUrl: job.documentUrl || '',
      documentKey: job.documentKey || '',
      documentName: job.documentName || 'Unknown',
      serviceUserName: job.serviceUserName || '',
      serviceUserFirstName: job.serviceUserFirstName || null,
      serviceUserLastName: job.serviceUserLastName || null,
      replaceFirstNameWith: job.replaceFirstNameWith || null,
      replaceLastNameWith: job.replaceLastNameWith || null,
      keepOriginalNames: job.keepOriginalNames === 1,
      anonymise: job.anonymise === 1,
      requestedById: job.requestedById || 0,
      openaiApiKey: company.openaiApiKey,
    };
    
    // Process the job
    await processJob(context);
    
    // Update worker status
    workerStatus.jobsProcessed++;
    workerStatus.currentJobId = null;
    
  } catch (error) {
    console.error('[Job Worker] Error processing job:', error);
    workerStatus.lastError = error instanceof Error ? error.message : String(error);
    workerStatus.currentJobId = null;
  }
}

/**
 * Replace names in text with specified replacements
 * Handles case variations and possessives
 */
function replaceNamesInText(
  text: string,
  firstName: string,
  lastName: string,
  replaceFirstWith: string,
  replaceLastWith: string
): { processedText: string; replacementsMade: number } {
  let processedText = text;
  let replacementsMade = 0;
  
  // Helper to create case-insensitive regex that preserves word boundaries
  const createNameRegex = (name: string) => {
    // Escape special regex characters
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the name with optional possessive 's
    return new RegExp(`\\b${escaped}('s)?\\b`, 'gi');
  };
  
  // Replace full name first (to avoid partial replacements)
  const fullName = `${firstName} ${lastName}`;
  const fullReplacement = `${replaceFirstWith} ${replaceLastWith}`;
  const fullNameRegex = createNameRegex(fullName);
  
  processedText = processedText.replace(fullNameRegex, (match) => {
    replacementsMade++;
    // Preserve possessive if present
    if (match.toLowerCase().endsWith("'s")) {
      return `${fullReplacement}'s`;
    }
    return fullReplacement;
  });
  
  // Replace first name
  const firstNameRegex = createNameRegex(firstName);
  processedText = processedText.replace(firstNameRegex, (match) => {
    replacementsMade++;
    if (match.toLowerCase().endsWith("'s")) {
      return `${replaceFirstWith}'s`;
    }
    return replaceFirstWith;
  });
  
  // Replace last name
  const lastNameRegex = createNameRegex(lastName);
  processedText = processedText.replace(lastNameRegex, (match) => {
    replacementsMade++;
    if (match.toLowerCase().endsWith("'s")) {
      return `${replaceLastWith}'s`;
    }
    return replaceLastWith;
  });
  
  return { processedText, replacementsMade };
}

/**
 * Process a single job
 */
async function processJob(context: JobContext) {
  const { 
    jobId, 
    tenantId, 
    auditType,
    openaiApiKey, 
    serviceUserName, 
    serviceUserFirstName,
    serviceUserLastName,
    replaceFirstNameWith,
    replaceLastNameWith,
    keepOriginalNames,
    anonymise, 
    documentUrl, 
    documentKey, 
    documentName 
  } = context;
  
  console.log(`[Job Worker] Processing ${auditType} audit job ${jobId}`);
  
  // Get database connection
  const db = await dbModule.getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  
  try {
    console.log(`[Job Worker] Processing job ${jobId}`);
    console.log(`[Job Worker] Name settings: firstName=${serviceUserFirstName}, lastName=${serviceUserLastName}, keepOriginal=${keepOriginalNames}`);
    
    // Step 1: Download and parse the document
    await updateJobProgress(jobId, 'Downloading document...');
    
    let fileBuffer: Buffer;
    
    // Check if we have a URL or need to fetch from temp storage
    if (documentUrl && documentUrl.startsWith('temp://')) {
      // Read from temporary file storage
      const { readFile, unlink } = await import('fs/promises');
      const { join } = await import('path');
      const fileId = documentUrl.replace('temp://', '');
      const tempPath = join(process.cwd(), 'temp-uploads', fileId);
      
      console.log(`[Job Worker] Reading temp file: ${tempPath}`);
      fileBuffer = await readFile(tempPath);
      console.log(`[Job Worker] Temp file read: ${fileBuffer.length} bytes`);
      
      // Note: File will be deleted after successful processing (see cleanup at end)
    } else if (documentUrl && documentUrl.startsWith('data:')) {
      // Extract base64 data from data URL
      const base64Data = documentUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URL format');
      }
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (documentUrl && documentUrl.startsWith('http')) {
      // Download from URL
      const response = await fetch(documentUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      fileBuffer = Buffer.from(await response.arrayBuffer());
    } else if (documentKey) {
      // Fetch from S3 (implement S3 download)
      // For now, throw error as S3 integration needs to be implemented
      throw new Error('S3 document storage not yet implemented. Please use direct file upload.');
    } else {
      throw new Error('No document URL or key provided');
    }
    
    console.log(`[Job Worker] Document downloaded: ${fileBuffer.length} bytes`);
    
    // Step 2: Parse the document
    await updateJobProgress(jobId, 'Parsing document...');
    const parsed = await parseFile(fileBuffer, documentName);
    console.log(`[Job Worker] Document parsed: ${parsed.text.length} characters`);
    
    // Step 3: Apply name replacement if not keeping original names
    let processedContent = parsed.text;
    let nameMappings: Array<{ original: string; replacement: string }> = [];
    let displayName = serviceUserName; // Name to show in report
    
    if (!keepOriginalNames && serviceUserFirstName && serviceUserLastName && replaceFirstNameWith && replaceLastNameWith) {
      await updateJobProgress(jobId, 'Applying name replacements...');
      
      const result = replaceNamesInText(
        parsed.text,
        serviceUserFirstName,
        serviceUserLastName,
        replaceFirstNameWith,
        replaceLastNameWith
      );
      
      processedContent = result.processedText;
      displayName = `${replaceFirstNameWith} ${replaceLastNameWith}`;
      
      nameMappings = [
        { original: serviceUserFirstName, replacement: replaceFirstNameWith },
        { original: serviceUserLastName, replacement: replaceLastNameWith },
      ];
      
      console.log(`[Job Worker] Name replacement applied: ${result.replacementsMade} replacements made`);
      console.log(`[Job Worker] ${serviceUserFirstName} ${serviceUserLastName} -> ${replaceFirstNameWith} ${replaceLastNameWith}`);
    } else if (keepOriginalNames) {
      console.log(`[Job Worker] Keeping original names as requested (consent confirmed)`);
      displayName = serviceUserName;
    } else {
      // Fallback to old anonymization if new fields not provided
      console.log(`[Job Worker] No name replacement configured, using original content`);
    }
    
    // Step 4: Run analysis based on audit type
    await updateJobProgress(jobId, 'Starting AI analysis...');
    
    let result: any;
    let documentBuffer: Buffer;
    
    if (auditType === 'daily_notes') {
      // Care Notes Analysis
      const { analyzeCareNotesWithProgress, generateCareNotesDocument } = await import('./care-notes-worker');
      
      result = await analyzeCareNotesWithProgress(
        openaiApiKey,
        processedContent,
        displayName,
        serviceUserFirstName || '',
        serviceUserLastName || '',
        replaceFirstNameWith || '',
        replaceLastNameWith || '',
        keepOriginalNames,
        (progress: string) => updateJobProgress(jobId, progress)
      );
      
      console.log(`[Job Worker] Care notes analysis complete: ${result.summary?.totalNotes || 0} notes analysed`);
      
      // Generate Word document for care notes
      await updateJobProgress(jobId, 'Generating report document...');
      const doc = generateCareNotesDocument(displayName, result);
      documentBuffer = await Packer.toBuffer(doc);
      
    } else {
      // Care Plan Analysis (default)
      result = await analyzeCarePlanMultiPassWithProgress(
        openaiApiKey,
        processedContent,
        displayName,
        (progress: string) => updateJobProgress(jobId, progress)
      );
      
      console.log(`[Job Worker] Care plan analysis complete: ${result.sections?.length || 0} sections analysed`);
      
      // Generate Word document for care plan
      await updateJobProgress(jobId, 'Generating report document...');
      const doc = generateCarePlanAnalysisDocument(
        displayName,
        new Date().toISOString().split('T')[0],
        result as any
      );
      documentBuffer = await Packer.toBuffer(doc);
    }
    
    console.log(`[Job Worker] Document generated: ${documentBuffer.length} bytes`);
    
    // Step 6: Prepare document for database storage
    await updateJobProgress(jobId, 'Saving report document...');
    
    const timestamp = Date.now();
    const sanitizedName = documentName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${jobId}-${sanitizedName}.docx`;
    
    console.log(`[Job Worker] Document prepared: ${fileName} (${documentBuffer.length} bytes)`);
    
    // Store filename for download endpoint (actual data stored in database)
    const reportKey = fileName;
    const reportUrl = `/api/reports/${fileName}`;
    
    // Step 7: Save results to database
    await updateJobProgress(jobId, 'Saving results...');
    
    await db
      .update(aiAudits)
      .set({
        status: 'completed',
        progress: 'Analysis complete',
        score: result.overall_score,
        reportDocumentUrl: reportUrl,
        reportDocumentKey: reportKey,
        reportDocumentData: documentBuffer, // Store document binary in database
        detailedAnalysisJson: JSON.stringify({
          analysis: result,
          nameMappings: nameMappings,
          fileMetadata: parsed.metadata,
          displayName: displayName,
        }),
        processedAt: now(),
        updatedAt: now(),
      })
      .where(eq(aiAudits.id, jobId));
    
    console.log(`[Job Worker] Job ${jobId} completed successfully`);
    
    // Step 8: Clean up temp file if it exists
    if (documentUrl && documentUrl.startsWith('temp://')) {
      try {
        const { unlink } = await import('fs/promises');
        const { join } = await import('path');
        const fileId = documentUrl.replace('temp://', '');
        const tempPath = join(process.cwd(), 'temp-uploads', fileId);
        await unlink(tempPath);
        console.log(`[Job Worker] Temp file deleted: ${tempPath}`);
      } catch (cleanupError) {
        console.error(`[Job Worker] Failed to delete temp file:`, cleanupError);
        // Don't fail the job if cleanup fails
      }
    }
    
    // Step 9: Send notification
    await sendJobCompletionNotification(context);
    
  } catch (error) {
    console.error(`[Job Worker] Job ${jobId} failed:`, error);
    
    // Mark job as failed
    const db = await dbModule.getDb();
    if (db) {
      await db
        .update(aiAudits)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          updatedAt: now(),
        })
        .where(eq(aiAudits.id, jobId));
    }
    
    // Send failure notification
    await sendJobFailureNotification(context, error);
    
    // Re-throw to update worker status
    throw error;
  }
}

/**
 * Update job progress in database
 */
async function updateJobProgress(jobId: number, progress: string) {
  console.log(`[Job Worker] Job ${jobId} progress: ${progress}`);
  
  const db = await dbModule.getDb();
  if (!db) {
    console.error('[Job Worker] Database not available for progress update');
    return;
  }
  
  await db
    .update(aiAudits)
    .set({
      progress: progress,
      updatedAt: now(),
    })
    .where(eq(aiAudits.id, jobId));
}

/**
 * Wrapper for multi-pass analyzer with progress callbacks
 */
async function analyzeCarePlanMultiPassWithProgress(
  apiKey: string,
  content: string,
  serviceUserName: string,
  onProgress: (progress: string) => Promise<void>
) {
  // Import the analyzer
  const { parseCarePlanIntoSections } = await import('./care-plan-parser');
  const { analyzeSingleSection } = await import('./section-analyzer');
  
  // Parse sections
  await onProgress('Parsing care plan sections...');
  const sections = parseCarePlanIntoSections(content);
  console.log(`[Multi-Pass] Found ${sections.length} sections`);
  
  // Analyze each section with progress updates
  const sectionResults = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    await onProgress(`Analysing section ${i + 1}/${sections.length}: ${section.section_name}`);
    
    try {
      const result = await analyzeSingleSection(apiKey, section, serviceUserName);
      sectionResults.push(result);
    } catch (error) {
      console.error(`[Multi-Pass] Failed to analyse section ${i + 1}:`, error);
      // Add placeholder result
      sectionResults.push({
        section_name: section.section_name,
        section_score: 0,
        extracted_content: section.fields,
        metadata: section.metadata,
        issues: [{
          issue_number: 1,
          severity: 'CRITICAL' as const,
          field: 'Analysis',
          current_text: 'Analysis failed',
          problems_identified: ['Technical error during analysis'],
          whats_missing: [],
          ideal_example: 'N/A',
          cqc_requirement: 'N/A',
          recommendation: 'Retry analysis',
        }],
      });
    }
  }
  
  // Calculate overall stats
  await onProgress('Calculating overall statistics...');
  
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
  
  return {
    overall_score: overallScore,
    summary: {
      sections_analyzed: sectionResults.length,
      critical_issues: criticalCount,
      major_issues: majorCount,
      minor_issues: minorCount,
    },
    sections: sectionResults,
    missing_sections: [],
  };
}

/**
 * Send job completion notification
 */
async function sendJobCompletionNotification(context: JobContext) {
  try {
    console.log(`[Job Worker] Sending completion notification for job ${context.jobId}`);
    
    // Get user email
    const { getUserById } = await import('./db');
    const user = await getUserById(context.requestedById);
    
    if (!user?.email) {
      console.warn(`[Job Worker] No email found for user ${context.requestedById}`);
      return;
    }
    
    // Send email
    const auditTypeName = context.auditType === 'daily_notes' ? 'Care Notes' : 'Care Plan';
    const auditPageUrl = context.auditType === 'daily_notes' 
      ? 'https://app.ccms.co.uk/ai-care-notes-audit'
      : `https://app.ccms.co.uk/ai-care-plan-audits/${context.jobId}`;
    
    await sendEmail({
      to: user.email,
      subject: `AI ${auditTypeName} Audit Complete`,
      html: `
        <h2>Your AI ${auditTypeName} Audit is Ready</h2>
        <p>The AI analysis for <strong>${context.serviceUserName || context.documentName}</strong> has been completed.</p>
        <p><a href="${auditPageUrl}">View Results</a></p>
        <p>You can also download the detailed report from the audits page.</p>
      `,
    });
    
    // Create in-app notification
    const db = await dbModule.getDb();
    if (!db) {
      console.error('[Job Worker] Database not available for notification');
      return;
    }
    
    const { notifications } = await import('../drizzle/schema');
    await db.insert(notifications).values({
      tenantId: context.tenantId,
      userId: context.requestedById,
      notificationType: 'ai_audit_complete',
      title: `AI ${auditTypeName} Audit Complete`,
      message: `The AI ${auditTypeName.toLowerCase()} analysis for ${context.serviceUserName || context.documentName} has been completed. View the results now.`,
      relatedEntityId: context.jobId,
      relatedEntityType: 'ai_audit',
      isRead: 0,
        createdAt: now(),
    });
    
    // Mark notification as sent
    await db
      .update(aiAudits)
      .set({
        notificationSent: 1,
        notificationSentAt: now(),
      })
      .where(eq(aiAudits.id, context.jobId));
    
    console.log(`[Job Worker] Notification sent successfully`);
    
  } catch (error) {
    console.error(`[Job Worker] Failed to send notification:`, error);
  }
}

/**
 * Send job failure notification
 */
async function sendJobFailureNotification(context: JobContext, error: unknown) {
  try {
    console.log(`[Job Worker] Sending failure notification for job ${context.jobId}`);
    
    const { getUserById } = await import('./db');
    const user = await getUserById(context.requestedById);
    
    if (!user?.email) {
      return;
    }
    
    const auditTypeName = context.auditType === 'daily_notes' ? 'Care Notes' : 'Care Plan';
    
    await sendEmail({
      to: user.email,
      subject: `AI ${auditTypeName} Audit Failed`,
      html: `
        <h2>AI ${auditTypeName} Audit Failed</h2>
        <p>Unfortunately, the AI analysis for <strong>${context.serviceUserName || context.documentName}</strong> could not be completed.</p>
        <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
        <p>Please try again or contact support if the problem persists.</p>
      `,
    });
    
  } catch (emailError) {
    console.error(`[Job Worker] Failed to send failure notification:`, emailError);
  }
}
