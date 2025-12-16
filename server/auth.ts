import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import jwt from "jsonwebtoken";
import { startFreeTrial } from "./subscription";
import { trackFailedLogin, resetFailedLoginAttempts, logSecurityEvent } from "./services/securityMonitoringService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authRouter = router({
  // Register new user and create company
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string(),
        companyName: z.string(),
        companyAddress: z.string().optional(),
        companyTelephone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Create tenant (company)
      const slug = input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const tenant = await db.createTenant({
        name: input.companyName,
        slug: slug + '-' + Date.now(), // Ensure uniqueness
        address: input.companyAddress || null,
        telephone: input.companyTelephone || null,
      });

      // Create default location (Main Office)
      await db.createLocation({
        tenantId: tenant.id,
        name: "Main Office",
        address: input.companyAddress || "",
        numberOfServiceUsers: 0,
        numberOfStaff: 0,
      });

      // Create user as admin of the company
      const userResult = await db.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        tenantId: tenant.id,
        role: "admin",
        superAdmin: true, // First user is super admin
      });

      // Start free trial for the new company
      await startFreeTrial(tenant.id);

      return {
        success: true,
        userId: userResult.insertId,
        tenantId: tenant.id,
      };
    }),

  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[LOGIN] Attempting login for:", input.email);
      const ipAddress = ctx.req?.ip || ctx.req?.headers['x-forwarded-for'] as string || 'unknown';
      
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        console.log("[LOGIN] User not found");
        trackFailedLogin(input.email, ipAddress);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      console.log("[LOGIN] User found:", user.email, "Has password:", !!user.password);
      const isValidPassword = await db.verifyPassword(input.password, user.password);
      console.log("[LOGIN] Password valid:", isValidPassword);
      if (!isValidPassword) {
        trackFailedLogin(input.email, ipAddress);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      
      // Reset failed attempts on successful login
      resetFailedLoginAttempts(input.email, ipAddress);
      
      // Log successful login
      logSecurityEvent({
        eventType: "failed_login",
        severity: "low",
        userId: user.id,
        email: user.email,
        ipAddress,
        details: `Successful login for ${user.email}`,
      });

      // Update last sign in
      await db.updateUserLastSignIn(user.id);

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log("[AUTH] Login successful for user:", user.email, "Token generated");

      return {
        success: true,
        token, // Return token in response body for localStorage storage
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
      };
    }),

  // Get current user
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user || null;
  }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("auth_token", {
      httpOnly: true,
      secure: ctx.req.protocol === "https",
      sameSite: "lax",
      path: "/",
    });
    return { success: true };
  }),

  // Update profile (name)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }
      await db.updateUserProfile(ctx.user.id, { name: input.name });
      return { success: true };
    }),

  // Update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
        confirmPassword: z.string(),
      }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }
      try {
        await db.updateUserPassword(ctx.user.id, input.currentPassword, input.newPassword);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to update password",
        });
      }
    }),

  // Request password reset
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
      }

      // Generate a secure token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

      await db.createPasswordResetToken(user.id, token, expiresAt);

      // TODO: Send email with reset link
      // For now, log the token (in production, send via email)
      console.log(`[PASSWORD RESET] Token for ${input.email}: ${token}`);
      console.log(`[PASSWORD RESET] Reset link: /reset-password?token=${token}`);

      return { 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link.",
        // In development, return token for testing
        ...(process.env.NODE_ENV === "development" ? { devToken: token } : {})
      };
    }),

  // Verify password reset token
  verifyResetToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const tokenRecord = await db.getPasswordResetToken(input.token);
      
      if (!tokenRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token",
        });
      }

      return { valid: true };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const tokenRecord = await db.getPasswordResetToken(input.token);
      
      if (!tokenRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token",
        });
      }

      // Reset the password
      await db.resetUserPassword(tokenRecord.userId, input.newPassword);
      
      // Mark token as used
      await db.markPasswordResetTokenUsed(input.token);

      return { success: true, message: "Password has been reset successfully" };
    }),

  // Setup 2FA - Generate secret and QR code
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const speakeasy = await import("speakeasy");
    const QRCode = await import("qrcode");

    // Generate a new secret
    const secret = speakeasy.default.generateSecret({
      name: `CareCompliance:${ctx.user.email}`,
      length: 20,
    });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.default.toDataURL(secret.otpauth_url || "");

    // Save the secret to the user's record (not verified yet)
    await db.update2FASecret(ctx.user.id, secret.base32);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }),

  // Verify 2FA code and enable
  verify2FA: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.twoFaSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA setup not initiated",
        });
      }

      const speakeasy = await import("speakeasy");
      const verified = speakeasy.default.totp.verify({
        secret: user.twoFaSecret,
        encoding: "base32",
        token: input.code,
        window: 1,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      }

      // Enable 2FA
      await db.enable2FA(ctx.user.id);

      return { success: true, message: "Two-factor authentication enabled" };
    }),

  // Disable 2FA
  disable2FA: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.twoFaSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA is not enabled",
        });
      }

      const speakeasy = await import("speakeasy");
      const verified = speakeasy.default.totp.verify({
        secret: user.twoFaSecret,
        encoding: "base32",
        token: input.code,
        window: 1,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      }

      // Disable 2FA
      await db.disable2FA(ctx.user.id);

      return { success: true, message: "Two-factor authentication disabled" };
    }),

  // Get 2FA status
  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await db.getUserById(ctx.user.id);
    return {
      enabled: user?.twoFaEnabled || false,
      verified: user?.twoFaVerified || false,
    };
  }),
});
