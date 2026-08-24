import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, X } from "lucide-react";

import { getSiteSettings } from "@/lib/content.functions";
import { isEmergencyLive } from "@/lib/site-settings";

export function EmergencyBanner() {
  const fetchSettings = useServerFn(getSiteSettings);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });
  const [dismissed, setDismissed] = useState(false);
  // The banner depends on cached/persisted client data, so it renders only
  // after hydration to keep the server and client markup identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || dismissed || !isEmergencyLive(data ?? null)) return null;


  const headline = data?.emergency_headline?.trim() || "Emergency Appeal";
  const ctaLabel = data?.emergency_cta_label?.trim() || "Give now";
  const ctaUrl = data?.emergency_cta_url?.trim() || "/donate";

  return (
    <div className="w-full bg-urgent text-urgent-foreground">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 text-sm sm:items-center sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {headline}
          </span>
          <p className="flex-1 text-urgent-foreground/90">{data?.emergency_message}</p>
          <a
            href={ctaUrl}
            className="w-fit shrink-0 rounded-full bg-urgent-foreground/15 px-4 py-1.5 font-semibold underline-offset-4 transition-colors hover:bg-urgent-foreground/25"
          >
            {ctaLabel}
          </a>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss emergency appeal"
          className="-mr-1 shrink-0 rounded-full p-1 transition-colors hover:bg-urgent-foreground/20"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
