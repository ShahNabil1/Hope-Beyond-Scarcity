const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Production checkout is not configured yet. Complete payment go-live to accept real gifts.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/15 px-4 py-2 text-center text-sm text-accent-foreground">
        Test mode — donations made here are simulated. No real money is charged.
      </div>
    );
  }
  return null;
}
