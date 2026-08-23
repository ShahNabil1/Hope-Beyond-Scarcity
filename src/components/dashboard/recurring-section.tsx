import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCad, parseCadAmountToCents, PRESET_AMOUNTS_CAD } from "@/lib/donation";
import {
  getRecurringTimelineFn,
  openBillingPortal,
  retryRecurringPayment,
  setRecurringCancelAtPeriodEnd,
  updateRecurringAmount,
} from "@/lib/portal.functions";
import { supabase } from "@/lib/supabase";

type SubscriptionRow = {
  id: string;
  amount_cents: number | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
};

type Invoice = {
  id: string;
  amountCents: number;
  status: string;
  createdIso: string | null;
  paidIso: string | null;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
};

type Timeline = {
  nextPaymentIso: string | null;
  nextAmountCents: number | null;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoices: Invoice[];
  openInvoice: { id: string; hostedInvoiceUrl: string | null; amountCents: number } | null;
  status: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function RecurringSection({ userId }: { userId: string }) {
  const [rows, setRows] = useState<SubscriptionRow[] | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [timelines, setTimelines] = useState<Record<string, Timeline | { error: string } | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadTimeline = useCallback(async (id: string) => {
    setTimelines((prev) => ({ ...prev, [id]: prev[id] ?? null }));
    const result = (await getRecurringTimelineFn({ data: { subscriptionId: id } })) as
      | Timeline
      | { error: string };
    setTimelines((prev) => ({ ...prev, [id]: result }));
  }, []);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("id, amount_cents, status, current_period_end, cancel_at_period_end, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setRows(list);
    setAmounts(
      Object.fromEntries(list.map((row) => [row.id, ((row.amount_cents ?? 0) / 100).toFixed(2)])),
    );
    await Promise.all(
      list.filter((row) => row.status !== "canceled").map((row) => loadTimeline(row.id)),
    );
  }, [userId, loadTimeline]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveAmount(id: string) {
    const parsed = parseCadAmountToCents(amounts[id] ?? "");
    if ("error" in parsed) {
      toast.error(parsed.error);
      return;
    }
    setBusy(`amount-${id}`);
    const result = await updateRecurringAmount({
      data: { subscriptionId: id, amountInCents: parsed.cents },
    });
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Your monthly gift is now ${formatCad(parsed.cents)} CAD.`);
    await load();
  }

  async function toggleCancel(id: string, cancel: boolean) {
    setBusy(`cancel-${id}`);
    const result = await setRecurringCancelAtPeriodEnd({ data: { subscriptionId: id, cancel } });
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(
      cancel
        ? "Your monthly gift will stop at the end of the current period."
        : "Your monthly gift has been resumed.",
    );
    await load();
  }

  async function managePaymentMethod(id: string) {
    setBusy(`portal-${id}`);
    const result = await openBillingPortal({
      data: { subscriptionId: id, returnUrl: `${window.location.origin}/dashboard` },
    });
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function retry(id: string) {
    setBusy(`retry-${id}`);
    const result = (await retryRecurringPayment({ data: { subscriptionId: id } })) as
      | { ok: true; status: string }
      | { error: string };
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment retried successfully. Thank you for your support.");
    await load();
  }

  const active = (rows ?? []).filter((row) => row.status !== "canceled");

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="bg-muted/40">
          <CardTitle className="text-lg">Monthly giving</CardTitle>
          <CardDescription>
            See every past gift, your next charge date, update your card, retry a declined payment
            or pause your support at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {rows === null ? (
            <>
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </>
          ) : active.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
              <RefreshCw className="mx-auto size-7 text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">
                You have no active monthly gift. Monthly giving funds the months after an emergency.
              </p>
              <Button asChild className="mt-4">
                <a href="/donate">Start monthly giving</a>
              </Button>
            </div>
          ) : (
            active.map((row) => {
              const timeline = timelines[row.id];
              const detail =
                timeline && !("error" in timeline) ? (timeline as Timeline) : null;
              const declined =
                row.status === "past_due" || row.status === "unpaid" || !!detail?.openInvoice;

              return (
                <div
                  key={row.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Monthly gift
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-foreground">
                        {formatCad(row.amount_cents ?? 0)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          CAD / month
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.environment === "sandbox" ? <Badge variant="outline">Test</Badge> : null}
                      <Badge
                        variant={
                          declined
                            ? "destructive"
                            : row.cancel_at_period_end
                              ? "secondary"
                              : "default"
                        }
                        className="capitalize"
                      >
                        {declined
                          ? "Payment failed"
                          : row.cancel_at_period_end
                            ? "Ending"
                            : row.status}
                      </Badge>
                    </div>
                  </div>

                  {declined ? (
                    <div className="mx-5 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className="mt-0.5 size-5 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        <div className="space-y-3">
                          <p className="text-sm text-foreground">
                            Your last charge was declined. Update your card, then retry — no gift is
                            lost.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => retry(row.id)}
                              disabled={busy === `retry-${row.id}`}
                            >
                              {busy === `retry-${row.id}` ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <RotateCw className="size-4" aria-hidden="true" />
                              )}
                              Retry payment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => managePaymentMethod(row.id)}
                              disabled={busy === `portal-${row.id}`}
                            >
                              <CreditCard className="size-4" aria-hidden="true" />
                              Update card
                            </Button>
                            {detail?.openInvoice?.hostedInvoiceUrl ? (
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={detail.openInvoice.hostedInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-4" aria-hidden="true" />
                                  Pay invoice
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <CalendarClock className="size-4" aria-hidden="true" />
                        {row.cancel_at_period_end ? "Support ends" : "Next gift"}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatDate(detail?.nextPaymentIso ?? row.current_period_end)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <CreditCard className="size-4" aria-hidden="true" />
                        Payment method
                      </div>
                      <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                        {detail?.card
                          ? `${detail.card.brand} •••• ${detail.card.last4} · ${String(detail.card.expMonth).padStart(2, "0")}/${String(detail.card.expYear).slice(-2)}`
                          : timeline === null
                            ? "Loading…"
                            : "Card on file"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border px-5 py-4">
                    <Label htmlFor={`amount-${row.id}`}>Change monthly amount (CAD)</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AMOUNTS_CAD.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAmounts((prev) => ({ ...prev, [row.id]: preset.toFixed(2) }))
                          }
                        >
                          ${preset}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        id={`amount-${row.id}`}
                        inputMode="decimal"
                        className="w-36"
                        value={amounts[row.id] ?? ""}
                        onChange={(event) =>
                          setAmounts((prev) => ({ ...prev, [row.id]: event.target.value }))
                        }
                      />
                      <Button
                        type="button"
                        onClick={() => saveAmount(row.id)}
                        disabled={busy === `amount-${row.id}`}
                      >
                        {busy === `amount-${row.id}` ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        Update amount
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Payment history
                    </p>
                    {timeline === null ? (
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    ) : detail && detail.invoices.length > 0 ? (
                      <ul className="mt-3 divide-y divide-border">
                        {detail.invoices.map((invoice) => (
                          <li
                            key={invoice.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              {invoice.status === "paid" ? (
                                <CheckCircle2
                                  className="size-4 text-primary"
                                  aria-hidden="true"
                                />
                              ) : (
                                <AlertTriangle
                                  className="size-4 text-destructive"
                                  aria-hidden="true"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {formatCad(invoice.amountCents)} CAD
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatShortDate(invoice.paidIso ?? invoice.createdIso)} ·{" "}
                                  <span className="capitalize">{invoice.status}</span>
                                </p>
                              </div>
                            </div>
                            {invoice.pdfUrl || invoice.hostedInvoiceUrl ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={(invoice.pdfUrl ?? invoice.hostedInvoiceUrl)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-4" aria-hidden="true" />
                                  Invoice
                                </a>
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {timeline && "error" in timeline
                          ? timeline.error
                          : "No charges have been made yet."}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => managePaymentMethod(row.id)}
                      disabled={busy === `portal-${row.id}`}
                    >
                      {busy === `portal-${row.id}` ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <CreditCard className="size-4" aria-hidden="true" />
                      )}
                      Manage payment method
                    </Button>

                    {row.cancel_at_period_end ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toggleCancel(row.id, false)}
                        disabled={busy === `cancel-${row.id}`}
                      >
                        Resume monthly gift
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="ghost" className="text-destructive">
                            Cancel monthly gift
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel your monthly gift?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your support continues until {formatDate(row.current_period_end)} and
                              then stops. You will not be charged again, and you can restart any
                              time.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep giving</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleCancel(row.id, true)}>
                              Cancel gift
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
