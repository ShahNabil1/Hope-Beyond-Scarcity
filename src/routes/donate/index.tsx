import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Lock, Repeat, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { DonationCheckout } from "@/components/payments/donation-checkout";
import { PaymentTestModeBanner } from "@/components/payments/test-mode-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  PRESET_AMOUNTS_CAD,
  formatCad,
  parseCadAmountToCents,
  type DonationFrequency,
} from "@/lib/donation";
import { cn } from "@/lib/utils";

const title = "Donate | Hope Beyond Scarcity";
const description =
  "Give once or monthly in Canadian dollars to deliver care packages, clean water, and health support to families living in scarcity.";

export const Route = createFileRoute("/donate/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DonatePage,
});

function DonatePage() {
  const { user, isAuthenticated } = useAuth();
  const [frequency, setFrequency] = useState<DonationFrequency>("one_time");
  const [presetAmount, setPresetAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("50");
  const [email, setEmail] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => parseCadAmountToCents(customAmount), [customAmount]);
  const amountInCents = "cents" in parsedAmount ? parsedAmount.cents : 0;
  const amountError = "error" in parsedAmount ? parsedAmount.error : null;

  const donorEmail = user?.email ?? (email.trim() || undefined);
  const needsAccount = frequency === "monthly" && !isAuthenticated;
  const amountValid = amountError === null;
  const policiesAccepted = acceptedPolicies;
  const canDonate = amountValid && policiesAccepted && !needsAccount && !checkoutOpen;

  const returnUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`;

  const selectFrequency = (next: DonationFrequency) => {
    setFrequency(next);
    setCheckoutOpen(false);
    setCheckoutError(null);
  };

  return (
    <>
      <PageHero
        eyebrow="Give Today"
        title="Turn generosity into a family's next chapter"
        description="Secure Canadian donations in CAD. Transparent reporting. Every dollar tracked from gift to village."
      />

      <section
        className={`mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:gap-8 sm:px-6 lg:gap-8 lg:px-8 lg:py-16 xl:max-w-7xl xl:gap-10 ${
          checkoutOpen
            ? "lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]"
            : "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]"
        }`}
      >
        <div className="space-y-8">
          <PaymentTestModeBanner />

          {/* Frequency */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold text-foreground">1. Choose your giving rhythm</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <FrequencyOption
                active={frequency === "one_time"}
                onClick={() => selectFrequency("one_time")}
                icon={<Heart className="size-4" aria-hidden="true" />}
                label="One-Time"
                hint="No account needed"
              />
              <FrequencyOption
                active={frequency === "monthly"}
                onClick={() => selectFrequency("monthly")}
                icon={<Repeat className="size-4" aria-hidden="true" />}
                label="Monthly"
                hint="Sustained impact"
              />
            </div>

            <div className="mt-4 min-h-[3.25rem]">
              {needsAccount ? (
                <div className="rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm text-foreground">
                  <p className="font-medium">Monthly giving requires an account.</p>
                  <p className="mt-1 text-muted-foreground">
                    Sign in or create a free donor account so you can pause, edit, or cancel your
                    monthly gift anytime.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to="/auth">Log in</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/auth/sign-up">Create account</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {frequency === "monthly"
                    ? "Your monthly gift is charged in CAD on the same day each month. Cancel anytime from your donor dashboard."
                    : "A single gift in CAD. You'll receive an emailed receipt right after your donation."}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold text-foreground">2. Choose your amount (CAD)</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRESET_AMOUNTS_CAD.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setPresetAmount(amount);
                    setCustomAmount(String(amount));
                    setAmountTouched(true);
                    setCheckoutOpen(false);
                    setCheckoutError(null);
                  }}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-base font-semibold transition-colors",
                    presetAmount === amount
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary-soft",
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="custom-amount">Custom amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount"
                  inputMode="decimal"
                  placeholder="Enter an amount"
                  className="pl-7"
                  aria-describedby="amount-help"
                  aria-invalid={amountTouched && amountError ? true : undefined}
                  value={customAmount}
                  onBlur={() => setAmountTouched(true)}
                  onChange={(event) => {
                    setCustomAmount(event.target.value.replace(/[^0-9.]/g, ""));
                    setPresetAmount(null);
                    setAmountTouched(true);
                    setCheckoutOpen(false);
                    setCheckoutError(null);
                  }}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  CAD
                </span>
              </div>
              <p
                id="amount-help"
                role={amountTouched && amountError ? "alert" : undefined}
                className={cn(
                  "min-h-[1.25rem] text-xs",
                  amountTouched && amountError ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {amountTouched && amountError
                  ? amountError
                  : `You are giving ${formatCad(amountInCents)} CAD. All transactions are processed in Canadian dollars (CAD).`}
              </p>
            </div>

            {!isAuthenticated ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="donor-email">Email for your receipt (optional)</Label>
                <Input
                  id="donor-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          {/* Legal */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold text-foreground">3. Confirm and give</h2>

            <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Transparency notice</p>
              <p className="mt-1">
                Hope Beyond Scarcity is a Canadian Not-for-Profit Corporation headquartered in
                Toronto, Ontario. We are <strong>not yet a CRA-registered charity</strong>, so
                donations are <strong>not</strong> eligible for an official tax receipt at this
                time. You will receive a written acknowledgement of your gift by email. Funds
                support program delivery — care packages, clean water repairs, and community health
                support — along with the modest operating costs required to run those programs.
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-policies"
                  checked={acceptedPolicies}
                  onCheckedChange={(value) => setAcceptedPolicies(value === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="accept-policies"
                  className="text-sm font-normal leading-relaxed text-muted-foreground"
                >
                  I have read and accept the{" "}
                  <Link to="/terms" className="font-medium text-primary underline underline-offset-4">
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link to="/privacy" className="font-medium text-primary underline underline-offset-4">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link to="/refund" className="font-medium text-primary underline underline-offset-4">
                    Return / Refund Policy
                  </Link>
                  .
                </Label>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              disabled={!canDonate}
              onClick={() => {
                setAmountTouched(true);
                setCheckoutError(null);
                if (!amountValid) return;
                setCheckoutOpen(true);
              }}
            >
              <Lock className="size-4" aria-hidden="true" />
              {frequency === "monthly"
                ? `Give ${amountValid ? formatCad(amountInCents) : ""} monthly`
                : `Donate ${amountValid ? formatCad(amountInCents) : ""}`}
            </Button>
            {checkoutError ? (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-center text-xs text-destructive"
              >
                {checkoutError}
              </p>
            ) : null}
            <p className="mt-3 min-h-[1rem] text-center text-xs text-muted-foreground">
              {amountTouched && amountError
                ? amountError
                : policiesAccepted
                ? "Card details are entered directly with our payment processor — they never touch our servers."
                  : "Accept the Terms, Privacy, and Refund policies above to continue."}
            </p>
          </div>

        </div>

        <aside
          className={`space-y-4 lg:sticky lg:top-24 lg:self-start ${
            checkoutOpen ? "order-first lg:order-none" : ""
          }`}
        >
          {checkoutOpen && returnUrl ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-foreground">Secure payment</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCheckoutOpen(false)}>
                  Change amount
                </Button>
              </div>
              <DonationCheckout
                amountInCents={amountInCents}
                frequency={frequency}
                customerEmail={donorEmail}
                userId={user?.id}
                returnUrl={returnUrl}
                onError={setCheckoutError}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Where your gift goes</p>
              <p className="mt-2">
                $25 stocks a family care package. $50 helps repair a village water pump. $100 funds a
                week of community health outreach.
              </p>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

function FrequencyOption({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border px-4 py-3 text-left transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary-soft",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </span>
      <span
        className={cn("mt-1 block text-xs", active ? "opacity-90" : "text-muted-foreground")}
      >
        {hint}
      </span>
    </button>
  );
}

