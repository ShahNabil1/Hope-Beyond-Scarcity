import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsRange = 7 | 30 | 90;

export type AnalyticsOverview = {
  range: number;
  totals: {
    events: number;
    pageViews: number;
    visitors: number;
    sessions: number;
    signedInVisitors: number;
    signUps: number;
    signIns: number;
    donateClicks: number;
    avgEventsPerSession: number;
    bounceRate: number;
  };
  daily: { date: string; pageViews: number; visitors: number }[];
  topPages: { page_path: string; views: number; visitors: number }[];
  countries: { country: string; visitors: number; views: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  sources: { name: string; count: number }[];
  events: { name: string; count: number }[];
  recent: {
    id: string;
    event_name: string;
    page_path: string;
    country: string | null;
    device_category: string | null;
    is_authenticated: boolean;
    created_at: string;
  }[];
};

type EventRow = {
  id: string;
  event_name: string;
  page_path: string;
  referrer: string | null;
  visitor_id: string;
  session_id: string;
  user_id: string | null;
  is_authenticated: boolean;
  country: string | null;
  device_category: string | null;
  browser: string | null;
  utm_source: string | null;
  created_at: string;
};

function rank(map: Map<string, number>, limit = 8) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export const adminGetAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) => ({
    days: [7, 30, 90].includes(Number(data?.days)) ? Number(data.days) : 30,
  }))
  .handler(async ({ data, context }): Promise<AnalyticsOverview> => {
    const { supabase, userId } = context;
    const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "editor" }),
    ]);
    if (!isAdmin && !isEditor) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("analytics_events")
      .select(
        "id,event_name,page_path,referrer,visitor_id,session_id,user_id,is_authenticated,country,device_category,browser,utm_source,created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw new Error(error.message);

    const events = (rows ?? []) as EventRow[];

    const visitors = new Set<string>();
    const signedIn = new Set<string>();
    const sessions = new Map<string, number>();
    const daily = new Map<string, { views: number; visitors: Set<string> }>();
    const pages = new Map<string, { views: number; visitors: Set<string> }>();
    const countries = new Map<string, { views: number; visitors: Set<string> }>();
    const devices = new Map<string, number>();
    const browsers = new Map<string, number>();
    const referrers = new Map<string, number>();
    const sources = new Map<string, number>();
    const eventCounts = new Map<string, number>();

    let pageViews = 0;
    let signUps = 0;
    let signIns = 0;
    let donateClicks = 0;

    for (const row of events) {
      visitors.add(row.visitor_id);
      if (row.is_authenticated && row.user_id) signedIn.add(row.user_id);
      sessions.set(row.session_id, (sessions.get(row.session_id) ?? 0) + 1);
      eventCounts.set(row.event_name, (eventCounts.get(row.event_name) ?? 0) + 1);
      devices.set(row.device_category ?? "unknown", (devices.get(row.device_category ?? "unknown") ?? 0) + 1);
      browsers.set(row.browser ?? "unknown", (browsers.get(row.browser ?? "unknown") ?? 0) + 1);

      if (row.event_name === "sign_up") signUps += 1;
      if (row.event_name === "login" || row.event_name === "sign_in") signIns += 1;
      if (row.event_name === "donate_cta_click") donateClicks += 1;

      if (row.event_name !== "page_view") continue;

      pageViews += 1;
      const day = row.created_at.slice(0, 10);
      const dayBucket = daily.get(day) ?? { views: 0, visitors: new Set<string>() };
      dayBucket.views += 1;
      dayBucket.visitors.add(row.visitor_id);
      daily.set(day, dayBucket);

      const pageBucket = pages.get(row.page_path) ?? { views: 0, visitors: new Set<string>() };
      pageBucket.views += 1;
      pageBucket.visitors.add(row.visitor_id);
      pages.set(row.page_path, pageBucket);

      const code = row.country ?? "Unknown";
      const countryBucket = countries.get(code) ?? { views: 0, visitors: new Set<string>() };
      countryBucket.views += 1;
      countryBucket.visitors.add(row.visitor_id);
      countries.set(code, countryBucket);

      const host = (() => {
        if (!row.referrer) return "Direct";
        try {
          const url = new URL(row.referrer);
          return url.hostname.replace(/^www\./, "");
        } catch {
          return "Direct";
        }
      })();
      referrers.set(host, (referrers.get(host) ?? 0) + 1);
      const source = row.utm_source ?? (host === "Direct" ? "direct" : host);
      sources.set(source, (sources.get(source) ?? 0) + 1);
    }

    const days: { date: string; pageViews: number; visitors: number }[] = [];
    for (let i = data.days - 1; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const bucket = daily.get(date);
      days.push({ date, pageViews: bucket?.views ?? 0, visitors: bucket?.visitors.size ?? 0 });
    }

    const sessionCount = sessions.size;
    const singleEventSessions = [...sessions.values()].filter((count) => count <= 1).length;

    return {
      range: data.days,
      totals: {
        events: events.length,
        pageViews,
        visitors: visitors.size,
        sessions: sessionCount,
        signedInVisitors: signedIn.size,
        signUps,
        signIns,
        donateClicks,
        avgEventsPerSession: sessionCount ? Math.round((events.length / sessionCount) * 10) / 10 : 0,
        bounceRate: sessionCount ? Math.round((singleEventSessions / sessionCount) * 100) : 0,
      },
      daily: days,
      topPages: [...pages.entries()]
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, 10)
        .map(([page_path, value]) => ({ page_path, views: value.views, visitors: value.visitors.size })),
      countries: [...countries.entries()]
        .sort((a, b) => b[1].visitors.size - a[1].visitors.size)
        .slice(0, 10)
        .map(([country, value]) => ({ country, visitors: value.visitors.size, views: value.views })),
      devices: rank(devices, 5),
      browsers: rank(browsers, 6),
      referrers: rank(referrers, 8),
      sources: rank(sources, 8),
      events: rank(eventCounts, 12),
      recent: events.slice(0, 25).map((row) => ({
        id: row.id,
        event_name: row.event_name,
        page_path: row.page_path,
        country: row.country,
        device_category: row.device_category,
        is_authenticated: row.is_authenticated,
        created_at: row.created_at,
      })),
    };
  });
