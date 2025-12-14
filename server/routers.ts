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

  // Service Users management
  serviceUsers: router({
    list: protectedProcedure
      .input(z.object({ locationId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        
        // If locationId provided, filter by location
        if (input?.locationId) {
          return db.getServiceUsersByLocation(input.locationId);
        }
        
        // Otherwise return all for tenant
        return db.getServiceUsersByTenant(ctx.user.tenantId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          name: z.string(),
          dateOfBirth: z.string().optional(),
          carePackageType: z.string().optional(),
          admissionDate: z.string().optional(),
          supportNeeds: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No company associated" });
        }

        const serviceUser = await db.createServiceUser({
          ...input,
          tenantId: ctx.user.tenantId,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          admissionDate: input.admissionDate ? new Date(input.admissionDate) : null,
        });

        return serviceUser;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          dateOfBirth: z.string().optional(),
          carePackageType: z.string().optional(),
          admissionDate: z.string().optional(),
          supportNeeds: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateServiceUser(id, {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServiceUser(input.id);
        return { success: true };
      }),
  }),

  // Staff management
  staff: router({
    list: protectedProcedure
      .input(z.object({ locationId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        
        // If locationId provided, filter by location
        if (input?.locationId) {
          return db.getStaffMembersByLocation(input.locationId);
        }
        
        // Otherwise return all for tenant
        return db.getStaffMembersByTenant(ctx.user.tenantId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          name: z.string(),
          role: z.string().optional(),
          employmentDate: z.string().optional(),
          dbsCertificateNumber: z.string().optional(),
          dbsDate: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No company associated" });
        }

        const staff = await db.createStaffMember({
          ...input,
          tenantId: ctx.user.tenantId,
          employmentDate: input.employmentDate ? new Date(input.employmentDate) : null,
          dbsDate: input.dbsDate ? new Date(input.dbsDate) : null,
          isActive: input.isActive ?? true,
        });

        return staff;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          role: z.string().optional(),
          employmentDate: z.string().optional(),
          dbsCertificateNumber: z.string().optional(),
          dbsDate: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateStaffMember(id, {
          ...data,
          employmentDate: data.employmentDate ? new Date(data.employmentDate) : undefined,
          dbsDate: data.dbsDate ? new Date(data.dbsDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStaffMember(input.id);
        return { success: true };
      }),
  }),

  // Compliance management
  compliance: router({
    // Get all compliance sections
    sections: publicProcedure.query(async () => {
      return db.getAllComplianceSections();
    }),

    // Get section by ID with questions
    sectionDetails: protectedProcedure
      .input(z.object({ sectionId: z.number() }))
      .query(async ({ input }) => {
        const section = await db.getComplianceSectionById(input.sectionId);
        const questions = await db.getQuestionsBySection(input.sectionId);
        return { section, questions };
      }),

    // Get assessments for a location
    assessmentsByLocation: protectedProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return db.getComplianceAssessmentsByLocation(input.locationId);
      }),

    // Get compliance summary for a location
    summary: protectedProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return db.getComplianceSummaryByLocation(input.locationId);
      }),

    // Get overdue actions for a location
    overdueActions: protectedProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return db.getOverdueActionsByLocation(input.locationId);
      }),

    // Create or update assessment
    saveAssessment: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          locationId: z.number(),
          questionId: z.number(),
          assessmentType: z.enum(["service_user", "staff"]),
          serviceUserId: z.number().optional(),
          staffMemberId: z.number().optional(),
          complianceStatus: z.enum(["compliant", "non_compliant", "partial", "not_assessed"]),
          ragStatus: z.enum(["red", "amber", "green"]),
          evidenceProvided: z.string().optional(),
          identifiedGaps: z.string().optional(),
          actionRequired: z.string().optional(),
          responsiblePersonId: z.number().optional(),
          targetCompletionDate: z.string().optional(),
          notes: z.string().optional(),
          assessedById: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const assessmentId = await db.createOrUpdateComplianceAssessment({
          ...input,
          targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : undefined,
          assessedAt: new Date(),
        });
        return { success: true, assessmentId };
      }),

    // Get supporting documents
    documents: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupportingDocuments(input.assessmentId);
      }),

    // Upload supporting document
    uploadDocument: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          assessmentId: z.number(),
          documentType: z.string(),
          documentName: z.string(),
          fileUrl: z.string(),
          fileKey: z.string(),
          fileSize: z.number(),
          mimeType: z.string(),
          uploadedById: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.createSupportingDocument({
          ...input,
          uploadedAt: new Date(),
        });
        return { success: true };
      }),

    // Delete supporting document
    deleteDocument: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSupportingDocument(input.id);
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
