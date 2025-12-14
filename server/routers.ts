import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./auth";
import { rolesRouter } from "./roles";
import * as db from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  roles: rolesRouter,

  // Company management
  company: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return db.getTenantById(ctx.user.tenantId);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          address: z.string().optional(),
          telephone: z.string().optional(),
          email: z.string().email().optional(),
          website: z.string().optional(),
          managerName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }

        await db.updateTenant(ctx.user.tenantId, input);
        return { success: true };
      }),

    uploadLogo: protectedProcedure
      .input(
        z.object({
          fileData: z.string(), // base64
          fileName: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData.split(",")[1] || input.fileData, "base64");

        // Upload to S3
        const fileKey = `logos/${ctx.user.tenantId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Update tenant with logo URL
        await db.updateTenant(ctx.user.tenantId, { logoUrl: url });

        return { success: true, url };
      }),
  }),

  // Location management
  locations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      return db.getLocationsByTenant(ctx.user.tenantId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          address: z.string(),
          numberOfServiceUsers: z.number().optional(),
          numberOfStaff: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No company associated" });
        }

        const location = await db.createLocation({
          ...input,
          tenantId: ctx.user.tenantId,
        });

        return location;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          address: z.string().optional(),
          numberOfServiceUsers: z.number().optional(),
          numberOfStaff: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateLocation(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLocation(input.id);
        return { success: true };
      }),
  }),

  // User management
  users: router({
    list: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      return db.getUsersByTenant(ctx.user.tenantId);
    }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["admin", "quality_officer", "manager", "staff"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
