/**
 * Debug endpoint to view failed job errors
 * Temporary endpoint for debugging - remove in production
 */

import express from 'express';
import * as dbModule from './db';
import { aiAudits } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const debugFailedJobsRouter = express.Router();

debugFailedJobsRouter.get('/debug/failed-jobs', async (req, res) => {
  try {
    const db = await dbModule.getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const failedJobs = await db
      .select({
        id: aiAudits.id,
        documentName: aiAudits.documentName,
        serviceUserName: aiAudits.serviceUserName,
        createdAt: aiAudits.createdAt,
        progress: aiAudits.progress,
        errorMessage: aiAudits.errorMessage,
        documentUrl: aiAudits.documentUrl,
      })
      .from(aiAudits)
      .where(eq(aiAudits.status, 'failed'))
      .orderBy(desc(aiAudits.createdAt))
      .limit(10);

    res.json({
      success: true,
      count: failedJobs.length,
      jobs: failedJobs.map(job => ({
        id: job.id,
        documentName: job.documentName,
        serviceUserName: job.serviceUserName,
        createdAt: job.createdAt,
        progress: job.progress,
        error: job.errorMessage,
        documentUrl: job.documentUrl ? job.documentUrl.substring(0, 50) + '...' : null,
      })),
    });
  } catch (error) {
    console.error('[Debug] Error fetching failed jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch failed jobs',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
