import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import jwt from "jsonwebtoken";

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

      return {
        success: true,
        userId: (userResult as any).insertId,
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
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        console.log("[LOGIN] User not found");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      console.log("[LOGIN] User found:", user.email, "Has password:", !!user.password);
      const isValidPassword = await db.verifyPassword(input.password, user.password);
      console.log("[LOGIN] Password valid:", isValidPassword);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

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
});
