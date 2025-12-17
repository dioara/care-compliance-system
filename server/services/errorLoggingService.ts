/**
 * Error Logging Service
 * 
 * Handles error logging and error report management
 */

import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { errorLogs, errorReports, type InsertErrorLog, type InsertErrorReport } from "../../drizzle/schema";

// ============================================================================
// ERROR LOGS
// ============================================================================

export async function createErrorLog(data: InsertErrorLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(errorLogs).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId };
}

export async function getErrorLogs(filters: {
  tenantId?: number;
  userId?: number;
  errorType?: string;
  severity?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(errorLogs);

  const conditions: any[] = [];
  
  if (filters.tenantId) {
    conditions.push(eq(errorLogs.tenantId, filters.tenantId));
  }
  
  if (filters.userId) {
    conditions.push(eq(errorLogs.userId, filters.userId));
  }
  
  if (filters.errorType) {
    conditions.push(eq(errorLogs.errorType, filters.errorType));
  }
  
  if (filters.severity) {
    conditions.push(eq(errorLogs.severity, filters.severity as any));
  }
  
  if (filters.resolved !== undefined) {
    conditions.push(eq(errorLogs.resolved, filters.resolved));
  }
  
  if (filters.startDate) {
    conditions.push(gte(errorLogs.createdAt, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(sql`${errorLogs.createdAt} <= ${filters.endDate}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(errorLogs.createdAt)) as any;

  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }

  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function getErrorStats(tenantId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get total errors
  const totalErrors = await db
    .select({ count: sql<number>`count(*)` })
    .from(errorLogs)
    .where(and(
      eq(errorLogs.tenantId, tenantId),
      gte(errorLogs.createdAt, startDate)
    ));

  // Get errors by severity
  const bySeverity = await db
    .select({
      severity: errorLogs.severity,
      count: sql<number>`count(*)`
    })
    .from(errorLogs)
    .where(and(
      eq(errorLogs.tenantId, tenantId),
      gte(errorLogs.createdAt, startDate)
    ))
    .groupBy(errorLogs.severity);

  // Get errors by type
  const byType = await db
    .select({
      errorType: errorLogs.errorType,
      count: sql<number>`count(*)`
    })
    .from(errorLogs)
    .where(and(
      eq(errorLogs.tenantId, tenantId),
      gte(errorLogs.createdAt, startDate)
    ))
    .groupBy(errorLogs.errorType)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Get daily error counts for chart
  const dailyCounts = await db
    .select({
      date: sql<string>`DATE(${errorLogs.createdAt})`,
      count: sql<number>`count(*)`
    })
    .from(errorLogs)
    .where(and(
      eq(errorLogs.tenantId, tenantId),
      gte(errorLogs.createdAt, startDate)
    ))
    .groupBy(sql`DATE(${errorLogs.createdAt})`)
    .orderBy(sql`DATE(${errorLogs.createdAt})`);

  // Get affected users count
  const affectedUsers = await db
    .select({
      count: sql<number>`count(DISTINCT ${errorLogs.userId})`
    })
    .from(errorLogs)
    .where(and(
      eq(errorLogs.tenantId, tenantId),
      gte(errorLogs.createdAt, startDate),
      sql`${errorLogs.userId} IS NOT NULL`
    ));

  return {
    totalErrors: Number(totalErrors[0]?.count || 0),
    bySeverity: bySeverity.map(s => ({
      severity: s.severity,
      count: Number(s.count)
    })),
    byType: byType.map(t => ({
      errorType: t.errorType,
      count: Number(t.count)
    })),
    dailyCounts: dailyCounts.map(d => ({
      date: d.date,
      count: Number(d.count)
    })),
    affectedUsers: Number(affectedUsers[0]?.count || 0)
  };
}

export async function resolveError(errorId: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(errorLogs)
    .set({
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy
    })
    .where(eq(errorLogs.id, errorId));

  return { success: true };
}

// ============================================================================
// ERROR REPORTS
// ============================================================================

export async function createErrorReport(data: InsertErrorReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(errorReports).values(data);
  return { id: (result as any)[0]?.insertId ?? (result as any).insertId };
}

export async function getErrorReports(filters: {
  tenantId?: number;
  userId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(errorReports);

  const conditions: any[] = [];
  
  if (filters.tenantId) {
    conditions.push(eq(errorReports.tenantId, filters.tenantId));
  }
  
  if (filters.userId) {
    conditions.push(eq(errorReports.userId, filters.userId));
  }
  
  if (filters.status) {
    conditions.push(eq(errorReports.status, filters.status as any));
  }
  
  if (filters.startDate) {
    conditions.push(gte(errorReports.createdAt, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(sql`${errorReports.createdAt} <= ${filters.endDate}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(errorReports.createdAt)) as any;

  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }

  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function updateErrorReportStatus(
  reportId: number,
  status: 'new' | 'investigating' | 'resolved' | 'wont_fix',
  adminNotes?: string,
  resolvedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  
  if (adminNotes) {
    updateData.adminNotes = adminNotes;
  }
  
  if (status === 'resolved' || status === 'wont_fix') {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = resolvedBy;
  }

  await db.update(errorReports)
    .set(updateData)
    .where(eq(errorReports.id, reportId));

  return { success: true };
}
