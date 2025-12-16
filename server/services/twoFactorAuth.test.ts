import { describe, it, expect } from "vitest";
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from "./twoFactorAuthService";
import { authenticator } from "otplib";

describe("Two-Factor Authentication Service", () => {
  describe("generateTwoFactorSecret", () => {
    it("should generate a valid secret", () => {
      const secret = generateTwoFactorSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);
    });

    it("should generate unique secrets", () => {
      const secret1 = generateTwoFactorSecret();
      const secret2 = generateTwoFactorSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("generateQRCode", () => {
    it("should generate a QR code data URL", async () => {
      const email = "test@example.com";
      const secret = generateTwoFactorSecret();
      
      const qrCode = await generateQRCode(email, secret);
      
      expect(qrCode).toBeDefined();
      expect(qrCode).toContain("data:image/png;base64,");
    });
  });

  describe("verifyTwoFactorToken", () => {
    it("should verify a valid token", () => {
      const secret = generateTwoFactorSecret();
      const token = authenticator.generate(secret);
      
      const isValid = verifyTwoFactorToken(token, secret);
      
      expect(isValid).toBe(true);
    });

    it("should reject an invalid token", () => {
      const secret = generateTwoFactorSecret();
      const invalidToken = "000000";
      
      const isValid = verifyTwoFactorToken(invalidToken, secret);
      
      expect(isValid).toBe(false);
    });

    it("should reject a token with wrong secret", () => {
      const secret1 = generateTwoFactorSecret();
      const secret2 = generateTwoFactorSecret();
      const token = authenticator.generate(secret1);
      
      const isValid = verifyTwoFactorToken(token, secret2);
      
      expect(isValid).toBe(false);
    });
  });

  describe("generateBackupCodes", () => {
    it("should generate default 10 backup codes", () => {
      const codes = generateBackupCodes();
      
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(typeof code).toBe("string");
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it("should generate specified number of backup codes", () => {
      const count = 5;
      const codes = generateBackupCodes(count);
      
      expect(codes).toHaveLength(count);
    });

    it("should generate unique backup codes", () => {
      const codes = generateBackupCodes(10);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("hashBackupCodes", () => {
    it("should hash backup codes", async () => {
      const codes = generateBackupCodes(3);
      const hashedCodes = await hashBackupCodes(codes);
      
      expect(hashedCodes).toHaveLength(codes.length);
      hashedCodes.forEach((hashed, index) => {
        expect(hashed).not.toBe(codes[index]);
        expect(hashed.length).toBeGreaterThan(0);
      });
    });
  });

  describe("verifyBackupCode", () => {
    it("should verify a valid backup code", async () => {
      const codes = generateBackupCodes(3);
      const hashedCodes = await hashBackupCodes(codes);
      
      const index = await verifyBackupCode(codes[0], hashedCodes);
      
      expect(index).toBe(0);
    });

    it("should return -1 for invalid backup code", async () => {
      const codes = generateBackupCodes(3);
      const hashedCodes = await hashBackupCodes(codes);
      
      const index = await verifyBackupCode("INVALID", hashedCodes);
      
      expect(index).toBe(-1);
    });

    it("should find correct index for each code", async () => {
      const codes = generateBackupCodes(3); // Reduce to 3 codes for faster test
      const hashedCodes = await hashBackupCodes(codes);
      
      for (let i = 0; i < codes.length; i++) {
        const index = await verifyBackupCode(codes[i], hashedCodes);
        expect(index).toBe(i);
      }
    }, 10000); // Increase timeout to 10 seconds
  });
});
