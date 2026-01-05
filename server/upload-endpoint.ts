/**
 * Multipart file upload endpoint for AI analysis
 * More efficient than base64 encoding in tRPC
 */

import { Router } from 'express';
import multer from 'multer';
import { TRPCError } from '@trpc/server';
import * as db from './db';
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

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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

export const uploadRouter = Router();

// AI Care Plan File Analysis endpoint
uploadRouter.post('/ai/analyze-care-plan-file', upload.single('file'), async (req, res) => {
  console.log('[Upload Endpoint] POST /api/upload/ai/analyze-care-plan-file');
  console.log('[Upload Endpoint] Headers:', req.headers);
  
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Upload Endpoint] ERROR: No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    console.log('[Upload Endpoint] Token present:', !!token);
    
    const decoded = await verifyToken(token);
    console.log('[Upload Endpoint] User authenticated:', decoded.email);
    
    if (!decoded.tenantId) {
      console.error('[Upload Endpoint] ERROR: No tenantId in token');
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.error('[Upload Endpoint] ERROR: No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[Upload Endpoint] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer_length: req.file.buffer.length
    });

    // Get form data
    const serviceUserName = req.body.serviceUserName || '';
    const anonymise = req.body.anonymise === 'true';
    
    console.log('[Upload Endpoint] Service User Name:', serviceUserName);
    console.log('[Upload Endpoint] Anonymise:', anonymise);

    // Get organization's OpenAI API key
    console.log('[Upload Endpoint] Getting company by tenantId:', decoded.tenantId);
    const company = await db.getCompanyByTenantId(decoded.tenantId);
    console.log('[Upload Endpoint] Company found:', company?.name);
    console.log('[Upload Endpoint] OpenAI API key configured:', !!company?.openaiApiKey);
    
    if (!company?.openaiApiKey) {
      console.error('[Upload Endpoint] ERROR: OpenAI API key not configured');
      return res.status(412).json({
        error: 'OpenAI API key not configured. Please contact your administrator.',
      });
    }

    // Parse file
    console.log('[Upload Endpoint] Importing file-parser module');
    const { parseFile, validateFile } = await import('./file-parser');
    
    console.log('[Upload Endpoint] Validating file');
    const validation = validateFile(req.file.buffer, req.file.originalname, 10);
    console.log('[Upload Endpoint] Validation result:', validation);
    
    if (!validation.valid) {
      console.error('[Upload Endpoint] ERROR: File validation failed:', validation.error);
      return res.status(400).json({
        error: validation.error || 'Invalid file',
      });
    }

    // Parse file to extract text
    console.log('[Upload Endpoint] Parsing file to extract text');
    const parsed = await parseFile(req.file.buffer, req.file.originalname);
    console.log('[Upload Endpoint] Parsed text length:', parsed.text.length, 'characters');
    console.log('[Upload Endpoint] Parsed metadata:', parsed.metadata);
    
    // Analyze the extracted text
    console.log('[Upload Endpoint] Importing ai-analysis module');
    const { analyzeCarePlan } = await import('./ai-analysis');
    
    console.log('[Upload Endpoint] Calling analyzeCarePlan with OpenAI');
    const result = await analyzeCarePlan(
      company.openaiApiKey,
      parsed.text,
      serviceUserName,
      anonymise
    );
    
    console.log('[Upload Endpoint] Analysis complete successfully');
    console.log('[Upload Endpoint] Result summary:', {
      hasOverallAssessment: !!result.analysis.enhanced_version,
      hasRecommendations: !!result.analysis.recommendations,
      complianceScore: result.analysis.compliance_score
    });

    // Generate Word document if the analysis has the new detailed format
    let documentBuffer;
    if (result.analysis.sections) {
      console.log('[Upload Endpoint] Generating Word document');
      const { generateCarePlanAnalysisDocument } = await import('./document-generator');
      const { Packer } = await import('docx');
      
      const doc = generateCarePlanAnalysisDocument(
        serviceUserName,
        new Date().toISOString().split('T')[0],
        result.analysis as any
      );
      
      documentBuffer = await Packer.toBuffer(doc);
      console.log('[Upload Endpoint] Word document generated, size:', documentBuffer.length, 'bytes');
    }

    return res.json({
      analysis: result.analysis,
      nameMappings: result.nameMappings,
      fileMetadata: parsed.metadata,
      documentBase64: documentBuffer ? documentBuffer.toString('base64') : undefined,
    });
    
  } catch (error) {
    console.error('[Upload Endpoint] ERROR: Exception occurred');
    console.error('[Upload Endpoint] Error type:', error?.constructor?.name);
    console.error('[Upload Endpoint] Error message:', error?.message);
    console.error('[Upload Endpoint] Error stack:', error?.stack);
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze care plan',
    });
  }
});

// AI Care Notes File Analysis endpoint
uploadRouter.post('/ai/analyze-care-notes-file', upload.single('file'), async (req, res) => {
  console.log('[Upload Endpoint] POST /api/upload/ai/analyze-care-notes-file');
  
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded.tenantId) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[Upload Endpoint] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get form data
    const serviceUserName = req.body.serviceUserName || '';
    const anonymise = req.body.anonymise === 'true';

    // Get organization's OpenAI API key
    const company = await db.getCompanyByTenantId(decoded.tenantId);
    if (!company?.openaiApiKey) {
      return res.status(412).json({
        error: 'OpenAI API key not configured. Please contact your administrator.',
      });
    }

    // Parse file
    const { parseFile, validateFile } = await import('./file-parser');
    const validation = validateFile(req.file.buffer, req.file.originalname, 10);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || 'Invalid file',
      });
    }

    const parsed = await parseFile(req.file.buffer, req.file.originalname);
    
    // Analyze the extracted text
    const { analyzeCareNotes } = await import('./ai-analysis');
    const result = await analyzeCareNotes(
      company.openaiApiKey,
      parsed.text,
      serviceUserName,
      anonymise
    );

    return res.json({
      analysis: result.analysis,
      nameMappings: result.nameMappings,
      fileMetadata: parsed.metadata,
    });
    
  } catch (error) {
    console.error('[Upload Endpoint] ERROR:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze care notes',
    });
  }
});
