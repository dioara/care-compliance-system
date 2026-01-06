/**
 * Report Documents Download Endpoint
 * Serves generated Word documents from the local filesystem
 */

import { Router } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

export const reportsDownloadRouter = Router();

/**
 * GET /api/reports/:filename
 * Download a generated report document
 */
reportsDownloadRouter.get('/api/reports/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    // Validate file extension
    if (!filename.endsWith('.docx')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type'
      });
    }
    
    // Build file path
    const reportsDir = join(process.cwd(), 'reports');
    const filePath = join(reportsDir, filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const { createReadStream } = await import('fs');
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('[Reports Download] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
