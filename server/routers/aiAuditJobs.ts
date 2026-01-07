/**
 * tRPC Router for AI Audit Jobs
 * Handles async job submission, status checking, and results retrieval
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbModule from "../db";
import { aiAudits } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const aiAuditJobsRouter = router({
  /**
   * Submit a care plan audit job
   */
  submitCarePlanAudit: protectedProcedure
    .input(
      z.object({
        fileId: z.string(), // temp file ID from upload
        fileName: z.string(),
        fileType: z.string(),
        serviceUserName: z.string(),
        serviceUserFirstName: z.string(),
        serviceUserLastName: z.string(),
        keepOriginalNames: z.boolean().default(false),
        replaceFirstNameWith: z.string().nullable().optional(),
        replaceLastNameWith: z.string().nullable().optional(),
        consentConfirmed: z.boolean().default(false),
        anonymise: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      console.log('[aiAuditJobs] Creating job for file:', input.fileId);
      console.log('[aiAuditJobs] Name settings:', {
        firstName: input.serviceUserFirstName,
        lastName: input.serviceUserLastName,
        keepOriginal: input.keepOriginalNames,
        replaceFirst: input.replaceFirstNameWith,
        replaceLast: input.replaceLastNameWith,
      });

      // Create job record with temp file reference
      const now = new Date();
      const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      // Fetch file from temp_files table and create data URL
      let tempFileResult;
      try {
        tempFileResult = await db.execute(sql`
          SELECT file_data, mime_type FROM temp_files WHERE id = ${input.fileId}
        `) as any;
        console.log('[aiAuditJobs] Query result type:', typeof tempFileResult);
        console.log('[aiAuditJobs] Query result is array:', Array.isArray(tempFileResult));
        console.log('[aiAuditJobs] Query result length:', tempFileResult?.length);
      } catch (error) {
        console.error('[aiAuditJobs] Query error:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to fetch uploaded file from database." 
        });
      }
      
      // Handle different possible result structures
      let rows;
      if (Array.isArray(tempFileResult)) {
        if (tempFileResult.length > 0 && Array.isArray(tempFileResult[0])) {
          rows = tempFileResult[0]; // [rows, fields] format
        } else {
          rows = tempFileResult; // Direct rows array
        }
      } else {
        console.error('[aiAuditJobs] Unexpected result structure:', tempFileResult);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Unexpected database response format." 
        });
      }
      
      console.log('[aiAuditJobs] Rows:', rows?.length, 'rows found');
      
      if (!rows || rows.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Uploaded file not found. Please upload again." 
        });
      }
      
      const tempFile = rows[0];
      if (!tempFile.mime_type || !tempFile.file_data) {
        console.error('[aiAuditJobs] Invalid temp file data:', Object.keys(tempFile));
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Uploaded file data is incomplete." 
        });
      }
      
      const dataUrl = `data:${tempFile.mime_type};base64,${tempFile.file_data}`;
      
      const [job] = await db.insert(aiAudits).values({
        tenantId: ctx.user.tenantId,
        locationId: 0,
        auditType: 'care_plan',
        documentName: input.fileName,
        documentUrl: dataUrl, // Store full data URL in job
        documentKey: input.fileId,
        serviceUserName: input.serviceUserName || '',
        serviceUserFirstName: input.serviceUserFirstName || null,
        serviceUserLastName: input.serviceUserLastName || null,
        replaceFirstNameWith: input.replaceFirstNameWith || null,
        replaceLastNameWith: input.replaceLastNameWith || null,
        keepOriginalNames: input.keepOriginalNames ? 1 : 0,
        consentConfirmed: input.consentConfirmed ? 1 : 0,
        anonymise: input.anonymise ? 1 : 0,
        status: 'pending',
        progress: 'Queued for processing',
        requestedById: ctx.user.userId,
        createdAt: mysqlDatetime,
        updatedAt: mysqlDatetime,
      });
      
      // Delete temp file after creating job
      await db.execute(sql`DELETE FROM temp_files WHERE id = ${input.fileId}`);

      console.log('[aiAuditJobs] Job created:', job.insertId);

      return {
        success: true,
        jobId: job.insertId,
        message: 'Analysis job submitted successfully',
      };
    }),

  /**
   * Submit a care notes audit job
   */
  submitCareNotesAudit: protectedProcedure
    .input(
      z.object({
        fileId: z.string(), // temp file ID from upload
        fileName: z.string(),
        fileType: z.string(),
        serviceUserName: z.string(),
        serviceUserFirstName: z.string(),
        serviceUserLastName: z.string(),
        keepOriginalNames: z.boolean().default(false),
        replaceFirstNameWith: z.string().nullable().optional(),
        replaceLastNameWith: z.string().nullable().optional(),
        consentConfirmed: z.boolean().default(false),
        anonymise: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      console.log('[aiAuditJobs] Creating care notes job for file:', input.fileId);
      console.log('[aiAuditJobs] Name settings:', {
        firstName: input.serviceUserFirstName,
        lastName: input.serviceUserLastName,
        keepOriginal: input.keepOriginalNames,
        replaceFirst: input.replaceFirstNameWith,
        replaceLast: input.replaceLastNameWith,
      });

      // Create job record with temp file reference
      const now = new Date();
      const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      // Fetch file from temp_files table and create data URL
      let tempFileResult;
      try {
        tempFileResult = await db.execute(sql`
          SELECT file_data, mime_type FROM temp_files WHERE id = ${input.fileId}
        `) as any;
      } catch (error) {
        console.error('[aiAuditJobs] Query error:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to fetch uploaded file from database." 
        });
      }
      
      // Handle different possible result structures
      let rows;
      if (Array.isArray(tempFileResult)) {
        if (tempFileResult.length > 0 && Array.isArray(tempFileResult[0])) {
          rows = tempFileResult[0]; // [rows, fields] format
        } else {
          rows = tempFileResult; // Direct rows array
        }
      } else {
        console.error('[aiAuditJobs] Unexpected result structure:', tempFileResult);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Unexpected database response format." 
        });
      }
      
      if (!rows || rows.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Uploaded file not found. Please upload again." 
        });
      }
      
      const tempFile = rows[0];
      if (!tempFile.mime_type || !tempFile.file_data) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Uploaded file data is incomplete." 
        });
      }
      
      const dataUrl = `data:${tempFile.mime_type};base64,${tempFile.file_data}`;
      
      const [job] = await db.insert(aiAudits).values({
        tenantId: ctx.user.tenantId,
        locationId: 0,
        auditType: 'daily_notes', // Different audit type
        documentName: input.fileName,
        documentUrl: dataUrl,
        documentKey: input.fileId,
        serviceUserName: input.serviceUserName || '',
        serviceUserFirstName: input.serviceUserFirstName || null,
        serviceUserLastName: input.serviceUserLastName || null,
        replaceFirstNameWith: input.replaceFirstNameWith || null,
        replaceLastNameWith: input.replaceLastNameWith || null,
        keepOriginalNames: input.keepOriginalNames ? 1 : 0,
        consentConfirmed: input.consentConfirmed ? 1 : 0,
        anonymise: input.anonymise ? 1 : 0,
        status: 'pending',
        progress: 'Queued for processing',
        requestedById: ctx.user.userId,
        createdAt: mysqlDatetime,
        updatedAt: mysqlDatetime,
      });
      
      // Delete temp file after creating job
      await db.execute(sql`DELETE FROM temp_files WHERE id = ${input.fileId}`);

      console.log('[aiAuditJobs] Care notes job created:', job.insertId);

      return {
        success: true,
        jobId: job.insertId,
        message: 'Care notes analysis job submitted successfully',
      };
    }),

  /**
   * Get all audit jobs for the current user's tenant
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
        auditType: z.enum(['care_plan', 'daily_notes']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const limit = input?.limit || 50;
      const offset = input?.offset || 0;
      const status = input?.status;
      const auditType = input?.auditType;

      // Build where conditions
      const conditions = [eq(aiAudits.tenantId, ctx.user.tenantId)];
      
      if (status) {
        conditions.push(eq(aiAudits.status, status));
      }
      
      if (auditType) {
        conditions.push(eq(aiAudits.auditType, auditType));
      }

      // Build query with all conditions
      const query = db
        .select()
        .from(aiAudits)
        .where(and(...conditions))
        .orderBy(desc(aiAudits.createdAt))
        .limit(limit)
        .offset(offset);

      const jobs = await query;

      return {
        jobs: jobs.map(job => ({
          id: job.id,
          documentName: job.documentName,
          serviceUserName: job.serviceUserName,
          status: job.status,
          progress: job.progress,
          score: job.score,
          createdAt: job.createdAt,
          processedAt: job.processedAt,
          errorMessage: job.errorMessage,
          auditType: job.auditType,
        })),
        total: jobs.length,
        hasMore: jobs.length === limit,
      };
    }),

  /**
   * Get a single audit job by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [job] = await db
        .select()
        .from(aiAudits)
        .where(
          and(
            eq(aiAudits.id, input.id),
            eq(aiAudits.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Audit job not found" });
      }

      // Parse detailed analysis if available
      let detailedAnalysis = null;
      if (job.detailedAnalysisJson) {
        try {
          detailedAnalysis = JSON.parse(job.detailedAnalysisJson);
        } catch (error) {
          console.error('[AI Audit Jobs] Failed to parse detailed analysis JSON:', error);
        }
      }

      return {
        id: job.id,
        documentName: job.documentName,
        serviceUserName: job.serviceUserName,
        anonymise: job.anonymise === 1,
        status: job.status,
        progress: job.progress,
        score: job.score,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        errorMessage: job.errorMessage,
        detailedAnalysis: detailedAnalysis,
      };
    }),

  /**
   * Get job status (lightweight endpoint for polling)
   */
  getStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [job] = await db
        .select({
          id: aiAudits.id,
          status: aiAudits.status,
          progress: aiAudits.progress,
          errorMessage: aiAudits.errorMessage,
          processedAt: aiAudits.processedAt,
        })
        .from(aiAudits)
        .where(
          and(
            eq(aiAudits.id, input.id),
            eq(aiAudits.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Audit job not found" });
      }

      return job;
    }),

  /**
   * Download report document
   */
  downloadReport: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      console.log('[downloadReport] Request received for job ID:', input.id);
      console.log('[downloadReport] User tenantId:', ctx.user?.tenantId);
      
      if (!ctx.user?.tenantId) {
        console.error('[downloadReport] No tenantId found');
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      console.log('[downloadReport] Querying database for job');
      const [job] = await db
        .select()
        .from(aiAudits)
        .where(
          and(
            eq(aiAudits.id, input.id),
            eq(aiAudits.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!job) {
        console.error('[downloadReport] Job not found');
        throw new TRPCError({ code: "NOT_FOUND", message: "Audit job not found" });
      }
      
      console.log('[downloadReport] Job found:', { id: job.id, status: job.status, reportDocumentUrl: job.reportDocumentUrl });

      if (job.status !== 'completed') {
        console.error('[downloadReport] Job not completed, status:', job.status);
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Report is not ready yet. Job status: " + job.status 
        });
      }

      // Check if report document data exists in database
      let documentBuffer: Buffer;
      
      if (!job.reportDocumentData) {
        console.log('[downloadReport] No reportDocumentData found, attempting to regenerate from analysis...');
        
        // Try to regenerate from stored analysis data
        if (!job.detailedAnalysisJson) {
          console.error('[downloadReport] No analysis data found to regenerate document');
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "Report document not found and cannot be regenerated." 
          });
        }
        
        try {
          // Import document generator
          const { generateCarePlanAnalysisDocument } = await import('../document-generator');
          const { Packer } = await import('docx');
          
          // Parse stored analysis
          const analysisData = JSON.parse(job.detailedAnalysisJson);
          const result = analysisData.analysis;
          
          console.log('[downloadReport] Regenerating document from stored analysis...');
          console.log('[downloadReport] Analysis has', result?.summary?.sections_analyzed || 0, 'sections');
          
          // Generate document (3 parameters: clientName, analysisDate, analysis)
          const doc = generateCarePlanAnalysisDocument(
            job.serviceUserName || 'Service User',
            new Date().toISOString().split('T')[0],
            result
          );
          
          documentBuffer = await Packer.toBuffer(doc);
          console.log('[downloadReport] Document regenerated:', documentBuffer.length, 'bytes');
          
          // Save regenerated document to database for future downloads
          await db
            .update(aiAudits)
            .set({ reportDocumentData: documentBuffer })
            .where(eq(aiAudits.id, input.id));
          console.log('[downloadReport] Regenerated document saved to database');
          
        } catch (regenError) {
          console.error('[downloadReport] Failed to regenerate document:', regenError);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to regenerate report document." 
          });
        }
      } else {
        documentBuffer = Buffer.from(job.reportDocumentData);
      }

      // Convert buffer to base64 for transmission
      const base64Data = documentBuffer.toString('base64');
      const filename = job.reportDocumentKey || `AI_Audit_${job.serviceUserName || job.documentName}_${new Date().toISOString().split('T')[0]}.docx`;
      
      console.log('[downloadReport] Returning document data:', { filename, dataLength: base64Data.length });
      
      return {
        data: base64Data,
        filename: filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
    }),

  /**
   * Delete an audit job
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }

      const db = await dbModule.getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Verify ownership
      const [job] = await db
        .select()
        .from(aiAudits)
        .where(
          and(
            eq(aiAudits.id, input.id),
            eq(aiAudits.tenantId, ctx.user.tenantId)
          )
        )
        .limit(1);

      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Audit job not found" });
      }

      // Delete physical file if it exists
      if (job.reportDocumentKey) {
        try {
          const { unlink } = await import('fs/promises');
          const { join } = await import('path');
          const reportsDir = join(process.cwd(), 'reports');
          const filePath = join(reportsDir, job.reportDocumentKey);
          await unlink(filePath);
          console.log(`[AI Audit Jobs] Deleted file: ${job.reportDocumentKey}`);
        } catch (error: any) {
          // File might not exist, log but don't fail
          if (error.code !== 'ENOENT') {
            console.error(`[AI Audit Jobs] Error deleting file:`, error);
          }
        }
      }

      // Delete the job from database
      await db
        .delete(aiAudits)
        .where(eq(aiAudits.id, input.id));

      return { success: true };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    }

    const db = await dbModule.getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const allJobs = await db
      .select()
      .from(aiAudits)
      .where(eq(aiAudits.tenantId, ctx.user.tenantId));

    const stats = {
      total: allJobs.length,
      pending: allJobs.filter(j => j.status === 'pending').length,
      processing: allJobs.filter(j => j.status === 'processing').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      failed: allJobs.filter(j => j.status === 'failed').length,
      averageScore: 0,
    };

    const completedJobs = allJobs.filter(j => j.status === 'completed' && j.score);
    if (completedJobs.length > 0) {
      const totalScore = completedJobs.reduce((sum, j) => sum + (j.score || 0), 0);
      stats.averageScore = Math.round(totalScore / completedJobs.length);
    }

    return stats;
  }),
});
