import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import {
  DONATION_CURRENCY_STRIPE,
  validateDonation,
  type DonationInput,
} from "@/lib/donation";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    const hit = found.data[0];
    if (hit) return hit.id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export async function createDonationSession(
  data: DonationInput,
): Promise<{ clientSecret: string } | { error: string }> {
  try {
    // Re-validate on the server: the amount charged is always the exact
    // integer CAD cent amount that passed validation.
    validateDonation(data);
    const stripe = createStripeClient(data.environment);
    const isMonthly = data.frequency === "monthly";

    const customerId =
      data.customerEmail || data.userId
        ? await resolveOrCreateCustomer(stripe, {
            email: data.customerEmail,
            userId: data.userId,
          })
        : undefined;

    const productName = isMonthly
      ? "Monthly Donation — Hope Beyond Scarcity"
      : "One-Time Donation — Hope Beyond Scarcity";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: DONATION_CURRENCY_STRIPE,
            product_data: { name: productName },
            unit_amount: data.amountInCents,
            ...(isMonthly && { recurring: { interval: "month" as const } }),
          },
          quantity: 1,
        },
      ],
      mode: isMonthly ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      ...(customerId
        ? { customer: customerId }
        : data.customerEmail
          ? { customer_email: data.customerEmail }
          : {}),
      ...(!isMonthly && { payment_intent_data: { description: productName } }),
      metadata: {
        donation_type: data.frequency,
        ...(data.userId && { userId: data.userId }),
      },
      ...(isMonthly && {
        subscription_data: {
          metadata: {
            donation_type: "monthly",
            ...(data.userId && { userId: data.userId }),
          },
        },
      }),
    });

    return { clientSecret: session.client_secret ?? "" };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}

export async function fetchDonationStatus(sessionId: string, environment: StripeEnv) {
  try {
    const stripe = createStripeClient(environment);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Fallback: if the Stripe webhook has not (yet) recorded this donation or
    // sent the receipt, do it here so the donor always gets their PDF receipt.
    if (session.payment_status && session.payment_status !== "unpaid") {
      try {
        const { recordDonationFromSession } = await import("@/lib/donation-record.server");
        await recordDonationFromSession(session, environment, "paid");
      } catch (e) {
        console.error("Receipt fallback failed:", e);
      }
    }

    return {
      status: session.status ?? "unknown",
      paymentStatus: session.payment_status ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      email: session.customer_details?.email ?? null,
      mode: session.mode ?? null,
    };
  } catch (error) {
    return { error: getStripeErrorMessage(error) };
  }
}
