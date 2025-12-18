import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
// @ts-ignore
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { tenantSubscriptions, userLicenses, users } from "../drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { calculateTotalPrice, calculatePricePerLicense, formatPrice, PRICING_CONFIG } from "./stripe/products";
import { checkExpiringSubscriptions } from "./services/licenseExpirationService";

// Initialize Stripe only if credentials are available
let stripe: Stripe | null = null;
try {
  if (ENV.STRIPE_SECRET_KEY && 
      ENV.STRIPE_SECRET_KEY !== 'not-configured' && 
      ENV.STRIPE_SECRET_KEY !== 'your-stripe-secret-key-here' &&
      ENV.STRIPE_SECRET_KEY.startsWith('sk_')) {
    stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
      // @ts-ignore - API version mismatch with types
      apiVersion: "2025-01-27.acacia",
    });
    console.log('[STRIPE] ✅ Initialized successfully');
  } else {
    console.log('[STRIPE] ⚠️  Skipped - credentials not configured (subscription features disabled)');
  }
} catch (error) {
  console.error('[STRIPE] ❌ Initialization failed:', error);
  stripe = null;
}

// Helper to get database connection
async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

// Helper to get or create Stripe customer
async function getOrCreateStripeCustomer(tenantId: number, email: string, name: string): Promise<string> {
  if (!stripe) {
    throw new TRPCError({ 
      code: "PRECONDITION_FAILED", 
      message: "Stripe is not configured. Please contact support to enable subscription features." 
    });
  }
  
  const db = await requireDb();
  
  const [subscription] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId));

  if (subscription?.stripeCustomerId) {
    // Verify the customer still exists in Stripe
    try {
      await stripe.customers.retrieve(subscription.stripeCustomerId);
      return subscription.stripeCustomerId;
    } catch (error: any) {
      // Customer doesn't exist in Stripe (maybe different Stripe account)
      // Create a new customer
      console.log(`[Stripe] Customer ${subscription.stripeCustomerId} not found, creating new one`);
      const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: { tenantId: tenantId.toString() },
      });
      await db
        .update(tenantSubscriptions)
        .set({ stripeCustomerId: newCustomer.id })
        .where(eq(tenantSubscriptions.tenantId, tenantId));
      return newCustomer.id;
    }
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { tenantId: tenantId.toString() },
  });

  if (subscription) {
    await db
      .update(tenantSubscriptions)
      .set({ stripeCustomerId: customer.id })
      .where(eq(tenantSubscriptions.tenantId, tenantId));
  } else {
    await db.insert(tenantSubscriptions).values({
      tenantId,
      stripeCustomerId: customer.id,
      status: "incomplete",
      licensesCount: 0,
    });
  }

  return customer.id;
}

// Start free trial for a tenant (called during signup)
export async function startFreeTrial(tenantId: number): Promise<void> {
  const db = await requireDb();
  const trialEndsAtDate = new Date();
  trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 30); // 30 days trial
  const trialEndsAt = trialEndsAtDate.toISOString();

  // Check if subscription already exists
  const [existing] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
  
  if (existing) {
    // Update existing to trial
    await db.update(tenantSubscriptions).set({
      isTrial: 1,
      trialEndsAt,
      trialLicensesCount: 5,
      licensesCount: 5,
      status: "trialing",
    }).where(eq(tenantSubscriptions.tenantId, tenantId));
  } else {
    // Create new trial subscription
    await db.insert(tenantSubscriptions).values({
      tenantId,
      isTrial: 1,
      trialEndsAt,
      trialLicensesCount: 5,
      licensesCount: 5,
      status: "trialing",
    });
  }

  // Create 5 unassigned trial licenses
  const licenseValues = Array.from({ length: 5 }, () => ({
    tenantId,
    isActive: 1,
  }));
  await db.insert(userLicenses).values(licenseValues);
}

export const subscriptionRouter = router({
  // Get trial status for current tenant
  getTrialStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) return null;
    const db = await requireDb();

    const [subscription] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

    if (!subscription || !subscription.isTrial) return null;

    const now = new Date();
    const trialEndsAt = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const isExpired = trialEndsAt ? now > trialEndsAt : false;

    return {
      isTrial: subscription.isTrial,
      trialEndsAt: subscription.trialEndsAt,
      trialLicensesCount: subscription.trialLicensesCount,
      daysRemaining,
      isExpired,
    };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    }
    const db = await requireDb();

    const [subscription] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

    if (!subscription) return null;

    const [licenseStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        assigned: sql<number>`SUM(CASE WHEN ${userLicenses.userId} IS NOT NULL THEN 1 ELSE 0 END)`,
        unassigned: sql<number>`SUM(CASE WHEN ${userLicenses.userId} IS NULL THEN 1 ELSE 0 END)`,
      })
      .from(userLicenses)
      .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.isActive, 1)));

    return {
      ...subscription,
      licenseStats: {
        total: Number(licenseStats?.total || 0),
        assigned: Number(licenseStats?.assigned || 0),
        unassigned: Number(licenseStats?.unassigned || 0),
      },
    };
  }),

  getPricing: protectedProcedure
    .input(z.object({ quantity: z.number().min(1), billingInterval: z.enum(["monthly", "annual"]) }))
    .query(({ input }) => {
      const pricing = calculateTotalPrice(input.quantity, input.billingInterval);
      return {
        ...pricing,
        pricePerLicenseFormatted: formatPrice(pricing.pricePerLicense),
        totalMonthlyFormatted: formatPrice(pricing.totalMonthly),
        totalBillingFormatted: formatPrice(pricing.totalBilling),
        savingsFormatted: formatPrice(pricing.savings),
        basePriceFormatted: formatPrice(PRICING_CONFIG.basePricePerLicense),
        tiers: PRICING_CONFIG.tiers,
      };
    }),

  createCheckoutSession: adminProcedure
    .input(z.object({ quantity: z.number().min(1), billingInterval: z.enum(["monthly", "annual"]) }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Subscription features are not available. Stripe is not configured." 
        });
      }
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });

      const customerId = await getOrCreateStripeCustomer(ctx.user.tenantId, ctx.user.email, ctx.user.name || "Care Compliance Customer");
      
      // Calculate the correct unit amount for Stripe
      // For monthly: price per license per month
      // For annual: price per license per month × 12 (annual total)
      const monthlyPricePerLicense = calculatePricePerLicense(input.quantity, input.billingInterval);
      const interval = input.billingInterval === "annual" ? "year" : "month";
      
      // For annual billing, multiply by 12 to get the yearly amount per license
      const unitAmount = input.billingInterval === "annual" 
        ? monthlyPricePerLicense * 12 
        : monthlyPricePerLicense;

      const price = await stripe.prices.create({
        currency: PRICING_CONFIG.currency,
        unit_amount: unitAmount,
        recurring: { interval },
        product_data: {
          name: `Care Compliance License (${input.quantity} ${input.quantity === 1 ? 'license' : 'licenses'})`,
          metadata: { tenantId: ctx.user.tenantId.toString(), quantity: input.quantity.toString(), billingInterval: input.billingInterval },
        },
      });

      const origin = ctx.req.headers.origin || "https://care-compliance.manus.space";

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        allow_promotion_codes: true,
        line_items: [{ price: price.id, quantity: input.quantity }],
        success_url: `${origin}/admin/subscription?success=true`,
        cancel_url: `${origin}/admin/subscription?canceled=true`,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          tenant_id: ctx.user.tenantId.toString(),
          customer_email: ctx.user.email,
          customer_name: ctx.user.name || "",
          quantity: input.quantity.toString(),
          billing_interval: input.billingInterval,
        },
      });

      return { url: session.url };
    }),

  addLicenses: adminProcedure
    .input(z.object({ additionalLicenses: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Stripe is not configured. Please contact support to enable subscription features." 
        });
      }

      const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
      if (!subscription?.stripeSubscriptionId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });

      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      const currentQuantity = stripeSubscription.items.data[0]?.quantity || 0;
      const newQuantity = currentQuantity + input.additionalLicenses;

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{ id: stripeSubscription.items.data[0].id, quantity: newQuantity }],
        proration_behavior: "create_prorations",
      });

      const newLicenses = Array.from({ length: input.additionalLicenses }, () => ({ tenantId: ctx.user.tenantId!, isActive: 1 }));
      await db.insert(userLicenses).values(newLicenses);
      await db.update(tenantSubscriptions).set({ licensesCount: newQuantity }).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

      return { success: true, newQuantity };
    }),

  // Modify license count (upgrade or downgrade)
  modifyLicenseCount: adminProcedure
    .input(z.object({ newQuantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
      if (!subscription?.stripeSubscriptionId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });

      // Get current license stats
      const [licenseStats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          assigned: sql<number>`SUM(CASE WHEN ${userLicenses.userId} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(userLicenses)
        .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.isActive, 1)));

      const currentTotal = Number(licenseStats?.total || 0);
      const assignedCount = Number(licenseStats?.assigned || 0);

      // Validate downgrade doesn't remove assigned licenses
      if (input.newQuantity < assignedCount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reduce to ${input.newQuantity} licenses. You have ${assignedCount} licenses currently assigned to users. Please unassign some licenses first.`
        });
      }

      // Update Stripe subscription
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Stripe is not configured. Please contact support to enable subscription features." 
        });
      }
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{ id: stripeSubscription.items.data[0].id, quantity: input.newQuantity }],
        proration_behavior: "create_prorations",
      });

      // Handle license records
      if (input.newQuantity > currentTotal) {
        // Upgrading: add new licenses
        const licensesToAdd = input.newQuantity - currentTotal;
        const newLicenses = Array.from({ length: licensesToAdd }, () => ({ tenantId: ctx.user.tenantId!, isActive: 1 }));
        await db.insert(userLicenses).values(newLicenses);
      } else if (input.newQuantity < currentTotal) {
        // Downgrading: remove unassigned licenses
        const licensesToRemove = currentTotal - input.newQuantity;
        const unassignedLicenses = await db
          .select({ id: userLicenses.id })
          .from(userLicenses)
          .where(and(
            eq(userLicenses.tenantId, ctx.user.tenantId),
            eq(userLicenses.isActive, 1),
            isNull(userLicenses.userId)
          ))
          .limit(licensesToRemove);

        for (const license of unassignedLicenses) {
          await db.update(userLicenses)
            .set({ isActive: 0 })
            .where(eq(userLicenses.id, license.id));
        }
      }

      // Update subscription record
      await db.update(tenantSubscriptions)
        .set({ licensesCount: input.newQuantity })
        .where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

      return { 
        success: true, 
        previousQuantity: currentTotal,
        newQuantity: input.newQuantity,
        change: input.newQuantity - currentTotal
      };
    }),

  // Preview price change for modifying license count
  previewPriceChange: adminProcedure
    .input(z.object({ newQuantity: z.number().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
      if (!subscription?.stripeSubscriptionId) {
        return { available: false, message: "No active subscription" };
      }

      // Get current license stats
      const [licenseStats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          assigned: sql<number>`SUM(CASE WHEN ${userLicenses.userId} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(userLicenses)
        .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.isActive, 1)));

      const currentTotal = Number(licenseStats?.total || 0);
      const assignedCount = Number(licenseStats?.assigned || 0);

      // Check if downgrade is valid
      if (input.newQuantity < assignedCount) {
        return {
          available: false,
          message: `Cannot reduce to ${input.newQuantity} licenses. ${assignedCount} are currently assigned.`,
          currentQuantity: currentTotal,
          assignedCount,
        };
      }

      try {
        // Get Stripe preview
        // @ts-ignore - Stripe types mismatch
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId) as any;
        const currentPriceId = stripeSubscription.items.data[0]?.price?.id;
        
        if (!currentPriceId) {
          return { available: false, message: "Unable to retrieve current pricing" };
        }

        // Create invoice preview
        if (!stripe) {
          return { available: false, message: "Stripe is not configured" };
        }
        const preview = await stripe.invoices.createPreview({
          customer: subscription.stripeCustomerId!,
          subscription: subscription.stripeSubscriptionId,
          subscription_details: {
            items: [{
              id: stripeSubscription.items.data[0].id,
              quantity: input.newQuantity,
            }],
            proration_behavior: "create_prorations",
          },
        });

        const change = input.newQuantity - currentTotal;
        const isUpgrade = change > 0;

        return {
          available: true,
          currentQuantity: currentTotal,
          newQuantity: input.newQuantity,
          change,
          isUpgrade,
          assignedCount,
          proratedAmount: preview.amount_due,
          proratedAmountFormatted: `£${(preview.amount_due / 100).toFixed(2)}`,
          nextBillingDate: stripeSubscription.current_period_end * 1000,
        };
      } catch (error: any) {
        console.error("Error previewing price change:", error);
        return {
          available: false,
          message: "Unable to preview price change",
          currentQuantity: currentTotal,
          assignedCount,
        };
      }
    }),

  cancelSubscription: adminProcedure
    .input(z.object({ cancelImmediately: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Subscription features are not available. Stripe is not configured." 
        });
      }
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Subscription features are not available. Stripe is not configured." 
        });
      }
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
      if (!subscription?.stripeSubscriptionId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });

      if (input.cancelImmediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true });
      }

      await db.update(tenantSubscriptions).set({
        cancelAtPeriodEnd: input.cancelImmediately ? 0 : 1,
        canceledAt: input.cancelImmediately ? new Date().toISOString() : null,
        status: input.cancelImmediately ? "canceled" : subscription.status,
      }).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

      return { success: true };
    }),

  reactivateSubscription: adminProcedure.mutation(async ({ ctx }) => {
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Subscription features are not available. Stripe is not configured." 
        });
      }
      if (!stripe) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Subscription features are not available. Stripe is not configured." 
        });
      }
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    const db = await requireDb();

    const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
    if (!subscription?.stripeSubscriptionId) throw new TRPCError({ code: "BAD_REQUEST", message: "No subscription found" });

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: false });
    await db.update(tenantSubscriptions).set({ cancelAtPeriodEnd: 0 }).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));

    return { success: true };
  }),

  getLicenses: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    const db = await requireDb();

    return db
      .select({
        id: userLicenses.id,
        userId: userLicenses.userId,
        assignedAt: userLicenses.assignedAt,
        isActive: userLicenses.isActive,
        userName: users.name,
        userEmail: users.email,
      })
      .from(userLicenses)
      .leftJoin(users, eq(userLicenses.userId, users.id))
      .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.isActive, 1)));
  }),

  assignLicense: adminProcedure
    .input(z.object({ licenseId: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      const [existingLicense] = await db.select().from(userLicenses)
        .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.userId, input.userId), eq(userLicenses.isActive, 1)));
      if (existingLicense) throw new TRPCError({ code: "BAD_REQUEST", message: "User already has a license assigned" });

      const [license] = await db.select().from(userLicenses)
        .where(and(eq(userLicenses.id, input.licenseId), eq(userLicenses.tenantId, ctx.user.tenantId), isNull(userLicenses.userId), eq(userLicenses.isActive, 1)));
      if (!license) throw new TRPCError({ code: "BAD_REQUEST", message: "License not available" });

      await db.update(userLicenses).set({ userId: input.userId, assignedAt: new Date().toISOString(), assignedById: ctx.user.id }).where(eq(userLicenses.id, input.licenseId));
      return { success: true };
    }),

  unassignLicense: adminProcedure
    .input(z.object({ licenseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      await db.update(userLicenses).set({ userId: null, assignedAt: null, assignedById: null })
        .where(and(eq(userLicenses.id, input.licenseId), eq(userLicenses.tenantId, ctx.user.tenantId)));
      return { success: true };
    }),

  checkUserLicense: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) return { hasLicense: false, reason: "No company associated" };
    if (ctx.user.role === "admin" || ctx.user.superAdmin === 1) return { hasLicense: true, reason: "Admin access" };
    
    const db = await requireDb();
    const [license] = await db.select().from(userLicenses)
      .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.userId, ctx.user.id), eq(userLicenses.isActive, 1)));

    if (license) return { hasLicense: true, reason: "License assigned" };
    return { hasLicense: false, reason: "No license assigned. Please contact your administrator to assign a license to your account." };
  }),

  getUsersWithoutLicenses: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    const db = await requireDb();

    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users).where(eq(users.tenantId, ctx.user.tenantId));

    const usersWithLicenses = await db.select({ userId: userLicenses.userId }).from(userLicenses)
      .where(and(eq(userLicenses.tenantId, ctx.user.tenantId), eq(userLicenses.isActive, 1), sql`${userLicenses.userId} IS NOT NULL`));

    const licensedUserIds = new Set(usersWithLicenses.map((l: { userId: number | null }) => l.userId));
    return allUsers.filter((u: { id: number; role: string | null }) => !licensedUserIds.has(u.id) && u.role !== "admin");
  }),

  getBillingPortalUrl: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    const db = await requireDb();

    const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
    if (!subscription?.stripeCustomerId) throw new TRPCError({ code: "BAD_REQUEST", message: "No customer found" });

    if (!stripe) {
      throw new TRPCError({ 
        code: "PRECONDITION_FAILED", 
        message: "Stripe is not configured. Please contact support to enable subscription features." 
      });
    }
    const origin = ctx.req.headers.origin || "https://care-compliance.manus.space";
    const session = await stripe.billingPortal.sessions.create({ customer: subscription.stripeCustomerId, return_url: `${origin}/admin/subscription` });
    return { url: session.url };
  }),

  // Get billing history (invoices)
  getBillingHistory: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
    const db = await requireDb();

    const [subscription] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, ctx.user.tenantId));
    if (!subscription?.stripeCustomerId) return [];

    if (!stripe) return [];
    
    try {
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 24,
      });

      return invoices.data.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        date: invoice.created * 1000,
        dueDate: invoice.due_date ? invoice.due_date * 1000 : null,
        amount: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
        description: invoice.description || `Invoice ${invoice.number}`,
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  }),

  // Assign license to user by user ID (finds available license automatically)
  assignLicenseToUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      // Check if user already has a license
      const [existingLicense] = await db.select().from(userLicenses)
        .where(and(
          eq(userLicenses.tenantId, ctx.user.tenantId),
          eq(userLicenses.userId, input.userId),
          eq(userLicenses.isActive, 1)
        ));
      if (existingLicense) throw new TRPCError({ code: "BAD_REQUEST", message: "User already has a license assigned" });

      // Find an available unassigned license
      const [availableLicense] = await db.select().from(userLicenses)
        .where(and(
          eq(userLicenses.tenantId, ctx.user.tenantId),
          isNull(userLicenses.userId),
          eq(userLicenses.isActive, 1)
        ));
      if (!availableLicense) throw new TRPCError({ code: "BAD_REQUEST", message: "No available licenses. Please purchase more licenses." });

      // Assign the license
      await db.update(userLicenses)
        .set({ userId: input.userId, assignedAt: new Date().toISOString(), assignedById: ctx.user.id })
        .where(eq(userLicenses.id, availableLicense.id));

      return { success: true, licenseId: availableLicense.id };
    }),

  // Unassign license from user by user ID
  unassignLicenseFromUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const db = await requireDb();

      // Find the user's license
      const [license] = await db.select().from(userLicenses)
        .where(and(
          eq(userLicenses.tenantId, ctx.user.tenantId),
          eq(userLicenses.userId, input.userId),
          eq(userLicenses.isActive, 1)
        ));
      if (!license) throw new TRPCError({ code: "BAD_REQUEST", message: "User does not have a license assigned" });

      // Unassign the license
      await db.update(userLicenses)
        .set({ userId: null, assignedAt: null, assignedById: null })
        .where(eq(userLicenses.id, license.id));

      return { success: true };
    }),

  // Trigger license expiration check (for admin/system use)
  triggerExpirationCheck: adminProcedure.mutation(async () => {
    await checkExpiringSubscriptions();
    return { success: true, message: "Expiration check completed" };
  }),
});
