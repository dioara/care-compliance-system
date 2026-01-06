/**
 * tRPC Router for AI Audit Jobs
 * Handles async job submission, status checking, and results retrieval
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbModule from "../db";
import { aiAudits } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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

      // Create job record with temp file reference
      const now = new Date();
      const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      // Check if fileId is a data URL or a file reference
      const documentUrl = input.fileId.startsWith('data:') 
        ? input.fileId // Direct data URL
        : `temp://${input.fileId}`; // Legacy temp file reference
      
      const [job] = await db.insert(aiAudits).values({
        tenantId: ctx.user.tenantId,
        locationId: 0,
        auditType: 'care_plan',
        documentName: input.fileName,
        documentUrl: documentUrl,
        documentKey: input.fileId.startsWith('data:') ? '' : input.fileId,
        serviceUserName: input.serviceUserName || '',
        anonymise: input.anonymise ? 1 : 0,
        status: 'pending',
        progress: 'Queued for processing',
        requestedById: ctx.user.userId,
        createdAt: mysqlDatetime,
        updatedAt: mysqlDatetime,
      });

      console.log('[aiAuditJobs] Job created:', job.insertId);

      return {
        success: true,
        jobId: job.insertId,
        message: 'Analysis job submitted successfully',
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

      // Build query
      let query = db
        .select()
        .from(aiAudits)
        .where(eq(aiAudits.tenantId, ctx.user.tenantId))
        .orderBy(desc(aiAudits.createdAt))
        .limit(limit)
        .offset(offset);

      // Add status filter if provided
      if (status) {
        query = db
          .select()
          .from(aiAudits)
          .where(
            and(
              eq(aiAudits.tenantId, ctx.user.tenantId),
              eq(aiAudits.status, status)
            )
          )
          .orderBy(desc(aiAudits.createdAt))
          .limit(limit)
          .offset(offset);
      }

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

      if (job.status !== 'completed') {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Report is not ready yet. Job status: " + job.status 
        });
      }

      // Check if report document URL exists
      if (!job.reportDocumentUrl) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Report document not found" 
        });
      }

      // Return the download URL
      return {
        downloadUrl: job.reportDocumentUrl,
        filename: job.reportDocumentKey || `AI_Audit_${job.serviceUserName || job.documentName}_${new Date().toISOString().split('T')[0]}.docx`,
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
