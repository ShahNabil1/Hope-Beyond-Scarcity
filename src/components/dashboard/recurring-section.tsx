import { useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
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
  openBillingPortal,
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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function RecurringSection({ userId }: { userId: string }) {
  const [rows, setRows] = useState<SubscriptionRow[] | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("subscriptions")
      .select("id, amount_cents, status, current_period_end, cancel_at_period_end, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setAmounts(
      Object.fromEntries(
        (data ?? []).map((row) => [row.id, ((row.amount_cents ?? 0) / 100).toFixed(2)]),
      ),
    );
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  const active = (rows ?? []).filter((row) => row.status !== "canceled");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly giving</CardTitle>
        <CardDescription>
          Change your monthly amount, update your card, or pause your support at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows === null ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <RefreshCw className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              You have no active monthly gift. Monthly giving funds the months after an emergency.
            </p>
            <Button asChild className="mt-4">
              <a href="/donate">Start monthly giving</a>
            </Button>
          </div>
        ) : (
          active.map((row) => (
            <div key={row.id} className="rounded-xl border border-border p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {formatCad(row.amount_cents ?? 0)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      CAD / month
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.cancel_at_period_end ? "Ends on " : "Next gift on "}
                    {formatDate(row.current_period_end)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {row.environment === "sandbox" ? <Badge variant="outline">Test</Badge> : null}
                  <Badge
                    variant={row.cancel_at_period_end ? "secondary" : "default"}
                    className="capitalize"
                  >
                    {row.cancel_at_period_end ? "Ending" : row.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
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

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
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
                          Your support continues until {formatDate(row.current_period_end)} and then
                          stops. You will not be charged again, and you can restart any time.
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
