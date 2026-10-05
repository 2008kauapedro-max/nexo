export type BillingState =
  "pending" | "active" | "past_due" | "cancelled" | "expired" | "failed";
export interface Subscription {
  status: BillingState;
  plan: string;
  periodEnd: string;
}
export function effectivePlan(
  subscription: Subscription | null,
  now = new Date(),
) {
  return subscription &&
    ["active", "cancelled"].includes(subscription.status) &&
    new Date(subscription.periodEnd) > now
    ? subscription.plan
    : "free";
}
export interface BillingProvider {
  checkout(userId: string, priceId: string): Promise<{ url: string }>;
  cancel(subscriptionId: string): Promise<void>;
  verifyWebhook(
    body: string,
    signature: string,
  ): Promise<{ id: string; subscription: Subscription }>;
}
