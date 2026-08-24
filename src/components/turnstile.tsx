import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    });
    if (!existing) document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Shared hook so any form can read the configured site key. */
export function useTurnstileSiteKey() {
  const fetchKey = useServerFn(getTurnstileSiteKey);
  const { data } = useQuery({
    queryKey: ["turnstile-site-key"],
    queryFn: () => fetchKey(),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
  return data?.siteKey ?? "";
}

export type TurnstileHandle = { reset: () => void };

/**
 * Convenience hook: owns the captcha token plus a reset callback so forms can
 * clear the challenge after every submit attempt.
 */
export function useTurnstile() {
  const siteKey = useTurnstileSiteKey();
  const [token, setToken] = useState("");
  const ref = useRef<TurnstileHandle | null>(null);
  const reset = useCallback(() => {
    setToken("");
    ref.current?.reset();
  }, []);
  // When no site key is configured the captcha is simply skipped.
  const ready = !siteKey || Boolean(token);
  return { token, setToken, ref, reset, siteKey, ready };
}

export function Turnstile({
  onToken,
  handleRef,
  action,
  className,
  label = "Protected by Cloudflare Turnstile",
}: {
  onToken: (token: string) => void;
  handleRef?: React.MutableRefObject<TurnstileHandle | null>;
  action?: string;
  className?: string;
  label?: string;
}) {
  const siteKey = useTurnstileSiteKey();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [attempt, setAttempt] = useState(0);
  const domId = useId();

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    setStatus("idle");
    const el = containerRef.current;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        el.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          action,
          theme: "auto",
          size: "flexible",
          "refresh-expired": "auto",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "timeout-callback": () => onTokenRef.current(""),
          "error-callback": () => {
            onTokenRef.current("");
            setStatus("error");
          },
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {
        /* widget already gone */
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, action, attempt]);

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      reset: () => {
        try {
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        } catch {
          /* noop */
        }
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  if (!siteKey) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        id={domId}
        ref={containerRef}
        className={cn(
          "min-h-[65px] w-full overflow-hidden rounded-xl border border-border/70 bg-muted/30 p-1.5 transition-colors",
          status === "idle" && "animate-pulse",
          status === "error" && "border-destructive/50",
        )}
      />
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
        {status === "error" ? "Security check unavailable — please refresh." : label}
      </p>
    </div>
  );
}
