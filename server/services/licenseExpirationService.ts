import { getDb } from "../db";
import { tenantSubscriptions, users, tenants } from "../../drizzle/schema";
import { eq, and, lte, gt, isNotNull } from "drizzle-orm";
import { sendEmail } from "../_core/email";

// Check for expiring subscriptions and send notifications
export async function checkExpiringSubscriptions() {
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable for license expiration check");
    return;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  try {
    // Find subscriptions expiring in the next 7 days
    const expiringSubscriptions = await db
      .select({
        subscription: tenantSubscriptions,
        tenant: tenants,
      })
      .from(tenantSubscriptions)
      .innerJoin(tenants, eq(tenantSubscriptions.tenantId, tenants.id))
      .where(
        and(
          eq(tenantSubscriptions.status, "active"),
          isNotNull(tenantSubscriptions.currentPeriodEnd),
          lte(tenantSubscriptions.currentPeriodEnd, sevenDaysFromNow),
          gt(tenantSubscriptions.currentPeriodEnd, now)
        )
      );

    for (const { subscription, tenant } of expiringSubscriptions) {
      if (!subscription.currentPeriodEnd) continue;

      const expirationDate = new Date(subscription.currentPeriodEnd);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Determine notification type based on days remaining
      let shouldNotify = false;
      let notificationType = "";

      if (daysUntilExpiration === 7) {
        shouldNotify = true;
        notificationType = "7_day_warning";
      } else if (daysUntilExpiration === 1) {
        shouldNotify = true;
        notificationType = "1_day_warning";
      } else if (daysUntilExpiration === 0) {
        shouldNotify = true;
        notificationType = "expiration_day";
      }

      if (!shouldNotify) continue;

      // Get admin users for this tenant
      const adminUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, subscription.tenantId),
            eq(users.superAdmin, 1)
          )
        );

      // Send notification to each admin
      for (const admin of adminUsers) {
        await sendLicenseExpirationEmail(
          admin.email,
          admin.name || "Administrator",
          tenant.name || "Your Organisation",
          subscription.licensesCount || 0,
          expirationDate,
          daysUntilExpiration,
          notificationType
        );
      }

      console.log(
        `Sent ${notificationType} notification for tenant ${tenant.name} (${daysUntilExpiration} days remaining)`
      );
    }
  } catch (error) {
    console.error("Error checking expiring subscriptions:", error);
  }
}

async function sendLicenseExpirationEmail(
  email: string,
  name: string,
  companyName: string,
  licensesCount: number,
  expirationDate: Date,
  daysRemaining: number,
  notificationType: string
) {
  const formattedDate = expirationDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let subject = "";
  let urgencyText = "";
  let actionText = "";

  switch (notificationType) {
    case "7_day_warning":
      subject = `License Expiration Reminder - 7 Days Remaining`;
      urgencyText = `Your Care Compliance subscription will expire in <strong>7 days</strong>.`;
      actionText = `Please renew your subscription to ensure uninterrupted access for your team.`;
      break;
    case "1_day_warning":
      subject = `Urgent: License Expires Tomorrow`;
      urgencyText = `Your Care Compliance subscription will expire <strong>tomorrow</strong>.`;
      actionText = `Renew now to avoid service interruption for your ${licensesCount} licensed users.`;
      break;
    case "expiration_day":
      subject = `Action Required: License Expires Today`;
      urgencyText = `Your Care Compliance subscription expires <strong>today</strong>.`;
      actionText = `Renew immediately to maintain access for your team.`;
      break;
    default:
      subject = `License Expiration Notice`;
      urgencyText = `Your Care Compliance subscription is expiring soon.`;
      actionText = `Please renew your subscription to continue using the service.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Care Compliance</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Subscription Expiration Notice</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">Dear ${name},</p>
        
        <div style="background: ${daysRemaining <= 1 ? '#fef2f2' : '#fefce8'}; border-left: 4px solid ${daysRemaining <= 1 ? '#ef4444' : '#eab308'}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 16px;">${urgencyText}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Organisation</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${companyName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Active Licenses</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${licensesCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Expiration Date</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Days Remaining</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: ${daysRemaining <= 1 ? '#ef4444' : '#eab308'};">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</td>
          </tr>
        </table>
        
        <p>${actionText}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://care-compliance.manus.space/admin/subscription" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Renew Subscription</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">If you have any questions about your subscription, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
          This is an automated notification from Care Compliance.<br>
          Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const textBody = `Dear ${name},\n\n${urgencyText}\n\nOrganisation: ${companyName}\nActive Licenses: ${licensesCount}\nExpiration Date: ${formattedDate}\nDays Remaining: ${daysRemaining}\n\n${actionText}\n\nPlease visit https://care-compliance.manus.space/admin/subscription to renew your subscription.`;
    
    await sendEmail({
      to: email,
      subject,
      text: textBody,
      html,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send expiration email to ${email}:`, error);
    return false;
  }
}

// Export for use in scheduled jobs or manual triggers
export { sendLicenseExpirationEmail };
