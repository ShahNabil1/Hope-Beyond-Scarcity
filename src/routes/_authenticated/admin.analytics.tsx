import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Globe2,
  LogIn,
  MousePointerClick,
  UserPlus,
  Users,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetAnalytics } from "@/lib/analytics-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

const RANGES = [7, 30, 90] as const;

const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function countryName(code: string) {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return REGION_NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
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

function BarList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; sub?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data in this period yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.sub ? `${row.sub} · ` : ""}
                  {row.value.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TrendChart({ data }: { data: { date: string; pageViews: number; visitors: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.pageViews));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Traffic trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-[3px]">
          {data.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.pageViews} views · ${d.visitors} visitors`}
              className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary transition-[height]"
              style={{ height: `${Math.max(2, (d.pageViews / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminAnalytics() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const fetchAnalytics = useServerFn(adminGetAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", days],
    queryFn: () => fetchAnalytics({ data: { days } }),
    staleTime: 60_000,
  });

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Consent-based, first-party traffic and engagement. Admin pages are never tracked."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Button
            key={range}
            size="sm"
            variant={days === range ? "default" : "outline"}
            onClick={() => setDays(range)}
          >
            Last {range} days
          </Button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Page views"
              value={data.totals.pageViews.toLocaleString()}
              hint={`${data.totals.events.toLocaleString()} tracked events`}
              icon={<Activity />}
            />
            <StatCard
              label="Unique visitors"
              value={data.totals.visitors.toLocaleString()}
              hint={`${data.totals.sessions.toLocaleString()} sessions · ${data.totals.bounceRate}% bounce`}
              icon={<Users />}
            />
            <StatCard
              label="Signed-in members seen"
              value={data.totals.signedInVisitors.toLocaleString()}
              hint={`${data.totals.avgEventsPerSession} events per session`}
              icon={<LogIn />}
            />
            <StatCard
              label="Sign-ups"
              value={data.totals.signUps.toLocaleString()}
              hint="Accounts created in this period"
              icon={<UserPlus />}
            />
            <StatCard
              label="Sign-ins"
              value={data.totals.signIns.toLocaleString()}
              hint="Returning member logins"
              icon={<LogIn />}
            />
            <StatCard
              label="Donate CTA clicks"
              value={data.totals.donateClicks.toLocaleString()}
              hint="Intent to give"
              icon={<MousePointerClick />}
            />
          </div>

          <TrendChart data={data.daily} />

          <div className="grid gap-4 lg:grid-cols-2">
            <BarList
              title="Top pages"
              rows={data.topPages.map((p) => ({
                label: p.page_path,
                value: p.views,
                sub: `${p.visitors} visitors`,
              }))}
            />
            <BarList
              title="Countries"
              rows={data.countries.map((c) => ({
                label: countryName(c.country),
                value: c.visitors,
                sub: `${c.views} views`,
              }))}
            />
            <BarList
              title="Events fired"
              rows={data.events.map((e) => ({ label: e.name, value: e.count }))}
            />
            <BarList
              title="Traffic sources"
              rows={data.sources.map((s) => ({ label: s.name, value: s.count }))}
            />
            <BarList
              title="Referrers"
              rows={data.referrers.map((r) => ({ label: r.name, value: r.count }))}
            />
            <BarList
              title="Devices & browsers"
              rows={[
                ...data.devices.map((d) => ({ label: d.name, value: d.count })),
                ...data.browsers.map((b) => ({ label: b.name, value: b.count })),
              ]}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2 className="size-4 text-primary" aria-hidden="true" />
                Live activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events recorded yet — data appears once visitors accept performance cookies.
                </p>
              ) : (
                data.recent.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{row.event_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.page_path}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{countryName(row.country ?? "Unknown")}</Badge>
                      <Badge variant="outline">{row.device_category ?? "unknown"}</Badge>
                      {row.is_authenticated ? <Badge>member</Badge> : null}
                      <span className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString("en-CA")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
