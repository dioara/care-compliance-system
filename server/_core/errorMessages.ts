/**
 * Centralized User-Friendly Error Messages
 * 
 * This file contains all user-facing error messages to ensure:
 * 1. No technical details or stack traces are exposed
 * 2. Consistent messaging across the application
 * 3. Security by obscurity - no internal system details revealed
 */

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_INVALID: "Invalid email or password. Please try again.",
  AUTH_FORBIDDEN: "You don't have permission to perform this action.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  
  // User Management
  USER_NOT_FOUND: "User account not found.",
  USER_EMAIL_EXISTS: "This email address is already registered.",
  USER_PASSWORD_INCORRECT: "The password you entered is incorrect.",
  USER_CREATION_FAILED: "Unable to create user account. Please try again.",
  
  // Company/Tenant
  COMPANY_NOT_FOUND: "Company information not found.",
  COMPANY_UPDATE_FAILED: "Unable to update company information. Please try again.",
  
  // Locations
  LOCATION_NOT_FOUND: "Location not found.",
  LOCATION_CREATION_FAILED: "Unable to create location. Please try again.",
  LOCATION_UPDATE_FAILED: "Unable to update location. Please try again.",
  
  // Audits
  AUDIT_NOT_FOUND: "Audit not found.",
  AUDIT_TEMPLATE_NOT_FOUND: "Audit template not found.",
  AUDIT_CREATION_FAILED: "Unable to create audit. Please try again.",
  AUDIT_UPDATE_FAILED: "Unable to update audit. Please try again.",
  AUDIT_INCOMPLETE: "This audit is not yet complete.",
  
  // Incidents
  INCIDENT_NOT_FOUND: "Incident not found.",
  INCIDENT_CREATION_FAILED: "Unable to create incident report. Please try again.",
  INCIDENT_UPDATE_FAILED: "Unable to update incident. Please try again.",
  
  // Files & Documents
  FILE_TOO_LARGE: "File size exceeds the maximum allowed limit.",
  FILE_INVALID_TYPE: "This file type is not supported.",
  FILE_UPLOAD_FAILED: "Unable to upload file. Please try again.",
  FILE_PROCESSING_FAILED: "Unable to process file. Please ensure it's a valid document.",
  
  // PDF Generation
  PDF_GENERATION_FAILED: "Unable to generate PDF. Please try again.",
  
  // API Keys & Configuration
  API_KEY_REQUIRED: "API key configuration is required. Please contact your administrator.",
  API_KEY_INVALID: "API key is invalid or expired. Please contact your administrator.",
  
  // Subscriptions & Billing
  SUBSCRIPTION_NOT_FOUND: "No active subscription found.",
  SUBSCRIPTION_UPDATE_FAILED: "Unable to update subscription. Please try again.",
  LICENSE_NOT_AVAILABLE: "No available licenses. Please purchase additional licenses.",
  LICENSE_ALREADY_ASSIGNED: "This user already has a license assigned.",
  
  // Two-Factor Authentication
  TWO_FA_REQUIRED: "Two-factor authentication is required.",
  TWO_FA_INVALID_CODE: "Invalid verification code. Please try again.",
  TWO_FA_NOT_ENABLED: "Two-factor authentication is not enabled for this account.",
  TWO_FA_SETUP_FAILED: "Unable to set up two-factor authentication. Please try again.",
  
  // Email & Notifications
  EMAIL_SEND_FAILED: "Unable to send email. Please try again later.",
  NOTIFICATION_FAILED: "Unable to send notification. Please try again.",
  
  // Data & Database
  DATA_NOT_FOUND: "The requested information could not be found.",
  DATA_SAVE_FAILED: "Unable to save changes. Please try again.",
  DATA_DELETE_FAILED: "Unable to delete. Please try again.",
  DATA_INVALID: "The information provided is not valid. Please check and try again.",
  
  // Generic Errors
  GENERIC_ERROR: "Something went wrong. Please try again.",
  SERVICE_UNAVAILABLE: "This service is temporarily unavailable. Please try again later.",
  OPERATION_FAILED: "Operation failed. Please try again.",
  INVALID_REQUEST: "Invalid request. Please check your information and try again.",
  
  // Rate Limiting & Security
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again.",
  SUSPICIOUS_ACTIVITY: "Unusual activity detected. Please contact support if you need assistance.",
  
  // Validation
  VALIDATION_FAILED: "Please check the information you entered and try again.",
  REQUIRED_FIELD_MISSING: "Please fill in all required fields.",
  
  // AI/OpenAI
  AI_PROCESSING_FAILED: "Unable to process request. Please try again.",
  AI_CONFIGURATION_REQUIRED: "AI features require additional configuration. Please contact your administrator.",
  
  // Confirmation
  CONFIRMATION_REQUIRED: "Please confirm this action to continue.",
  CONFIRMATION_INVALID: "Confirmation failed. Please try again.",
} as const;

/**
 * Sanitize error for user display
 * Logs technical details server-side but returns user-friendly message
 */
export function sanitizeError(error: unknown, fallbackMessage: string = ERROR_MESSAGES.GENERIC_ERROR): string {
  // Log the actual error server-side for debugging
  console.error('[Error]', error);
  
  // Never expose technical error details to users
  // Return generic user-friendly message
  return fallbackMessage;
}

/**
 * Check if error is a known user-facing message
 */
export function isUserFacingError(message: string): boolean {
  return Object.values(ERROR_MESSAGES).includes(message as any);
}
