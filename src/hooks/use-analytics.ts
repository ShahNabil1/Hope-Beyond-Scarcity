import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/hooks/use-auth";
import { bootstrapAnalytics, isTrackablePath, setAnalyticsUser, trackEvent, trackPageView } from "@/lib/analytics";

const SCROLL_MARKS = [25, 50, 75, 90, 100];
const DOWNLOAD_RE = /\.(pdf|docx?|xlsx?|csv|zip|pptx?|jpe?g|png|mp4)$/i;

/**
 * Site-wide automatic GA4 + first-party tracking.
 * Nothing fires on `/admin/**` or without "performance" consent — both guards
 * live inside `trackEvent`/`trackPageView`.
 */
export function useAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles } = useAuth();
  const startedAt = useRef(Date.now());
  const marks = useRef(new Set<number>());

  useEffect(() => {
    bootstrapAnalytics();
    trackEvent("session_start", {
      entry_page: window.location.pathname,
      referrer: document.referrer || "direct",
    });
  }, []);

  useEffect(() => {
    setAnalyticsUser(user?.id ?? null, roles);
    if (user?.id) trackEvent("member_identified", { member_role: roles[0] ?? "donor" });
  }, [user?.id, roles]);

  // Page views on every client-side navigation.
  useEffect(() => {
    marks.current.clear();
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => trackPageView(pathname), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Scroll depth.
  useEffect(() => {
    if (!isTrackablePath(pathname)) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / max) * 100));
      for (const mark of SCROLL_MARKS) {
        if (percent >= mark && !marks.current.has(mark)) {
          marks.current.add(mark);
          trackEvent("scroll_depth", { percent_scrolled: mark });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Delegated click tracking: CTAs, outbound links, downloads, tel/mailto.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("a,button,[data-analytics-event]");
      if (!el) return;

      const label =
        el.getAttribute("data-analytics-label") ||
        el.getAttribute("aria-label") ||
        el.textContent?.trim().slice(0, 80) ||
        "unknown";
      const custom = el.getAttribute("data-analytics-event");
      if (custom) {
        trackEvent(custom, { label, location: el.getAttribute("data-analytics-location") ?? "" });
        return;
      }

      if (el instanceof HTMLAnchorElement) {
        const href = el.getAttribute("href") ?? "";
        if (href.startsWith("mailto:")) return trackEvent("contact_email_click", { label });
        if (href.startsWith("tel:")) return trackEvent("contact_phone_click", { label });
        if (DOWNLOAD_RE.test(href)) return trackEvent("file_download", { file_name: href, label });
        if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) {
          return trackEvent("outbound_click", { link_url: href, label });
        }
        if (href.startsWith("/donate")) return trackEvent("donate_cta_click", { label, link_url: href });
        if (href.startsWith("/volunteer")) return trackEvent("volunteer_cta_click", { label });
        return trackEvent("internal_link_click", { link_url: href, label });
      }

      trackEvent("button_click", { label });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Form interactions.
  useEffect(() => {
    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      trackEvent("form_submit", {
        form_id: form.getAttribute("id") ?? form.getAttribute("name") ?? "form",
        form_page: window.location.pathname,
      });
    };
    const started = new WeakSet<HTMLFormElement>();
    const onFocus = (event: FocusEvent) => {
      const field = event.target as HTMLElement | null;
      const form = field?.closest("form");
      if (!form || started.has(form)) return;
      started.add(form);
      trackEvent("form_start", { form_id: form.getAttribute("id") ?? "form" });
    };
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("focusin", onFocus, true);
    };
  }, []);

  // Engagement time + exit.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      trackEvent("user_engagement", {
        engagement_time_msec: Date.now() - startedAt.current,
        exit_page: window.location.pathname,
      });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Client errors (useful signal, no personal data).
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackEvent("javascript_error", { message: String(event.message).slice(0, 180) });
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);
}
