import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { db } from "./db";
import { articleBookmarks, articleFeedback, supportTickets } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Mock authenticated context
const createMockContext = (userId: string, tenantId: string): TrpcContext => ({
  user: {
    id: userId,
    openId: `test-openid-${userId}`,
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    tenantId: tenantId,
    loginMethod: "manus" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date(),
  },
  req: {
    protocol: "https",
    headers: {},
  } as any,
  res: {} as any,
});

describe("Help Center Features", () => {
  const testUserId = `test-user-${Date.now()}`;
  const testTenantId = `test-tenant-${Date.now()}`;
  const testArticleId = "first-login";
  let testBookmarkId: string;
  let testFeedbackId: string;
  let testTicketId: string;

  // Cleanup function
  const cleanup = async () => {
    try {
      // Delete test bookmarks
      await db.delete(articleBookmarks).where(
        eq(articleBookmarks.userId, testUserId)
      );
      
      // Delete test feedback
      await db.delete(articleFeedback).where(
        eq(articleFeedback.userId, testUserId)
      );
      
      // Delete test support tickets
      await db.delete(supportTickets).where(
        eq(supportTickets.userId, testUserId)
      );
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("Article Bookmarks", () => {
    it("should add a bookmark for an article", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.addBookmark({
        articleId: testArticleId,
      });

      expect(result.success).toBe(true);
      expect(result.bookmarkId).toBeDefined();
      testBookmarkId = result.bookmarkId!;

      // Verify bookmark was created in database
      const bookmarks = await db
        .select()
        .from(articleBookmarks)
        .where(
          and(
            eq(articleBookmarks.userId, testUserId),
            eq(articleBookmarks.articleId, testArticleId)
          )
        );

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].articleId).toBe(testArticleId);
    });

    it("should check if an article is bookmarked", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.isBookmarked({
        articleId: testArticleId,
      });

      expect(result).toBe(true);
    });

    it("should return false for non-bookmarked article", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.isBookmarked({
        articleId: "non-existent-article",
      });

      expect(result).toBe(false);
    });

    it("should remove a bookmark", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.removeBookmark({
        articleId: testArticleId,
      });

      expect(result.success).toBe(true);

      // Verify bookmark was removed from database
      const bookmarks = await db
        .select()
        .from(articleBookmarks)
        .where(
          and(
            eq(articleBookmarks.userId, testUserId),
            eq(articleBookmarks.articleId, testArticleId)
          )
        );

      expect(bookmarks).toHaveLength(0);
    });

    it("should get all user bookmarks", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      // Add multiple bookmarks
      await caller.helpCenter.addBookmark({ articleId: "first-login" });
      await caller.helpCenter.addBookmark({ articleId: "welcome" });

      const result = await caller.helpCenter.getBookmarks();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((b) => b.articleId === "first-login")).toBe(true);
      expect(result.some((b) => b.articleId === "welcome")).toBe(true);
    });
  });

  describe("Article Feedback", () => {
    it("should submit positive feedback for an article", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.submitFeedback({
        articleId: testArticleId,
        helpful: true,
      });

      expect(result.success).toBe(true);
      expect(result.feedbackId).toBeDefined();
      testFeedbackId = result.feedbackId!;

      // Verify feedback was created in database
      const feedback = await db
        .select()
        .from(articleFeedback)
        .where(
          and(
            eq(articleFeedback.userId, testUserId),
            eq(articleFeedback.articleId, testArticleId)
          )
        );

      expect(feedback).toHaveLength(1);
      expect(feedback[0].helpful).toBe(true);
    });

    it("should get user feedback for an article", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.getUserFeedback({
        articleId: testArticleId,
      });

      expect(result).toBeDefined();
      expect(result?.helpful).toBe(true);
    });

    it("should return null for article without feedback", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.getUserFeedback({
        articleId: "article-without-feedback",
      });

      expect(result).toBeNull();
    });

    it("should update existing feedback instead of creating duplicate", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      // Submit negative feedback (should update existing)
      const result = await caller.helpCenter.submitFeedback({
        articleId: testArticleId,
        helpful: false,
        comment: "Needs more detail",
      });

      expect(result.success).toBe(true);

      // Verify only one feedback record exists
      const feedback = await db
        .select()
        .from(articleFeedback)
        .where(
          and(
            eq(articleFeedback.userId, testUserId),
            eq(articleFeedback.articleId, testArticleId)
          )
        );

      expect(feedback).toHaveLength(1);
      expect(feedback[0].helpful).toBe(false);
      expect(feedback[0].comment).toBe("Needs more detail");
    });

    it("should get feedback statistics for an article", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.getArticleFeedbackStats({
        articleId: testArticleId,
      });

      expect(result).toBeDefined();
      expect(result.totalFeedback).toBeGreaterThanOrEqual(1);
      expect(result.helpfulCount).toBeGreaterThanOrEqual(0);
      expect(result.notHelpfulCount).toBeGreaterThanOrEqual(0);
      expect(result.helpfulPercentage).toBeGreaterThanOrEqual(0);
      expect(result.helpfulPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe("Support Tickets", () => {
    it("should create a support ticket", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const ticketData = {
        subject: "Test Support Request",
        message: "This is a test support ticket with sufficient detail to meet the minimum character requirement.",
        category: "technical" as const,
        priority: "medium" as const,
      };

      const result = await caller.helpCenter.createSupportTicket(ticketData);

      expect(result.success).toBe(true);
      expect(result.ticketId).toBeDefined();
      expect(result.ticketNumber).toBeDefined();
      testTicketId = result.ticketId!;

      // Verify ticket was created in database
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, testTicketId));

      expect(tickets).toHaveLength(1);
      expect(tickets[0].subject).toBe(ticketData.subject);
      expect(tickets[0].message).toBe(ticketData.message);
      expect(tickets[0].category).toBe(ticketData.category);
      expect(tickets[0].priority).toBe(ticketData.priority);
      expect(tickets[0].status).toBe("open");
    });

    it("should validate minimum message length", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.helpCenter.createSupportTicket({
          subject: "Short message test",
          message: "Too short", // Less than 20 characters
          priority: "low" as const,
        })
      ).rejects.toThrow();
    });

    it("should get user support tickets", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.getUserTickets();

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((t) => t.id === testTicketId)).toBe(true);
    });

    it("should get a specific support ticket", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.helpCenter.getTicketById({
        id: testTicketId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(testTicketId);
      expect(result.subject).toBe("Test Support Request");
    });

    it("should not allow accessing other users tickets", async () => {
      const otherUserId = `other-user-${Date.now()}`;
      const ctx = createMockContext(otherUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.helpCenter.getTicketById({
          id: testTicketId,
        })
      ).rejects.toThrow();
    });

    it("should generate unique ticket numbers", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      const ticket1 = await caller.helpCenter.createSupportTicket({
        subject: "First ticket",
        message: "This is the first test ticket with enough characters to pass validation.",
        priority: "low" as const,
      });

      const ticket2 = await caller.helpCenter.createSupportTicket({
        subject: "Second ticket",
        message: "This is the second test ticket with enough characters to pass validation.",
        priority: "high" as const,
      });

      expect(ticket1.ticketNumber).not.toBe(ticket2.ticketNumber);
      expect(ticket1.ticketNumber).toMatch(/^CCMS-\d{10}$/);
      expect(ticket2.ticketNumber).toMatch(/^CCMS-\d{10}$/);
    });
  });

  describe("Email Notifications", () => {
    it("should handle support ticket email sending gracefully", async () => {
      const ctx = createMockContext(testUserId, testTenantId);
      const caller = appRouter.createCaller(ctx);

      // This test verifies the ticket is created even if email fails
      const result = await caller.helpCenter.createSupportTicket({
        subject: "Email test ticket",
        message: "Testing email notification functionality with sufficient message length.",
        priority: "medium" as const,
      });

      expect(result.success).toBe(true);
      expect(result.ticketId).toBeDefined();
      
      // Verify ticket exists in database regardless of email status
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, result.ticketId!));

      expect(tickets).toHaveLength(1);
    });
  });

  describe("Data Isolation", () => {
    it("should only show user's own bookmarks", async () => {
      const user1Id = `user1-${Date.now()}`;
      const user2Id = `user2-${Date.now()}`;
      
      const ctx1 = createMockContext(user1Id, testTenantId);
      const ctx2 = createMockContext(user2Id, testTenantId);
      
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      // User 1 adds bookmark
      await caller1.helpCenter.addBookmark({ articleId: "user1-article" });

      // User 2 should not see user 1's bookmark
      const user2Bookmarks = await caller2.helpCenter.getUserBookmarks();
      expect(user2Bookmarks.every((b) => b.userId === user2Id)).toBe(true);
      expect(user2Bookmarks.some((b) => b.articleId === "user1-article")).toBe(false);

      // Cleanup
      await db.delete(articleBookmarks).where(eq(articleBookmarks.userId, user1Id));
      await db.delete(articleBookmarks).where(eq(articleBookmarks.userId, user2Id));
    });

    it("should only show user's own feedback", async () => {
      const user1Id = `user1-${Date.now()}`;
      const user2Id = `user2-${Date.now()}`;
      
      const ctx1 = createMockContext(user1Id, testTenantId);
      const ctx2 = createMockContext(user2Id, testTenantId);
      
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      // User 1 submits feedback
      await caller1.helpCenter.submitFeedback({
        articleId: "shared-article",
        helpful: true,
      });

      // User 2 should not see user 1's feedback
      const user2Feedback = await caller2.helpCenter.getUserFeedback({
        articleId: "shared-article",
      });
      expect(user2Feedback).toBeNull();

      // Cleanup
      await db.delete(articleFeedback).where(eq(articleFeedback.userId, user1Id));
      await db.delete(articleFeedback).where(eq(articleFeedback.userId, user2Id));
    });

    it("should only show user's own support tickets", async () => {
      const user1Id = `user1-${Date.now()}`;
      const user2Id = `user2-${Date.now()}`;
      
      const ctx1 = createMockContext(user1Id, testTenantId);
      const ctx2 = createMockContext(user2Id, testTenantId);
      
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      // User 1 creates ticket
      const ticket = await caller1.helpCenter.createSupportTicket({
        subject: "User 1 ticket",
        message: "This is a private ticket that should only be visible to user 1.",
        priority: "low" as const,
      });

      // User 2 should not see user 1's ticket
      const user2Tickets = await caller2.helpCenter.getUserSupportTickets();
      expect(user2Tickets.every((t) => t.userId === user2Id)).toBe(true);
      expect(user2Tickets.some((t) => t.id === ticket.ticketId)).toBe(false);

      // Cleanup
      await db.delete(supportTickets).where(eq(supportTickets.userId, user1Id));
      await db.delete(supportTickets).where(eq(supportTickets.userId, user2Id));
    });
  });
});
