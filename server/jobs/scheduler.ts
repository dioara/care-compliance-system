/**
 * Cron Job Scheduler
 * Manages all scheduled background jobs
 */

import cron from "node-cron";
import { runAuditAutomation } from "./auditAutomation";

/**
 * Initialize all cron jobs
 */
export function initializeScheduler() {
  console.log("[SCHEDULER] Initializing cron jobs...");

  // Run audit automation daily at 6:00 AM
  // Cron format: second minute hour day month dayOfWeek
  cron.schedule("0 0 6 * * *", async () => {
    console.log("[SCHEDULER] Triggering daily audit automation job");
    try {
      await runAuditAutomation();
    } catch (error) {
      console.error("[SCHEDULER] Error in audit automation job:", error);
    }
  });

  // Also run audit reminders separately at 9:00 AM and 3:00 PM
  cron.schedule("0 0 9,15 * * *", async () => {
    console.log("[SCHEDULER] Triggering audit reminder check");
    try {
      const { sendAuditReminders } = await import("./auditAutomation");
      await sendAuditReminders();
    } catch (error) {
      console.error("[SCHEDULER] Error in audit reminder job:", error);
    }
  });

  console.log("[SCHEDULER] Cron jobs initialized:");
  console.log("[SCHEDULER] - Audit automation: Daily at 6:00 AM");
  console.log("[SCHEDULER] - Audit reminders: Daily at 9:00 AM and 3:00 PM");
}

/**
 * Manually trigger audit automation (for testing or admin use)
 */
export async function triggerAuditAutomation() {
  console.log("[SCHEDULER] Manual trigger of audit automation");
  return await runAuditAutomation();
}
