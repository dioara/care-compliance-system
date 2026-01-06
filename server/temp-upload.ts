/**
 * Temporary file upload endpoint
 * Stores files temporarily on server filesystem for processing
 */

import { Router } from 'express';
import multer from 'multer';
import { randomBytes } from 'crypto';
import { readFile } from 'fs/promises';
import jwt from 'jsonwebtoken';
import * as dbModule from './db';
import { aiAudits } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
interface TokenPayload {
  userId: number;
  email: string;
  tenantId: number;
  role: string;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Configure multer for memory storage (no filesystem)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, CSV, and Excel files are allowed.'));
    }
  },
});

export const tempUploadRouter = Router();

/**
 * POST /api/temp-upload
 * Upload a file temporarily to server filesystem
 */
tempUploadRouter.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('[Temp Upload] POST /api/temp-upload');
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    const user = await verifyToken(token);
    console.log('[Temp Upload] User authenticated:', user.email);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const fileId = `${Date.now()}-${randomBytes(8).toString('hex')}`;
    
    console.log('[Temp Upload] File received:', {
      fileId,
      originalname: req.file.originalname,
      size: req.file.size,
      base64Length: fileBase64.length,
    });
    
    // Store file in temporary database table
    const db = await dbModule.getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    await db.execute(sql`
      INSERT INTO temp_files (id, file_data, file_name, mime_type, file_size, uploaded_by, created_at, expires_at)
      VALUES (
        ${fileId},
        ${fileBase64},
        ${req.file.originalname},
        ${req.file.mimetype},
        ${req.file.size},
        ${user.userId},
        ${now.toISOString().slice(0, 19).replace('T', ' ')},
        ${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}
      )
    `);
    
    console.log('[Temp Upload] File stored in database with ID:', fileId);
    
    // Return file reference (small payload)
    res.json({
      success: true,
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('[Temp Upload] ERROR:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
});
