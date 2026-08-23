import { useCallback, useMemo, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { AlertCircle } from "lucide-react";

import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { DONATION_CURRENCY, type DonationFrequency } from "@/lib/donation";
import { createDonationCheckout } from "@/utils/payments.functions";

type DonationCheckoutProps = {
  amountInCents: number;
  frequency: DonationFrequency;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl: string;
  onError?: ((message: string) => void) | undefined;
};

export function DonationCheckout({
  amountInCents,
  frequency,
  customerEmail,
  userId,
  returnUrl,
  onError,
}: DonationCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const fail = (message: string) => {
      setError(message);
      onError?.(message);
      return new Error(message);
    };

    try {
      const result = await createDonationCheckout({
        data: {
          amountInCents,
          currency: DONATION_CURRENCY,
          frequency,
          customerEmail,
          userId,
          returnUrl,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) throw fail(result.error);
      if (!result.clientSecret) {
        throw fail("Checkout could not be started. Please try again.");
      }
      return result.clientSecret;
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message
          ? caught.message
          : "We couldn't start the secure checkout. Please check your connection and try again.";
      setError(message);
      onError?.(message);
      throw caught instanceof Error ? caught : new Error(message);
    }
  }, [amountInCents, frequency, customerEmail, userId, returnUrl, onError]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">We couldn't start your secure checkout</p>
          <p className="mt-1 text-destructive/90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 sm:p-4">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
