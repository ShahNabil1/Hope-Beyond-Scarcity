import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

/** Change the monthly amount on an existing recurring donation. */
export async function changeRecurringAmount(options: {
  environment: StripeEnv;
  stripeSubscriptionId: string;
  amountInCents: number;
}): Promise<{ ok: true; amountInCents: number } | { error: string }> {
  try {
    const stripe = createStripeClient(options.environment);
    const subscription = await stripe.subscriptions.retrieve(options.stripeSubscriptionId);
    const item = subscription.items.data[0];
    if (!item) return { error: "This recurring gift has no billable item." };

    const productId =
      typeof item.price.product === "string" ? item.price.product : item.price.product.id;

    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: options.amountInCents,
      recurring: { interval: "month" },
      product: productId,
    });

    await stripe.subscriptions.update(options.stripeSubscriptionId, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: "none",
      metadata: { ...subscription.metadata, donation_type: "monthly" },
    });

    return { ok: true, amountInCents: options.amountInCents };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}

/** Cancel a recurring donation at the end of the paid period, or resume it. */
export async function setRecurringCancellation(options: {
  environment: StripeEnv;
  stripeSubscriptionId: string;
  cancelAtPeriodEnd: boolean;
}): Promise<{ ok: true; cancelAtPeriodEnd: boolean } | { error: string }> {
  try {
    const stripe = createStripeClient(options.environment);
    await stripe.subscriptions.update(options.stripeSubscriptionId, {
      cancel_at_period_end: options.cancelAtPeriodEnd,
    });
    return { ok: true, cancelAtPeriodEnd: options.cancelAtPeriodEnd };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}

/** Stripe-hosted billing portal for payment-method management. */
export async function createBillingPortalUrl(options: {
  environment: StripeEnv;
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    const stripe = createStripeClient(options.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: options.stripeCustomerId,
      return_url: options.returnUrl,
    });
    return { url: portal.url };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}
