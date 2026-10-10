import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export type PaidPlanId = "pro" | "premium";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { maxNetworkRetries: 2 });
  return client;
}

export function stripePriceFor(plan: PaidPlanId) {
  return plan === "pro"
    ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID || null
    : process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || null;
}

export function planForStripePrice(price: string): PaidPlanId | null {
  if (price && price === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) return "pro";
  if (price && price === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID)
    return "premium";
  return null;
}

export function stripeBillingReady() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID &&
    process.env.SUPABASE_SECRET_KEY,
  );
}
