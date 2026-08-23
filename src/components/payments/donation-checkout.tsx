import { useCallback, useMemo } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import type { DonationFrequency } from "@/lib/donation";
import { createDonationCheckout } from "@/utils/payments.functions";

type DonationCheckoutProps = {
  amountInCents: number;
  frequency: DonationFrequency;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl: string;
};

export function DonationCheckout({
  amountInCents,
  frequency,
  customerEmail,
  userId,
  returnUrl,
}: DonationCheckoutProps) {
  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const result = await createDonationCheckout({
      data: {
        amountInCents,
        frequency,
        customerEmail,
        userId,
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not be started. Please try again.");
    return result.clientSecret;
  }, [amountInCents, frequency, customerEmail, userId, returnUrl]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 sm:p-4">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
