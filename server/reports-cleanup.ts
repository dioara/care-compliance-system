/**
 * Reports Cleanup Job
 * Automatically deletes report files older than 90 days
 */

import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import * as dbModule from './db';
import { aiAudits } from '../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const RETENTION_DAYS = 90;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Delete reports older than 90 days
 */
export async function cleanupOldReports() {
  try {
    console.log('[Reports Cleanup] Starting cleanup job...');
    
    const reportsDir = join(process.cwd(), 'reports');
    const cutoffDate = new Date(Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000));
    
    console.log(`[Reports Cleanup] Deleting reports older than ${cutoffDate.toISOString()}`);
    
    // Get database connection
    const db = await dbModule.getDb();
    if (!db) {
      console.error('[Reports Cleanup] Database not available');
      return;
    }
    
    // Find jobs with reports older than 90 days
    const oldJobs = await db
      .select()
      .from(aiAudits)
      .where(
        and(
          eq(aiAudits.status, 'completed'),
          lt(aiAudits.processedAt, cutoffDate.toISOString().slice(0, 19).replace('T', ' '))
        )
      );
    
    console.log(`[Reports Cleanup] Found ${oldJobs.length} old reports to clean up`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const job of oldJobs) {
      try {
        // Delete file from filesystem
        if (job.reportDocumentKey) {
          const filePath = join(reportsDir, job.reportDocumentKey);
          
          try {
            await unlink(filePath);
            console.log(`[Reports Cleanup] Deleted file: ${job.reportDocumentKey}`);
            deletedCount++;
          } catch (fileError: any) {
            if (fileError.code !== 'ENOENT') {
              console.error(`[Reports Cleanup] Error deleting file ${job.reportDocumentKey}:`, fileError);
              errorCount++;
            }
            // File doesn't exist, continue
          }
        }
        
        // Update database to remove document references
        await db
          .update(aiAudits)
          .set({
            reportDocumentUrl: null,
            reportDocumentKey: null,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
          })
          .where(eq(aiAudits.id, job.id));
        
      } catch (error) {
        console.error(`[Reports Cleanup] Error processing job ${job.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[Reports Cleanup] Cleanup complete: ${deletedCount} files deleted, ${errorCount} errors`);
    
  } catch (error) {
    console.error('[Reports Cleanup] Cleanup job failed:', error);
  }
}

/**
 * Start the cleanup job (runs daily)
 */
export function startReportsCleanupJob() {
  console.log('[Reports Cleanup] Starting automatic cleanup job (runs every 24 hours)');
  
  // Run immediately on startup
  cleanupOldReports();
  
  // Then run every 24 hours
  setInterval(() => {
    cleanupOldReports();
  }, CLEANUP_INTERVAL_MS);
}
