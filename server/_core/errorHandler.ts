/**
 * Global Error Handler for tRPC
 * 
 * This middleware intercepts all errors and sanitizes them before sending to clients
 * to prevent exposing internal system details and technical error messages.
 */

import { TRPCError } from "@trpc/server";
import { ERROR_MESSAGES } from "./errorMessages";

/**
 * Map of technical error patterns to user-friendly messages
 */
const ERROR_PATTERN_MAP: Array<{ pattern: RegExp; message: string }> = [
  // Database errors
  { pattern: /database.*not.*available/i, message: ERROR_MESSAGES.SERVICE_UNAVAILABLE },
  { pattern: /database.*not.*initialized/i, message: ERROR_MESSAGES.SERVICE_UNAVAILABLE },
  { pattern: /connection.*refused/i, message: ERROR_MESSAGES.SERVICE_UNAVAILABLE },
  { pattern: /ECONNREFUSED/i, message: ERROR_MESSAGES.SERVICE_UNAVAILABLE },
  
  // Authentication errors
  { pattern: /invalid.*email.*password/i, message: ERROR_MESSAGES.AUTH_INVALID },
  { pattern: /unauthorized/i, message: ERROR_MESSAGES.AUTH_REQUIRED },
  { pattern: /forbidden/i, message: ERROR_MESSAGES.AUTH_FORBIDDEN },
  { pattern: /not.*authenticated/i, message: ERROR_MESSAGES.AUTH_REQUIRED },
  { pattern: /session.*expired/i, message: ERROR_MESSAGES.AUTH_SESSION_EXPIRED },
  
  // User errors
  { pattern: /user.*not.*found/i, message: ERROR_MESSAGES.USER_NOT_FOUND },
  { pattern: /email.*already.*exists/i, message: ERROR_MESSAGES.USER_EMAIL_EXISTS },
  { pattern: /password.*incorrect/i, message: ERROR_MESSAGES.USER_PASSWORD_INCORRECT },
  
  // Company/Tenant errors
  { pattern: /company.*not.*found/i, message: ERROR_MESSAGES.COMPANY_NOT_FOUND },
  { pattern: /tenant.*not.*found/i, message: ERROR_MESSAGES.COMPANY_NOT_FOUND },
  
  // Audit errors
  { pattern: /audit.*not.*found/i, message: ERROR_MESSAGES.AUDIT_NOT_FOUND },
  { pattern: /audit.*template.*not.*found/i, message: ERROR_MESSAGES.AUDIT_TEMPLATE_NOT_FOUND },
  
  // File errors
  { pattern: /file.*too.*large/i, message: ERROR_MESSAGES.FILE_TOO_LARGE },
  { pattern: /file.*size.*exceeds/i, message: ERROR_MESSAGES.FILE_TOO_LARGE },
  { pattern: /invalid.*file.*type/i, message: ERROR_MESSAGES.FILE_INVALID_TYPE },
  { pattern: /unsupported.*file/i, message: ERROR_MESSAGES.FILE_INVALID_TYPE },
  
  // API/Service errors
  { pattern: /api.*key.*not.*configured/i, message: ERROR_MESSAGES.API_KEY_REQUIRED },
  { pattern: /api.*key.*invalid/i, message: ERROR_MESSAGES.API_KEY_INVALID },
  
  // 2FA errors
  { pattern: /two.*factor.*not.*enabled/i, message: ERROR_MESSAGES.TWO_FA_NOT_ENABLED },
  { pattern: /invalid.*verification.*code/i, message: ERROR_MESSAGES.TWO_FA_INVALID_CODE },
  { pattern: /invalid.*token/i, message: ERROR_MESSAGES.TWO_FA_INVALID_CODE },
];

/**
 * Sanitize error message by matching against known patterns
 */
function sanitizeErrorMessage(message: string): string {
  // Check if message is already a user-friendly message
  if (Object.values(ERROR_MESSAGES).includes(message as any)) {
    return message;
  }
  
  // Try to match against known patterns
  for (const { pattern, message: userMessage } of ERROR_PATTERN_MAP) {
    if (pattern.test(message)) {
      return userMessage;
    }
  }
  
  // Default to generic error message
  return ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Sanitize TRPCError before sending to client
 */
export function sanitizeTRPCError(error: TRPCError): TRPCError {
  // Log the original error server-side for debugging
  console.error('[TRPC Error]', {
    code: error.code,
    message: error.message,
    cause: error.cause,
  });
  
  // Return sanitized error
  return new TRPCError({
    code: error.code,
    message: sanitizeErrorMessage(error.message),
    // Never expose cause to client
  });
}

/**
 * Sanitize any error (TRPCError or regular Error)
 */
export function sanitizeError(error: unknown): TRPCError {
  // Log the original error
  console.error('[Error]', error);
  
  if (error instanceof TRPCError) {
    return sanitizeTRPCError(error);
  }
  
  if (error instanceof Error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: sanitizeErrorMessage(error.message),
    });
  }
  
  // Unknown error type
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: ERROR_MESSAGES.GENERIC_ERROR,
  });
}
