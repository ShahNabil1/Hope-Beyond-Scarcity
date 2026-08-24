/**
 * Analytics layer: Google Analytics 4 (gtag.js with Consent Mode v2) plus a
 * first-party event stream sent to the Supabase `track` edge function.
 *
 * Rules enforced here:
 * - Nothing is loaded or sent until the visitor grants "performance" consent.
 * - Admin routes (`/admin/**`) are never tracked.
 * - Withdrawing consent stops GA immediately, denies consent signals and drops
 *   the local analytics identifiers.
 */
import {
  effectiveConsent,
  hasConsentFor,
  onConsentChange,
  purgeNonEssentialCookies,
  type ConsentState,
} from "@/lib/consent";

export const GA_MEASUREMENT_ID =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] as string | undefined) ?? "";

const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";
const SUPABASE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ?? "";
const TRACK_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/track` : "";

const VISITOR_KEY = "hbs.analytics.visitor";
const SESSION_KEY = "hbs.analytics.session";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean | null | undefined>;

/** Admin CMS pages are excluded from every analytics signal. */
export function isTrackablePath(pathname: string): boolean {
  return !pathname.startsWith("/admin");
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function consentPayload(state: ConsentState) {
  return {
    ad_storage: state.advertising ? "granted" : "denied",
    ad_user_data: state.advertising ? "granted" : "denied",
    ad_personalization: state.advertising ? "granted" : "denied",
    analytics_storage: state.performance ? "granted" : "denied",
    functionality_storage: state.functional ? "granted" : "denied",
    personalization_storage: state.functional ? "granted" : "denied",
    security_storage: "granted",
  };
}

let scriptLoaded = false;
let bootstrapped = false;
let currentUserId: string | null = null;

function loadGtag() {
  if (scriptLoaded || typeof document === "undefined" || !GA_MEASUREMENT_ID) return;
  scriptLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: hasConsentFor("advertising"),
    allow_ad_personalization_signals: hasConsentFor("advertising"),
  });
}

function id(): string {
  const bytes = new Uint8Array(16);
  (globalThis.crypto ?? window.crypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function visitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let value = window.localStorage.getItem(VISITOR_KEY);
    if (!value) {
      value = id();
      window.localStorage.setItem(VISITOR_KEY, value);
    }
    return value;
  } catch {
    return "anonymous";
  }
}

function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let value = window.sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      value = id();
      window.sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  } catch {
    return "anonymous";
  }
}

function forgetIdentifiers() {
  try {
    window.localStorage.removeItem(VISITOR_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function deviceCategory(): string {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function utmParams() {
  const search = new URLSearchParams(window.location.search);
  const pick = (key: string) => search.get(key) || undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_term: pick("utm_term"),
    utm_content: pick("utm_content"),
  };
}

function sendToEdge(eventName: string, params: EventParams) {
  if (!TRACK_ENDPOINT || !SUPABASE_KEY) return;
  const body = JSON.stringify({
    event_name: eventName,
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
    referrer: document.referrer || null,
    visitor_id: visitorId(),
    session_id: sessionId(),
    user_id: currentUserId,
    device_category: deviceCategory(),
    language: navigator.language,
    screen_size: `${window.screen.width}x${window.screen.height}`,
    ...utmParams(),
    params,
  });
  try {
    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* analytics must never break the page */
  }
}

/** Records a GA4 event and mirrors it into our own store. Respects consent. */
export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  if (!isTrackablePath(window.location.pathname)) return;
  if (!hasConsentFor("performance")) return;
  const payload: EventParams = { ...params, page_path: window.location.pathname };
  if (GA_MEASUREMENT_ID) gtag("event", eventName, payload);
  sendToEdge(eventName, params);
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;
  if (!isTrackablePath(path)) return;
  if (!hasConsentFor("performance")) return;
  if (GA_MEASUREMENT_ID) {
    gtag("event", "page_view", {
      page_path: path,
      page_title: title ?? document.title,
      page_location: window.location.href,
      page_referrer: document.referrer || undefined,
      ...utmParams(),
    });
  }
  sendToEdge("page_view", { page_referrer: document.referrer || undefined });
}

/** Associates subsequent events with the signed-in member. */
export function setAnalyticsUser(userId: string | null, roles: string[] = []) {
  currentUserId = userId;
  if (!hasConsentFor("performance") || !GA_MEASUREMENT_ID) return;
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    user_id: userId ?? undefined,
    user_properties: {
      signed_in: Boolean(userId),
      member_role: roles[0] ?? "guest",
    },
  });
}

function applyConsent(state: ConsentState) {
  gtag("consent", "update", consentPayload(state));
  if (state.performance) {
    loadGtag();
  } else {
    forgetIdentifiers();
    purgeNonEssentialCookies();
  }
}

/** Called once on the client; sets Consent Mode v2 defaults before anything loads. */
export function bootstrapAnalytics() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  const state = effectiveConsent();
  gtag("consent", "default", {
    ...consentPayload({ ...state, performance: false, advertising: false, functional: false }),
    wait_for_update: 500,
  });
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);
  applyConsent(state);
  onConsentChange(applyConsent);
}
