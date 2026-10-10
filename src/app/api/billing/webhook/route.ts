import { createHash } from "node:crypto";
import Stripe from "stripe";
import { adminDb } from "@/lib/admin-db";
import {
  planForStripePrice,
  stripeClient,
  type PaidPlanId,
} from "@/lib/stripe";

type StoredStatus =
  "pending" | "active" | "past_due" | "cancelled" | "expired" | "failed";

function mapStatus(status: Stripe.Subscription.Status): StoredStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "cancelled";
  if (status === "unpaid" || status === "incomplete_expired") return "failed";
  return "pending";
}

export async function POST(request: Request) {
  const stripe = stripeClient();
  const admin = adminDb();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !admin || !secret)
    return Response.json({ error: "Billing not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return Response.json({ error: "Missing signature." }, { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  )
    return Response.json({ received: true });

  const subscription = event.data.object as Stripe.Subscription;
  const item = subscription.items.data[0];
  const priceId = item?.price.id || "";
  const planFromPrice = planForStripePrice(priceId);
  const planFromMetadata = subscription.metadata.plan_id;
  const plan: PaidPlanId | null =
    planFromMetadata === "pro" || planFromMetadata === "premium"
      ? planFromMetadata
      : planFromPrice;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  let userId = subscription.metadata.nexo_user_id;

  if (!userId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted))
      userId = (customer as Stripe.Customer).metadata.nexo_user_id;
  }

  if (!userId || !plan || !priceId)
    return Response.json({ error: "Unknown subscription." }, { status: 400 });

  const rawSubscription = subscription as unknown as {
    current_period_end?: number;
    cancel_at?: number | null;
    items: { data: Array<{ current_period_end?: number }> };
  };

  const periodEndSeconds =
    rawSubscription.current_period_end ||
    rawSubscription.items.data[0]?.current_period_end ||
    rawSubscription.cancel_at ||
    Math.floor(Date.now() / 1000);

  const { error } = await admin.rpc("apply_stripe_billing_event", {
    p_id: event.id,
    p_hash: createHash("sha256").update(raw).digest("hex"),
    p_user: userId,
    p_plan: plan,
    p_status: mapStatus(subscription.status),
    p_period_end: new Date(periodEndSeconds * 1000).toISOString(),
    p_customer: customerId,
    p_subscription: subscription.id,
    p_price: priceId,
    p_created_at: new Date(event.created * 1000).toISOString(),
  });

  if (error)
    return Response.json({ error: "Event rejected." }, { status: 400 });

  return Response.json({ received: true });
}
