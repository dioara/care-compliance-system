/**
 * Utility functions for datetime formatting
 */

/**
 * Convert JavaScript Date to MySQL datetime format
 * MySQL expects: 'YYYY-MM-DD HH:MM:SS'
 * JavaScript Date.toISOString() returns: 'YYYY-MM-DDTHH:MM:SS.sssZ'
 */
export function toMySQLDatetime(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Get current datetime in MySQL format
 */
export function now(): string {
  return toMySQLDatetime();
}
