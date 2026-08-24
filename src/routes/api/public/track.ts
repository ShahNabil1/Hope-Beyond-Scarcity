// Public analytics ingest endpoint.
// The browser only calls this after the visitor grants "performance" consent.
// It stores anonymous, aggregate-friendly events; no IP address is persisted.
import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_LEN = 512;

function str(value: unknown, max = MAX_LEN): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function uuidOrNull(value: unknown): string | null {
  const raw = str(value, 36);
  return raw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
    ? raw
    : null;
}

function uaInfo(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Other";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Other";
  return { browser, os };
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;

          const eventName = str(body["event_name"], 60);
          const visitorId = str(body["visitor_id"], 64);
          const sessionId = str(body["session_id"], 64);
          const pagePath = str(body["page_path"], 300) ?? "/";

          if (!eventName || !visitorId || !sessionId) return json({ error: "Invalid payload" }, 400);

          // Admin CMS traffic is never recorded.
          if (pagePath.startsWith("/admin")) return json({ skipped: true }, 202);

          const ua = request.headers.get("user-agent") ?? "";
          const { browser, os } = uaInfo(ua);
          const country =
            request.headers.get("cf-ipcountry") ??
            request.headers.get("x-country") ??
            request.headers.get("x-vercel-ip-country");

          const rawParams = body["params"];
          const params =
            rawParams && typeof rawParams === "object" && !Array.isArray(rawParams) ? rawParams : {};

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const userId = uuidOrNull(body["user_id"]);

          const { error } = await supabaseAdmin.from("analytics_events").insert({
            event_name: eventName,
            page_path: pagePath,
            page_title: str(body["page_title"], 300),
            page_location: str(body["page_location"], 500),
            referrer: str(body["referrer"], 500),
            visitor_id: visitorId,
            session_id: sessionId,
            user_id: userId,
            is_authenticated: Boolean(userId),
            country: country ? country.toUpperCase().slice(0, 2) : null,
            device_category: str(body["device_category"], 20),
            browser,
            os,
            language: str(body["language"], 20),
            screen_size: str(body["screen_size"], 20),
            utm_source: str(body["utm_source"], 120),
            utm_medium: str(body["utm_medium"], 120),
            utm_campaign: str(body["utm_campaign"], 120),
            utm_term: str(body["utm_term"], 120),
            utm_content: str(body["utm_content"], 120),
            params: params as Record<string, unknown>,
          });

          if (error) throw new Error(error.message);
          return json({ ok: true }, 202);
        } catch (error) {
          console.error("track error", error);
          return json({ error: "Failed to record event" }, 500);
        }
      },
    },
  },
});
