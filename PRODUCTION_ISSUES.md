# Production Environment Issues - Railway Deployment

## External Dependencies Audit

### 1. PDF Generation (PDFKit)
**Status:** ❌ Not Working in Production
**Dependencies:**
- `pdfkit` package ✅ (installed in package.json)
- System fonts (Helvetica, Helvetica-Bold) ❓ (may be missing in Railway container)
- Canvas/Cairo libraries ❓ (native dependencies for PDFKit)

**Files Affected:**
- `server/services/pdfService.ts`
- `server/services/actionLogPdfService.ts`
- `server/services/complianceReportPdfService.ts`

**Fix Required:**
- Add Railway Nixpacks configuration for system fonts
- Add fallback fonts or embed fonts in application
- Test PDF generation endpoint in production

### 2. Document Processing (Mammoth, PDF-Parse)
**Status:** ❓ Unknown
**Dependencies:**
- `mammoth` package ✅ (Word document processing)
- `pdf-parse` package ✅ (PDF text extraction)
- Poppler-utils ❓ (system dependency for pdf-parse)

**Files Affected:**
- AI audit document upload features
- Care plan processing

**Fix Required:**
- Test document upload in production
- Add system dependencies if needed

### 3. Voice Transcription
**Status:** ❓ Unknown
**Dependencies:**
- Uses Manus built-in API (should work)
- No external system dependencies

**Files Affected:**
- `server/_core/voiceTranscription.ts`

### 4. Image Generation
**Status:** ❓ Unknown
**Dependencies:**
- Uses Manus built-in API (should work)
- No external system dependencies

**Files Affected:**
- `server/_core/imageGeneration.ts`

### 5. Email Service (SendGrid)
**Status:** ❓ Unknown
**Dependencies:**
- SendGrid API key (configured via env vars)
- No system dependencies

**Files Affected:**
- `server/_core/email.ts`
- `server/services/auditReminderService.ts`
- `server/services/licenseExpirationService.ts`

### 6. Database (MySQL/TiDB)
**Status:** ✅ Should be working (Railway provides DATABASE_URL)
**Dependencies:**
- `mysql2` package ✅
- `drizzle-orm` package ✅

### 7. File Storage (S3)
**Status:** ✅ Should be working (Manus provides S3 credentials)
**Dependencies:**
- S3-compatible storage via Manus
- No system dependencies

### 8. Session/Authentication
**Status:** ❓ May have timeout issues
**Dependencies:**
- JWT tokens
- Cookie-based sessions
- No system dependencies

**Issue:** Site becomes unresponsive after inactivity

## Railway-Specific Configuration Needed

### Nixpacks Configuration (nixpacks.toml)
```toml
[phases.setup]
nixPkgs = ["...", "cairo", "pango", "giflib", "librsvg"]
```

### Environment Variables Check
- DATABASE_URL ✅
- JWT_SECRET ✅
- S3 credentials ✅
- SendGrid API key ✅
- All Manus built-in API keys ✅

### Build Configuration
- Node.js version: 22.x ✅
- Build command: `pnpm install && pnpm build`
- Start command: `pnpm start`

## Action Items

1. ✅ Audit all external dependencies
2. [ ] Create nixpacks.toml for Railway with required system packages
3. [ ] Add fallback fonts for PDFKit
4. [ ] Test PDF generation in production
5. [ ] Test document upload/processing in production
6. [ ] Fix session timeout/unresponsiveness issue
7. [ ] Add comprehensive error logging for production debugging
8. [ ] Create health check endpoint for monitoring

## Testing Checklist

- [ ] Login/Authentication
- [ ] PDF Export (Action Log, Audit Reports, Compliance Reports)
- [ ] Excel/CSV Export
- [ ] Document Upload (Word, PDF)
- [ ] AI Audit Processing
- [ ] Email Notifications
- [ ] File Upload to S3
- [ ] Session persistence after inactivity
- [ ] All CRUD operations
- [ ] Search functionality
- [ ] Audit scheduling
- [ ] Incident reporting
