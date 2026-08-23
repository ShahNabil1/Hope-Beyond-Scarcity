import { createServerFn } from "@tanstack/react-start";

import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

type DonationInput = {
  amountInCents: number;
  frequency: "one_time" | "monthly";
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
};

function validateDonation(data: DonationInput): DonationInput {
  if (!Number.isInteger(data.amountInCents) || data.amountInCents < 500) {
    throw new Error("Minimum donation is $5.00 CAD");
  }
  if (data.amountInCents > 10_000_000) {
    throw new Error("For gifts above $100,000 CAD please contact us directly");
  }
  if (data.frequency !== "one_time" && data.frequency !== "monthly") {
    throw new Error("Invalid donation frequency");
  }
  if (data.frequency === "monthly" && !data.userId) {
    throw new Error("Monthly giving requires an account");
  }
  if (data.userId && !/^[a-zA-Z0-9_-]+$/.test(data.userId)) {
    throw new Error("Invalid userId");
  }
  if (data.customerEmail && data.customerEmail.length > 255) {
    throw new Error("Invalid email");
  }
  if (!data.returnUrl.startsWith("http")) {
    throw new Error("Invalid return URL");
  }
  return data;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
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

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator(validateDonation)
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
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
              currency: "cad",
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
        ...(!isMonthly && {
          payment_intent_data: { description: productName },
        }),
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
  });

type DonationStatusResult =
  | {
      status: string;
      paymentStatus: string | null;
      amountTotal: number | null;
      currency: string | null;
      email: string | null;
      mode: string | null;
    }
  | { error: string };

export const getDonationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid session id");
    return data;
  })
  .handler(async ({ data }): Promise<DonationStatusResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
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
  });
