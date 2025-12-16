import { authenticator } from "otplib";
import QRCode from "qrcode";

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before and after current time (30 seconds each)
  step: 30, // 30 second time step
};

/**
 * Generate a new 2FA secret for a user
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code URL for Google Authenticator
 * @param email User's email address
 * @param secret The 2FA secret
 * @param issuer App name (e.g., "Care Compliance System")
 */
export async function generateQRCode(
  email: string,
  secret: string,
  issuer: string = "Care Compliance System"
): Promise<string> {
  // Generate otpauth URL
  const otpauth = authenticator.keyuri(email, issuer, secret);
  
  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
  
  return qrCodeDataUrl;
}

/**
 * Verify a TOTP token against a secret
 * @param token The 6-digit code from authenticator app
 * @param secret The user's 2FA secret
 * @returns true if token is valid
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("[2FA] Token verification error:", error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * @param count Number of backup codes to generate (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup codes for secure storage
 * @param codes Array of plain text backup codes
 * @returns Array of hashed backup codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const bcrypt = await import("bcryptjs");
  const hashedCodes: string[] = [];
  
  for (const code of codes) {
    const hashed = await bcrypt.hash(code, 10);
    hashedCodes.push(hashed);
  }
  
  return hashedCodes;
}

/**
 * Verify a backup code against hashed codes
 * @param code Plain text backup code
 * @param hashedCodes Array of hashed backup codes
 * @returns Index of matching code, or -1 if no match
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  const bcrypt = await import("bcryptjs");
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(code, hashedCodes[i]);
    if (isValid) {
      return i;
    }
  }
  
  return -1;
}
