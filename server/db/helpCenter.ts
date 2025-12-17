import { getDb } from "../db";
import { 
  supportTickets, 
  articleFeedback, 
  articleBookmarks,
  type InsertSupportTicket,
  type InsertArticleFeedback,
  type InsertArticleBookmark
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ============================================
// SUPPORT TICKETS
// ============================================

export async function createSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [ticket] = await db.insert(supportTickets).values(data).$returningId();
  return { success: true, ticketId: ticket.id, ticketNumber: data.ticketNumber };
}

export async function getSupportTicketsByUser(userId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function getSupportTicketsByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.tenantId, tenantId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id));
  
  return ticket || null;
}

export async function updateSupportTicketStatus(
  id: number,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(supportTickets)
    .set({ status, updatedAt: sql`NOW()` })
    .where(eq(supportTickets.id, id));
  
  return { success: true };
}

// ============================================
// ARTICLE FEEDBACK
// ============================================

export async function submitArticleFeedback(data: InsertArticleFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [feedback] = await db.insert(articleFeedback).values(data).$returningId();
  return { success: true, feedbackId: feedback.id };
}

export async function getArticleFeedback(articleId: string, userId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const [feedback] = await db
    .select()
    .from(articleFeedback)
    .where(
      and(
        eq(articleFeedback.articleId, articleId),
        eq(articleFeedback.userId, userId)
      )
    );
  
  return feedback || null;
}

export async function getArticleFeedbackStats(articleId: string) {
  const db = await getDb();
  if (!db) return { 
    totalFeedback: 0, 
    helpfulCount: 0, 
    notHelpfulCount: 0, 
    helpfulPercentage: 0 
  };
  
  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      helpful: sql<number>`SUM(CASE WHEN ${articleFeedback.helpful} = 1 THEN 1 ELSE 0 END)`,
      notHelpful: sql<number>`SUM(CASE WHEN ${articleFeedback.helpful} = 0 THEN 1 ELSE 0 END)`,
    })
    .from(articleFeedback)
    .where(eq(articleFeedback.articleId, articleId));
  
  const result = stats[0];
  const total = Number(result?.total || 0);
  const helpful = Number(result?.helpful || 0);
  const notHelpful = Number(result?.notHelpful || 0);
  
  return {
    totalFeedback: total,
    helpfulCount: helpful,
    notHelpfulCount: notHelpful,
    helpfulPercentage: total > 0 ? Math.round((helpful / total) * 100) : 0,
  };
}

// ============================================
// ARTICLE BOOKMARKS
// ============================================

export async function addArticleBookmark(data: InsertArticleBookmark) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [bookmark] = await db.insert(articleBookmarks).values(data).$returningId();
  return { success: true, bookmarkId: bookmark.id };
}

export async function removeArticleBookmark(articleId: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(articleBookmarks)
    .where(
      and(
        eq(articleBookmarks.articleId, articleId),
        eq(articleBookmarks.userId, userId)
      )
    );
  
  return { success: true };
}

export async function getUserBookmarks(userId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(articleBookmarks)
    .where(eq(articleBookmarks.userId, userId))
    .orderBy(desc(articleBookmarks.createdAt));
}

export async function isArticleBookmarked(articleId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const [bookmark] = await db
    .select()
    .from(articleBookmarks)
    .where(
      and(
        eq(articleBookmarks.articleId, articleId),
        eq(articleBookmarks.userId, userId)
      )
    );
  
  return !!bookmark;
}
