/**
 * Audit Automation Cron Job
 * Handles recurring audit creation and email reminders
 */

import { getDb } from "../db";
import { auditSchedules, auditInstances, auditTypes, auditTemplates, locations, tenants, users } from "../../drizzle/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Calculate next due date based on frequency
 */
function calculateNextDueDate(frequency: string, dayOfMonth?: number | null, monthOfYear?: number | null, dayOfWeek?: number | null): Date {
  const now = new Date();
  let nextDate = new Date(now);

  switch (frequency) {
    case "daily":
      nextDate.setDate(now.getDate() + 1);
      break;
    
    case "weekly":
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDay = now.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      nextDate.setDate(now.getDate() + daysUntilTarget);
      break;
    
    case "monthly":
      const targetDayOfMonth = dayOfMonth ?? 1; // Default to 1st
      nextDate.setMonth(now.getMonth() + 1);
      nextDate.setDate(targetDayOfMonth);
      // Handle edge case where target day doesn't exist in month
      if (nextDate.getDate() !== targetDayOfMonth) {
        nextDate.setDate(0); // Last day of previous month
      }
      break;
    
    case "quarterly":
      nextDate.setMonth(now.getMonth() + 3);
      nextDate.setDate(dayOfMonth ?? 1);
      break;
    
    case "annually":
      nextDate.setFullYear(now.getFullYear() + 1);
      nextDate.setMonth((monthOfYear ?? 1) - 1);
      nextDate.setDate(dayOfMonth ?? 1);
      break;
    
    default:
      // Default to monthly
      nextDate.setMonth(now.getMonth() + 1);
      nextDate.setDate(1);
  }

  return nextDate;
}

/**
 * Generate audit instances for schedules that are due
 */
export async function generateScheduledAudits() {
  console.log("[AUDIT AUTOMATION] Starting scheduled audit generation...");
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all active schedules where nextAuditDue is today or in the past
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get all active schedules and filter by date in JavaScript
    const allSchedules = await db
      .select()
      .from(auditSchedules)
      .where(eq(auditSchedules.isActive, true));
    
    const dueSchedules = allSchedules.filter(s => {
      if (!s.nextAuditDue) return false;
      const dueDate = new Date(s.nextAuditDue);
      const todayDate = new Date(today);
      return dueDate <= todayDate;
    });

    console.log(`[AUDIT AUTOMATION] Found ${dueSchedules.length} due schedules`);

    for (const schedule of dueSchedules) {
      try {
        // Get audit type details
        const [auditType] = await db
          .select()
          .from(auditTypes)
          .where(eq(auditTypes.id, schedule.auditTypeId));

        if (!auditType) {
          console.error(`[AUDIT AUTOMATION] Audit type ${schedule.auditTypeId} not found`);
          continue;
        }

        // Check if audit instance already exists for this schedule
        const existingInstance = await db
          .select()
          .from(auditInstances)
          .where(
            and(
              eq(auditInstances.tenantId, schedule.tenantId),
              eq(auditInstances.locationId, schedule.locationId),
              eq(auditInstances.auditTypeId, schedule.auditTypeId),
              eq(auditInstances.auditScheduleId, schedule.id)
            )
          );

        if (existingInstance.length > 0) {
          console.log(`[AUDIT AUTOMATION] Audit instance already exists for schedule ${schedule.id}`);
          continue;
        }

        // Get audit template for this audit type
        const [template] = await db
          .select()
          .from(auditTemplates)
          .where(eq(auditTemplates.auditTypeId, schedule.auditTypeId));

        if (!template) {
          console.error(`[AUDIT AUTOMATION] No template found for audit type ${schedule.auditTypeId}`);
          continue;
        }

        // Create new audit instance
        const [newInstance] = await db
          .insert(auditInstances)
          .values({
            tenantId: schedule.tenantId,
            locationId: schedule.locationId,
            auditTypeId: schedule.auditTypeId,
            auditTemplateId: template.id,
            auditScheduleId: schedule.id,
            auditDate: schedule.nextAuditDue ? new Date(schedule.nextAuditDue) : new Date(),
            auditorId: schedule.createdById ?? 1, // Default to system user
            auditorName: "System",
            auditorRole: "Automated",
            status: "in_progress",
            createdAt: new Date(),
          })
          .$returningId();

        console.log(`[AUDIT AUTOMATION] Created audit instance ${newInstance.id} for schedule ${schedule.id}`);

        // Calculate next due date
        const nextDue = calculateNextDueDate(
          schedule.frequency,
          schedule.dayOfMonth,
          schedule.monthOfYear,
          schedule.dayOfWeek
        );

        // Update schedule with new next due date
        await db
          .update(auditSchedules)
          .set({
            lastAuditDate: schedule.nextAuditDue ? new Date(schedule.nextAuditDue) : null,
            nextAuditDue: new Date(nextDue.toISOString().split('T')[0]),
            updatedAt: new Date(),
          })
          .where(eq(auditSchedules.id, schedule.id));

        console.log(`[AUDIT AUTOMATION] Updated schedule ${schedule.id} - next due: ${nextDue.toISOString().split('T')[0]}`);

        // Send notification to owner
        await notifyOwner({
          title: `New Audit Scheduled: ${auditType.auditName}`,
          content: `A new ${auditType.auditName} audit has been automatically scheduled for ${schedule.nextAuditDue}. Please ensure it is completed on time.`,
        });

      } catch (error) {
        console.error(`[AUDIT AUTOMATION] Error processing schedule ${schedule.id}:`, error);
      }
    }

    console.log("[AUDIT AUTOMATION] Scheduled audit generation complete");
    return { success: true, generated: dueSchedules.length };

  } catch (error) {
    console.error("[AUDIT AUTOMATION] Error in generateScheduledAudits:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email reminders for overdue audits
 */
export async function sendAuditReminders() {
  console.log("[AUDIT AUTOMATION] Starting audit reminder check...");
  
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const today = new Date();
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Find all active schedules where reminder should be sent
    const schedulesNeedingReminders = await db
      .select({
        schedule: auditSchedules,
        auditType: auditTypes,
        location: locations,
        tenant: tenants,
      })
      .from(auditSchedules)
      .leftJoin(auditTypes, eq(auditSchedules.auditTypeId, auditTypes.id))
      .leftJoin(locations, eq(auditSchedules.locationId, locations.id))
      .leftJoin(tenants, eq(auditSchedules.tenantId, tenants.id))
      .where(eq(auditSchedules.isActive, true));

    console.log(`[AUDIT AUTOMATION] Found ${schedulesNeedingReminders.length} schedules to check for reminders`);

    let remindersSent = 0;

    for (const { schedule, auditType, location, tenant } of schedulesNeedingReminders) {
      if (!schedule || !auditType || !location || !tenant) continue;

      if (!schedule.nextAuditDue) continue;
      const dueDate = new Date(schedule.nextAuditDue);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = schedule.emailReminderDays ?? 7;

      // Send reminder if within reminder window or overdue
      if (daysUntilDue <= reminderDays) {
        try {
          const isOverdue = daysUntilDue < 0;
          const message = isOverdue
            ? `OVERDUE: ${auditType.auditName} audit at ${location.name} was due ${Math.abs(daysUntilDue)} days ago (${schedule.nextAuditDue}). Please complete immediately.`
            : `REMINDER: ${auditType.auditName} audit at ${location.name} is due in ${daysUntilDue} days (${schedule.nextAuditDue}). Please schedule completion.`;

          await notifyOwner({
            title: isOverdue ? `Overdue Audit: ${auditType.auditName}` : `Audit Reminder: ${auditType.auditName}`,
            content: message,
          });

          // Update last reminder sent date
          await db
            .update(auditSchedules)
            .set({
              lastReminderSent: new Date(today.toISOString().split('T')[0]),
              updatedAt: new Date(),
            })
            .where(eq(auditSchedules.id, schedule.id));

          remindersSent++;
          console.log(`[AUDIT AUTOMATION] Sent reminder for schedule ${schedule.id} - ${auditType.auditName} at ${location.name}`);

        } catch (error) {
          console.error(`[AUDIT AUTOMATION] Error sending reminder for schedule ${schedule.id}:`, error);
        }
      }
    }

    console.log(`[AUDIT AUTOMATION] Sent ${remindersSent} audit reminders`);
    return { success: true, sent: remindersSent };

  } catch (error) {
    console.error("[AUDIT AUTOMATION] Error in sendAuditReminders:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Main cron job function - runs both generation and reminders
 */
export async function runAuditAutomation() {
  console.log("[AUDIT AUTOMATION] ========================================");
  console.log("[AUDIT AUTOMATION] Running audit automation job at", new Date().toISOString());
  
  const generationResult = await generateScheduledAudits();
  const reminderResult = await sendAuditReminders();
  
  console.log("[AUDIT AUTOMATION] Job complete:", {
    generation: generationResult,
    reminders: reminderResult,
  });
  console.log("[AUDIT AUTOMATION] ========================================");
  
  return {
    generation: generationResult,
    reminders: reminderResult,
  };
}
