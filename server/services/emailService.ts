/**
 * Email Service for AI Audit Notifications
 * Uses the built-in notification system for email delivery
 */

import { notifyOwner } from "../_core/notification";

interface AuditCompletionEmailData {
  to: string;
  auditId: number;
  documentName: string;
  auditType: "care_plan" | "daily_notes";
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  companyName: string;
}

/**
 * Send email notification when AI audit is complete
 */
export async function sendAuditCompletionEmail(data: AuditCompletionEmailData): Promise<boolean> {
  const auditTypeLabel = data.auditType === "care_plan" ? "Care Plan" : "Daily Notes";
  const scoreLabel = data.score >= 8 ? "Excellent" : data.score >= 6 ? "Good" : data.score >= 4 ? "Needs Improvement" : "Poor";
  
  const strengthsList = data.strengths.length > 0 
    ? data.strengths.map(s => `• ${s}`).join("\n")
    : "• No specific strengths identified";
    
  const improvementsList = data.areasForImprovement.length > 0
    ? data.areasForImprovement.map(a => `• ${a}`).join("\n")
    : "• No specific areas for improvement identified";

  const title = `AI Audit Complete: ${data.documentName}`;
  
  const content = `
## ${auditTypeLabel} Audit Complete

**Document:** ${data.documentName}
**Score:** ${data.score}/10 (${scoreLabel})

### Key Strengths
${strengthsList}

### Areas for Improvement
${improvementsList}

---
View the full report in your Care Compliance dashboard.

*This is an automated notification from ${data.companyName}.*
  `.trim();

  try {
    // Use the built-in notification system
    // Note: In production, you would integrate with a proper email service like Resend or SendGrid
    const success = await notifyOwner({ title, content });
    
    if (success) {
      console.log(`[EMAIL] Audit completion notification sent for audit #${data.auditId}`);
    } else {
      console.warn(`[EMAIL] Failed to send notification for audit #${data.auditId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`[EMAIL] Error sending notification for audit #${data.auditId}:`, error);
    return false;
  }
}

/**
 * Send a test email to verify email configuration
 */
export async function sendTestEmail(email: string): Promise<boolean> {
  const title = "Test Email - Care Compliance System";
  const content = `
## Email Configuration Test

This is a test email to verify your email notification settings are working correctly.

If you received this email, your notifications are properly configured.

---
*Care Compliance Management System*
  `.trim();

  try {
    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("[EMAIL] Test email failed:", error);
    return false;
  }
}
