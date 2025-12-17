import * as db from "../db";
import { sendEmail } from "../_core/email";

/**
 * Security Monitoring Service
 * Tracks security events and sends alerts to administrators
 */

export interface SecurityEvent {
  eventType: "failed_login" | "suspicious_activity" | "system_error" | "unauthorized_access";
  severity: "low" | "medium" | "high" | "critical";
  userId?: number;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  metadata?: Record<string, any>;
}

// In-memory store for failed login attempts (could be moved to Redis in production)
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

/**
 * Log a security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const database = await db.getDb();
  
  try {
    // Log to database (you can create a securityEvents table for this)
    console.log("[SECURITY EVENT]", {
      type: event.eventType,
      severity: event.severity,
      email: event.email,
      details: event.details,
      timestamp: new Date().toISOString(),
    });

    // For critical events, send immediate alert
    if (event.severity === "critical" || event.severity === "high") {
      await sendSecurityAlert(event);
    }
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * Track failed login attempt
 */
export function trackFailedLogin(email: string, ipAddress?: string): void {
  const key = `${email}:${ipAddress || "unknown"}`;
  const existing = failedLoginAttempts.get(key);
  
  if (existing) {
    existing.count++;
    existing.lastAttempt = new Date();
    
    // Alert after 5 failed attempts
    if (existing.count === 5) {
      logSecurityEvent({
        eventType: "failed_login",
        severity: "high",
        email,
        ipAddress,
        details: `5 failed login attempts detected for ${email}`,
        metadata: { attemptCount: existing.count },
      });
    }
    
    // Alert after 10 failed attempts (potential brute force)
    if (existing.count === 10) {
      logSecurityEvent({
        eventType: "suspicious_activity",
        severity: "critical",
        email,
        ipAddress,
        details: `Potential brute force attack detected for ${email}`,
        metadata: { attemptCount: existing.count },
      });
    }
  } else {
    failedLoginAttempts.set(key, { count: 1, lastAttempt: new Date() });
  }
  
  // Clean up old entries (older than 1 hour)
  cleanupFailedAttempts();
}

/**
 * Reset failed login attempts after successful login
 */
export function resetFailedLoginAttempts(email: string, ipAddress?: string): void {
  const key = `${email}:${ipAddress || "unknown"}`;
  failedLoginAttempts.delete(key);
}

/**
 * Clean up old failed login attempts
 */
function cleanupFailedAttempts(): void {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [key, value] of Array.from(failedLoginAttempts.entries())) {
    if (value.lastAttempt < oneHourAgo) {
      failedLoginAttempts.delete(key);
    }
  }
}

/**
 * Send security alert email to administrators
 */
async function sendSecurityAlert(event: SecurityEvent): Promise<void> {
  try {
    const database = await db.getDb();
    
    // Get all super admin users
    const admins = await db.getUsersByTenant(1); // Adjust based on your tenant structure
    const superAdmins = admins.filter((user) => user.superAdmin === 1);
    
    if (superAdmins.length === 0) {
      console.warn("No super admins found to send security alert");
      return;
    }
    
    const subject = `[SECURITY ALERT] ${event.eventType.replace(/_/g, " ").toUpperCase()}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${getSeverityColor(event.severity)}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Security Alert</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Event Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Event Type:</td>
              <td style="padding: 8px 0;">${event.eventType.replace(/_/g, " ")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Severity:</td>
              <td style="padding: 8px 0;"><span style="background-color: ${getSeverityColor(event.severity)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${event.severity.toUpperCase()}</span></td>
            </tr>
            ${event.email ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0;">${event.email}</td>
            </tr>
            ` : ""}
            ${event.ipAddress ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">IP Address:</td>
              <td style="padding: 8px 0;">${event.ipAddress}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Time:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280; vertical-align: top;">Details:</td>
              <td style="padding: 8px 0;">${event.details}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> Please review this security event and take appropriate action if necessary.
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated security alert from your Care Compliance Management System.
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Send email to all super admins
    const textBody = `Security Alert: ${event.eventType}\n\nSeverity: ${event.severity}\nEmail: ${event.email || 'Unknown'}\nIP Address: ${event.ipAddress || 'Unknown'}\nDetails: ${event.details || 'No additional details'}`;
    
    for (const admin of superAdmins) {
      await sendEmail({
        to: admin.email,
        subject,
        text: textBody,
        html: body,
      });
    }
  } catch (error) {
    console.error("Failed to send security alert:", error);
  }
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#dc2626"; // red-600
    case "high":
      return "#ea580c"; // orange-600
    case "medium":
      return "#f59e0b"; // amber-500
    case "low":
      return "#3b82f6"; // blue-500
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Get security metrics for dashboard
 */
export function getSecurityMetrics(): {
  failedLoginAttempts: number;
  suspiciousIPs: string[];
  recentEvents: number;
} {
  const suspiciousIPs = new Set<string>();
  let totalAttempts = 0;
  
  for (const [key, value] of Array.from(failedLoginAttempts.entries())) {
    totalAttempts += value.count;
    if (value.count >= 5) {
      const ip = key.split(":")[1];
      if (ip && ip !== "unknown") {
        suspiciousIPs.add(ip);
      }
    }
  }
  
  return {
    failedLoginAttempts: totalAttempts,
    suspiciousIPs: Array.from(suspiciousIPs),
    recentEvents: failedLoginAttempts.size,
  };
}
