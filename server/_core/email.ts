import { ENV } from "./env";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using SendGrid API
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey) {
    console.warn("[Email] SendGrid API key is not configured");
    return false;
  }

  if (!fromEmail) {
    console.warn("[Email] SendGrid from email is not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
          },
        ],
        from: { email: fromEmail, name: "Care Compliance System" },
        subject: payload.subject,
        content: [
          {
            type: "text/plain",
            value: payload.text,
          },
          ...(payload.html
            ? [
                {
                  type: "text/html",
                  value: payload.html,
                },
              ]
            : []),
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      console.log(`[Email] Successfully sent email to ${payload.to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.warn(`[Email] Failed to send email: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Send a compliance alert email
 */
export async function sendComplianceAlertEmail(
  to: string,
  companyName: string,
  locationName: string,
  alerts: string[],
  stats: {
    compliance: number;
    threshold: number;
    overdueActions: number;
    ragStatus: { green: number; amber: number; red: number };
  }
): Promise<boolean> {
  const subject = `⚠️ Compliance Alert - ${companyName}`;
  
  const text = `
Compliance Alert for ${companyName}

Location: ${locationName}

Alerts:
${alerts.map(a => `- ${a}`).join("\n")}

Current Status:
- Overall Compliance: ${stats.compliance}%
- Threshold: ${stats.threshold}%
- Overdue Actions: ${stats.overdueActions}
- Compliant (Green): ${stats.ragStatus.green}
- Partial (Amber): ${stats.ragStatus.amber}
- Non-Compliant (Red): ${stats.ragStatus.red}

Please review and address these compliance issues promptly.

---
Care Compliance Management System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .alert-list { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .alert-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .alert-item:last-child { border-bottom: none; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px; }
    .stat-box { background: white; padding: 15px; border-radius: 4px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .green { color: #16a34a; }
    .amber { color: #d97706; }
    .red { color: #dc2626; }
    .footer { padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Compliance Alert</h1>
      <p style="margin: 5px 0 0 0;">${companyName} - ${locationName}</p>
    </div>
    <div class="content">
      <h3>Issues Detected:</h3>
      <div class="alert-list">
        ${alerts.map(a => `<div class="alert-item">• ${a}</div>`).join("")}
      </div>
      
      <h3>Current Status:</h3>
      <div class="stats">
        <div class="stat-box">
          <div class="stat-value ${stats.compliance < stats.threshold ? 'red' : 'green'}">${stats.compliance}%</div>
          <div class="stat-label">Overall Compliance</div>
        </div>
        <div class="stat-box">
          <div class="stat-value ${stats.overdueActions > 0 ? 'red' : 'green'}">${stats.overdueActions}</div>
          <div class="stat-label">Overdue Actions</div>
        </div>
        <div class="stat-box">
          <div class="stat-value green">${stats.ragStatus.green}</div>
          <div class="stat-label">Compliant (Green)</div>
        </div>
        <div class="stat-box">
          <div class="stat-value amber">${stats.ragStatus.amber}</div>
          <div class="stat-label">Partial (Amber)</div>
        </div>
        <div class="stat-box">
          <div class="stat-value red">${stats.ragStatus.red}</div>
          <div class="stat-label">Non-Compliant (Red)</div>
        </div>
      </div>
      
      <p style="margin-top: 20px;">
        <strong>Please review and address these compliance issues promptly.</strong>
      </p>
    </div>
    <div class="footer">
      Care Compliance Management System
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
}

/**
 * Validate SendGrid configuration by checking API key format
 */
export function validateSendGridConfig(): { valid: boolean; error?: string } {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey) {
    return { valid: false, error: "SENDGRID_API_KEY is not set" };
  }

  if (!apiKey.startsWith("SG.")) {
    return { valid: false, error: "SENDGRID_API_KEY should start with 'SG.'" };
  }

  if (!fromEmail) {
    return { valid: false, error: "SENDGRID_FROM_EMAIL is not set" };
  }

  if (!fromEmail.includes("@")) {
    return { valid: false, error: "SENDGRID_FROM_EMAIL is not a valid email address" };
  }

  return { valid: true };
}
