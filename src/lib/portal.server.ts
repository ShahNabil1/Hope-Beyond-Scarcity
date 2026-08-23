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

export type RecurringInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  createdIso: string | null;
  paidIso: string | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
};

export type RecurringDetail = {
  nextPaymentIso: string | null;
  nextAmountCents: number | null;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoices: RecurringInvoice[];
  openInvoice: { id: string; hostedInvoiceUrl: string | null; amountCents: number } | null;
  status: string;
};

function mapInvoice(inv: any): RecurringInvoice {
  return {
    id: inv.id ?? "",
    amountCents: inv.amount_due ?? inv.total ?? 0,
    currency: inv.currency ?? "cad",
    status: inv.status ?? "unknown",
    createdIso: inv.created ? new Date(inv.created * 1000).toISOString() : null,
    paidIso: inv.status_transitions?.paid_at
      ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
      : null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
  };
}

/** Billing timeline for one recurring gift: past charges, next charge, saved card. */
export async function getRecurringTimeline(options: {
  environment: StripeEnv;
  stripeSubscriptionId: string;
}): Promise<RecurringDetail | { error: string }> {
  try {
    const stripe = createStripeClient(options.environment);
    const subscription = (await stripe.subscriptions.retrieve(options.stripeSubscriptionId, {
      expand: ["default_payment_method", "customer.invoice_settings.default_payment_method"],
    })) as any;

    const item = subscription.items?.data?.[0];
    const periodEnd = item?.current_period_end ?? subscription.current_period_end;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

    const list = await stripe.invoices.list({
      subscription: options.stripeSubscriptionId,
      limit: 24,
    });
    const invoices = list.data.map(mapInvoice);

    const pm: any =
      subscription.default_payment_method ??
      (typeof subscription.customer === "object"
        ? subscription.customer?.invoice_settings?.default_payment_method
        : null);

    let card = pm?.card
      ? {
          brand: pm.card.brand as string,
          last4: pm.card.last4 as string,
          expMonth: pm.card.exp_month as number,
          expYear: pm.card.exp_year as number,
        }
      : null;

    if (!card && customerId) {
      const methods = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
      const first: any = methods.data[0];
      if (first?.card) {
        card = {
          brand: first.card.brand,
          last4: first.card.last4,
          expMonth: first.card.exp_month,
          expYear: first.card.exp_year,
        };
      }
    }

    const unpaid = list.data.find(
      (inv: any) => inv.status === "open" || inv.status === "uncollectible",
    ) as any;

    return {
      status: subscription.status,
      nextPaymentIso:
        subscription.cancel_at_period_end || !periodEnd
          ? null
          : new Date(periodEnd * 1000).toISOString(),
      nextAmountCents: item?.price?.unit_amount ?? null,
      card,
      invoices,
      openInvoice: unpaid
        ? {
            id: unpaid.id,
            hostedInvoiceUrl: unpaid.hosted_invoice_url ?? null,
            amountCents: unpaid.amount_due ?? 0,
          }
        : null,
    };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}

/** Retry the newest unpaid invoice on a recurring gift. */
export async function retryLatestInvoice(options: {
  environment: StripeEnv;
  stripeSubscriptionId: string;
}): Promise<{ ok: true; status: string } | { error: string; hostedInvoiceUrl?: string }> {
  try {
    const stripe = createStripeClient(options.environment);
    const list = await stripe.invoices.list({
      subscription: options.stripeSubscriptionId,
      limit: 5,
    });
    const open = list.data.find((inv: any) => inv.status === "open") as any;
    if (!open?.id) return { error: "There is no unpaid charge to retry right now." };

    const paid = await stripe.invoices.pay(open.id);
    return { ok: true, status: paid.status ?? "unknown" };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}
