import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

// Middleware to check if user is super admin
const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.superAdmin !== 1) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only super admins can perform this action",
    });
  }
  return next({ ctx });
});

export const rolesRouter = router({
  // ============================================================================
  // ROLE CRUD
  // ============================================================================
  
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "User not associated with a tenant" });
    }
    return await db.getRolesByTenant(ctx.user.tenantId);
  }),

  create: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not associated with a tenant" });
      }

      const result = await db.createRole({
        tenantId: ctx.user.tenantId,
        name: input.name,
        description: input.description,
      });

      return { success: true, roleId: (result as any).insertId };
    }),

  update: superAdminProcedure
    .input(
      z.object({
        roleId: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateRole(input.roleId, {
        name: input.name,
        description: input.description,
      });

      return { success: true };
    }),

  delete: superAdminProcedure
    .input(z.object({ roleId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteRole(input.roleId);
      return { success: true };
    }),

  // ============================================================================
  // ROLE-LOCATION PERMISSIONS
  // ============================================================================

  getPermissions: protectedProcedure
    .input(z.object({ roleId: z.number() }))
    .query(async ({ input }) => {
      return await db.getRoleLocationPermissions(input.roleId);
    }),

  setPermissions: superAdminProcedure
    .input(
      z.object({
        roleId: z.number(),
        permissions: z.array(
          z.object({
            locationId: z.number(),
            canRead: z.boolean(),
            canWrite: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const permissions = input.permissions.map((p) => ({
        roleId: input.roleId,
        locationId: p.locationId,
        canRead: p.canRead,
        canWrite: p.canWrite,
      }));

      await db.setRoleLocationPermissions(input.roleId, permissions);
      return { success: true };
    }),

  // ============================================================================
  // USER-ROLE ASSIGNMENTS
  // ============================================================================

  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserRoles(input.userId);
    }),

  assignUserRoles: superAdminProcedure
    .input(
      z.object({
        userId: z.number(),
        roleIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      await db.setUserRoles(input.userId, input.roleIds);
      return { success: true };
    }),

  // ============================================================================
  // PERMISSION RESOLUTION
  // ============================================================================

  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    // Super admins have access to all locations
    if (ctx.user.superAdmin === 1) {
      if (!ctx.user.tenantId) {
        return [];
      }
      const locations = await db.getLocationsByTenant(ctx.user.tenantId);
      return locations.map((loc) => ({
        locationId: loc.id,
        canRead: true,
        canWrite: true,
      }));
    }

    // Regular users get permissions from their roles
    return await db.getUserLocationPermissions(ctx.user.id);
  }),
});
