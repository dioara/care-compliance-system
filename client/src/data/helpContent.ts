export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

export const helpCategories = [
  { id: "getting-started", name: "Getting Started", icon: "🚀" },
  { id: "audits", name: "Audits & Compliance", icon: "📋" },
  { id: "incidents", name: "Incident Management", icon: "⚠️" },
  { id: "users", name: "User Management", icon: "👥" },
  { id: "reports", name: "Reports & Analytics", icon: "📊" },
  { id: "settings", name: "Settings & Configuration", icon: "⚙️" },
  { id: "troubleshooting", name: "Troubleshooting", icon: "🔧" },
];

export const helpArticles: HelpArticle[] = [
  // ============================================
  // GETTING STARTED
  // ============================================
  {
    id: "welcome",
    category: "getting-started",
    title: "Welcome to CCMS",
    keywords: ["welcome", "introduction", "overview", "getting started"],
    content: `
# Welcome to Care Compliance Management System (CCMS)

CCMS is a comprehensive platform designed to help care homes maintain regulatory compliance, manage audits, track incidents, and ensure the highest standards of care delivery.

## What is CCMS?

The Care Compliance Management System streamlines compliance management for care homes by providing tools to conduct audits, track incidents, manage documentation, and generate reports. The system helps you meet CQC (Care Quality Commission) requirements and maintain evidence of compliance.

## Key Features

**Audit Management**: Create, schedule, and conduct comprehensive audits across all areas of care delivery. Track audit history, generate action plans, and monitor compliance scores over time.

**Incident Reporting**: Record and manage incidents with detailed categorization, severity tracking, and investigation workflows. Ensure timely reporting and resolution of safety concerns.

**Service User Management**: Maintain comprehensive records for residents including care plans, assessments, and historical data. Track service user journeys and ensure personalized care delivery.

**Staff Management**: Manage staff records, track training and certifications, and maintain compliance with staffing requirements. Monitor staff performance and development.

**Reporting & Analytics**: Generate detailed compliance reports, track trends, and identify areas for improvement. Export data for regulatory submissions and internal reviews.

## Getting Help

This help center provides comprehensive guides for all CCMS features. Use the search function to find specific topics, or browse by category. If you need additional assistance, contact your system administrator or support team.
`
  },

  {
    id: "first-login",
    category: "getting-started",
    title: "Your First Login",
    keywords: ["login", "sign in", "first time", "password", "authentication"],
    content: `
# Your First Login

## Accessing CCMS

Navigate to your organization's CCMS URL (typically https://app.ccms.co.uk or your custom domain). You'll see the sign-in page.

## Signing In

Click the "Sign in" button to launch the authentication flow. CCMS uses secure OAuth authentication to protect your account. You'll be redirected to the Manus authentication portal where you can sign in with your email address.

## After Login

Upon successful authentication, you'll be redirected to the CCMS dashboard. The dashboard provides an overview of:

**Compliance Status**: Current compliance score and recent audit results across your organization.

**Pending Tasks**: Outstanding action plans, scheduled audits, and items requiring attention.

**Recent Activity**: Latest audits, incidents, and system updates.

**Quick Actions**: Shortcuts to common tasks like starting an audit or reporting an incident.

## Navigation

The left sidebar provides access to all CCMS modules. Key sections include Dashboard, Audits, Incidents, Service Users, Staff, and Reports. Click any menu item to navigate to that section.

## Getting Oriented

Take time to explore the dashboard and familiarize yourself with the navigation. The onboarding tour (if enabled) will guide you through key features. You can restart the tour anytime from your user profile settings.
`
  },

  {
    id: "dashboard-overview",
    category: "getting-started",
    title: "Understanding Your Dashboard",
    keywords: ["dashboard", "overview", "statistics", "metrics", "home"],
    content: `
# Understanding Your Dashboard

## Dashboard Layout

The CCMS dashboard provides a real-time overview of your organization's compliance status and key metrics. The dashboard is divided into several sections providing different insights.

## Compliance Score

The compliance score card shows your overall compliance percentage based on recent audit results. This score is calculated from all completed audits within the selected time period. A score above 85% indicates good compliance, while scores below 70% require immediate attention.

## Audit Statistics

View the total number of audits conducted, completion rate, and average scores. Track trends over time to identify improvements or areas of concern. The audit statistics help you understand your organization's audit performance at a glance.

## Incident Overview

See the number of incidents reported, categorized by severity. Monitor incident resolution rates and identify patterns that may require policy changes or additional training.

## Upcoming Audits

The dashboard displays scheduled audits for the coming weeks. Click on any audit to view details or start conducting it if the scheduled date has arrived.

## Recent Activity

Track the latest system activity including completed audits, new incidents, and user actions. This helps you stay informed about what's happening across your organization.

## Filtering by Location

If your organization has multiple locations, use the location filter at the top of the dashboard to view metrics for specific sites. This allows you to compare performance across locations and identify where additional support may be needed.

## Customizing Your View

The dashboard automatically updates based on your role and permissions. Administrators see organization-wide data, while location managers see data specific to their assigned locations.
`
  },

  // ============================================
  // AUDITS & COMPLIANCE
  // ============================================
  {
    id: "creating-audit",
    category: "audits",
    title: "Creating and Scheduling Audits",
    keywords: ["create audit", "schedule", "audit types", "planning"],
    content: `
# Creating and Scheduling Audits

## Audit Types

CCMS supports various audit types aligned with CQC fundamental standards including Care Planning, Medication Management, Infection Control, Health & Safety, Nutrition & Hydration, and more. Each audit type has a predefined template with relevant questions and compliance criteria.

## Starting a New Audit

Navigate to the Audits page and click the "Quick Add" button or "Schedule Audit" to create a new audit. Select the audit type from the dropdown menu based on what you want to assess.

## Audit Details

Provide the following information when scheduling an audit:

**Audit Type**: Select from the list of available audit types (e.g., Daily Notes Review, Cleanliness and Housekeeping).

**Location**: Choose the care home location where the audit will be conducted.

**Scheduled Date**: Set the date when the audit should be performed.

**Auditor**: Assign a staff member responsible for conducting the audit. You can assign yourself or another qualified team member.

**Service User** (if applicable): For service user-specific audits like care plan reviews, select the relevant resident.

## Audit Templates

Each audit type uses a structured template with sections and questions. Templates are pre-configured based on regulatory requirements and best practices. You cannot modify template questions during audit creation, ensuring consistency across all audits.

## Scheduling vs. Immediate Start

You can either schedule an audit for a future date or start it immediately. Scheduled audits appear in the Audit Calendar and send reminders to assigned auditors. Immediate audits take you directly to the audit conduct page.

## Recurring Audits

For audits that need to be conducted regularly (e.g., monthly medication audits), you can set up recurring schedules. This ensures compliance activities are performed consistently without manual scheduling each time.
`
  },

  {
    id: "conducting-audit",
    category: "audits",
    title: "Conducting an Audit",
    keywords: ["conduct", "complete", "answer questions", "audit process"],
    content: `
# Conducting an Audit

## Starting an Audit

From the Audits page or Audit History, click "Continue" on a scheduled audit or "Start" on a new audit. This opens the audit conduct page where you'll answer all audit questions.

## Audit Structure

Audits are organized into sections, each containing related questions. For example, a Cleanliness audit might have sections for General Cleanliness, Kitchen Standards, and Bathroom Facilities. Navigate through sections sequentially to ensure all areas are covered.

## Answering Questions

Each question requires a response. Common response types include:

**Yes/No**: Simple compliance questions where you indicate whether the standard is met.

**Multiple Choice**: Select from predefined options that best describe the current situation.

**Rating Scale**: Rate compliance on a scale (e.g., 1-5) based on observed conditions.

**Text Response**: Provide detailed observations or explanations for complex questions.

## Adding Evidence

For each question, you can attach supporting evidence such as photographs, documents, or notes. Evidence strengthens your audit findings and provides context for reviewers. Click the "Add Evidence" button to upload files or take photos directly from your device.

## Progress Tracking

The progress bar at the top shows how many questions you've answered. You can save your progress and return later if needed. CCMS automatically saves responses as you work through the audit.

## Creating Action Plans

When you identify non-compliance or areas for improvement, create action plans directly from the audit question. Specify what needs to be done, who is responsible, and the target completion date. Action plans are tracked separately and can be monitored for completion.

## Completing the Audit

Once all questions are answered, click "Complete Audit" to finalize your responses. Review the summary page showing your compliance score and any action plans created. Completed audits cannot be edited, ensuring audit integrity.

## Audit Results

After completion, the audit generates a results page with the overall score, section-by-section breakdown, and all action plans. You can export the audit report as a PDF for record-keeping or regulatory submissions.
`
  },

  {
    id: "audit-history",
    category: "audits",
    title: "Viewing Audit History",
    keywords: ["history", "past audits", "results", "trends", "archive"],
    content: `
# Viewing Audit History

## Accessing Audit History

Navigate to "Audit History" from the main menu to view all completed and in-progress audits. The history page displays audits in reverse chronological order with the most recent at the top.

## Filtering Audits

Use the filter options to narrow down the audit list:

**Audit Type**: Show only specific types of audits (e.g., only Medication Management audits).

**Location**: Filter by care home location if you manage multiple sites.

**Date Range**: View audits from a specific time period.

**Status**: Filter by audit status (completed, in-progress, scheduled).

**Auditor**: See audits conducted by specific staff members.

## Audit Status Indicators

Each audit displays a status badge:

**Scheduled**: Audit is planned for a future date.

**In Progress**: Audit has been started but not yet completed.

**Completed**: All questions answered and audit finalized.

**Reviewed**: Audit has been reviewed by management.

**Archived**: Older audits moved to archive for record-keeping.

## Viewing Audit Details

Click "View" on any completed audit to see the full results including compliance score, answered questions, evidence attachments, and action plans. For in-progress audits, click "Continue" to resume where you left off.

## Comparing Audits

Select multiple audits of the same type to compare results over time. This helps identify trends, measure improvement, and spot recurring issues. The comparison view shows score changes and highlights areas with significant variations.

## Exporting Audit Data

Export audit history to Excel or CSV for external analysis or regulatory reporting. The export includes all audit details, scores, and action plan status.
`
  },

  {
    id: "action-plans",
    category: "audits",
    title: "Managing Action Plans",
    keywords: ["action plans", "corrective actions", "follow-up", "tasks"],
    content: `
# Managing Action Plans

## What are Action Plans?

Action plans are corrective actions created when audits identify non-compliance or areas for improvement. Each action plan specifies what needs to be done, who is responsible, and when it should be completed.

## Creating Action Plans

Action plans are typically created during audits when you answer a question indicating non-compliance. You can also create standalone action plans from the audit results page. Provide the following information:

**Issue Description**: Clearly describe the problem or non-compliance identified.

**Corrective Action**: Specify what needs to be done to address the issue.

**Responsible Person**: Assign a staff member accountable for completing the action.

**Target Date**: Set a realistic deadline for completion.

**Priority**: Indicate urgency (High, Medium, Low) based on risk and regulatory requirements.

## Tracking Action Plans

All action plans are tracked in a centralized view accessible from the Audits section. You can filter action plans by status, priority, responsible person, or due date. Overdue action plans are highlighted in red to ensure they receive immediate attention.

## Updating Action Plans

The assigned person can update action plan status as work progresses. Status options include:

**Open**: Action plan created but work not yet started.

**In Progress**: Work underway to address the issue.

**Completed**: Corrective action finished and verified.

**Verified**: Management has confirmed the issue is resolved.

## Evidence of Completion

When marking an action plan as completed, attach evidence demonstrating the issue has been resolved. This might include photos, updated policies, training records, or verification checklists.

## Action Plan Reports

Generate reports showing all action plans, completion rates, and overdue items. These reports help management monitor compliance improvement efforts and demonstrate responsiveness to regulatory concerns.
`
  },

  {
    id: "audit-calendar",
    category: "audits",
    title: "Using the Audit Calendar",
    keywords: ["calendar", "schedule", "planning", "upcoming audits"],
    content: `
# Using the Audit Calendar

## Calendar Overview

The Audit Calendar provides a visual representation of all scheduled audits across your organization. Access it from the main menu to see upcoming audits, plan your compliance activities, and ensure no audits are missed.

## Calendar Views

Switch between different calendar views:

**Month View**: See all audits scheduled for the entire month at a glance.

**Week View**: Detailed view of audits for the current week.

**Day View**: Hourly breakdown of audits scheduled for a specific day.

**List View**: Chronological list of upcoming audits with full details.

## Color Coding

Audits are color-coded by type for easy identification. For example, medication audits might appear in blue, while health and safety audits appear in orange. The legend at the top of the calendar shows what each color represents.

## Adding Audits from Calendar

Click on any date in the calendar to quickly schedule a new audit for that day. This is faster than navigating to the Audits page when you know the specific date you want to schedule.

## Audit Reminders

CCMS automatically sends email reminders to assigned auditors before scheduled audits. Reminder timing can be configured in system settings (typically 24-48 hours before the audit date).

## Filtering Calendar View

Filter the calendar to show only specific audit types, locations, or auditors. This helps you focus on relevant audits when managing multiple locations or teams.

## Exporting Calendar

Export your audit calendar to integrate with external calendar applications like Outlook or Google Calendar. This ensures audit schedules are visible alongside other organizational activities.
`
  },

  // ============================================
  // INCIDENT MANAGEMENT
  // ============================================
  {
    id: "reporting-incident",
    category: "incidents",
    title: "Reporting an Incident",
    keywords: ["report", "incident", "accident", "near miss", "safety"],
    content: `
# Reporting an Incident

## When to Report

Report any incident, accident, near miss, or safety concern immediately after it occurs. Timely reporting ensures proper investigation, prevents recurrence, and meets regulatory requirements. Examples include falls, medication errors, safeguarding concerns, and equipment failures.

## Accessing Incident Reporting

Click "Incidents" in the main menu, then "Report New Incident" or use the Quick Add button for faster access. The incident form opens where you'll provide all relevant details.

## Incident Details

Complete the following sections when reporting an incident:

**Incident Type**: Select the category that best describes the incident (e.g., Fall, Medication Error, Safeguarding, Pressure Injury).

**Severity**: Indicate the impact level (Minor, Moderate, Severe, Critical). Severity determines notification requirements and investigation depth.

**Date and Time**: Record exactly when the incident occurred. Accurate timing is crucial for investigation and pattern analysis.

**Location**: Specify where the incident happened (e.g., Resident Room 12, Dining Area, Garden).

**People Involved**: Identify all individuals involved including service users, staff, and visitors.

## Incident Description

Provide a detailed, factual account of what happened. Include:

**What occurred**: Describe the sequence of events leading to and during the incident.

**Who was involved**: Names and roles of all people present.

**Where it happened**: Specific location details.

**When it occurred**: Exact date and time.

**Immediate actions taken**: First aid provided, medical attention sought, area secured, etc.

Avoid speculation or blame. Focus on observable facts that can be verified during investigation.

## Witness Statements

If witnesses were present, record their accounts separately. Witness statements provide additional perspectives and help establish a complete picture of the incident.

## Immediate Actions

Document all immediate actions taken in response to the incident. This includes first aid, medical treatment, notifications to family or authorities, and any temporary measures to prevent recurrence.

## Attachments

Attach relevant evidence such as photos of the incident scene, equipment involved, or injuries sustained (with appropriate consent). Visual evidence aids investigation and supports findings.

## Notifications

CCMS automatically notifies relevant personnel based on incident severity and type. Critical incidents trigger immediate alerts to management and may require external reporting to CQC or local authorities.

## Submitting the Report

Review all information for accuracy and completeness before submitting. Once submitted, the incident enters the investigation workflow and cannot be deleted (though it can be updated with additional information).
`
  },

  {
    id: "incident-investigation",
    category: "incidents",
    title: "Investigating Incidents",
    keywords: ["investigation", "root cause", "analysis", "findings"],
    content: `
# Investigating Incidents

## Investigation Purpose

Incident investigations determine root causes, identify contributing factors, and develop preventive measures. Thorough investigations improve safety and demonstrate due diligence to regulators.

## Investigation Timeline

Begin investigations promptly after incident reporting. Severity determines investigation depth and timeline:

**Critical incidents**: Investigation starts immediately, completed within 24-48 hours.

**Severe incidents**: Investigation begins within 24 hours, completed within 5 working days.

**Moderate incidents**: Investigation starts within 48 hours, completed within 10 working days.

**Minor incidents**: Investigation completed within 15 working days.

## Investigation Process

Access the incident from the Incidents list and click "Investigate" to begin. The investigation form guides you through a structured analysis.

## Gathering Information

Collect all relevant information including:

**Incident report**: Review the original report and any updates.

**Witness interviews**: Speak with everyone present during the incident.

**Documentation review**: Examine care plans, risk assessments, policies, and previous incident reports.

**Physical evidence**: Inspect equipment, environment, or any physical factors involved.

**Staff records**: Check training, competency, and previous performance of involved staff.

## Root Cause Analysis

Identify the underlying causes, not just immediate triggers. Use the "5 Whys" technique or fishbone diagrams to trace problems to their source. Common root causes include inadequate training, unclear procedures, equipment failure, or environmental hazards.

## Contributing Factors

Document all factors that contributed to the incident even if they weren't the primary cause. This might include staffing levels, time pressures, communication gaps, or systemic issues.

## Findings and Recommendations

Summarize investigation findings clearly and objectively. Recommendations should be specific, actionable, and address root causes. Assign responsibility for implementing each recommendation with target completion dates.

## Investigation Report

Complete the investigation report with all findings, evidence, and recommendations. The report becomes part of the permanent incident record and may be reviewed by regulators.

## Closing the Investigation

Once all recommendations are documented and assigned, close the investigation. The incident status changes to "Under Review" pending implementation of corrective actions.
`
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================
  {
    id: "managing-service-users",
    category: "users",
    title: "Managing Service Users",
    keywords: ["residents", "service users", "care recipients", "profiles"],
    content: `
# Managing Service Users

## Service User Records

Service user records contain comprehensive information about each resident including personal details, care needs, medical history, and preferences. Maintaining accurate records ensures personalized care and regulatory compliance.

## Adding New Service Users

Navigate to "Service Users" and click "Add Service User". Complete the registration form with:

**Personal Information**: Full name, date of birth, NHS number, and contact details.

**Emergency Contacts**: Family members or representatives to contact in emergencies.

**Admission Details**: Date of admission, room assignment, and funding source.

**Medical Information**: Diagnoses, allergies, medications, and healthcare providers.

**Care Needs**: Mobility level, dietary requirements, communication needs, and personal care preferences.

## Care Plans

Each service user has an individualized care plan outlining their needs, goals, and interventions. Care plans are reviewed regularly (typically monthly) and updated when needs change. Link care plan audits to service user records for easy access.

## Risk Assessments

Maintain current risk assessments for each service user covering areas like falls, nutrition, pressure injuries, and behavior. Risk assessments inform care planning and staff training needs.

## Service User History

CCMS tracks all changes to service user records, care plans, and risk assessments. The history log shows who made changes and when, ensuring accountability and audit trails.

## Privacy and Consent

Service user records contain sensitive personal information. Access is restricted based on role and need-to-know. Always obtain appropriate consent before sharing information with external parties.

## Discharge and Transfer

When a service user leaves the care home, update their status to "Discharged" and record the discharge date and destination. Discharged records are archived but remain accessible for reference.
`
  },

  {
    id: "managing-staff",
    category: "users",
    title: "Managing Staff Members",
    keywords: ["staff", "employees", "team", "personnel", "users"],
    content: `
# Managing Staff Members

## Staff Records

Staff records contain employment information, qualifications, training history, and performance data. Accurate staff records support compliance with staffing regulations and ensure qualified personnel deliver care.

## Adding Staff Members

Administrators can add new staff from the Staff section. Provide:

**Personal Details**: Full name, contact information, and emergency contacts.

**Employment Information**: Job title, start date, employment type (full-time, part-time, agency).

**Qualifications**: Relevant certifications, licenses, and professional registrations.

**DBS Check**: Disclosure and Barring Service check details and renewal dates.

**Training Records**: Mandatory training completion dates and upcoming renewals.

## User Accounts

Each staff member can have a CCMS user account for accessing the system. When creating accounts, assign appropriate roles and permissions based on their responsibilities. Common roles include Administrator, Manager, Auditor, and Care Staff.

## Roles and Permissions

CCMS uses role-based access control to ensure staff only access information relevant to their duties:

**Administrator**: Full system access including configuration, user management, and all data.

**Manager**: Access to all operational features, reporting, and staff management for assigned locations.

**Auditor**: Conduct audits, create action plans, and view audit history.

**Care Staff**: View service user information, report incidents, and complete assigned tasks.

## Training Tracking

Record all training completed by staff including mandatory training (e.g., safeguarding, infection control) and role-specific training. CCMS can send reminders when training renewals are due.

## Performance Management

Link audit results and incident investigations to staff records to support performance reviews and identify training needs. Positive performance can also be documented for recognition and development planning.

## Staff Scheduling

If using the scheduling module, staff availability and shift patterns are managed through their profiles. This ensures adequate staffing levels and compliance with working time regulations.
`
  },

  // ============================================
  // REPORTS & ANALYTICS
  // ============================================
  {
    id: "generating-reports",
    category: "reports",
    title: "Generating Reports",
    keywords: ["reports", "analytics", "export", "data", "statistics"],
    content: `
# Generating Reports

## Report Types

CCMS offers various reports to support compliance monitoring, performance analysis, and regulatory submissions:

**Compliance Reports**: Overall compliance scores, audit results by type, and trend analysis.

**Incident Reports**: Incident statistics, severity breakdown, and investigation status.

**Action Plan Reports**: Outstanding actions, completion rates, and overdue items.

**Service User Reports**: Demographics, care needs analysis, and risk assessment summaries.

**Staff Reports**: Training compliance, audit performance, and incident involvement.

## Accessing Reports

Navigate to the Reports section from the main menu. Select the report type you need from the available options. Each report type has specific parameters you can configure.

## Report Parameters

Customize reports using available parameters:

**Date Range**: Specify the time period for the report (e.g., last month, last quarter, custom dates).

**Location**: Filter by specific care home locations if managing multiple sites.

**Audit Type**: For audit reports, select specific audit types or include all types.

**Status**: Filter by status (e.g., only completed audits, only open action plans).

## Generating Reports

After selecting parameters, click "Generate Report" to create the report. Depending on data volume, report generation may take a few seconds to a minute. Large reports with extensive historical data take longer to process.

## Report Formats

Export reports in multiple formats:

**PDF**: Professional format suitable for printing and regulatory submissions.

**Excel**: Spreadsheet format for further analysis and data manipulation.

**CSV**: Raw data export for integration with external systems.

## Scheduled Reports

Set up recurring reports to be generated automatically and emailed to specified recipients. For example, schedule a monthly compliance report to be sent to management on the first of each month.

## Report Interpretation

Each report includes explanatory notes and guidance on interpreting the data. Pay attention to trends over time rather than isolated data points. Significant changes (positive or negative) warrant investigation.

## Sharing Reports

Reports can be shared with internal stakeholders or external parties like CQC inspectors. Ensure appropriate permissions and data protection measures when sharing reports containing personal information.
`
  },

  {
    id: "dashboard-analytics",
    category: "reports",
    title: "Understanding Analytics",
    keywords: ["analytics", "metrics", "KPIs", "performance", "trends"],
    content: `
# Understanding Analytics

## Key Performance Indicators (KPIs)

CCMS tracks several KPIs to measure compliance and care quality:

**Overall Compliance Score**: Weighted average of all audit results. Target: 85% or higher.

**Audit Completion Rate**: Percentage of scheduled audits completed on time. Target: 95% or higher.

**Incident Rate**: Number of incidents per 100 resident days. Lower is better; compare to industry benchmarks.

**Action Plan Completion**: Percentage of action plans completed by target date. Target: 90% or higher.

**Training Compliance**: Percentage of staff with current mandatory training. Target: 100%.

## Trend Analysis

Track KPIs over time to identify trends. Improving trends indicate effective compliance management, while declining trends signal areas needing attention. Look for:

**Seasonal patterns**: Some metrics may vary by season (e.g., infection rates in winter).

**Sudden changes**: Investigate any sharp increases or decreases in metrics.

**Correlation**: Identify relationships between metrics (e.g., training compliance and incident rates).

## Benchmarking

Compare your performance to:

**Historical performance**: Are you improving compared to last year?

**Other locations**: If managing multiple sites, identify best performers and share their practices.

**Industry standards**: Compare to published benchmarks for care homes.

## Data Quality

Analytics are only as good as the underlying data. Ensure:

**Timely data entry**: Record audits and incidents promptly.

**Complete information**: Fill all required fields accurately.

**Consistent practices**: Use standardized processes across all locations.

## Using Analytics for Improvement

Analytics should drive continuous improvement:

**Identify gaps**: Use data to find areas needing attention.

**Set targets**: Establish realistic improvement goals based on current performance.

**Monitor progress**: Track whether interventions are working.

**Celebrate success**: Recognize improvements and share successes with the team.
`
  },

  // ============================================
  // SETTINGS & CONFIGURATION
  // ============================================
  {
    id: "system-settings",
    category: "settings",
    title: "System Settings",
    keywords: ["settings", "configuration", "preferences", "admin"],
    content: `
# System Settings

## Accessing Settings

Administrators can access system settings from the user menu in the top right corner. Settings are organized into categories for easy navigation.

## Organization Settings

Configure basic organization information:

**Organization Name**: Your care home or organization name displayed throughout the system.

**Locations**: Add and manage multiple care home locations if you operate more than one site.

**Contact Information**: Main contact details for your organization.

**Logo**: Upload your organization logo to appear on reports and documents.

## User Management

Manage user accounts, roles, and permissions:

**Add Users**: Create new user accounts for staff members.

**Assign Roles**: Set appropriate access levels based on job responsibilities.

**Deactivate Users**: Disable accounts for staff who leave without deleting historical data.

**Password Policies**: Configure password requirements and expiration policies.

## Notification Settings

Control how and when the system sends notifications:

**Email Notifications**: Enable or disable email alerts for incidents, audits, and action plans.

**Notification Recipients**: Specify who receives notifications for different event types.

**Reminder Timing**: Set how far in advance to send audit reminders.

## Audit Configuration

Customize audit settings:

**Audit Templates**: View and manage audit templates (contact support to modify templates).

**Scoring Rules**: Configure how compliance scores are calculated.

**Evidence Requirements**: Set whether evidence is mandatory for certain question types.

## Data Retention

Configure how long data is retained:

**Audit History**: How long to keep completed audits before archiving.

**Incident Records**: Retention period for incident reports (must comply with regulations).

**User Data**: When to remove data for discharged service users or former staff.

## Integration Settings

If using integrations with other systems:

**API Access**: Manage API keys for external system connections.

**Data Sync**: Configure automatic data synchronization schedules.

**Export Formats**: Set default formats for data exports.

## Backup and Security

Review security settings and backup status:

**Data Backups**: Verify automatic backups are running successfully.

**Access Logs**: Review who has accessed the system and when.

**Security Policies**: Configure session timeouts and login attempt limits.
`
  },

  {
    id: "user-profile",
    category: "settings",
    title: "Managing Your Profile",
    keywords: ["profile", "account", "password", "preferences", "personal"],
    content: `
# Managing Your Profile

## Accessing Your Profile

Click your name or avatar in the top right corner to access your user profile. Here you can view and update your personal information and preferences.

## Personal Information

Update your contact details:

**Name**: Your display name shown throughout the system.

**Email**: Email address for notifications and password resets.

**Phone**: Contact number for urgent notifications.

**Profile Photo**: Upload a photo to personalize your account.

## Changing Your Password

To change your password:

1. Navigate to your profile settings
2. Click "Change Password"
3. Enter your current password
4. Enter and confirm your new password
5. Save changes

Passwords must meet security requirements (minimum length, complexity) configured by your administrator.

## Notification Preferences

Control which notifications you receive:

**Email Notifications**: Choose which types of events trigger email alerts.

**In-App Notifications**: Configure desktop notifications for time-sensitive events.

**Digest Emails**: Opt for daily or weekly summary emails instead of individual notifications.

## Display Preferences

Customize how CCMS appears:

**Theme**: Choose between light and dark themes.

**Language**: Select your preferred language (if multiple languages are configured).

**Date Format**: Set your preferred date display format.

**Timezone**: Ensure timestamps match your local timezone.

## Default Settings

Set defaults for common actions:

**Default Location**: If you primarily work at one location, set it as default for faster data entry.

**Default Audit View**: Choose how you prefer to view audit lists (grid, list, calendar).

## Privacy Settings

Control your data and privacy:

**Activity Visibility**: Choose whether other users can see your recent activity.

**Profile Visibility**: Control who can view your full profile information.

**Data Export**: Request a copy of your personal data stored in the system.

## Two-Factor Authentication

Enable two-factor authentication (2FA) for enhanced security:

1. Navigate to security settings
2. Click "Enable 2FA"
3. Scan the QR code with your authenticator app
4. Enter the verification code to confirm

With 2FA enabled, you'll need both your password and a code from your authenticator app to sign in.
`
  },

  // ============================================
  // TROUBLESHOOTING
  // ============================================
  {
    id: "login-issues",
    category: "troubleshooting",
    title: "Login and Access Issues",
    keywords: ["login", "access", "password", "locked out", "authentication"],
    content: `
# Login and Access Issues

## Cannot Sign In

If you're having trouble signing in:

**Check your email address**: Ensure you're using the correct email associated with your account. Email addresses are case-insensitive but must be spelled correctly.

**Verify password**: Passwords are case-sensitive. Check that Caps Lock is not enabled.

**Clear browser cache**: Old cached data can sometimes interfere with login. Clear your browser cache and cookies, then try again.

**Try a different browser**: If issues persist, test with a different web browser to rule out browser-specific problems.

## Forgot Password

To reset your password:

1. Click "Forgot Password" on the sign-in page
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and follow instructions to create a new password
5. Sign in with your new password

Password reset links expire after 24 hours. If your link has expired, request a new one.

## Account Locked

Accounts are temporarily locked after multiple failed login attempts (typically 5 attempts within 15 minutes). This security measure prevents unauthorized access.

If your account is locked:

**Wait 30 minutes**: Locks automatically expire after the lockout period.

**Contact your administrator**: They can manually unlock your account immediately.

**Reset your password**: This also unlocks your account.

## Access Denied Messages

If you can sign in but see "Access Denied" when trying to access certain features:

**Check your role**: You may not have permission for that feature. Contact your administrator to request appropriate access.

**Verify location access**: Some features are restricted by location. Ensure you're assigned to the relevant location.

**Session timeout**: Your session may have expired. Sign out and sign back in.

## Two-Factor Authentication Issues

If you're having trouble with 2FA:

**Time sync**: Ensure your authenticator app's time is synchronized correctly.

**Backup codes**: Use a backup code if you've lost access to your authenticator app.

**Contact administrator**: They can temporarily disable 2FA so you can sign in and reconfigure it.

## Browser Compatibility

CCMS works best with modern browsers:

**Recommended**: Chrome, Edge, Firefox, Safari (latest versions)

**Not supported**: Internet Explorer

Update your browser to the latest version for the best experience and security.
`
  },

  {
    id: "performance-issues",
    category: "troubleshooting",
    title: "Performance and Loading Issues",
    keywords: ["slow", "loading", "performance", "timeout", "freezing"],
    content: `
# Performance and Loading Issues

## Slow Loading

If CCMS is loading slowly:

**Check internet connection**: Slow or unstable internet affects system performance. Test your connection speed and stability.

**Clear browser cache**: Accumulated cache can slow down the application. Clear your browser cache and reload the page.

**Close unnecessary tabs**: Too many open browser tabs consume memory and processing power.

**Disable browser extensions**: Some extensions interfere with web applications. Try disabling extensions temporarily.

**Check system resources**: Ensure your computer has sufficient available memory and isn't running too many programs.

## Page Not Loading

If a page fails to load completely:

**Refresh the page**: Press F5 or click the refresh button to reload.

**Check browser console**: Press F12 to open developer tools and check for error messages.

**Try incognito mode**: Open CCMS in a private/incognito window to rule out extension or cache issues.

**Contact support**: If problems persist, report the issue with details about what you were doing when it occurred.

## Timeout Errors

If you see timeout errors:

**Large data sets**: Generating reports with extensive data can take time. Be patient and avoid clicking multiple times.

**Network issues**: Timeouts often indicate network problems. Check your internet connection.

**Try again later**: Temporary server load can cause timeouts. Wait a few minutes and retry.

## Data Not Saving

If your changes aren't being saved:

**Check for error messages**: Look for red error notifications explaining why the save failed.

**Required fields**: Ensure all required fields are completed before saving.

**Session timeout**: If you've been inactive for a long time, your session may have expired. Sign in again.

**Network interruption**: Brief network disconnections can prevent saves. Check your connection and try again.

## Upload Failures

If file uploads are failing:

**File size**: Check that files don't exceed the maximum size limit (typically 10MB per file).

**File type**: Ensure you're uploading supported file types (PDF, JPG, PNG, DOCX, etc.).

**Network stability**: Large file uploads require stable internet. Avoid uploading on unreliable connections.

**Browser issues**: Try a different browser if uploads consistently fail.

## Screen Display Issues

If the interface looks incorrect:

**Zoom level**: Reset browser zoom to 100% (Ctrl+0 or Cmd+0).

**Screen resolution**: CCMS is optimized for resolutions 1280x720 and higher.

**Browser compatibility**: Update to the latest browser version.

**Responsive design**: On mobile devices, rotate to landscape for better viewing of complex pages.
`
  },

  {
    id: "data-issues",
    category: "troubleshooting",
    title: "Data and Sync Issues",
    keywords: ["data", "missing", "sync", "duplicate", "incorrect"],
    content: `
# Data and Sync Issues

## Missing Data

If you can't find expected data:

**Check filters**: Ensure filters aren't hiding the data you're looking for. Reset filters to show all records.

**Verify permissions**: You may not have access to certain data based on your role or assigned locations.

**Search function**: Use the search feature to find specific records by name, ID, or other identifiers.

**Date range**: Expand the date range if looking for historical data.

**Contact administrator**: They can verify whether the data exists and check your access permissions.

## Duplicate Records

If you see duplicate records:

**Check carefully**: Records may appear similar but have different IDs or details.

**Report to administrator**: True duplicates should be reported so they can be merged or removed.

**Avoid creating duplicates**: Always search for existing records before creating new ones.

## Incorrect Data

If data appears incorrect:

**Verify source**: Check when and by whom the data was entered (visible in audit trails).

**Update if needed**: If you have permission, edit the record to correct the information.

**Report errors**: Notify your administrator of systematic data errors that may indicate a larger issue.

## Sync Delays

If recent changes aren't appearing:

**Refresh the page**: Press F5 to reload and fetch the latest data.

**Wait briefly**: Some changes take a few seconds to propagate through the system.

**Check notifications**: The system may be performing maintenance or updates.

## Export Issues

If data exports are failing or incomplete:

**Reduce date range**: Very large exports can timeout. Try exporting smaller date ranges.

**Check format**: Ensure you're using a supported export format.

**File permissions**: Verify you have permission to save files to your chosen location.

**Browser downloads**: Check your browser's download settings and folder.

## Audit Trail

To track data changes:

**View history**: Most records have a history or audit trail showing all changes.

**Identify who changed what**: Audit trails show the user, date, and nature of each change.

**Restore if needed**: Contact your administrator if data needs to be restored to a previous state.
`
  },

  {
    id: "getting-help",
    category: "troubleshooting",
    title: "Getting Additional Help",
    keywords: ["support", "help", "contact", "assistance", "technical support"],
    content: `
# Getting Additional Help

## Help Center

This help center provides comprehensive documentation for all CCMS features. Use the search function to find specific topics quickly.

## In-App Guidance

Look for help icons (?) throughout the system. Clicking these provides context-specific guidance for the feature you're using.

## Contacting Your Administrator

For account-related issues, permissions, or organization-specific questions, contact your system administrator. They can:

- Reset your password
- Adjust your permissions
- Create or modify user accounts
- Configure organization settings
- Provide training on specific features

## Technical Support

For technical issues that your administrator cannot resolve:

**Email Support**: support@ccms.co.uk

**Phone Support**: Available during business hours (9 AM - 5 PM GMT, Monday-Friday)

**Emergency Support**: For critical system issues affecting care delivery, use the emergency support line available 24/7

When contacting support, provide:

- Your organization name
- Your user email address
- Detailed description of the issue
- Steps to reproduce the problem
- Screenshots if applicable
- Browser and operating system information

## Feature Requests

Have ideas for improving CCMS? Submit feature requests through the feedback form in your user profile settings. The development team reviews all suggestions and prioritizes based on user needs and regulatory requirements.

## Training

Need additional training on CCMS features?

**Online Training**: Self-paced video tutorials available in the Training section

**Live Training**: Schedule group training sessions for your team

**Documentation**: Download user guides and quick reference cards

**Onboarding**: New users receive an onboarding tour highlighting key features

## Community Forum

Join the CCMS user community to:

- Share best practices with other care homes
- Learn tips and tricks from experienced users
- Discuss compliance strategies
- Stay updated on new features and enhancements

## System Status

Check the system status page for:

- Planned maintenance schedules
- Current system performance
- Known issues and resolutions
- Service announcements

## Feedback

Your feedback helps improve CCMS. Share your experience through:

- In-app feedback button
- User satisfaction surveys
- Direct communication with your account manager
- Annual user conference and feedback sessions
`
  },
];
