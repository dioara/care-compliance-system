import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { startFreeTrial } from "./subscription";
import { ERROR_MESSAGES, sanitizeError } from "./_core/errorMessages";
import { trackFailedLogin, resetFailedLoginAttempts, logSecurityEvent } from "./services/securityMonitoringService";
import { 
  generateTwoFactorSecret, 
  generateQRCode, 
  verifyTwoFactorToken,
  generateBackupCodes,
  hashBackupCodes
} from "./services/twoFactorAuthService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Rate limiting for password reset - max 3 requests per email per hour
const passwordResetAttempts = new Map<string, { count: number; firstAttempt: number }>();
const PASSWORD_RESET_MAX_ATTEMPTS = 3;
const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkPasswordResetRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = passwordResetAttempts.get(key);
  
  if (!record || now - record.firstAttempt > PASSWORD_RESET_WINDOW_MS) {
    // Reset or create new record
    passwordResetAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (record.count >= PASSWORD_RESET_MAX_ATTEMPTS) {
    return false; // Rate limited
  }
  
  record.count++;
  return true;
}

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
          message: ERROR_MESSAGES.USER_EMAIL_EXISTS,
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

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user as admin of the company (unverified)
      const userResult = await db.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        tenantId: tenant.id,
        role: "admin",
        superAdmin: true, // First user is super admin
        emailVerified: 0,
        emailVerificationToken,
        emailVerificationExpires: emailVerificationExpires.toISOString().slice(0, 19).replace('T', ' '),
      });

      // Start free trial for the new company
      await startFreeTrial(tenant.id);

      // Send email verification email
      const { sendEmail } = await import("./_core/email");
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://app.ccms.co.uk" 
        : "http://localhost:3000";
      
      const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
      
      await sendEmail({
        to: input.email,
        subject: "Verify Your Email - CCMS",
        text: `Welcome to Care Compliance Management System, ${input.name}!\n\nPlease verify your email address to activate your account and start your 30-day free trial.\n\nClick here to verify: ${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\nBest regards,\nThe CCMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1F7AE0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${input.name},</h2>
              <p style="color: #4b5563; font-size: 16px;">Welcome to CCMS! Please verify your email address to activate your account and start your <strong>30-day free trial</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #1F7AE0; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #1F7AE0; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1F7AE0; margin-top: 0;">What's included in your trial:</h3>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  <li>Unlimited compliance audits</li>
                  <li>AI-powered care plan auditing</li>
                  <li>Incident reporting and tracking</li>
                  <li>Staff training management</li>
                  <li>CQC inspection preparation tools</li>
                </ul>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Care Compliance Management System</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">UK Health Kits LTD</p>
            </div>
          </div>
        `
      });

      console.log(`[REGISTER] Verification email sent to ${input.email}`);

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
        rememberMe: z.boolean().optional().default(false),
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
          message: ERROR_MESSAGES.AUTH_INVALID,
        });
      }

      console.log("[LOGIN] User found:", user.email, "Has password:", !!user.password);
      const isValidPassword = await db.verifyPassword(input.password, user.password);
      console.log("[LOGIN] Password valid:", isValidPassword);
      if (!isValidPassword) {
        trackFailedLogin(input.email, ipAddress);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: ERROR_MESSAGES.AUTH_INVALID,
        });
      }
      
      // Check if email is verified
      if (user.emailVerified === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
        });
      }
      
      // Reset failed attempts on successful login
      resetFailedLoginAttempts(input.email, ipAddress);
      
      // Log successful login
      logSecurityEvent({
        eventType: "successful_login",
        severity: "low",
        userId: user.id,
        email: user.email,
        ipAddress,
        details: `Successful login for ${user.email}`,
      });

      // Update last sign in
      await db.updateUserLastSignIn(user.id);

      // Create JWT token with extended expiry if remember me is checked
      const tokenExpiry = input.rememberMe ? "30d" : "7d";
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: tokenExpiry }
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
    // Clear cookie with all possible configurations to ensure it's removed
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    
    ctx.res.clearCookie("auth_token", cookieOptions);
    
    // Also try clearing without httpOnly in case cookie was set differently
    ctx.res.clearCookie("auth_token", {
      ...cookieOptions,
      httpOnly: false,
    });
    
    console.log('[Logout] Cookies cleared');
    return { success: true };
  }),

  // Verify email address
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByVerificationToken(input.token);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired verification link. Please request a new one.",
        });
      }
      
      // Check if token is expired
      if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification link has expired. Please request a new one.",
        });
      }
      
      // Mark email as verified
      await db.verifyUserEmail(user.id);
      
      // Send welcome email now that email is verified
      const { sendEmail } = await import("./_core/email");
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://app.ccms.co.uk" 
        : "http://localhost:3000";
      
      await sendEmail({
        to: user.email,
        subject: "Welcome to CCMS - Your 30-Day Free Trial Has Started!",
        text: `Welcome to Care Compliance Management System!\n\nYour email has been verified and your 30-day free trial has started.\n\nLog in now: ${baseUrl}/login\n\nBest regards,\nThe CCMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1F7AE0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Email Verified!</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome to CCMS!</h2>
              <p style="color: #4b5563; font-size: 16px;">Your email has been verified and your <strong>30-day free trial</strong> has started!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/login" style="background: #1F7AE0; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Log In Now</a>
              </div>
              
              <div style="background: #f0f9ff; border-left: 4px solid #1F7AE0; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1F7AE0; margin-top: 0;">What's included in your trial:</h3>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  <li>Unlimited compliance audits</li>
                  <li>AI-powered care plan auditing</li>
                  <li>Incident reporting and tracking</li>
                  <li>Staff training management</li>
                  <li>CQC inspection preparation tools</li>
                </ul>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Care Compliance Management System</p>
            </div>
          </div>
        `
      });
      
      return { success: true, message: "Email verified successfully! You can now log in." };
    }),

  // Resend verification email
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      if (!user) {
        // Don't reveal if user exists
        return { success: true, message: "If an account exists with this email, a verification link has been sent." };
      }
      
      if (user.emailVerified === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already verified. You can log in.",
        });
      }
      
      // Generate new token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await db.updateUserVerificationToken(user.id, emailVerificationToken, emailVerificationExpires.toISOString().slice(0, 19).replace('T', ' '));
      
      // Send verification email
      const { sendEmail } = await import("./_core/email");
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://app.ccms.co.uk" 
        : "http://localhost:3000";
      
      const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
      
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - CCMS",
        text: `Please verify your email address.\n\nClick here to verify: ${verificationUrl}\n\nThis link expires in 24 hours.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1F7AE0; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <p style="color: #4b5563; font-size: 16px;">Click the button below to verify your email address.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #1F7AE0; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
            </div>
          </div>
        `
      });
      
      return { success: true, message: "Verification email sent. Please check your inbox." };
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
          message: ERROR_MESSAGES.AUTH_REQUIRED,
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
          message: ERROR_MESSAGES.USER_PASSWORD_INCORRECT,
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
      // Check rate limit
      if (!checkPasswordResetRateLimit(input.email)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many password reset requests. Please try again in an hour.",
        });
      }
      
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

      // Send password reset email
      const { sendEmail } = await import("./_core/email");
      const baseUrl = process.env.NODE_ENV === "production" 
        ? "https://app.ccms.co.uk" 
        : "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      
      await sendEmail({
        to: user.email,
        subject: "Reset Your CCMS Password",
        text: `You requested a password reset for your CCMS account.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1F7AE0; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">CCMS</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Reset Your Password</h2>
              <p style="color: #4b5563;">You requested a password reset for your CCMS account.</p>
              <p style="color: #4b5563;">Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #1F7AE0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
            <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} Care Compliance Management System</p>
            </div>
          </div>
        `
      });

      console.log(`[PASSWORD RESET] Reset email sent to ${input.email}`);

      return { 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link."
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
          message: ERROR_MESSAGES.AUTH_SESSION_EXPIRED,
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
          message: ERROR_MESSAGES.AUTH_SESSION_EXPIRED,
        });
      }

      // Reset the password
      await db.resetUserPassword(tokenRecord.userId, input.newPassword);
      
      // Mark token as used
      await db.markPasswordResetTokenUsed(input.token);

      return { success: true, message: "Password has been reset successfully" };
    }),

  // Get 2FA status
  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: ERROR_MESSAGES.AUTH_REQUIRED });
    }

    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      enabled: Boolean(user.twoFaEnabled),
      verified: Boolean(user.twoFaVerified),
    };
  }),

  // Setup 2FA - Generate QR code
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: ERROR_MESSAGES.AUTH_REQUIRED });
    }

    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // Generate new secret
    const secret = generateTwoFactorSecret();
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(user.email, secret);
    
    // Store secret (not yet verified)
    await db.updateUser(user.id, {
      twoFaSecret: secret,
      twoFaEnabled: 0, // Not enabled until verified
      twoFaVerified: 0,
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
    };
  }),

  // Verify and enable 2FA
  verify2FA: protectedProcedure
    .input(z.object({
      token: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: ERROR_MESSAGES.AUTH_REQUIRED });
      }

      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.twoFaSecret) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "2FA not set up. Please set up 2FA first." 
        });
      }

      // Verify token
      const isValid = verifyTwoFactorToken(input.token, user.twoFaSecret);
      if (!isValid) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Invalid verification code" 
        });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = await hashBackupCodes(backupCodes);

      // Enable 2FA
      await db.updateUser(user.id, {
        twoFaEnabled: 1,
        twoFaVerified: 1,
      });

      // Store backup codes in a separate table (you'll need to create this)
      // For now, return them to the user to save
      
      logSecurityEvent({
        eventType: "failed_login",
        severity: "low",
        userId: user.id,
        email: user.email,
        ipAddress: "system",
        details: `2FA enabled for ${user.email}`,
      });

      return {
        success: true,
        backupCodes, // User should save these securely
      };
    }),

  // Disable 2FA
  disable2FA: protectedProcedure
    .input(z.object({
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: ERROR_MESSAGES.AUTH_REQUIRED });
      }

      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: ERROR_MESSAGES.USER_NOT_FOUND });
      }

      // Verify password
      const isValidPassword = await db.verifyPassword(input.password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: ERROR_MESSAGES.USER_PASSWORD_INCORRECT 
        });
      }

      // Disable 2FA
      await db.updateUser(user.id, {
        twoFaEnabled: 0,
        twoFaVerified: 0,
        twoFaSecret: null,
      });

      logSecurityEvent({
        eventType: "failed_login",
        severity: "medium",
        userId: user.id,
        email: user.email,
        ipAddress: "system",
        details: `2FA disabled for ${user.email}`,
      });

      return { success: true };
    }),

  // Verify 2FA token during login
  verify2FALogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      token: z.string().length(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.twoFaSecret) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: ERROR_MESSAGES.AUTH_INVALID 
        });
      }

      // Verify token
      const isValid = verifyTwoFactorToken(input.token, user.twoFaSecret);
      if (!isValid) {
        const ipAddress = ctx.req?.ip || ctx.req?.headers['x-forwarded-for'] as string || 'unknown';
        trackFailedLogin(input.email, ipAddress);
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Invalid verification code" 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Set cookie
      ctx.res?.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          superAdmin: user.superAdmin,
        },
      };
    }),
});
