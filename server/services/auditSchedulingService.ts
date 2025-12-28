import { format, addDays, parseISO, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns';

// UK Bank Holidays 2025-2026
const UK_BANK_HOLIDAYS = [
  // 2025
  '2025-01-01', // New Year's Day
  '2025-04-18', // Good Friday
  '2025-04-21', // Easter Monday
  '2025-05-05', // Early May Bank Holiday
  '2025-05-26', // Spring Bank Holiday
  '2025-08-25', // Summer Bank Holiday
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day
  // 2026
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May Bank Holiday
  '2026-05-25', // Spring Bank Holiday
  '2026-08-31', // Summer Bank Holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute)
];

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * Check if a date is a UK bank holiday
 */
function isBankHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  return UK_BANK_HOLIDAYS.includes(dateStr);
}

/**
 * Check if a date is a working day (not weekend, not bank holiday)
 */
function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isBankHoliday(date);
}

interface AuditType {
  id: number;
  auditName: string;
  recommendedFrequency: string;
  targetType?: 'general' | 'staff' | 'serviceUser';
  serviceTypes?: string; // JSON array string
}

interface ExistingAudit {
  id: number;
  auditTypeId: number;
  scheduledDate: string | Date;
}

interface SuggestedAudit {
  auditTypeId: number;
  auditTypeName: string;
  suggestedDate: Date;
  frequency: string;
  reason: string;
  serviceTypes: string; // JSON array string
}

/**
 * Parse recommended frequency and return number of times per year
 * Examples: "Monthly" = 12, "Quarterly" = 4, "Annually" = 1, "Weekly" = 52
 */
function parseFrequency(frequency: string): number {
  const freq = frequency.toLowerCase();
  if (freq.includes('weekly')) return 52;
  if (freq.includes('monthly')) return 12;
  if (freq.includes('quarterly')) return 4;
  if (freq.includes('bi-annual') || freq.includes('6 month')) return 2;
  if (freq.includes('annual') || freq.includes('yearly')) return 1;
  if (freq.includes('daily')) return 365;
  
  // Try to extract number from text like "Every 3 months"
  const match = freq.match(/every\s+(\d+)\s+(month|week|day)/);
  if (match) {
    const num = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'month') return Math.floor(12 / num);
    if (unit === 'week') return Math.floor(52 / num);
    if (unit === 'day') return Math.floor(365 / num);
  }
  
  // Default to quarterly if unknown
  return 4;
}

/**
 * Calculate interval in days between audits based on frequency
 */
function getIntervalDays(timesPerYear: number): number {
  return Math.floor(365 / timesPerYear);
}

/**
 * Generate suggested audit schedule for the next 12 months
 * Distributes audits evenly and avoids scheduling conflicts
 */
export function generateAuditSchedule(
  auditTypes: AuditType[],
  existingAudits: ExistingAudit[],
  locationId: number,
  startDate: Date = new Date()
): SuggestedAudit[] {
  const suggestions: SuggestedAudit[] = [];
  const scheduledDates = new Map<string, number>(); // date -> count of audits
  
  // Track existing audits
  existingAudits.forEach(audit => {
    const dateKey = format(typeof audit.scheduledDate === 'string' ? parseISO(audit.scheduledDate) : audit.scheduledDate, 'yyyy-MM-dd');
    scheduledDates.set(dateKey, (scheduledDates.get(dateKey) || 0) + 1);
  });
  
  // Calculate end date (12 months from start)
  const endDate = addMonths(startDate, 12);
  
  // Process each audit type
  auditTypes.forEach(auditType => {
    const timesPerYear = parseFrequency(auditType.recommendedFrequency);
    const intervalDays = getIntervalDays(timesPerYear);
    
    // Find last audit of this type
    const lastAudit = existingAudits
      .filter(a => a.auditTypeId === auditType.id)
      .map(a => ({
        ...a,
        date: typeof a.scheduledDate === 'string' ? parseISO(a.scheduledDate) : a.scheduledDate
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    // Calculate how many instances we need to schedule
    const monthsToSchedule = 12;
    const instancesToSchedule = Math.ceil((monthsToSchedule / 12) * timesPerYear);
    
    // Start from last audit date or current date
    let currentDate = lastAudit ? addDays(lastAudit.date, intervalDays) : startDate;
    
    // Generate suggestions
    for (let i = 0; i < instancesToSchedule; i++) {
      // Skip if date is in the past
      if (currentDate < startDate) {
        currentDate = addDays(currentDate, intervalDays);
        continue;
      }
      
      // Stop if we've exceeded the 12-month window
      if (currentDate > endDate) break;
      
      // Find a suitable date (avoid weekends, bank holidays, and days with too many audits)
      let suggestedDate = currentDate;
      let attempts = 0;
      while (attempts < 14) { // Increased attempts to account for weekends
        const dateKey = format(suggestedDate, 'yyyy-MM-dd');
        const auditsOnDate = scheduledDates.get(dateKey) || 0;
        
        // Check if it's a working day with capacity
        if (isWorkingDay(suggestedDate) && auditsOnDate < 3) {
          break;
        }
        
        // Try next day
        suggestedDate = addDays(suggestedDate, 1);
        attempts++;
      }
      
      // Mark this date as scheduled
      const dateKey = format(suggestedDate, 'yyyy-MM-dd');
      scheduledDates.set(dateKey, (scheduledDates.get(dateKey) || 0) + 1);
      
      // Determine reason for scheduling
      let reason = '';
      if (lastAudit) {
        reason = `Due based on ${auditType.recommendedFrequency.toLowerCase()} frequency`;
      } else {
        reason = `Initial ${auditType.recommendedFrequency.toLowerCase()} audit`;
      }
      
      const serviceTypesValue = auditType.serviceTypes || '["all"]';
      
      suggestions.push({
        auditTypeId: auditType.id,
        auditTypeName: auditType.auditName,
        suggestedDate,
        frequency: auditType.recommendedFrequency,
        reason,
        serviceTypes: serviceTypesValue,
      });
      
      // Move to next interval
      currentDate = addDays(currentDate, intervalDays);
    }
  });
  
  // Sort suggestions by date
  suggestions.sort((a, b) => a.suggestedDate.getTime() - b.suggestedDate.getTime());
  
  return suggestions;
}

/**
 * Create audit instances from accepted suggestions
 * For staff/serviceUser specific audits, creates one instance per person
 */
export interface CreateScheduledAuditsInput {
  tenantId: number;
  locationId: number;
  auditorId: number;
  auditorName: string;
  suggestions: Array<{
    auditTypeId: number;
    suggestedDate: Date;
    targetType?: 'general' | 'staff' | 'serviceUser';
  }>;
  staffMembers?: Array<{ id: number; name: string }>;
  serviceUsers?: Array<{ id: number; name: string }>;
}

export function prepareAuditInstancesForCreation(input: CreateScheduledAuditsInput) {
  const instances: any[] = [];

  input.suggestions.forEach(suggestion => {
    const baseInstance = {
      tenantId: input.tenantId,
      locationId: input.locationId,
      auditTypeId: suggestion.auditTypeId,
      auditDate: suggestion.suggestedDate,
      auditorId: input.auditorId,
      auditorName: input.auditorName,
      status: 'scheduled' as const,
    };

    // For staff-specific audits, create one instance per staff member
    if (suggestion.targetType === 'staff' && input.staffMembers && input.staffMembers.length > 0) {
      input.staffMembers.forEach(staff => {
        instances.push({
          ...baseInstance,
          staffMemberId: staff.id,
        });
      });
    }
    // For service-user-specific audits, create one instance per service user
    else if (suggestion.targetType === 'serviceUser' && input.serviceUsers && input.serviceUsers.length > 0) {
      input.serviceUsers.forEach(user => {
        instances.push({
          ...baseInstance,
          serviceUserId: user.id,
        });
      });
    }
    // For general audits, create one instance
    else {
      instances.push(baseInstance);
    }
  });

  return instances;
}
