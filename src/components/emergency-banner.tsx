import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, X } from "lucide-react";

type EmergencyBannerProps = {
  active?: boolean;
  headline?: string;
  message?: string;
};

export function EmergencyBanner({
  active = true,
  headline = "Emergency Appeal",
  message = "Monsoon flooding has displaced families in southern Bangladesh. Every $50 delivers a family care package this week.",
}: EmergencyBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (!active || dismissed) return null;

  return (
    <div className="w-full bg-urgent text-urgent-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {headline}
        </span>
        <p className="flex-1 text-urgent-foreground/90">{message}</p>
        <Link
          to="/donate"
          className="shrink-0 rounded-full bg-urgent-foreground/15 px-4 py-1.5 font-semibold underline-offset-4 transition-colors hover:bg-urgent-foreground/25"
        >
          Give now
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss emergency appeal"
          className="hidden rounded-full p-1 transition-colors hover:bg-urgent-foreground/20 sm:block"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
