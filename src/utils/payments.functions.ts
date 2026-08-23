import { createServerFn } from "@tanstack/react-start";

import { validateDonation, type DonationInput } from "@/lib/donation";
import type { StripeEnv } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

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

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: DonationInput) => validateDonation(data))
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    const { createDonationSession } = await import("@/lib/donation.server");
    return createDonationSession(data);
  });

export const getDonationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_[a-zA-Z0-9_]+$/.test(data.sessionId)) throw new Error("Invalid session id");
    return data;
  })
  .handler(async ({ data }): Promise<DonationStatusResult> => {
    const { fetchDonationStatus } = await import("@/lib/donation.server");
    return fetchDonationStatus(data.sessionId, data.environment);
  });
