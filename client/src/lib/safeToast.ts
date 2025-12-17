/**
 * Safe Toast Wrapper
 * 
 * Wraps sonner toast to automatically sanitize error messages
 * before displaying them to users.
 */

import { toast as sonnerToast } from "sonner";
import { sanitizeErrorMessage } from "./errorMessages";

/**
 * Safe toast wrapper that sanitizes all error messages
 */
export const toast = {
  success: (message: string, data?: any) => {
    return sonnerToast.success(message, data);
  },
  
  error: (message: string | Error | unknown, data?: any) => {
    // Sanitize the error message
    const safeMessage = typeof message === 'string' 
      ? sanitizeErrorMessage(message)
      : sanitizeErrorMessage(message);
    
    // Log original error for debugging
    if (message instanceof Error || (typeof message === 'object' && message !== null)) {
      console.error('[Toast Error]', message);
    }
    
    return sonnerToast.error(safeMessage, data);
  },
  
  info: (message: string, data?: any) => {
    return sonnerToast.info(message, data);
  },
  
  warning: (message: string, data?: any) => {
    return sonnerToast.warning(message, data);
  },
  
  loading: (message: string, data?: any) => {
    return sonnerToast.loading(message, data);
  },
  
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};

/**
 * Helper to extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  return sanitizeErrorMessage(error);
}
