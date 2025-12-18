import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createSupportTicket,
  getSupportTicketsByUser,
  getSupportTicketsByTenant,
  getSupportTicketById,
  updateSupportTicketStatus,
  submitArticleFeedback,
  getArticleFeedback,
  getArticleFeedbackStats,
  addArticleBookmark,
  removeArticleBookmark,
  getUserBookmarks,
  isArticleBookmarked,
} from "../db/helpCenter";
import { sendEmail } from "../_core/email";

// Generate unique ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CCMS-${timestamp}-${random}`;
}

export const helpCenterRouter = router({
  // ============================================
  // SUPPORT TICKETS
  // ============================================
  
  createSupportTicket: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(5, "Subject must be at least 5 characters"),
        message: z.string().min(20, "Message must be at least 20 characters"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticketNumber = generateTicketNumber();
      
      const ticket = await createSupportTicket({
        tenantId: ctx.user.tenantId!,
        userId: ctx.user.id,
        ticketNumber,
        name: ctx.user.name,
        email: ctx.user.email,
        subject: input.subject,
        message: input.message,
        priority: input.priority,
        category: input.category,
        status: "open",
      });

      // Send confirmation email to user
      try {
        await sendEmail({
          to: ctx.user.email,
          subject: `Support Ticket Created: ${ticketNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Support Ticket Confirmation</h2>
              <p>Dear ${ctx.user.name},</p>
              <p>Your support ticket has been successfully created. Our team will review your request and respond as soon as possible.</p>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p style="margin: 10px 0 0 0;"><strong>Subject:</strong> ${input.subject}</p>
                <p style="margin: 10px 0 0 0;"><strong>Priority:</strong> ${input.priority}</p>
                <p style="margin: 10px 0 0 0;"><strong>Status:</strong> Open</p>
              </div>
              
              <p><strong>Your Message:</strong></p>
              <p style="background: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 10px 0;">
                ${input.message.replace(/\n/g, '<br>')}
              </p>
              
              <p>You can track the status of your ticket in the Help Center.</p>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                CCMS Support Team
              </p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }

      // Send notification to support team
      try {
        await sendEmail({
          to: "contact@ccms.co.uk",
          subject: `New Support Ticket: ${ticketNumber} - ${input.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #DC2626;">New Support Ticket</h2>
              
              <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
                <p style="margin: 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
                <p style="margin: 10px 0 0 0;"><strong>Priority:</strong> <span style="color: ${
                  input.priority === 'urgent' ? '#DC2626' : 
                  input.priority === 'high' ? '#EA580C' :
                  input.priority === 'medium' ? '#D97706' : '#059669'
                }">${input.priority.toUpperCase()}</span></p>
                <p style="margin: 10px 0 0 0;"><strong>Category:</strong> ${input.category || 'General'}</p>
              </div>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>From:</strong> ${ctx.user.name} (${ctx.user.email})</p>
                <p style="margin: 10px 0 0 0;"><strong>User ID:</strong> ${ctx.user.id}</p>
                <p style="margin: 10px 0 0 0;"><strong>Tenant ID:</strong> ${ctx.user.tenantId}</p>
              </div>
              
              <p><strong>Subject:</strong></p>
              <p style="font-size: 16px; font-weight: 600; color: #111827;">${input.subject}</p>
              
              <p><strong>Message:</strong></p>
              <p style="background: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 10px 0; white-space: pre-wrap;">
                ${input.message}
              </p>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Submitted at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
              </p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send support notification:", error);
      }

      return ticket;
    }),

  getUserTickets: protectedProcedure.query(async ({ ctx }) => {
    return await getSupportTicketsByUser(ctx.user.id);
  }),

  getTenantTickets: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No tenant associated with user",
      });
    }
    return await getSupportTicketsByTenant(ctx.user.tenantId);
  }),

  getTicketById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getSupportTicketById(input.id);
      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ticket not found",
        });
      }
      
      // Check if user has access to this ticket
      if (ticket.userId !== ctx.user.id && ticket.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this ticket",
        });
      }
      
      return ticket;
    }),

  // ============================================
  // ARTICLE FEEDBACK
  // ============================================

  submitFeedback: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        helpful: z.boolean(),
        feedbackText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already submitted feedback for this article
      const existing = await getArticleFeedback(input.articleId, ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already submitted feedback for this article",
        });
      }

      return await submitArticleFeedback({
        articleId: input.articleId,
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        helpful: input.helpful ? 1 : 0,
        feedbackText: input.feedbackText,
      });
    }),

  getUserFeedback: publicProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Return null for unauthenticated users
      if (!ctx.user) {
        return null;
      }
      return await getArticleFeedback(input.articleId, ctx.user.id);
    }),

  getFeedbackStats: publicProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ input }) => {
      return await getArticleFeedbackStats(input.articleId);
    }),

  // ============================================
  // ARTICLE BOOKMARKS
  // ============================================

  addBookmark: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already bookmarked
      const isBookmarked = await isArticleBookmarked(input.articleId, ctx.user.id);
      if (isBookmarked) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Article is already bookmarked",
        });
      }

      return await addArticleBookmark({
        articleId: input.articleId,
        userId: ctx.user.id,
      });
    }),

  removeBookmark: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await removeArticleBookmark(input.articleId, ctx.user.id);
    }),

  getUserBookmarks: protectedProcedure.query(async ({ ctx }) => {
    return await getUserBookmarks(ctx.user.id);
  }),

  isBookmarked: publicProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Return false for unauthenticated users
      if (!ctx.user) {
        return false;
      }
      return await isArticleBookmarked(input.articleId, ctx.user.id);
    }),
});
