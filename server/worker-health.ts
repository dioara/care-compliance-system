/**
 * Worker Health Check Endpoint
 * Provides status information about the background job worker
 */

import { Router } from 'express';
import { getWorkerStatus } from './job-worker';

export const workerHealthRouter = Router();

/**
 * GET /api/worker-health
 * Returns the current status of the job worker
 */
workerHealthRouter.get('/api/worker-health', (req, res) => {
  try {
    const status = getWorkerStatus();
    
    res.json({
      success: true,
      worker: {
        isRunning: status.isRunning,
        startedAt: status.startedAt,
        lastPollAt: status.lastPollAt,
        uptime: status.uptime,
        uptimeFormatted: formatUptime(status.uptime),
        jobsProcessed: status.jobsProcessed,
        currentJobId: status.currentJobId,
        lastError: status.lastError,
        status: status.isRunning ? 'healthy' : 'stopped',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
