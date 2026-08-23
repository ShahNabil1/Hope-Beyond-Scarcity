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
      <div className="w-full border-b border-warning/40 bg-warning/15 px-4 py-2 text-center text-sm text-warning-foreground">
        Test mode — all donations made in the preview are simulated. No real money is charged.
      </div>
    );
  }
  return null;
}
