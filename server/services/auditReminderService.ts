import { addDays, startOfDay, endOfDay, format } from 'date-fns';
import * as db from '../db';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@care-compliance.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface AuditReminder {
  auditId: number;
  auditType: string;
  auditDate: string | Date; // Can be string from DB or Date object
  locationName: string;
  auditorEmail: string;
  auditorName: string;
  tenantName: string;
}

/**
 * Get all audits due tomorrow across all tenants
 */
export async function getAuditsDueTomorrow(): Promise<AuditReminder[]> {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  // Get all audit instances across all tenants
  const allAudits = await db.getAllAuditInstancesForReminders(tomorrowStart, tomorrowEnd);

  const reminders: AuditReminder[] = [];

  for (const audit of allAudits) {
    // Skip if no auditor assigned or no email
    if (!audit.auditorEmail) {
      console.log(`[Audit Reminder] Skipping audit ${audit.id} - no auditor email`);
      continue;
    }

    reminders.push({
      auditId: audit.id,
      auditType: audit.auditTypeName || 'Unknown Audit',
      auditDate: audit.auditDate,
      locationName: audit.locationName || 'Unknown Location',
      auditorEmail: audit.auditorEmail,
      auditorName: audit.auditorName || 'Auditor',
      tenantName: audit.tenantName || 'Care Home',
    });
  }

  return reminders;
}

/**
 * Send email reminder for a single audit
 */
export async function sendAuditReminderEmail(reminder: AuditReminder): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('[Audit Reminder] SendGrid API key not configured');
    return false;
  }

  const formattedDate = format(reminder.auditDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(reminder.auditDate, 'h:mm a');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          background: white;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .audit-details {
          background: #f9fafb;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .audit-details h2 {
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #667eea;
        }
        .detail-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          min-width: 120px;
          color: #6b7280;
        }
        .detail-value {
          color: #111827;
        }
        .reminder-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .cta-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Audit Reminder</h1>
      </div>
      <div class="content">
        <p>Hello ${reminder.auditorName},</p>
        
        <div class="reminder-badge">
          ⏰ Audit Due Tomorrow
        </div>
        
        <p>This is a friendly reminder that you have an audit scheduled for tomorrow.</p>
        
        <div class="audit-details">
          <h2>Audit Details</h2>
          <div class="detail-row">
            <div class="detail-label">Audit Type:</div>
            <div class="detail-value">${reminder.auditType}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">${reminder.locationName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${formattedDate}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Time:</div>
            <div class="detail-value">${formattedTime}</div>
          </div>
        </div>
        
        <p>Please ensure you have reviewed the audit template and prepared any necessary materials.</p>
        
        <p style="margin-top: 30px;">
          <strong>Need to reschedule?</strong><br>
          Please contact your manager or update the audit schedule in the system.
        </p>
      </div>
      
      <div class="footer">
        <p>This is an automated reminder from ${reminder.tenantName}</p>
        <p style="font-size: 12px; color: #9ca3af;">
          Care Compliance Management System
        </p>
      </div>
    </body>
    </html>
  `;

  const emailText = `
Audit Reminder - Due Tomorrow

Hello ${reminder.auditorName},

This is a friendly reminder that you have an audit scheduled for tomorrow.

Audit Details:
- Audit Type: ${reminder.auditType}
- Location: ${reminder.locationName}
- Date: ${formattedDate}
- Time: ${formattedTime}

Please ensure you have reviewed the audit template and prepared any necessary materials.

Need to reschedule? Please contact your manager or update the audit schedule in the system.

---
This is an automated reminder from ${reminder.tenantName}
Care Compliance Management System
  `;

  try {
    await sgMail.send({
      to: reminder.auditorEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `Audit Reminder: ${reminder.auditType} - Due Tomorrow`,
      text: emailText,
      html: emailHtml,
    });

    console.log(`[Audit Reminder] Email sent to ${reminder.auditorEmail} for audit ${reminder.auditId}`);
    return true;
  } catch (error) {
    console.error(`[Audit Reminder] Failed to send email to ${reminder.auditorEmail}:`, error);
    return false;
  }
}

/**
 * Main function to send all audit reminders for tomorrow
 * This should be called by the cron job daily
 */
export async function sendDailyAuditReminders(): Promise<{ sent: number; failed: number }> {
  console.log('[Audit Reminder] Starting daily audit reminder job...');

  const reminders = await getAuditsDueTomorrow();
  console.log(`[Audit Reminder] Found ${reminders.length} audits due tomorrow`);

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const success = await sendAuditReminderEmail(reminder);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[Audit Reminder] Job complete. Sent: ${sent}, Failed: ${failed}`);

  return { sent, failed };
}
