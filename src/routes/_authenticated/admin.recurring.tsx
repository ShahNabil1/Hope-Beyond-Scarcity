import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminListSubscriptions,
  adminSetSubscriptionCancel,
} from "@/lib/admin-finance.functions";

export const Route = createFileRoute("/_authenticated/admin/recurring")({
  component: AdminRecurring,
});

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function AdminRecurring() {
  const listSubs = useServerFn(adminListSubscriptions);
  const setCancel = useServerFn(adminSetSubscriptionCancel);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => listSubs(),
  });

  async function toggleCancel(id: string, cancel: boolean) {
    setBusy(id);
    const result = await setCancel({ data: { subscriptionId: id, cancel } });
    setBusy(null);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(cancel ? "Will stop at period end" : "Recurring gift resumed");
    queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
  }

  const term = search.trim().toLowerCase();
  const subscriptions = (data?.subscriptions ?? []).filter(
    (s) =>
      !term ||
      (s.donor_name ?? "").toLowerCase().includes(term) ||
      (s.donor_email ?? "").toLowerCase().includes(term) ||
      s.stripe_subscription_id.toLowerCase().includes(term),
  );

  return (
    <>
      <AdminPageHeader
        title="Recurring gifts"
        description="Monthly partners, their next charge dates, and cancellation state."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Active partners", value: data ? String(data.totals.active) : "—" },
          { label: "Monthly recurring", value: data ? money(data.totals.mrrCents) : "—" },
          { label: "Ending soon", value: data ? String(data.totals.cancelling) : "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search donor or subscription id"
        className="mb-4 sm:max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No recurring gifts yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">
                      {money(sub.amount_cents ?? 0)}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </span>
                    <Badge variant="secondary">{sub.status}</Badge>
                    {sub.cancel_at_period_end ? (
                      <Badge variant="outline" className="text-destructive">
                        ends at period end
                      </Badge>
                    ) : null}
                    {sub.environment !== "live" ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        test
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">
                    {sub.donor_name ?? "Donor"}
                    {sub.donor_email ? (
                      <span className="text-muted-foreground"> · {sub.donor_email}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sub.current_period_end
                      ? `Next charge ${new Date(sub.current_period_end).toLocaleDateString("en-CA", { timeZone: "America/Toronto" })}`
                      : "No upcoming charge on file"}
                    {` · ${sub.stripe_subscription_id}`}
                  </p>
                </div>

                {data?.isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={busy === sub.id || sub.status === "canceled"}
                    onClick={() => toggleCancel(sub.id, !sub.cancel_at_period_end)}
                  >
                    {sub.cancel_at_period_end ? (
                      <>
                        <PlayCircle className="size-4" /> Resume
                      </>
                    ) : (
                      <>
                        <PauseCircle className="size-4" /> Stop at period end
                      </>
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
