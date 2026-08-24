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

    const sinceDate = new Date(Date.now() - (data.days - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [totalsRes, dimsRes, visitorsRes, usersRes, sessionsRes, dimVisitorsRes, recentRes] =
      await Promise.all([
        supabaseAdmin.from("analytics_daily_totals").select("*").gte("day", sinceDate),
        supabaseAdmin.from("analytics_daily_dims").select("*").gte("day", sinceDate).limit(20000),
        supabaseAdmin.from("analytics_daily_visitors").select("*").gte("day", sinceDate).limit(50000),
        supabaseAdmin.from("analytics_daily_users").select("*").gte("day", sinceDate).limit(50000),
        supabaseAdmin.from("analytics_daily_sessions").select("*").gte("day", sinceDate).limit(50000),
        supabaseAdmin
          .from("analytics_daily_dim_visitors")
          .select("*")
          .gte("day", sinceDate)
          .limit(50000),
        supabaseAdmin
          .from("analytics_events")
          .select("id,event_name,page_path,country,device_category,is_authenticated,created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    const firstError =
      totalsRes.error ??
      dimsRes.error ??
      visitorsRes.error ??
      usersRes.error ??
      sessionsRes.error ??
      dimVisitorsRes.error ??
      recentRes.error;
    if (firstError) throw new Error(firstError.message);

    const totalsRows = totalsRes.data ?? [];
    const dimRows = dimsRes.data ?? [];
    const sessionRows = sessionsRes.data ?? [];
    const dimVisitorRows = dimVisitorsRes.data ?? [];

    const totals = totalsRows.reduce(
      (acc, row) => ({
        events: acc.events + row.events,
        pageViews: acc.pageViews + row.page_views,
        signUps: acc.signUps + row.sign_ups,
        signIns: acc.signIns + row.sign_ins,
        donateClicks: acc.donateClicks + row.donate_clicks,
      }),
      { events: 0, pageViews: 0, signUps: 0, signIns: 0, donateClicks: 0 },
    );

    const uniqueVisitors = new Set((visitorsRes.data ?? []).map((row) => row.visitor_id));
    const uniqueUsers = new Set((usersRes.data ?? []).map((row) => row.user_id));
    const sessions = new Map<string, number>();
    for (const row of sessionRows) {
      sessions.set(row.session_id, (sessions.get(row.session_id) ?? 0) + row.events);
    }

    const dailyViews = new Map<string, number>();
    for (const row of totalsRows) dailyViews.set(row.day, row.page_views);
    const dailyVisitors = new Map<string, Set<string>>();
    for (const row of dimVisitorRows) {
      if (row.kind !== "page") continue;
      const bucket = dailyVisitors.get(row.day) ?? new Set<string>();
      bucket.add(row.visitor_id);
      dailyVisitors.set(row.day, bucket);
    }

    const byKind = (kind: string) => dimRows.filter((row) => row.kind === kind);
    const sumBy = (kind: string, field: "events" | "page_views") => {
      const map = new Map<string, number>();
      for (const row of byKind(kind)) map.set(row.value, (map.get(row.value) ?? 0) + row[field]);
      return map;
    };
    const visitorsBy = (kind: string) => {
      const map = new Map<string, Set<string>>();
      for (const row of dimVisitorRows) {
        if (row.kind !== kind) continue;
        const bucket = map.get(row.value) ?? new Set<string>();
        bucket.add(row.visitor_id);
        map.set(row.value, bucket);
      }
      return map;
    };

    const pageViewsByPage = sumBy("page", "page_views");
    const pageVisitors = visitorsBy("page");
    const countryViews = sumBy("country", "page_views");
    const countryVisitors = visitorsBy("country");

    const days: { date: string; pageViews: number; visitors: number }[] = [];
    for (let i = data.days - 1; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      days.push({
        date,
        pageViews: dailyViews.get(date) ?? 0,
        visitors: dailyVisitors.get(date)?.size ?? 0,
      });
    }

    const sessionCount = sessions.size;
    const singleEventSessions = [...sessions.values()].filter((count) => count <= 1).length;

    return {
      range: data.days,
      totals: {
        events: totals.events,
        pageViews: totals.pageViews,
        visitors: uniqueVisitors.size,
        sessions: sessionCount,
        signedInVisitors: uniqueUsers.size,
        signUps: totals.signUps,
        signIns: totals.signIns,
        donateClicks: totals.donateClicks,
        avgEventsPerSession: sessionCount ? Math.round((totals.events / sessionCount) * 10) / 10 : 0,
        bounceRate: sessionCount ? Math.round((singleEventSessions / sessionCount) * 100) : 0,
      },
      daily: days,
      topPages: [...pageViewsByPage.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page_path, views]) => ({
          page_path,
          views,
          visitors: pageVisitors.get(page_path)?.size ?? 0,
        })),
      countries: [...countryViews.entries()]
        .sort((a, b) => (countryVisitors.get(b[0])?.size ?? 0) - (countryVisitors.get(a[0])?.size ?? 0))
        .slice(0, 10)
        .map(([country, views]) => ({
          country,
          views,
          visitors: countryVisitors.get(country)?.size ?? 0,
        })),
      devices: rank(sumBy("device", "events"), 5),
      browsers: rank(sumBy("browser", "events"), 6),
      referrers: rank(sumBy("referrer", "page_views"), 8),
      sources: rank(sumBy("source", "page_views"), 8),
      events: rank(sumBy("event", "events"), 12),
      recent: (recentRes.data ?? []).map((row) => ({
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
