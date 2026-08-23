import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCad } from "@/lib/donation";
import { getStripeEnvironment } from "@/lib/stripe";
import { getDonationStatus } from "@/utils/payments.functions";

const title = "Thank You for Your Gift | Hope Beyond Scarcity";
const description =
  "Your donation is confirmed. Thank you for funding care packages, clean water, and community health for families living in scarcity.";

export const Route = createFileRoute("/donate/thank-you")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: ThankYouPage,
});

type Status =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "done"; amount: number | null; email: string | null; monthly: boolean };

function ThankYouPage() {
  const { session_id: sessionId } = Route.useSearch();
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    let active = true;
    if (!sessionId) {
      setStatus({ state: "error", message: "We couldn't find your donation details." });
      return;
    }
    getDonationStatus({ data: { sessionId, environment: getStripeEnvironment() } })
      .then((result) => {
        if (!active) return;
        if ("error" in result) {
          setStatus({ state: "error", message: result.error });
          return;
        }
        setStatus({
          state: "done",
          amount: result.amountTotal,
          email: result.email,
          monthly: result.mode === "subscription",
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus({
          state: "error",
          message: error instanceof Error ? error.message : "Something went wrong.",
        });
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
      {status.state === "loading" ? (
        <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p>Confirming your gift…</p>
        </div>
      ) : status.state === "error" ? (
        <div className="min-h-[16rem] space-y-4">
          <h1 className="text-3xl font-bold text-foreground">We couldn't confirm your donation</h1>
          <p className="text-muted-foreground">{status.message}</p>
          <Button asChild>
            <Link to="/donate">Back to donation page</Link>
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 className="size-9" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Thank you — your gift is on its way
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            {status.amount
              ? `Your ${status.monthly ? "monthly" : "one-time"} gift of ${formatCad(status.amount)} CAD is confirmed.`
              : "Your donation is confirmed."}{" "}
            Because of you, a family in a village we serve moves from crisis to steady footing.
          </p>

          <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">PDF receipt on the way</p>
              <p className="mt-1 text-muted-foreground">
                An acknowledgement with your PDF receipt is being sent
                {status.email ? ` to ${status.email}` : ""}. Give it a couple of minutes, then check
                your spam folder if it hasn't arrived.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/dashboard">Go to my donor dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/programs">See the programs you funded</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
