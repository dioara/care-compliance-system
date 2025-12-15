import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./auth";
import { rolesRouter } from "./roles";
import * as db from "./db";
import { storagePut } from "./storage";
import { sendComplianceAlertEmail, sendComplianceAlertToRecipients } from "./_core/email";

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
        const responseId = await db.saveAuditResponse(input);
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
      .mutation(async ({ input }) => {
        await db.updateIncident(input.id, input.data as any);
        return { success: true };
      }),

    // Log notification
    logNotification: protectedProcedure
      .input(z.object({
        id: z.number(),
        notificationType: z.enum(['cqc', 'council', 'ico', 'police', 'family']),
        details: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateIncidentNotification(input.id, input.notificationType, input.details);
        return { success: true };
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
