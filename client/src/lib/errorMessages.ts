/**
 * Frontend Error Message Utilities
 * 
 * Ensures all error messages displayed to users are user-friendly
 * and don't expose technical implementation details.
 */

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  // Generic
  GENERIC_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection and try again.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  
  // Authentication
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_INVALID: "Invalid email or password. Please try again.",
  AUTH_FORBIDDEN: "You don't have permission to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  
  // Data operations
  SAVE_FAILED: "Unable to save changes. Please try again.",
  DELETE_FAILED: "Unable to delete. Please try again.",
  LOAD_FAILED: "Unable to load data. Please try again.",
  
  // File operations
  FILE_TOO_LARGE: "File size exceeds the maximum allowed limit.",
  FILE_INVALID_TYPE: "This file type is not supported.",
  FILE_UPLOAD_FAILED: "Unable to upload file. Please try again.",
  
  // Form validation
  VALIDATION_FAILED: "Please check the information you entered and try again.",
  REQUIRED_FIELDS: "Please fill in all required fields.",
} as const;

/**
 * Sanitize error message for display to user
 * Never expose technical details, stack traces, or internal errors
 */
export function sanitizeErrorMessage(error: unknown): string {
  // If it's already a user-friendly message, return it
  if (typeof error === 'string' && Object.values(ERROR_MESSAGES).includes(error as any)) {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Check if the message is already user-friendly
    if (Object.values(ERROR_MESSAGES).includes(message as any)) {
      return message;
    }
    
    // Check for known patterns
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    
    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return ERROR_MESSAGES.AUTH_REQUIRED;
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ERROR_MESSAGES.AUTH_FORBIDDEN;
    }
    
    // Default to generic error
    return ERROR_MESSAGES.GENERIC_ERROR;
  }
  
  // Handle tRPC errors
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as any).message;
    if (typeof message === 'string') {
      // If it's already a user-friendly message from backend, use it
      if (Object.values(ERROR_MESSAGES).includes(message as any)) {
        return message;
      }
      // Otherwise sanitize it
      return sanitizeErrorMessage(new Error(message));
    }
  }
  
  // Unknown error type
  console.error('[Error]', error);
  return ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Get user-friendly error message for toast/alert display
 */
export function getErrorMessage(error: unknown): string {
  return sanitizeErrorMessage(error);
}
