/**
 * Error Monitoring Router
 * 
 * Handles error logging and error report management
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as errorService from "./services/errorLoggingService";

// Super admin middleware
const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.superAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only super admins can access error monitoring",
    });
  }
  return next({ ctx });
});

export const errorMonitoringRouter = router({
  // ============================================================================
  // ERROR LOGS (Admin/Super Admin only)
  // ============================================================================
  
  logError: protectedProcedure
    .input(z.object({
      errorType: z.string(),
      errorCode: z.string().optional(),
      errorMessage: z.string(),
      stackTrace: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      ipAddress: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    }))
    .mutation(async ({ ctx, input }) => {
      return await errorService.createErrorLog({
        ...input,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
      });
    }),

  getErrorLogs: superAdminProcedure
    .input(z.object({
      userId: z.number().optional(),
      errorType: z.string().optional(),
      severity: z.string().optional(),
      resolved: z.boolean().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await errorService.getErrorLogs({
        ...input,
        tenantId: ctx.user.tenantId,
      });
    }),

  getErrorStats: superAdminProcedure
    .input(z.object({
      days: z.number().default(7),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return await errorService.getErrorStats(ctx.user.tenantId, input.days);
    }),

  resolveError: superAdminProcedure
    .input(z.object({
      errorId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await errorService.resolveError(input.errorId, ctx.user.id);
    }),

  // ============================================================================
  // ERROR REPORTS (User-submitted feedback)
  // ============================================================================

  submitErrorReport: protectedProcedure
    .input(z.object({
      errorLogId: z.number().optional(),
      userDescription: z.string().min(10, "Please provide more details"),
      userAction: z.string().optional(),
      errorMessage: z.string().optional(),
      url: z.string().optional(),
      browserInfo: z.string().optional(),
      screenshot: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await errorService.createErrorReport({
        ...input,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        userName: ctx.user.name || undefined,
        userEmail: ctx.user.email,
      });
    }),

  getErrorReports: superAdminProcedure
    .input(z.object({
      userId: z.number().optional(),
      status: z.enum(['new', 'investigating', 'resolved', 'wont_fix']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return await errorService.getErrorReports({
        ...input,
        tenantId: ctx.user.tenantId,
      });
    }),

  updateErrorReportStatus: superAdminProcedure
    .input(z.object({
      reportId: z.number(),
      status: z.enum(['new', 'investigating', 'resolved', 'wont_fix']),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await errorService.updateErrorReportStatus(
        input.reportId,
        input.status,
        input.adminNotes,
        ctx.user.id
      );
    }),
});
