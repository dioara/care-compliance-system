import { Router, raw } from "express";
// @ts-ignore
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { tenantSubscriptions, userLicenses } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe only if credentials are available
let stripe: Stripe | null = null;
try {
  if (ENV.STRIPE_SECRET_KEY && ENV.STRIPE_SECRET_KEY !== 'your-stripe-secret-key-here') {
    stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
      // @ts-ignore - API version mismatch with types
      apiVersion: "2025-01-27.acacia",
    });
  }
} catch (error) {
  console.error('[STRIPE WEBHOOK] Initialization failed:', error);
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post("/webhook", raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    console.log('[STRIPE WEBHOOK] Skipped - Stripe not configured');
    return res.status(200).send('Stripe not configured');
  }
  
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = parseInt(session.metadata?.tenant_id || "0");
  const quantity = parseInt(session.metadata?.quantity || "0");
  const billingInterval = session.metadata?.billing_interval as "monthly" | "annual" || "monthly";

  if (!tenantId || !quantity) {
    console.error("[Stripe Webhook] Missing tenant_id or quantity in checkout session metadata");
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for tenant ${tenantId}: ${quantity} licenses (${billingInterval})`);
  const db = await requireDb();

  // Clear trial status and activate subscription
  await db.update(tenantSubscriptions).set({
    stripeSubscriptionId: session.subscription as string,
    status: "active",
    licensesCount: quantity,
    billingInterval,
    isTrial: 0, // Clear trial flag
    trialEndsAt: null, // Clear trial end date
  }).where(eq(tenantSubscriptions.tenantId, tenantId));

  // Deactivate any existing trial licenses first
  await db.update(userLicenses).set({ 
    isActive: 0, 
    deactivatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') 
  }).where(eq(userLicenses.tenantId, tenantId));

  // Create new paid licenses
  const licenses = Array.from({ length: quantity }, () => ({ tenantId, isActive: 1 }));
  await db.insert(userLicenses).values(licenses);
  console.log(`[Stripe Webhook] Created ${quantity} paid license records for tenant ${tenantId}, trial cleared`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await requireDb();
  const [tenantSub] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.stripeCustomerId, subscription.customer as string));

  if (!tenantSub) {
    console.error("[Stripe Webhook] No tenant found for customer:", subscription.customer);
    return;
  }

  const quantity = subscription.items.data[0]?.quantity || 0;
  const status = mapStripeStatus(subscription.status);

  // Type assertion: Stripe API has these properties but TypeScript definitions may be incomplete
  const sub = subscription as any;
  
  await db.update(tenantSubscriptions).set({
    stripeSubscriptionId: subscription.id,
    status,
    licensesCount: quantity,
    currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString().slice(0, 19).replace('T', ' '),
    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString().slice(0, 19).replace('T', ' '),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString().slice(0, 19).replace('T', ' ') : null,
  }).where(eq(tenantSubscriptions.tenantId, tenantSub.tenantId));

  console.log(`[Stripe Webhook] Updated subscription for tenant ${tenantSub.tenantId}: status=${status}, licenses=${quantity}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await requireDb();
  const [tenantSub] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.stripeCustomerId, subscription.customer as string));

  if (!tenantSub) {
    console.error("[Stripe Webhook] No tenant found for customer:", subscription.customer);
    return;
  }

  await db.update(tenantSubscriptions).set({ status: "canceled", canceledAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }).where(eq(tenantSubscriptions.tenantId, tenantSub.tenantId));
  await db.update(userLicenses).set({ isActive: 0, deactivatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }).where(eq(userLicenses.tenantId, tenantSub.tenantId));
  console.log(`[Stripe Webhook] Subscription canceled for tenant ${tenantSub.tenantId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Type assertion: Stripe API has subscription property but TypeScript definitions may be incomplete
  const inv = invoice as any;
  if (!inv.subscription || !stripe) return;
  const subscription = await stripe.subscriptions.retrieve(inv.subscription as string);
  const db = await requireDb();
  const [tenantSub] = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.stripeCustomerId, subscription.customer as string));
  if (!tenantSub) return;

  await db.update(tenantSubscriptions).set({ status: "past_due" }).where(eq(tenantSubscriptions.tenantId, tenantSub.tenantId));
  console.log(`[Stripe Webhook] Payment failed for tenant ${tenantSub.tenantId}`);
}

function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "canceled" | "unpaid" | "trialing" | "incomplete" {
  switch (status) {
    case "active": return "active";
    case "past_due": return "past_due";
    case "canceled": return "canceled";
    case "unpaid": return "unpaid";
    case "trialing": return "trialing";
    default: return "incomplete";
  }
}
