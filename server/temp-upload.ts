/**
 * Temporary file upload endpoint
 * Stores files temporarily on server filesystem for processing
 */

import { Router } from 'express';
import multer from 'multer';
import { randomBytes } from 'crypto';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';

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

// Create temp directory if it doesn't exist
const TEMP_DIR = join(process.cwd(), 'temp-uploads');
mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueId = `${Date.now()}-${randomBytes(8).toString('hex')}`;
    const ext = file.originalname.split('.').pop();
    cb(null, `${uniqueId}.${ext}`);
  },
});

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
    
    console.log('[Temp Upload] File saved:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
    });
    
    // Return file reference
    res.json({
      success: true,
      fileId: req.file.filename,
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
