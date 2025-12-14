import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Quality Officer or Admin procedure
const qualityOfficerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'quality_officer') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Quality Officer or Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Get tenant information
      const tenant = ctx.user.tenantId ? await db.getTenantById(ctx.user.tenantId) : null;
      
      return {
        ...ctx.user,
        tenant,
      };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  company: router({
    // Get company profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No company profile found' });
      }
      
      const tenant = await db.getTenantById(ctx.user.tenantId);
      if (!tenant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' });
      }
      
      return tenant;
    }),

    // Update company profile
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        telephone: z.string().optional(),
        email: z.string().email().optional(),
        managerName: z.string().optional(),
        managerTitle: z.string().optional(),
        serviceType: z.string().optional(),
        cqcInspectionDate: z.string().optional(),
        cqcRating: z.string().optional(),
        specialisms: z.array(z.string()).optional(),
        isSuspended: z.boolean().optional(),
        suspensionDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.tenantId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No company profile found' });
        }

        const updateData: any = { ...input };
        
        // Convert specialisms array to JSON string
        if (input.specialisms) {
          updateData.specialisms = JSON.stringify(input.specialisms);
        }
        
        // Convert date strings to Date objects
        if (input.cqcInspectionDate) {
          updateData.cqcInspectionDate = new Date(input.cqcInspectionDate);
        }
        if (input.suspensionDate) {
          updateData.suspensionDate = new Date(input.suspensionDate);
        }

        await db.updateTenant(ctx.user.tenantId, updateData);
        
        return { success: true };
      }),

    // Upload company logo
    uploadLogo: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.tenantId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No company profile found' });
        }

        // Decode base64 file data
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique file key
        const fileKey = `tenant-${ctx.user.tenantId}/logo/${nanoid()}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update tenant with logo URL
        await db.updateTenant(ctx.user.tenantId, { logoUrl: url });
        
        return { url };
      }),
  }),

  locations: router({
    // List all locations for the tenant
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        return [];
      }
      
      return await db.getLocationsByTenant(ctx.user.tenantId);
    }),

    // Create new location
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        managerName: z.string().optional(),
        managerEmail: z.string().email().optional(),
        numberOfServiceUsers: z.number().optional(),
        numberOfStaff: z.number().optional(),
        serviceType: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.tenantId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No company profile found' });
        }

        const locationId = await db.createLocation({
          tenantId: ctx.user.tenantId,
          ...input,
        });
        
        return { id: locationId };
      }),

    // Update location
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        managerName: z.string().optional(),
        managerEmail: z.string().email().optional(),
        numberOfServiceUsers: z.number().optional(),
        numberOfStaff: z.number().optional(),
        serviceType: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        await db.updateLocation(id, updateData);
        return { success: true };
      }),

    // Delete location
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteLocation(input.id);
        return { success: true };
      }),
  }),

  users: router({
    // List all users in the tenant (admin only)
    list: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantId) {
        return [];
      }
      
      return await db.getUsersByTenant(ctx.user.tenantId);
    }),

    // Update user role (admin only)
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['admin', 'quality_officer', 'manager', 'staff']),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
