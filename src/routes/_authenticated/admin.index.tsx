import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  HandHeart,
  Inbox,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { adminGetOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-primary [&>svg]:size-4">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function AdminOverview() {
  const fetchOverview = useServerFn(adminGetOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fetchOverview(),
  });

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="A live snapshot of giving, community and published content."
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Given this month"
              value={money(data.monthTotalCents)}
              hint={`${data.monthCount} completed gifts`}
              icon={<HandHeart />}
            />
            <StatCard
              label="Active monthly gifts"
              value={String(data.activeRecurring)}
              hint="Recurring donors"
              icon={<Sparkles />}
            />
            <StatCard
              label="Members"
              value={String(data.members)}
              hint="Signed-in donors & volunteers"
              icon={<Users />}
            />
            <StatCard
              label="New messages"
              value={String(data.newMessages)}
              hint="Unread contact enquiries"
              icon={<Inbox />}
            />
            <StatCard
              label="Volunteer applications"
              value={String(data.pendingApplications)}
              hint="Awaiting review"
              icon={<CalendarDays />}
            />
            <StatCard
              label="Published content"
              value={`${data.programs + data.news + data.events + data.roles}`}
              hint={`${data.programs} programs · ${data.news} stories · ${data.events} events · ${data.roles} roles`}
              icon={<Newspaper />}
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Latest donations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
              ) : (
                data.recent.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {d.email ?? "Anonymous donor"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleString("en-CA")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{d.donation_type}</Badge>
                      <Badge variant={d.status === "paid" ? "default" : "outline"}>{d.status}</Badge>
                      <span className="text-sm font-semibold">{money(d.amount_cents)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
