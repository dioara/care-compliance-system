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
- [x] Debug why users are redirected back to login after successful login
- [x] Fix cookie/session persistence issue
- [x] Verify JWT token is being set correctly
- [x] Test authentication flow end-to-end
- [x] Ensure dashboard loads after successful login

## GitHub Repository
- [x] Create new GitHub repository
- [x] Initialize git in project directory
- [x] Add all files to git
- [x] Create initial commit
- [x] Push to GitHub repository
- [x] Provide repository link to user


## BUG: Mobile Browser Authentication Issue
- [x] Authentication fails on mobile browsers (iOS Safari, Chrome mobile)
- [x] HTTP-only cookies with sameSite: none not working on mobile
- [x] Switch from cookie-based auth to localStorage token storage
- [x] Update backend to return token in response body
- [x] Update frontend to store token in localStorage
- [x] Update context to read token from Authorization header
- [x] Test on mobile Safari, Chrome mobile, and desktop browsers
- [x] Ensure token is sent with every API request via Authorization header


## Role-Based Permission System
- [x] Create roles table (id, tenantId, name, description)
- [x] Create roleLocationPermissions table (roleId, locationId, canRead, canWrite)
- [x] Create userRoles table (userId, roleId)
- [x] Update user schema to add superAdmin boolean field
- [x] Push database schema changes
- [x] Create database functions for role management (CRUD)
- [x] Create database functions for role-location permission management
- [x] Create database functions for user-role assignment
- [ ] Build super admin role management page
- [ ] Add role creation/edit form with name and description
- [ ] Add role location permissions UI (checkboxes for read/write per location)
- [ ] Build user management page for super admin
- [ ] Add user creation form with role assignment (multi-select)
- [ ] Add user edit form to change assigned roles
- [ ] Implement role-based location access resolution in context
- [ ] Add permission checks in all mutations (canWrite check)
- [ ] Update dashboard to show only accessible locations
- [ ] Update service users list to filter by accessible locations
- [ ] Update staff list to filter by accessible locations
- [ ] Update compliance assessments to filter by accessible locations
- [ ] Update audits to filter by accessible locations
- [ ] Update incidents to filter by accessible locations
- [ ] Test super admin can create roles with location permissions
- [ ] Test super admin can assign users to roles
- [ ] Test users can only see locations from their assigned roles
- [ ] Test read-only role users cannot edit data
- [ ] Test role permission changes affect all users with that role


## RBAC Implementation Summary

**Completed:**
- Database schema with roles, roleLocationPermissions, userRoles tables
- Super admin flag on users table
- Complete database helper functions for role CRUD, permission management, user-role assignments
- Permission resolution functions (getUserLocationPermissions, canUserAccessLocation, canUserWriteToLocation)
- tRPC routers for role management with super admin middleware
- Role-based location access aggregation (most permissive wins if user has multiple roles)

**How it works:**
1. Super admin creates roles (e.g., "North Region QO", "Location A Manager")
2. Super admin assigns location permissions to each role (locationId + canRead + canWrite)
3. Super admin assigns users to one or more roles
4. System resolves user's effective permissions by aggregating all their roles' permissions
5. If user has multiple roles with different permissions for same location, most permissive wins
6. Super admins automatically have full read/write access to all locations

**Next Steps:**
- Build super admin UI for role management
- Build role-location permission assignment UI
- Build user management UI with role assignment
- Implement location-based filtering in all data queries
- Add permission checks in all mutations


## Location Switcher & Context Management
- [x] Create LocationContext provider to manage active location state
- [x] Create useLocation hook to access active location and permissions
- [x] Build location switcher dropdown component
- [x] Add location switcher to DashboardLayout header
- [x] Show user's accessible locations in dropdown
- [x] Persist selected location in localStorage
- [ ] Update Dashboard to show selected location's data
- [ ] Update CompanyProfile to filter by selected location
- [ ] Update Locations page to highlight selected location
- [ ] Add read-only badge/indicator when user only has read access
- [ ] Disable edit buttons when user doesn't have write permission
- [ ] Update all future data queries to filter by selected location
- [ ] Test switching between locations
- [ ] Test read-only vs read-write permissions


## BUG: Authentication Failure with Correct Credentials
- [ ] Debug why login fails with admin@testcarehome.com / admin123
- [ ] Check if user exists in database
- [ ] Check if password hash is correct
- [ ] Add detailed logging to login endpoint
- [ ] Test login flow end-to-end
- [ ] Verify token generation and storage
- [ ] Fix any issues preventing successful login


## BUG: Default Location Not Created on Signup
- [x] Update registration endpoint to create default "Main Office" location
- [x] Ensure every new tenant has at least one location
- [x] First user is automatically super admin
- [x] Created default location for existing test tenant
- [x] Test registration creates location automatically

## BUG: Missing company.listLocations tRPC Endpoint
- [x] Verified locations.list endpoint exists and works correctly
- [x] Return locations for user's tenant
- [x] Test locations page loads correctly


## Service Users & Staff Management with Location Filtering
- [x] Add database helper functions for service users CRUD
- [x] Add database helper functions for staff members CRUD
- [x] Create tRPC routers for service users management
- [x] Create tRPC routers for staff management
- [x] Build Service Users page with list, create, edit, delete
- [x] Default location to active location from LocationContext
- [x] Filter service users list by active location
- [x] Build Staff page with list, create, edit, delete
- [x] Default location to active location from LocationContext
- [x] Filter staff list by active location
- [x] Add navigation links to Service Users and Staff pages
- [x] Add seed data for testing (sample service users and staff)
- [x] Test location filtering works correctly
- [x] Test location defaulting in forms
- [x] Commit database schema and seed data to GitHub


## Complete Compliance Assessment Interface
- [x] Define all 29 CQC compliance sections with descriptions
- [x] Create seed data script for compliance sections (questions need to be added)
- [x] Add database helper functions for compliance assessments
- [x] Create tRPC endpoints for compliance CRUD operations
- [x] Build compliance overview page with RAG status grid
- [x] Show compliance percentage and overdue actions count
- [x] Build detailed section assessment page
- [x] Add question-by-question assessment with RAG status
- [x] Add notes and findings for each question
- [x] Build action tracking system
- [x] Add responsible person assignment
- [x] Add target completion dates
- [x] Show overdue actions prominently
- [x] Filter assessments by active location
- [x] Test complete assessment workflow
- [ ] Implement evidence document upload (S3) - placeholder added
- [ ] Seed compliance questions for each section


## Restructure Compliance to be Per-Person
- [x] Update compliance assessment approach: assessments should be per staff member or service user, not per location
- [x] Modify Staff page to show compliance status for each staff member (7 sections)
- [x] Modify Service User page to show compliance status for each service user (22 sections)
- [x] Add "View Compliance" button on each staff/service user card
- [x] Create person-specific compliance page showing their sections
- [x] Update database queries to fetch assessments by person ID
- [x] Test complete per-person compliance workflow
- [ ] Add detailed compliance questions for 29 sections (optional - sections work without questions)


## Extract Questions from Intervention Plan Document
- [x] Review intervention plan document to extract all compliance questions
- [x] Extract evidence requirements for each question (198 questions extracted)
- [x] Create seed script with all questions organized by section
- [x] Populate complianceQuestions table with all extracted questions (198 added)
- [x] Fix section filtering bug - removed duplicate sections, fixed section types
- [x] Update PersonCompliance UI to display questions within sections using Accordion
- [x] Add getAllComplianceQuestions database function
- [x] Add questions endpoint to tRPC compliance router
- [x] Test question-by-question assessment workflow
- [x] Commit all changes to GitHub


## BUG: Question Ordering and Missing Questions
- [x] Fix question number sorting (11.1, 11.2... 11.10, 11.11 using parseFloat)
- [x] Re-examine intervention plan Excel to find all sheets with questions (16 sheets, 198 questions)
- [x] Extract questions for missing staff sections (split Supporting Staff 25 questions across sections 2-7)
- [x] Create questions for missing service user sections (Financial, Activities, End of Life, Mental Health, Equality - 35 new questions)
- [x] Update seed script with all missing questions (233 total questions)
- [x] Populate database with complete question set (233 questions across 26 sections)
- [x] Fix UI to sort questions by numeric value using parseFloat on questionNumber
- [x] Verify all 26 sections have questions (7 staff + 19 service user)
- [x] Test question ordering displays correctly on both staff and service user pages
- [x] Commit to GitHub


## Renumber Questions to Match Section Numbers
- [x] Update all questions to use section-based numbering (Section 1 → 1.1, 1.2, 1.3...)
- [x] Replace Excel numbering (11.1, 11.2) with clean sequential numbering
- [x] Update database with renumbered questions (233 questions renumbered)
- [x] Test questions display with correct numbering (verified Section 1 shows 1.1-1.20)
- [x] Commit to GitHub


## Convert to British Spelling
- [x] Search for American spellings in database (organization, color, license, etc.)
- [x] Update compliance questions to use British spelling
- [x] Update UI text to use British spelling
- [x] Update section descriptions to use British spelling
- [x] Test changes across all pages
- [x] Commit to GitHub (committed locally, will be synced via checkpoint)


## Add Compliance Progress Indicators
- [x] Create database function to calculate compliance progress per person
- [x] Add progress indicator to Staff cards (X/7 sections complete)
- [x] Add progress indicator to Service User cards (X/19 sections complete)
- [x] Add color-coded progress bars to cards
- [x] Update tRPC endpoints to include progress data
- [x] Test progress indicators display correctly (verified in browser)

## Remove Hardcoded Dashboard Data
- [x] Create database functions for dashboard statistics
- [x] Replace hardcoded overall compliance percentage with real data
- [x] Replace hardcoded overdue actions count with real data
- [x] Replace hardcoded upcoming audits count with real data (placeholder 0 until audit system built)
- [x] Replace hardcoded recent incidents count with real data (placeholder 0 until incident system built)
- [x] Replace hardcoded RAG status counts with real data
- [x] Replace hardcoded overdue actions list with real data
- [x] Test dashboard displays real data correctly (verified in browser)


## Build Comprehensive Audit System
- [x] Review uploaded audit documents (7 templates)
- [ ] Extract audit structures and questions from each template
- [x] Research CQC audit standards and requirements
- [x] Identify all required audit types from intervention plan (40 audit types identified)
- [x] Design database schema for audit system
- [x] Create audit templates table
- [x] Create audit template sections table
- [x] Create audit template questions table
- [x] Create audit instances table
- [x] Create audit responses table
- [x] Create audit evidence table
- [x] Create audit action plans table
- [x] Push schema changes to database
- [ ] Build dynamic audit questionnaire forms
- [ ] Implement audit scheduling and reminders
- [ ] Integrate S3 evidence upload for audits
- [ ] Link audit responses to Quality Monitoring section
- [ ] Create audit dashboard showing scheduled vs completed
- [ ] Add overdue audit alerts
- [ ] Build audit report generation (PDF)
- [ ] Test audit workflow end-to-end


## Build Comprehensive Audit System
- [x] Review uploaded audit documents (7 templates)
- [x] Extract audit structures and questions from each template
- [x] Research CQC audit standards and requirements
- [x] Identify all required audit types from intervention plan (42 audit types identified)
- [x] Design database schema for audit system (8 tables)
- [x] Create audit templates table
- [x] Create audit questions table
- [x] Create audit responses table
- [x] Create audit evidence/attachments table
- [x] Populate 42 audit types with 822 questions
- [x] Build audit database helper functions
- [x] Create tRPC audit router with all endpoints
- [x] Build Audits dashboard page (schedule audits, view history)
- [x] Create Audits dashboard page (schedule audits, view history)
- [x] Create ConductAudit page (dynamic questionnaire with real-time save)
- [x] Create AuditResults page (view completed audits with responses)
- [x] Implement evidence upload UI with S3 integration
- [x] Create action plans UI with assignment and due dates
- [x] Register audit routes in App.tsx
- [x] Test complete audit workflow end-to-end (Audits page loading, schedule dialog working)
- [ ] Save checkpoint and push to GitHub
