# Care Compliance Management System - TODO

## Phase 1: Database Schema & Seed Data
- [x] Create database schema for tenants, locations, users with roles
- [x] Create schema for service users and staff members
- [x] Create schema for compliance sections and questions (22 service user sections)
- [x] Create schema for staff compliance sections (7 sections)
- [x] Create schema for compliance assessments with RAG status
- [x] Create schema for audit schedules and audit results
- [x] Create schema for 25 audit types
- [x] Create schema for incidents with categorization
- [x] Create schema for AI audits (care plans and staff notes)
- [x] Create schema for notifications and audit trail
- [x] Create schema for reports and supporting documents
- [x] Seed compliance sections and questions from intervention plan
- [x] Seed staff compliance sections
- [x] Seed audit types with frequencies and tooltips

## Phase 2: Authentication & Authorization
- [x] Extend user schema with 2FA fields (twoFaEnabled, twoFaSecret)
- [x] Extend user schema with role enum (admin, quality_officer, manager, staff)
- [x] Create tRPC procedures for user registration with company creation
- [ ] Create tRPC procedures for 2FA setup and verification
- [x] Create role-based middleware (adminProcedure, qualityOfficerProcedure)
- [x] Update auth.me to include role and tenant information
- [x] Create user management procedures (list, create, update, delete)

## Phase 3: Company Profile & Location Management
- [x] Create tRPC procedures for company profile CRUD
- [x] Create company logo upload procedure using storagePut
- [x] Create location management procedures (list, create, update, delete)
- [x] Build company profile page with logo upload
- [x] Build location management UI
- [ ] Add company branding context for reports

## Phase 4: Compliance Assessment Framework
- [ ] Create procedures to list compliance sections by type
- [ ] Create procedures to get questions for a section
- [ ] Create procedures for compliance assessments CRUD
- [ ] Create procedure to calculate RAG status
- [ ] Create procedure to get compliance status dashboard
- [ ] Build service user compliance assessment UI with tooltips
- [ ] Build staff compliance assessment UI with tooltips
- [ ] Build assessment form with evidence upload
- [ ] Build compliance status dashboard with RAG indicators

## Phase 5: Audit Management System
- [ ] Create procedures for audit schedule CRUD
- [ ] Create procedures for audit results CRUD
- [ ] Create procedure to calculate next audit due dates
- [ ] Create procedure to get overdue audits
- [ ] Build audit schedule calendar UI
- [ ] Build audit templates for 25 audit types
- [ ] Build audit result entry forms
- [ ] Build audit history view with filters

## Phase 6: AI-Powered Audit System
- [ ] Create AI audit submission procedures (care plan, staff notes)
- [ ] Implement name stripping function (names → initials)
- [ ] Integrate OpenAI GPT-4 for document analysis
- [ ] Create background job queue for AI processing
- [ ] Create procedure to get AI audit results
- [ ] Build care plan upload and audit UI
- [ ] Build staff notes upload and audit UI
- [ ] Build AI audit results display with scores and recommendations
- [ ] Send email notifications when AI audits complete

## Phase 7: Incident Reporting System
- [ ] Create procedures for incident CRUD
- [ ] Create procedures for incident escalation
- [ ] Create procedure to generate incident reports
- [ ] Build incident form with categorization
- [ ] Build incident list with filters
- [ ] Build incident details view
- [ ] Link incidents to Risk Notification Log and CQC Log

## Phase 8: Report Generation System
- [ ] Create procedure to generate compliance summary report
- [ ] Create procedure to generate detailed compliance report
- [ ] Create procedure to generate incident report
- [ ] Create procedure to generate audit report
- [ ] Implement PDF generation with company branding
- [ ] Implement Word export with company branding
- [ ] Implement Excel export for data
- [ ] Build report generator UI
- [ ] Build report history and download UI

## Phase 9: Notifications & Dashboard
- [ ] Create notification procedures (create, list, mark read)
- [ ] Create procedure to send email notifications
- [ ] Implement notification triggers (non-compliance, overdue audits, AI complete)
- [ ] Build notification center UI
- [ ] Build comprehensive dashboard with compliance overview
- [ ] Build RAG status visualization
- [ ] Build upcoming audits calendar widget
- [ ] Build overdue actions widget
- [ ] Build recent incidents widget
- [ ] Add dashboard filters (location, date range, section)

## Phase 10: Testing & Polish
- [ ] Write vitest tests for critical procedures
- [ ] Test multi-tenant data isolation
- [ ] Test role-based access control
- [ ] Test AI audit workflow end-to-end
- [ ] Test report generation with branding
- [ ] Test notification delivery
- [ ] Test compliance calculation accuracy
- [ ] Verify GDPR compliance (name stripping)
- [ ] Create first checkpoint

## Phase 11: Delivery
- [ ] Final status check
- [ ] Prepare user documentation
- [ ] Deliver system to user


## URGENT: Custom Authentication & Notifications (User Request)
- [x] Remove Manus OAuth dependency
- [x] Implement custom email/password authentication with bcrypt
- [x] Create registration endpoint with company creation
- [x] Create login endpoint with JWT token generation
- [ ] Implement password reset functionality
- [ ] Add 2FA setup and verification (optional for users)
- [ ] Replace Manus notification system with SendGrid/Resend
- [ ] Create email notification service for audit completion, overdue actions
- [x] Update frontend with login/registration forms
- [x] Create seed user accounts for testing
- [x] Provide login credentials to user


## BUG: Authentication Flow Issue
- [ ] Debug why users are redirected back to login after successful login
- [ ] Fix cookie/session persistence issue
- [ ] Verify JWT token is being set correctly
- [ ] Test authentication flow end-to-end
- [ ] Ensure dashboard loads after successful login

## GitHub Repository
- [ ] Create new GitHub repository
- [ ] Initialize git in project directory
- [ ] Add all files to git
- [ ] Create initial commit
- [ ] Push to GitHub repository
- [ ] Provide repository link to user
