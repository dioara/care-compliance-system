import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./auth";
import { rolesRouter } from "./roles";
import * as db from "./db";
import { storagePut } from "./storage";
import { sendComplianceAlertEmail, sendComplianceAlertToRecipients } from "./_core/email";
import { subscriptionRouter } from "./subscription";
import { auditInstances, auditTrail, auditTypes, staffMembers, serviceUsers } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { format } from "date-fns";

// Super admin middleware - only allows super admins to access
const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.superAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only super admins can perform this action",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  roles: rolesRouter,
  subscription: subscriptionRouter,

  // Dashboard statistics
  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({ locationId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        return db.getDashboardStats(ctx.user.tenantId, input?.locationId);
      }),
  }),

  // Compliance notifications
  notifications: router({
    // Check compliance and send alert if below threshold
    checkComplianceAndNotify: protectedProcedure
      .input(z.object({
        threshold: z.number().min(0).max(100).default(80),
        locationId: z.number().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        
        const threshold = input?.threshold ?? 80;
        const stats = await db.getDashboardStats(ctx.user.tenantId, input?.locationId);
        
        if (!stats) {
          return { sent: false, reason: "No stats available" };
        }
        
        const alerts: string[] = [];
        
        // Check if compliance is below threshold
        if (stats.overallCompliance < threshold) {
          alerts.push(`Overall compliance (${stats.overallCompliance}%) is below the ${threshold}% threshold.`);
        }
        
        // Check for overdue actions
        if (stats.overdueActions > 0) {
          alerts.push(`There are ${stats.overdueActions} overdue action items requiring attention.`);
        }
        
        // Check for non-compliant (red) items
        if (stats.ragStatus.red > 0) {
          alerts.push(`${stats.ragStatus.red} items are marked as non-compliant (red status).`);
        }
        
        if (alerts.length === 0) {
          return { sent: false, reason: "Compliance is healthy, no alerts needed" };
        }
        
        const tenant = await db.getTenantById(ctx.user.tenantId);
        const locationName = input?.locationId 
          ? (await db.getLocationById(input.locationId))?.name || "Unknown Location"
          : "All Locations";
        
        const title = `⚠️ Compliance Alert - ${tenant?.name || "Your Care Home"}`;
        const content = `**Location:** ${locationName}\n\n**Alerts:**\n${alerts.map(a => `- ${a}`).join("\n")}\n\n**Current Status:**\n- Overall Compliance: ${stats.overallCompliance}%\n- Compliant (Green): ${stats.ragStatus.green}\n- Partial (Amber): ${stats.ragStatus.amber}\n- Non-Compliant (Red): ${stats.ragStatus.red}\n\nPlease review and address these compliance issues promptly.`;
        
        // Get configured email recipients
        const configuredRecipients = await db.getActiveEmailRecipients(ctx.user.tenantId, 'compliance');
        
        // Get custom template if available
        const customTemplate = await db.getEmailTemplateByType(ctx.user.tenantId, 'compliance_alert');
        
        // Build recipient list - include configured recipients plus current user
        const recipients: Array<{ email: string; name?: string }> = [];
        
        // Add current user
        if (ctx.user.email) {
          recipients.push({ email: ctx.user.email, name: ctx.user.name || undefined });
        }
        
        // Add configured recipients (avoid duplicates)
        for (const r of configuredRecipients) {
          if (!recipients.some(existing => existing.email === r.email)) {
            recipients.push({ email: r.email, name: r.name || undefined });
          }
        }
        
        // Send to all recipients
        const emailResult = await sendComplianceAlertToRecipients(
          recipients,
          tenant?.name || "Your Care Home",
          locationName,
          alerts,
          {
            compliance: stats.overallCompliance,
            threshold,
            overdueActions: stats.overdueActions,
            ragStatus: stats.ragStatus
          },
          customTemplate ? {
            subject: customTemplate.subject,
            bodyHtml: customTemplate.bodyHtml,
            headerColor: customTemplate.headerColor || undefined,
            footerText: customTemplate.footerText || undefined,
          } : undefined
        );
        
        return { 
          sent: emailResult.sent > 0,
          emailSent: emailResult.sent > 0,
          emailsSent: emailResult.sent,
          emailsFailed: emailResult.failed,
          recipientCount: recipients.length,
          alerts,
          stats: {
            compliance: stats.overallCompliance,
            threshold,
            overdueActions: stats.overdueActions,
            ragStatus: stats.ragStatus
          }
        };
      }),
      
    // Get compliance alert status without sending notification
    getAlertStatus: protectedProcedure
      .input(z.object({
        threshold: z.number().min(0).max(100).default(80),
        locationId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        
        const threshold = input?.threshold ?? 80;
        const stats = await db.getDashboardStats(ctx.user.tenantId, input?.locationId);
        
        if (!stats) {
          return { hasAlerts: false, alerts: [] };
        }
        
        const alerts: { type: string; message: string; severity: 'warning' | 'critical' }[] = [];
        
        if (stats.overallCompliance < threshold) {
          alerts.push({
            type: 'compliance_low',
            message: `Overall compliance (${stats.overallCompliance}%) is below ${threshold}%`,
            severity: stats.overallCompliance < 50 ? 'critical' : 'warning'
          });
        }
        
        if (stats.overdueActions > 0) {
          alerts.push({
            type: 'overdue_actions',
            message: `${stats.overdueActions} overdue action items`,
            severity: stats.overdueActions > 5 ? 'critical' : 'warning'
          });
        }
        
        if (stats.ragStatus.red > 0) {
          alerts.push({
            type: 'non_compliant',
            message: `${stats.ragStatus.red} non-compliant items`,
            severity: stats.ragStatus.red > 10 ? 'critical' : 'warning'
          });
        }
        
        return {
          hasAlerts: alerts.length > 0,
          alerts,
          stats: {
            compliance: stats.overallCompliance,
            threshold,
            overdueActions: stats.overdueActions,
            ragStatus: stats.ragStatus
          }
        };
      }),
  }),

  // Admin dashboard (super admin only)
  admin: router({
    getStats: superAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return db.getAdminDashboardStats(ctx.user.tenantId);
    }),
  }),

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
          email: z.string().email().optional().or(z.literal("")),
          website: z.string().optional(),
          managerName: z.string().optional(),
          managerTitle: z.string().optional(),
          serviceType: z.string().optional(),
          careSettingType: z.enum(["residential", "nursing", "domiciliary", "supported_living"]).optional().or(z.literal("")),
          cqcRating: z.string().optional(),
          openaiApiKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }

        // Clean up empty strings for enum fields
        const cleanedInput = {
          ...input,
          careSettingType: input.careSettingType === "" ? undefined : input.careSettingType,
          email: input.email === "" ? undefined : input.email,
        };

        await db.updateTenant(ctx.user.tenantId, cleanedInput);
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

    // List all locations for the company (used by LocationSwitcher)
    listLocations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      return db.getLocationsByTenant(ctx.user.tenantId);
    }),
  }),

  // Location management
  locations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      const locations = await db.getLocationsByTenant(ctx.user.tenantId);
      
      // Get actual counts for each location
      const locationsWithCounts = await Promise.all(
        locations.map(async (location) => {
          const staff = await db.getStaffMembersByLocation(location.id);
          const serviceUsers = await db.getServiceUsersByLocation(location.id);
          
          return {
            ...location,
            numberOfStaff: staff.length,
            numberOfServiceUsers: serviceUsers.length,
          };
        })
      );
      
      return locationsWithCounts;
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
          const users = await db.getServiceUsersByLocation(input.locationId);
          // Add progress data to each service user
          const usersWithProgress = await Promise.all(
            users.map(async (user) => {
              const progress = await db.getServiceUserComplianceProgress(user.id);
              return { ...user, complianceProgress: progress };
            })
          );
          return usersWithProgress;
        }
        
        // Otherwise return all for tenant
        const users = await db.getServiceUsersByTenant(ctx.user.tenantId);
        const usersWithProgress = await Promise.all(
          users.map(async (user) => {
            const progress = await db.getServiceUserComplianceProgress(user.id);
            return { ...user, complianceProgress: progress };
          })
        );
        return usersWithProgress;
      }),

    create: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          name: z.string(),
          dateOfBirth: z.string().optional(),
          carePackageType: z.string().optional(),
          admissionDate: z.string().optional(),
          dischargeDate: z.string().optional(),
          supportNeeds: z.string().optional(),
          isActive: z.boolean().optional(),
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
          dischargeDate: input.dischargeDate ? new Date(input.dischargeDate) : null,
          isActive: input.isActive ?? true,
        });

        return serviceUser;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          locationId: z.number().optional(),
          name: z.string().optional(),
          dateOfBirth: z.string().optional(),
          carePackageType: z.string().optional(),
          admissionDate: z.string().optional(),
          dischargeDate: z.string().optional(),
          supportNeeds: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateServiceUser(id, {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
          dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServiceUser(input.id);
        return { success: true };
      }),

    // Get service user history
    getHistory: protectedProcedure
      .input(z.object({ serviceUserId: z.number() }))
      .query(async ({ input }) => {
        return await db.getServiceUserHistory(input.serviceUserId);
      }),

    // Add service user history entry
    addHistory: protectedProcedure
      .input(z.object({
        serviceUserId: z.number(),
        changeType: z.string(),
        previousValue: z.string().optional(),
        newValue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
        }
        await db.addServiceUserHistory({
          serviceUserId: input.serviceUserId,
          tenantId: ctx.user.tenantId,
          changeType: input.changeType,
          previousValue: input.previousValue,
          newValue: input.newValue,
          changedBy: ctx.user.id,
          changedByName: ctx.user.name || ctx.user.email,
          notes: input.notes,
        });
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
          const staff = await db.getStaffMembersByLocation(input.locationId);
          // Add progress data to each staff member
          const staffWithProgress = await Promise.all(
            staff.map(async (member) => {
              const progress = await db.getStaffComplianceProgress(member.id);
              return { ...member, complianceProgress: progress };
            })
          );
          return staffWithProgress;
        }
        
        // Otherwise return all for tenant
        const staff = await db.getStaffMembersByTenant(ctx.user.tenantId);
        const staffWithProgress = await Promise.all(
          staff.map(async (member) => {
            const progress = await db.getStaffComplianceProgress(member.id);
            return { ...member, complianceProgress: progress };
          })
        );
        return staffWithProgress;
      }),

    create: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          name: z.string(),
          role: z.string().optional(),
          employmentType: z.enum(["permanent_sponsored", "permanent_not_sponsored", "agency"]).optional(),
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
          employmentType: input.employmentType || "permanent_not_sponsored",
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
          locationId: z.number().optional(),
          name: z.string().optional(),
          role: z.string().optional(),
          employmentType: z.enum(["permanent_sponsored", "permanent_not_sponsored", "agency"]).optional(),
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

    // Get staff history
    getHistory: protectedProcedure
      .input(z.object({ staffId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStaffHistory(input.staffId);
      }),

    // Add staff history entry
    addHistory: protectedProcedure
      .input(z.object({
        staffId: z.number(),
        changeType: z.string(),
        previousValue: z.string().optional(),
        newValue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
        }
        await db.addStaffHistory({
          staffId: input.staffId,
          tenantId: ctx.user.tenantId,
          changeType: input.changeType,
          previousValue: input.previousValue,
          newValue: input.newValue,
          changedBy: ctx.user.id,
          changedByName: ctx.user.name || ctx.user.email,
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // Compliance management
  compliance: router({
    // Get all compliance sections
    sections: publicProcedure.query(async () => {
      return db.getAllComplianceSections();
    }),

    // Get all compliance questions
    questions: publicProcedure.query(async () => {
      return db.getAllComplianceQuestions();
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

    // Assessment Templates
    templates: publicProcedure.query(async () => {
      return db.getAllAssessmentTemplates();
    }),

    templateById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAssessmentTemplateById(input.id);
      }),

    templateByCareSetting: protectedProcedure
      .input(z.object({ careSettingType: z.enum(["residential", "nursing", "domiciliary", "supported_living"]) }))
      .query(async ({ input }) => {
        return db.getAssessmentTemplateByCareSetting(input.careSettingType);
      }),

    templateQuestionsWithDetails: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        return db.getTemplateQuestionsWithDetails(input.templateId);
      }),
  }),

  // Audit management
  audits: router({    
    // Get all audit types
    getAuditTypes: protectedProcedure.query(async () => {
      return db.getAllAuditTypes();
    }),

    // List audit types (alias for calendar)
    listTypes: protectedProcedure.query(async () => {
      return db.getAllAuditTypes();
    }),

    // List audits with pagination, filters, and search
    list: protectedProcedure
      .input(
        z.object({
          locationId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          status: z.enum(['all', 'in_progress', 'completed', 'archived']).optional(),
          auditTypeId: z.number().optional(),
          search: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
          sortBy: z.enum(['scheduledDate', 'auditName', 'status']).default('scheduledDate'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Get all audits for the tenant
        let audits = await db.getAllAuditInstances(ctx.user.tenantId);
        
        // Filter by location if provided
        if (input.locationId) {
          audits = audits.filter(a => a.locationId === input.locationId);
        }
        
        // Filter by status if provided
        if (input.status && input.status !== 'all') {
          audits = audits.filter(a => a.status === input.status);
        }
        
        // Filter by audit type if provided
        if (input.auditTypeId) {
          audits = audits.filter(a => a.auditTypeId === input.auditTypeId);
        }
        
        // Filter by date range if provided
        if (input.startDate && input.endDate) {
          const start = new Date(input.startDate);
          const end = new Date(input.endDate);
          audits = audits.filter(a => {
            const auditDate = new Date(a.scheduledDate);
            return auditDate >= start && auditDate <= end;
          });
        }
        
        // Search filter (search in audit name, location name, auditor name)
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          audits = audits.filter(a => {
            const auditName = a.auditName?.toLowerCase() || '';
            const locationName = a.locationName?.toLowerCase() || '';
            const auditorName = a.auditorName?.toLowerCase() || '';
            return auditName.includes(searchLower) || 
                   locationName.includes(searchLower) || 
                   auditorName.includes(searchLower);
          });
        }
        
        // Sort audits
        audits.sort((a, b) => {
          let comparison = 0;
          
          if (input.sortBy === 'scheduledDate') {
            const dateA = new Date(a.scheduledDate).getTime();
            const dateB = new Date(b.scheduledDate).getTime();
            comparison = dateA - dateB;
          } else if (input.sortBy === 'auditName') {
            comparison = (a.auditName || '').localeCompare(b.auditName || '');
          } else if (input.sortBy === 'status') {
            comparison = a.status.localeCompare(b.status);
          }
          
          return input.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        // Calculate pagination
        const totalCount = audits.length;
        const totalPages = Math.ceil(totalCount / input.pageSize);
        const startIndex = (input.page - 1) * input.pageSize;
        const endIndex = startIndex + input.pageSize;
        const paginatedAudits = audits.slice(startIndex, endIndex);
        
        return {
          audits: paginatedAudits,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount,
            totalPages,
          },
        };
      }),

    // Get audit type by ID
    getAuditType: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditTypeById(input.id);
      }),

    // Get audit template for an audit type
    getAuditTemplate: protectedProcedure
      .input(z.object({ auditTypeId: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getAuditTemplateByAuditTypeId(input.auditTypeId);
        if (!template) return null;
        
        const sections = await db.getAuditTemplateSections(template.id);
        const sectionsWithQuestions = await Promise.all(
          sections.map(async (section) => {
            const questions = await db.getAuditTemplateQuestions(section.id);
            return { ...section, questions };
          })
        );
        
        return { ...template, sections: sectionsWithQuestions };
      }),

    // Create new audit instance
    createAuditInstance: protectedProcedure
      .input(
        z.object({
          auditTypeId: z.number(),
          locationId: z.number(),
          auditDate: z.date(),
          serviceUserId: z.number().optional(),
          staffMemberId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const template = await db.getAuditTemplateByAuditTypeId(input.auditTypeId);
        if (!template) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Audit template not found" });
        }
        
        const instanceId = await db.createAuditInstance({
          tenantId: ctx.user.tenantId,
          locationId: input.locationId,
          auditTypeId: input.auditTypeId,
          auditTemplateId: template.id,
          auditDate: input.auditDate,
          auditorId: ctx.user.id,
          auditorName: ctx.user.name || undefined,
          auditorRole: ctx.user.role || undefined,
          serviceUserId: input.serviceUserId,
          staffMemberId: input.staffMemberId,
          status: 'in_progress',
        });
        
        return { id: instanceId };
      }),

    // Get audit instance by ID
    getAuditInstance: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditInstanceById(input.id);
      }),

    // Get audit instances by location
    getAuditInstancesByLocation: protectedProcedure
      .input(z.object({ locationId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getAuditInstancesByLocation(input.locationId, input.limit);
      }),

    // Start audit (change status to in_progress)
    startAudit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAuditInstanceStatus(input.id, 'in_progress');
        return { success: true };
      }),

    // Complete audit
    completeAudit: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          overallScore: z.number().optional(),
          summary: z.string().optional(),
          recommendations: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateAuditInstanceStatus(
          input.id,
          'completed',
          new Date(),
          input.overallScore,
          input.summary,
          input.recommendations
        );
        return { success: true };
      }),

    // Save audit response
    saveResponse: protectedProcedure
      .input(
        z.object({
          auditInstanceId: z.number(),
          auditTemplateQuestionId: z.number(),
          response: z.string(),
          responseValue: z.string().optional(),
          observations: z.string().optional(),
          isCompliant: z.boolean().optional(),
          actionRequired: z.string().optional(),
          responsiblePersonId: z.number().optional(),
          targetDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        console.log('[saveResponse] Received input:', JSON.stringify(input, null, 2));
        const responseId = await db.saveAuditResponse(input);
        console.log('[saveResponse] Saved with ID:', responseId);
        return { id: responseId };
      }),

    // Get audit responses
    getResponses: protectedProcedure
      .input(z.object({ auditInstanceId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditResponses(input.auditInstanceId);
      }),

    // Create action plan
    createActionPlan: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          locationId: z.number(),
          auditInstanceId: z.number(),
          auditResponseId: z.number().optional(),
          issueDescription: z.string(),
          auditOrigin: z.string().optional(),
          ragStatus: z.enum(['red', 'amber', 'green']).optional(),
          responsiblePersonId: z.number(),
          responsiblePersonName: z.string().optional(),
          targetCompletionDate: z.date(),
          actionTaken: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const actionPlanId = await db.createAuditActionPlan(input);
        return { id: actionPlanId };
      }),

    // Save multiple action items from audit questions
    saveActionItems: protectedProcedure
      .input(
        z.object({
          auditInstanceId: z.number(),
          locationId: z.number(),
          actionItems: z.array(
            z.object({
              questionId: z.number(),
              description: z.string(),
              assignedToId: z.number().nullable(),
              targetDate: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Get audit instance to get audit type name
        const auditInstance = await db.getAuditInstanceById(input.auditInstanceId);
        if (!auditInstance) throw new TRPCError({ code: "NOT_FOUND", message: "Audit instance not found" });

        // Create action plan entries for each action item
        for (const item of input.actionItems) {
          // Get staff name for responsible person
          let responsiblePersonName = "Unassigned";
          if (item.assignedToId) {
            const staff = await db.getStaffMemberById(item.assignedToId);
            if (staff) responsiblePersonName = staff.name;
          }

          await db.createAuditActionPlan({
            tenantId: ctx.user.tenantId,
            locationId: input.locationId,
            auditInstanceId: input.auditInstanceId,
            auditResponseId: null,
            issueDescription: item.description,
            auditOrigin: auditInstance.auditTypeName || "Audit",
            ragStatus: "amber",
            responsiblePersonId: item.assignedToId || ctx.user.id,
            responsiblePersonName,
            targetCompletionDate: item.targetDate ? new Date(item.targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "not_started",
          });
        }

        return { success: true, count: input.actionItems.length };
      }),

    // Get action plans
    getActionPlans: protectedProcedure
      .input(z.object({ auditInstanceId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditActionPlans(input.auditInstanceId);
      }),

    // Update action plan status
    updateActionPlanStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(['not_started', 'in_progress', 'partially_completed', 'completed']),
          actualCompletionDate: z.date().optional(),
          actionTaken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateAuditActionPlanStatus(
          input.id,
          input.status,
          input.actualCompletionDate,
          input.actionTaken
        );
        return { success: true };
      }),

    // Get all action plans across locations (for master action log)
    getAllActionPlans: protectedProcedure
      .input(
        z.object({
          locationId: z.number().optional(),
        })
      )
      .query(async ({ ctx }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        return db.getAllActionPlans(ctx.user.tenantId);
      }),

    // Generate PDF report for action log
    generateActionLogPDF: protectedProcedure
      .input(
        z.object({
          locationId: z.number().optional(),
          filterStatus: z.string().optional(),
          filterRag: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Get company details
        const company = await db.getCompanyByTenantId(ctx.user.tenantId);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        
        // Get location name if filtered
        let locationName: string | undefined;
        if (input.locationId) {
          const location = await db.getLocationById(input.locationId);
          locationName = location?.name;
        }
        
        // Get all action plans
        let actions = await db.getAllActionPlans(ctx.user.tenantId);
        
        // Apply filters
        if (input.locationId) {
          actions = actions.filter(a => a.locationId === input.locationId);
        }
        if (input.filterStatus && input.filterStatus !== "all") {
          actions = actions.filter(a => a.status === input.filterStatus);
        }
        if (input.filterRag && input.filterRag !== "all") {
          actions = actions.filter(a => a.ragStatus === input.filterRag);
        }
        
        // Generate PDF
        const { generateActionLogPDF } = await import("./services/actionLogPdfService");
        const pdfBuffer = await generateActionLogPDF({
          actions,
          companyName: company.name,
          companyLogo: company.logoUrl || undefined,
          locationName,
          generatedBy: ctx.user.name || ctx.user.email,
        });
        
        // Upload to S3
        const filename = `action-log-${Date.now()}.pdf`;
        const { url } = await storagePut(`reports/action-logs/${filename}`, pdfBuffer, "application/pdf");
        
        return { url, filename };
      }),

    // Generate PDF report for completed audit
    generateAuditReportPDF: protectedProcedure
      .input(z.object({ auditInstanceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Get audit instance
        const auditInstance = await db.getAuditInstanceById(input.auditInstanceId);
        if (!auditInstance) throw new TRPCError({ code: "NOT_FOUND", message: "Audit not found" });
        
        // Get company details
        const company = await db.getCompanyByTenantId(ctx.user.tenantId);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        
        // Get audit template with sections and questions
        const template = await db.getAuditTemplateByAuditTypeId(auditInstance.auditTypeId);
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Audit template not found" });
        
        const sections = await db.getAuditTemplateSections(template.id);
        const sectionsWithQuestions = await Promise.all(
          sections.map(async (section) => {
            const questions = await db.getAuditTemplateQuestions(section.id);
            return { ...section, questions };
          })
        );
        
        // Get all responses for this audit
        const responses = await db.getAuditResponses(input.auditInstanceId);
        
        // Map responses to include question details
        const mappedResponses = responses.map(r => {
          // Find the question for this response
          let questionNumber = "";
          let questionText = "";
          for (const section of sectionsWithQuestions) {
            const question = section.questions.find(q => q.id === r.auditTemplateQuestionId);
            if (question) {
              questionNumber = question.questionNumber;
              questionText = question.questionText;
              break;
            }
          }
          // Use responseValue first (for yes/no/na), then response (for text/number)
          const finalResponse = r.responseValue || r.response || null;
          return {
            questionId: r.auditTemplateQuestionId,
            questionNumber,
            questionText,
            response: finalResponse,
            observations: r.observations,
            actionRequired: r.actionRequired,
          };
        });
        
        // Calculate completion rate
        const totalQuestions = sectionsWithQuestions.reduce((sum, s) => sum + s.questions.length, 0);
        const answeredQuestions = responses.length;
        const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
        
        // Generate PDF
        const { generateAuditReportPDF } = await import("./services/auditReportPdfService");
        const pdfBuffer = await generateAuditReportPDF({
          auditId: auditInstance.id,
          auditTypeName: auditInstance.auditTypeName || "Audit",
          auditDate: auditInstance.auditDate,
          locationName: auditInstance.locationName || "Unknown Location",
          completionRate,
          overallScore: auditInstance.overallScore || 0,
          status: auditInstance.status,
          conductedBy: ctx.user.name || ctx.user.email,
          sections: sectionsWithQuestions,
          responses: mappedResponses,
          companyName: company.name,
          companyLogo: company.logoUrl || undefined,
          generatedBy: ctx.user.name || ctx.user.email,
        });
        
        // Upload to S3
        const filename = `audit-report-${auditInstance.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(`reports/audits/${filename}`, pdfBuffer, "application/pdf");
        
        return { url, filename };
      }),

    // Get audit schedules
    getSchedules: protectedProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditSchedulesByTenant(input.tenantId);
      }),

    // Create audit schedule
    createSchedule: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          auditTypeId: z.number(),
          locationId: z.number(),
          frequency: z.string(),
          nextAuditDue: z.date(),
          reminderDays: z.number(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const schedule = await db.createAuditSchedule(input);
        return schedule;
      }),

    // Update audit schedule
    updateSchedule: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          frequency: z.string().optional(),
          nextAuditDue: z.date().optional(),
          reminderDays: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const schedule = await db.updateAuditSchedule(id, data);
        return schedule;
      }),

    // Delete audit schedule
    deleteSchedule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAuditSchedule(input.id);
        return { success: true };
      }),

    // Upload evidence
    uploadEvidence: protectedProcedure
      .input(
        z.object({
          tenantId: z.number(),
          auditInstanceId: z.number(),
          auditResponseId: z.number().optional(),
          evidenceType: z.string().optional(),
          fileData: z.string(), // base64
          fileName: z.string(),
          mimeType: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData.split(",")[1] || input.fileData, "base64");
        
        // Upload to S3
        const fileKey = `audit-evidence/${input.tenantId}/${input.auditInstanceId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Save evidence record
        const evidenceId = await db.uploadAuditEvidence({
          tenantId: input.tenantId,
          auditInstanceId: input.auditInstanceId,
          auditResponseId: input.auditResponseId,
          evidenceType: input.evidenceType,
          fileKey,
          fileUrl: url,
          fileName: input.fileName,
          fileSize: buffer.length,
          mimeType: input.mimeType,
          description: input.description,
          uploadedById: ctx.user.id,
        });
        
        return { id: evidenceId, url };
      }),

    // Get evidence
    getEvidence: protectedProcedure
      .input(z.object({ auditInstanceId: z.number() }))
      .query(async ({ input }) => {
        return db.getAuditEvidence(input.auditInstanceId);
      }),

    // Generate auto-schedule suggestions for next 12 months
    generateScheduleSuggestions: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          startDate: z.string().optional(), // ISO date string, defaults to today
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Get all audit types
        const auditTypes = await db.getAllAuditTypes();
        
        // Get existing audits for this location
        const existingAudits = await db.getAllAuditInstances(ctx.user.tenantId);
        const locationAudits = existingAudits.filter(a => a.locationId === input.locationId);
        
        // Generate suggestions
        const { generateAuditSchedule } = await import("./services/auditSchedulingService");
        const startDate = input.startDate ? new Date(input.startDate) : new Date();
        const suggestions = generateAuditSchedule(
          auditTypes,
          locationAudits.map(a => ({
            id: a.id,
            auditTypeId: a.auditTypeId,
            scheduledDate: a.scheduledDate,
          })),
          input.locationId,
          startDate
        );
        
        return suggestions;
      }),

    // Accept and create audits from schedule suggestions
    acceptScheduleSuggestions: protectedProcedure
      .input(
        z.object({
          locationId: z.number(),
          suggestions: z.array(
            z.object({
              auditTypeId: z.number(),
              suggestedDate: z.string(), // ISO date string
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        console.log('[acceptScheduleSuggestions] Input:', JSON.stringify(input, null, 2));
        console.log('[acceptScheduleSuggestions] User:', ctx.user.email, 'TenantId:', ctx.user.tenantId);
        
        const createdAudits = [];
        
        // Get staff and service users for this location
        const staffMembers = await db.getStaffMembersByLocation(input.locationId);
        const serviceUsers = await db.getServiceUsersByLocation(input.locationId);
        
        // Create audit instances for each accepted suggestion
        for (const suggestion of input.suggestions) {
          console.log('[acceptScheduleSuggestions] Processing suggestion:', suggestion);
          const template = await db.getAuditTemplateByAuditTypeId(suggestion.auditTypeId);
          console.log('[acceptScheduleSuggestions] Template found:', template ? template.id : 'null');
          if (!template) {
            console.log('[acceptScheduleSuggestions] No template found for auditTypeId:', suggestion.auditTypeId);
            continue;
          }
          
          // Get audit type to check targetType
          const auditType = await db.getAuditTypeById(suggestion.auditTypeId);
          if (!auditType) continue;
          
          try {
            // For staff-specific audits, create one instance per staff member
            if (auditType.targetType === 'staff' && staffMembers.length > 0) {
              for (const staff of staffMembers) {
                const instanceId = await db.createAuditInstance({
                  tenantId: ctx.user.tenantId,
                  locationId: input.locationId,
                  auditTypeId: suggestion.auditTypeId,
                  auditTemplateId: template.id,
                  auditDate: new Date(suggestion.suggestedDate),
                  auditorId: ctx.user.id,
                  auditorName: ctx.user.name || undefined,
                  auditorRole: ctx.user.role || undefined,
                  status: 'in_progress',
                  staffMemberId: staff.id,
                });
                createdAudits.push({ id: instanceId, auditTypeId: suggestion.auditTypeId, staffMemberId: staff.id });
              }
            }
            // For service-user-specific audits, create one instance per service user
            else if (auditType.targetType === 'serviceUser' && serviceUsers.length > 0) {
              for (const user of serviceUsers) {
                const instanceId = await db.createAuditInstance({
                  tenantId: ctx.user.tenantId,
                  locationId: input.locationId,
                  auditTypeId: suggestion.auditTypeId,
                  auditTemplateId: template.id,
                  auditDate: new Date(suggestion.suggestedDate),
                  auditorId: ctx.user.id,
                  auditorName: ctx.user.name || undefined,
                  auditorRole: ctx.user.role || undefined,
                  status: 'in_progress',
                  serviceUserId: user.id,
                });
                createdAudits.push({ id: instanceId, auditTypeId: suggestion.auditTypeId, serviceUserId: user.id });
              }
            }
            // For general audits, create one instance
            else {
              const instanceId = await db.createAuditInstance({
                tenantId: ctx.user.tenantId,
                locationId: input.locationId,
                auditTypeId: suggestion.auditTypeId,
                auditTemplateId: template.id,
                auditDate: new Date(suggestion.suggestedDate),
                auditorId: ctx.user.id,
                auditorName: ctx.user.name || undefined,
                auditorRole: ctx.user.role || undefined,
                status: 'in_progress',
              });
              createdAudits.push({ id: instanceId, auditTypeId: suggestion.auditTypeId });
            }
            console.log('[acceptScheduleSuggestions] Created audit instances for auditTypeId:', suggestion.auditTypeId);
          } catch (error) {
            console.error('[acceptScheduleSuggestions] Failed to create audit instance:', error);
            throw error;
          }
        }
        
        return { success: true, count: createdAudits.length, audits: createdAudits };
      }),

    // Delete all audits for a location with audit trail
    deleteAll: protectedProcedure
      .input(z.object({
        locationId: z.number(),
        confirmation: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate confirmation
        if (input.confirmation !== 'CONFIRM') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please type CONFIRM to delete all audits',
          });
        }

        // Count audits before deletion
        const audits = await db.getAuditInstancesByLocation(input.locationId);
        const count = audits.length;

        // Get database instance
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        // Delete all audits
        await database.delete(auditInstances)
          .where(and(
            eq(auditInstances.tenantId, ctx.user.tenantId),
            eq(auditInstances.locationId, input.locationId)
          ));

        // Log to audit trail
        await database.insert(auditTrail).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          entityType: 'audit_bulk_delete',
          action: 'delete_all',
          description: `Deleted all ${count} audits for location ${input.locationId}`,
          metadata: JSON.stringify({
            locationId: input.locationId,
            deletedCount: count,
            deletedBy: ctx.user.name,
            deletedAt: new Date().toISOString(),
          }),
        });

        return { success: true, deletedCount: count };
      }),

    // Schedule a new audit
    scheduleAudit: protectedProcedure
      .input(z.object({
        locationId: z.number(),
        auditTypeId: z.number(),
        scheduledDate: z.string(),
        auditorId: z.number().optional(),
        serviceUserId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get audit template for this type
        const template = await db.getAuditTemplateByAuditTypeId(input.auditTypeId);
        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Audit template not found for this audit type',
          });
        }

        // Create audit instance
        const instanceId = await db.createAuditInstance({
          tenantId: ctx.user.tenantId,
          locationId: input.locationId,
          auditTypeId: input.auditTypeId,
          auditTemplateId: template.id,
          auditDate: new Date(input.scheduledDate),
          auditorId: input.auditorId || ctx.user.id,
          auditorName: ctx.user.name || undefined,
          auditorRole: ctx.user.role || undefined,
          serviceUserId: input.serviceUserId,
          status: 'in_progress',
        });

        return { success: true, auditId: instanceId };
      }),

    // Export calendar to PDF
    exportCalendarPdf: protectedProcedure
      .input(z.object({
        locationId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        viewType: z.enum(['month', 'week', 'day']),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { generateCalendarPdf } = await import('./services/calendarPdfService');
          
          // Get location details
          const location = await db.getLocationById(input.locationId);
          if (!location) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Location not found' });
          }

        // Get audits for the date range
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }
        
        console.log('[PDF Export] Fetching audits for location:', input.locationId, 'from', input.startDate, 'to', input.endDate);
        
        // Fetch audit instances
        const auditInstancesData = await database
          .select()
          .from(auditInstances)
          .where(
            and(
              eq(auditInstances.locationId, input.locationId),
              gte(auditInstances.auditDate, new Date(input.startDate)),
              lte(auditInstances.auditDate, new Date(input.endDate))
            )
          )
          .orderBy(auditInstances.auditDate);

        console.log('[PDF Export] Found', auditInstancesData.length, 'audit instances');
        
        // Fetch all related data in bulk
        const auditTypeIds = [...new Set(auditInstancesData.map(a => a.auditTypeId).filter(Boolean))];
        const auditorIds = [...new Set(auditInstancesData.map(a => a.assignedAuditorId).filter(Boolean))];
        const serviceUserIds = [...new Set(auditInstancesData.map(a => a.serviceUserId).filter(Boolean))];
        
        // Fetch audit types
        const auditTypesData = auditTypeIds.length > 0 
          ? await database.select().from(auditTypes).where(sql`${auditTypes.id} IN (${sql.join(auditTypeIds.map(id => sql`${id}`), sql`, `)})`)
          : [];
        const auditTypeMap = new Map(auditTypesData.map(at => [at.id, at.auditName]));
        
        // Fetch staff members
        const staffData = auditorIds.length > 0
          ? await database.select().from(staffMembers).where(sql`${staffMembers.id} IN (${sql.join(auditorIds.map(id => sql`${id}`), sql`, `)})`)
          : [];
        const staffMap = new Map(staffData.map(s => [s.id, s.name]));
        
        // Fetch service users
        const serviceUsersData = serviceUserIds.length > 0
          ? await database.select().from(serviceUsers).where(sql`${serviceUsers.id} IN (${sql.join(serviceUserIds.map(id => sql`${id}`), sql`, `)})`)
          : [];
        const serviceUserMap = new Map(serviceUsersData.map(su => [su.id, su.name]));
        
        // Map data to audits
        const auditsWithNames = auditInstancesData.map(instance => ({
          id: instance.id,
          auditName: auditTypeMap.get(instance.auditTypeId) || 'Unknown Audit',
          scheduledDate: instance.auditDate,
          status: instance.status,
          auditorName: instance.assignedAuditorId ? (staffMap.get(instance.assignedAuditorId) || null) : null,
          serviceUserName: instance.serviceUserId ? (serviceUserMap.get(instance.serviceUserId) || null) : null,
        }));
        
        console.log('[PDF Export] Enriched', auditsWithNames.length, 'audits with names');
        
        // Generate PDF
        console.log('[PDF Export] Generating PDF...');
        const pdfBuffer = await generateCalendarPdf({
          locationName: location.name,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          audits: auditsWithNames.map(a => ({
            ...a,
            scheduledDate: a.scheduledDate.toISOString(),
          })),
          viewType: input.viewType,
        });

        // Upload to S3
        console.log('[PDF Export] PDF generated, uploading to S3...');
        const { storagePut } = await import('./storage');
        const filename = `calendar-${location.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        const { url } = await storagePut(
          `reports/calendars/${filename}`,
          pdfBuffer,
          'application/pdf'
        );

        console.log('[PDF Export] Success! URL:', url);
        return { url, filename };
        } catch (error) {
          console.error('[PDF Export Error]', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to generate calendar PDF',
          });
        }
      }),

    // Send audit reminders manually (admin only)
    sendReminders: adminProcedure
      .mutation(async () => {
        const { sendDailyAuditReminders } = await import('./services/auditReminderService');
        const result = await sendDailyAuditReminders();
        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
          message: `Sent ${result.sent} reminders, ${result.failed} failed`,
        };
      }),

  }),

  // Incidents
  incidents: router({
    // Create incident
    create: protectedProcedure
      .input(z.object({
        locationId: z.number(),
        incidentNumber: z.string(),
        incidentDate: z.string(),
        incidentTime: z.string().optional(),
        incidentType: z.string(),
        severity: z.string().optional(),
        locationDescription: z.string().optional(),
        affectedPersonType: z.string().optional(),
        serviceUserId: z.number().optional(),
        affectedStaffId: z.number().optional(),
        affectedPersonName: z.string().optional(),
        staffInvolved: z.string().optional(),
        description: z.string().optional(),
        immediateActions: z.string().optional(),
        witnessStatements: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.tenantId) throw new Error("No tenant ID");
        
        const id = await db.createIncident({
          tenantId: ctx.user.tenantId,
          locationId: input.locationId,
          incidentNumber: input.incidentNumber,
          incidentDate: new Date(input.incidentDate),
          incidentTime: input.incidentTime,
          incidentType: input.incidentType,
          severity: input.severity,
          locationDescription: input.locationDescription,
          affectedPersonType: input.affectedPersonType,
          serviceUserId: input.serviceUserId,
          affectedStaffId: input.affectedStaffId,
          affectedPersonName: input.affectedPersonName,
          staffInvolved: input.staffInvolved,
          description: input.description,
          immediateActions: input.immediateActions,
          witnessStatements: input.witnessStatements,
          reportedById: ctx.user.id,
          reportedByName: ctx.user.name ?? undefined,
        });
        
        return { id };
      }),

    // Get incidents by location
    getByLocation: protectedProcedure
      .input(z.object({ locationId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getIncidentsByLocation(input.locationId, input.limit);
      }),

    // Get incidents by tenant
    getByTenant: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getIncidentsByTenant(ctx.user.tenantId, input.limit);
      }),

    // Get incident by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getIncidentById(input.id);
      }),

    // Update incident
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.updateIncident(input.id, ctx.user.tenantId, input.data as any);
        return { success: true };
      }),

    // Log notification - toggle notification status with timestamp
    logNotification: protectedProcedure
      .input(z.object({
        id: z.number(),
        notificationType: z.enum(['cqc', 'council', 'ico', 'police', 'family']),
        notified: z.boolean(),
        details: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateIncidentNotificationStatus(input.id, input.notificationType, input.notified, input.details);
        return { success: true };
      }),

    // Add follow-up action to master action log
    addFollowUpAction: protectedProcedure
      .input(z.object({
        incidentId: z.number(),
        incidentNumber: z.string(),
        locationId: z.number(),
        actionDescription: z.string(),
        assignedToId: z.number().optional(),
        targetDate: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Get staff name if assigned
        let responsiblePersonName = 'Unassigned';
        if (input.assignedToId) {
          const staff = await db.getStaffMemberById(input.assignedToId);
          if (staff) responsiblePersonName = staff.name;
        }
        
        // Map severity to RAG status
        const ragStatus = input.severity === 'critical' || input.severity === 'high' ? 'red' 
          : input.severity === 'medium' ? 'amber' : 'green';
        
        const actionId = await db.createActionPlanFromIncident({
          tenantId: ctx.user.tenantId,
          locationId: input.locationId,
          incidentId: input.incidentId,
          incidentNumber: input.incidentNumber,
          issueDescription: input.actionDescription,
          responsiblePersonId: input.assignedToId,
          responsiblePersonName,
          targetCompletionDate: new Date(input.targetDate),
          ragStatus,
        });
        
        return { success: true, actionId };
      }),

    // Close incident
    close: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.closeIncident(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get recent incidents
    getRecent: protectedProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getRecentIncidents(ctx.user.tenantId, input.days);
      }),

    // Generate PDF report for incidents
    generatePDF: protectedProcedure
      .input(
        z.object({
          locationId: z.number().optional(),
          severity: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const company = await db.getCompanyByTenantId(ctx.user.tenantId);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        
        let locationName: string | undefined;
        if (input.locationId) {
          const location = await db.getLocationById(input.locationId);
          locationName = location?.name;
        }
        
        let incidents = await db.getIncidentsByTenant(ctx.user.tenantId);
        
        // Apply filters
        if (input.locationId) {
          incidents = incidents.filter(i => i.locationId === input.locationId);
        }
        if (input.severity && input.severity !== "all") {
          incidents = incidents.filter(i => i.severity === input.severity);
        }
        if (input.status && input.status !== "all") {
          incidents = incidents.filter(i => i.status === input.status);
        }
        
        const { generateIncidentPDF } = await import("./services/incidentPdfService");
        const pdfBuffer = await generateIncidentPDF({
          incidents,
          companyName: company.name,
          companyLogo: company.logoUrl || undefined,
          locationName,
          generatedBy: ctx.user.name || ctx.user.email,
        });
        
        const filename = `incident-report-${Date.now()}.pdf`;
        const { url } = await storagePut(`reports/incidents/${filename}`, pdfBuffer, "application/pdf");
        
        return { url, filename };
      }),

    // Generate PDF report for a single incident
    generateSinglePDF: protectedProcedure
      .input(z.object({ incidentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const company = await db.getCompanyByTenantId(ctx.user.tenantId);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        
        const incident = await db.getIncidentById(input.incidentId);
        if (!incident || incident.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
        }
        
        // Fetch attachments and signatures for this incident
        const attachments = await db.getIncidentAttachments(input.incidentId, ctx.user.tenantId);
        const signatures = await db.getIncidentSignatures(input.incidentId, ctx.user.tenantId);
        
        let locationName: string | undefined;
        if (incident.locationId) {
          const location = await db.getLocationById(incident.locationId);
          locationName = location?.name;
        }
        
        const { generateIncidentPDF } = await import("./services/incidentPdfService");
        const pdfBuffer = await generateIncidentPDF({
          incidents: [{ ...incident, attachments, signatures }],
          companyName: company.name,
          companyLogo: company.logoUrl || undefined,
          locationName,
          generatedBy: ctx.user.name || ctx.user.email,
        });
        
        const filename = `incident-${incident.incidentNumber}-${Date.now()}.pdf`;
        const { url } = await storagePut(`reports/incidents/${filename}`, pdfBuffer, "application/pdf");
        
        return { url, filename };
      }),

    // Generate Excel export for incidents
    generateExcel: protectedProcedure
      .input(
        z.object({
          locationId: z.number().optional(),
          severity: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const company = await db.getCompanyByTenantId(ctx.user.tenantId);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        
        let locationName: string | undefined;
        if (input.locationId) {
          const location = await db.getLocationById(input.locationId);
          locationName = location?.name;
        }
        
        let incidents = await db.getIncidentsByTenant(ctx.user.tenantId);
        
        // Apply filters
        if (input.locationId) {
          incidents = incidents.filter(i => i.locationId === input.locationId);
        }
        if (input.severity && input.severity !== "all") {
          incidents = incidents.filter(i => i.severity === input.severity);
        }
        if (input.status && input.status !== "all") {
          incidents = incidents.filter(i => i.status === input.status);
        }
        
        const { generateIncidentExcel } = await import("./services/incidentExcelService");
        
        // Ensure incidents is an array and handle null values
        const safeIncidents = Array.isArray(incidents) ? incidents : [];
        console.log('[Excel] Generating report for', safeIncidents.length, 'incidents');
        
        const excelBuffer = await generateIncidentExcel({
          incidents: safeIncidents,
          companyName: company.name || 'Unknown Company',
          locationName,
          generatedBy: ctx.user.name || ctx.user.email || 'Unknown',
        });
        
        const filename = `incident-report-${Date.now()}.xlsx`;
        const { url } = await storagePut(`reports/incidents/${filename}`, excelBuffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        
        return { url, filename };
      }),

    // ============ Attachments ============
    
    // Get attachments for an incident
    getAttachments: protectedProcedure
      .input(z.object({ incidentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getIncidentAttachments(input.incidentId, ctx.user.tenantId);
      }),

    // Upload attachment to incident
    uploadAttachment: protectedProcedure
      .input(
        z.object({
          incidentId: z.number(),
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          fileData: z.string(), // Base64 encoded file data
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Verify incident belongs to tenant
        const incident = await db.getIncidentById(input.incidentId);
        if (!incident || incident.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
        }
        
        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileKey = `incidents/${ctx.user.tenantId}/${input.incidentId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, fileBuffer, input.fileType);
        
        // Save to database
        const attachmentId = await db.createIncidentAttachment({
          incidentId: input.incidentId,
          tenantId: ctx.user.tenantId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileUrl: url,
          fileKey: fileKey,
          description: input.description,
          uploadedById: ctx.user.id,
          uploadedByName: ctx.user.name || ctx.user.email,
        });
        
        return { id: attachmentId, url };
      }),

    // Delete attachment
    deleteAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const deleted = await db.deleteIncidentAttachment(input.attachmentId, ctx.user.tenantId);
        if (!deleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" });
        }
        
        // Note: S3 file deletion could be added here using storageDelete if available
        return { success: true };
      }),

    // ============ Digital Signatures ============
    
    // Get signatures for an incident
    getSignatures: protectedProcedure
      .input(z.object({ incidentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getIncidentSignatures(input.incidentId, ctx.user.tenantId);
      }),

    // Add digital signature to incident
    addSignature: protectedProcedure
      .input(
        z.object({
          incidentId: z.number(),
          signatureType: z.enum(["manager", "reviewer", "witness"]),
          signatureData: z.string(), // Base64 encoded signature image
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Verify incident belongs to tenant
        const incident = await db.getIncidentById(input.incidentId);
        if (!incident || incident.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
        }
        
        // Check if signature of this type already exists
        const existingSignature = await db.getIncidentSignatureByType(
          input.incidentId,
          ctx.user.tenantId,
          input.signatureType
        );
        
        if (existingSignature) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: `A ${input.signatureType} signature already exists for this incident` 
          });
        }
        
        // Create hash of signature data for verification
        const crypto = await import("crypto");
        const signatureHash = crypto
          .createHash("sha256")
          .update(input.signatureData)
          .digest("hex");
        
        // Get user's role
        const userRoles = await db.getUserRoles(ctx.user.id);
        const primaryRole = userRoles[0]?.roleName || "User";
        
        // Save signature
        const signatureId = await db.createIncidentSignature({
          incidentId: input.incidentId,
          tenantId: ctx.user.tenantId,
          signatureType: input.signatureType,
          signedById: ctx.user.id,
          signedByName: ctx.user.name || ctx.user.email,
          signedByRole: primaryRole,
          signedByEmail: ctx.user.email,
          signatureData: input.signatureData,
          signatureHash: signatureHash,
          notes: input.notes,
        });
        
        return { id: signatureId, signatureHash };
      }),

    // Delete signature (only by the signer or admin)
    deleteSignature: protectedProcedure
      .input(z.object({ signatureId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || !ctx.user.tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        // Only admins can delete signatures for audit trail purposes
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Only administrators can delete signatures" 
          });
        }
        
        await db.deleteIncidentSignature(input.signatureId, ctx.user.tenantId);
        return { success: true };
      }),
  }),

  // Analytics
  analytics: router({
    // Audit completion stats
    auditCompletion: protectedProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return { total: 0, completed: 0, inProgress: 0, completionRate: 0 };
        return db.getAuditCompletionStats(ctx.user.tenantId, input.days);
      }),

    // Audit completion trend
    auditTrend: protectedProcedure
      .input(z.object({ months: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getAuditCompletionTrend(ctx.user.tenantId, input.months);
      }),

    // Non-compliance areas
    nonComplianceAreas: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getNonComplianceAreas(ctx.user.tenantId, input.limit);
      }),

    // Action plan stats
    actionPlanStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.tenantId) return { total: 0, completed: 0, overdue: 0, inProgress: 0 };
        return db.getActionPlanStats(ctx.user.tenantId);
      }),

    // Audits by type
    auditsByType: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.tenantId) return [];
        return db.getAuditsByType(ctx.user.tenantId);
      }),
  }),

  // User management
  users: router({
    list: superAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      return db.getUsersByTenant(ctx.user.tenantId);
    }),

    create: superAdminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          superAdmin: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant" });
        }
        // Check if email already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already exists" });
        }
        // createUser already hashes the password internally
        const result = await db.createUser({
          tenantId: ctx.user.tenantId,
          name: input.name,
          email: input.email,
          password: input.password,
          superAdmin: input.superAdmin || false,
        });
        return { success: true, userId: (result as any).insertId };
      }),

    update: superAdminProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          password: z.string().min(6).optional(),
          superAdmin: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;
        if (input.superAdmin !== undefined) updates.superAdmin = input.superAdmin;
        if (input.password) {
          const bcrypt = await import("bcryptjs");
          updates.password = await bcrypt.hash(input.password, 10);
        }
        await db.updateUser(input.userId, updates);
        return { success: true };
      }),

    delete: superAdminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
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

    // Send staff invitation email
    sendInvitation: superAdminProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          staffId: z.number().optional(),
          roleIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No tenant" });
        }

        // Check if email already exists as a user
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "This email is already registered" });
        }

        // Generate a secure token
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Save invitation to database
        await db.createStaffInvitation({
          tenantId: ctx.user.tenantId,
          staffId: input.staffId,
          email: input.email,
          name: input.name,
          token,
          roleIds: input.roleIds ? JSON.stringify(input.roleIds) : null,
          expiresAt,
          createdBy: ctx.user.id,
        });

        // Get tenant info for email
        const tenant = await db.getTenantById(ctx.user.tenantId);
        const companyName = tenant?.name || "Care Compliance System";

        // Send invitation email
        const { sendEmail } = await import("./_core/email");
        const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL?.replace("/api", "") || "";
        const inviteUrl = `${baseUrl}/accept-invitation?token=${token}`;

        await sendEmail({
          to: input.email,
          subject: `You're invited to join ${companyName}`,
          text: `Hello${input.name ? " " + input.name : ""},\n\nYou have been invited to join ${companyName} on the Care Compliance System.\n\nClick the link below to create your account:\n${inviteUrl}\n\nThis invitation expires in 7 days.\n\nBest regards,\n${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">You're Invited!</h2>
              <p>Hello${input.name ? " " + input.name : ""},</p>
              <p>You have been invited to join <strong>${companyName}</strong> on the Care Compliance System.</p>
              <p style="margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create Your Account</a>
              </p>
              <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
              <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px;">Best regards,<br />${companyName}</p>
            </div>
          `,
        });

        return { success: true, message: "Invitation sent successfully" };
      }),

    // Get pending invitations
    getInvitations: superAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) return [];
      return db.getStaffInvitationsByTenant(ctx.user.tenantId);
    }),
  }),

  // AI Audits
  aiAudits: router({
    // Get tenant's OpenAI API key status
    getApiKeyStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      const tenant = await db.getTenantById(ctx.user.tenantId);
      return {
        hasApiKey: !!tenant?.openaiApiKey,
        keyPreview: tenant?.openaiApiKey ? `sk-...${tenant.openaiApiKey.slice(-4)}` : null,
      };
    }),

    // Validate OpenAI API key
    validateApiKey: protectedProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        const { validateApiKey } = await import("./services/openaiService");
        const isValid = await validateApiKey(input.apiKey);
        return { isValid };
      }),

    // Submit document for AI audit
    submitAudit: protectedProcedure
      .input(
        z.object({
          auditType: z.enum(["care_plan", "daily_notes"]),
          documentText: z.string().min(100, "Document must be at least 100 characters"),
          documentName: z.string().optional(),
          customNames: z.array(z.string()).optional(), // Additional names to anonymize
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }

        // Get tenant's OpenAI API key
        const tenant = await db.getTenantById(ctx.user.tenantId);
        if (!tenant?.openaiApiKey) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Please configure your OpenAI API key in Company Profile to use AI audits",
          });
        }

        // Anonymize the document
        const { anonymizeDocument, createAnonymizationReport } = await import("./utils/anonymize");
        const { anonymizedText, redactionSummary } = anonymizeDocument(input.documentText, {
          customNames: input.customNames,
        });
        const anonymizationReport = createAnonymizationReport(input.documentText.length, redactionSummary);

        // Create audit record with pending status
        const auditId = await db.createAiAudit({
          tenantId: ctx.user.tenantId,
          locationId: ctx.user.locationId || 1,
          auditType: input.auditType,
          documentName: input.documentName || `${input.auditType}_${Date.now()}`,
          status: "processing",
          anonymizationReport,
          requestedById: ctx.user.id,
        });

        // Process with OpenAI
        try {
          const { analyzeCarePlan, analyzeDailyNotes } = await import("./services/openaiService");
          
          let result;
          if (input.auditType === "care_plan") {
            result = await analyzeCarePlan(anonymizedText, tenant.openaiApiKey);
          } else {
            result = await analyzeDailyNotes(anonymizedText, tenant.openaiApiKey);
          }

          // Update audit with results
          await db.updateAiAudit(auditId, {
            status: "completed",
            score: result.score,
            strengths: JSON.stringify(result.strengths),
            areasForImprovement: JSON.stringify(result.areasForImprovement),
            recommendations: JSON.stringify(result.recommendations),
            examples: JSON.stringify(result.examples),
            cqcComplianceNotes: 'cqcComplianceNotes' in result ? result.cqcComplianceNotes : ('professionalismNotes' in result ? result.professionalismNotes : ''),
            processedAt: new Date(),
          });

          return {
            success: true,
            auditId,
            result: {
              score: result.score,
              strengths: result.strengths,
              areasForImprovement: result.areasForImprovement,
              recommendations: result.recommendations,
              examples: result.examples,
              cqcComplianceNotes: 'cqcComplianceNotes' in result ? result.cqcComplianceNotes : ('professionalismNotes' in result ? result.professionalismNotes : ''),
            },
            anonymizationSummary: {
              namesRedacted: redactionSummary.namesRedacted,
              piiRedacted: Object.values(redactionSummary.piiRedacted).reduce((a: number, b: number) => a + b, 0),
            },
          };
        } catch (error) {
          // Update audit with failed status
          await db.updateAiAudit(auditId, {
            status: "failed",
            cqcComplianceNotes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to process document",
          });
        }
      }),

    // Get audit history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        return db.getAiAuditsByTenant(ctx.user.tenantId, input.limit || 50);
      }),

    // Get single audit by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        const audit = await db.getAiAuditById(input.id);
        if (!audit || audit.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Audit not found" });
        }
        return {
          ...audit,
          strengths: audit.strengths ? JSON.parse(audit.strengths) : [],
          areasForImprovement: audit.areasForImprovement ? JSON.parse(audit.areasForImprovement) : [],
          recommendations: audit.recommendations ? JSON.parse(audit.recommendations) : [],
          examples: audit.examples ? JSON.parse(audit.examples) : [],
        };
      }),

    // Generate PDF report for an audit
    generatePDF: protectedProcedure
      .input(z.object({ auditId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        
        const audit = await db.getAiAuditById(input.auditId);
        if (!audit || audit.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Audit not found" });
        }
        
        if (audit.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot generate PDF for incomplete audit" });
        }
        
        const tenant = await db.getTenantById(ctx.user.tenantId);
        const { generateAuditPDF } = await import("./services/pdfService");
        
        const pdfBuffer = await generateAuditPDF({
          auditId: audit.id,
          auditType: audit.auditType as "care_plan" | "daily_notes",
          documentName: audit.documentName || "Unnamed Document",
          score: audit.score || 0,
          strengths: audit.strengths ? JSON.parse(audit.strengths) : [],
          areasForImprovement: audit.areasForImprovement ? JSON.parse(audit.areasForImprovement) : [],
          recommendations: audit.recommendations ? JSON.parse(audit.recommendations) : [],
          cqcComplianceNotes: audit.cqcComplianceNotes || undefined,
          anonymizationReport: audit.anonymizationReport || undefined,
          createdAt: audit.createdAt || new Date(),
          companyName: tenant?.name || undefined,
        });
        
        // Upload PDF to S3
        const filename = `audit-report-${audit.id}-${Date.now()}.pdf`;
        const { url } = await storagePut(`ai-audits/reports/${filename}`, pdfBuffer, "application/pdf");
        
        return { url, filename };
      }),

    // Submit audit from file upload
    submitFromFile: protectedProcedure
      .input(
        z.object({
          auditType: z.enum(["care_plan", "daily_notes"]),
          fileContent: z.string(), // Base64 encoded file content
          fileName: z.string(),
          documentName: z.string().optional(),
          customNames: z.array(z.string()).optional(),
          notifyEmail: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        
        const tenant = await db.getTenantById(ctx.user.tenantId);
        if (!tenant?.openaiApiKey) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "OpenAI API key not configured" });
        }
        
        // Decode base64 file content
        const fileBuffer = Buffer.from(input.fileContent, "base64");
        
        // Validate file size (max 10MB)
        if (fileBuffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "File size exceeds 10MB limit" });
        }
        
        // Extract text from file
        const { extractTextFromFile } = await import("./services/fileExtractionService");
        let documentText: string;
        try {
          documentText = await extractTextFromFile(fileBuffer, input.fileName);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to extract text from file",
          });
        }
        
        if (documentText.length < 100) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Extracted text is too short (minimum 100 characters)" });
        }
        
        // Anonymize the text
        const { anonymizeDocument } = await import("./utils/anonymize");
        const { anonymizedText, redactionSummary } = anonymizeDocument(documentText, { customNames: input.customNames });
        const anonymizationReport = `Names redacted: ${redactionSummary.namesRedacted}, PII redacted: ${Object.values(redactionSummary.piiRedacted).reduce((a: number, b: number) => a + b, 0)}`;
        
        // Create audit record
        const auditId = await db.createAiAudit({
          tenantId: ctx.user.tenantId,
          locationId: ctx.user.locationId || 1,
          auditType: input.auditType,
          documentName: input.documentName || input.fileName,
          status: "processing",
          anonymizationReport,
          requestedById: ctx.user.id,
        });
        
        // Process with OpenAI
        try {
          const { analyzeCarePlan, analyzeDailyNotes } = await import("./services/openaiService");
          
          let result;
          if (input.auditType === "care_plan") {
            result = await analyzeCarePlan(anonymizedText, tenant.openaiApiKey);
          } else {
            result = await analyzeDailyNotes(anonymizedText, tenant.openaiApiKey);
          }
          
          // Update audit with results
          await db.updateAiAudit(auditId, {
            status: "completed",
            score: result.score,
            strengths: JSON.stringify(result.strengths),
            areasForImprovement: JSON.stringify(result.areasForImprovement),
            recommendations: JSON.stringify(result.recommendations),
            examples: JSON.stringify(result.examples),
            cqcComplianceNotes: 'cqcComplianceNotes' in result ? result.cqcComplianceNotes : ('professionalismNotes' in result ? result.professionalismNotes : ''),
            processedAt: new Date(),
          });
          
          // Send email notification if requested
          if (input.notifyEmail) {
            try {
              const { sendAuditCompletionEmail } = await import("./services/emailService");
              await sendAuditCompletionEmail({
                to: input.notifyEmail,
                auditId,
                documentName: input.documentName || input.fileName,
                auditType: input.auditType,
                score: result.score,
                strengths: result.strengths.slice(0, 3),
                areasForImprovement: result.areasForImprovement.slice(0, 3),
                companyName: tenant.name || "Care Compliance System",
              });
            } catch (emailError) {
              console.error("Failed to send email notification:", emailError);
              // Don't throw - email failure shouldn't fail the audit
            }
          }
          
          return {
            success: true,
            auditId,
            result: {
              score: result.score,
              strengths: result.strengths,
              areasForImprovement: result.areasForImprovement,
              recommendations: result.recommendations,
              examples: result.examples,
              cqcComplianceNotes: 'cqcComplianceNotes' in result ? result.cqcComplianceNotes : ('professionalismNotes' in result ? result.professionalismNotes : ''),
            },
            anonymizationSummary: {
              namesRedacted: redactionSummary.namesRedacted,
              piiRedacted: Object.values(redactionSummary.piiRedacted).reduce((a: number, b: number) => a + b, 0),
            },
          };
        } catch (error) {
          await db.updateAiAudit(auditId, {
            status: "failed",
            cqcComplianceNotes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to process document",
          });
        }
      }),
  }),

  // Email Settings Management
  emailSettings: router({
    // Get all email recipients
    getRecipients: superAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return db.getEmailRecipients(ctx.user.tenantId);
    }),

    // Create email recipient
    createRecipient: superAdminProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        recipientType: z.enum(["manager", "cqc_contact", "owner", "external", "other"]).default("other"),
        receiveComplianceAlerts: z.boolean().default(true),
        receiveAuditReminders: z.boolean().default(true),
        receiveIncidentAlerts: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        return db.createEmailRecipient({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),

    // Update email recipient
    updateRecipient: superAdminProcedure
      .input(z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        recipientType: z.enum(["manager", "cqc_contact", "owner", "external", "other"]).optional(),
        isActive: z.boolean().optional(),
        receiveComplianceAlerts: z.boolean().optional(),
        receiveAuditReminders: z.boolean().optional(),
        receiveIncidentAlerts: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        const { id, ...data } = input;
        await db.updateEmailRecipient(id, ctx.user.tenantId, data);
        return { success: true };
      }),

    // Delete email recipient
    deleteRecipient: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        await db.deleteEmailRecipient(input.id, ctx.user.tenantId);
        return { success: true };
      }),

    // Get all email templates
    getTemplates: superAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return db.getEmailTemplates(ctx.user.tenantId);
    }),

    // Create email template
    createTemplate: superAdminProcedure
      .input(z.object({
        templateType: z.enum(["compliance_alert", "audit_reminder", "audit_overdue", "incident_alert", "weekly_summary", "monthly_report"]),
        name: z.string(),
        subject: z.string(),
        bodyHtml: z.string(),
        bodyText: z.string().optional(),
        headerColor: z.string().optional(),
        logoUrl: z.string().optional(),
        footerText: z.string().optional(),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        return db.createEmailTemplate({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),

    // Update email template
    updateTemplate: superAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        bodyHtml: z.string().optional(),
        bodyText: z.string().optional(),
        headerColor: z.string().optional(),
        logoUrl: z.string().optional(),
        footerText: z.string().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        const { id, ...data } = input;
        await db.updateEmailTemplate(id, ctx.user.tenantId, data);
        return { success: true };
      }),

    // Delete email template
    deleteTemplate: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
        }
        await db.deleteEmailTemplate(input.id, ctx.user.tenantId);
        return { success: true };
      }),

    // Initialize default templates
    initializeDefaults: superAdminProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user?.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      await db.createDefaultEmailTemplates(ctx.user.tenantId);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
