import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public site key for the Cloudflare Turnstile widget. It is a publishable
 * value, but we serve it from the server so it can be rotated from the secret
 * store without a rebuild. Returns an empty string when unconfigured, which
 * makes every form degrade gracefully instead of breaking.
 */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(async () => {
  return { siteKey: process.env["TURNSTILE_SITE_KEY"] ?? "" };
});

/**
 * Server-side verification for our own (non-Supabase) forms. Supabase verifies
 * the captcha itself for auth endpoints; this covers contact / application
 * submissions.
 */
export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().max(4096).default("") }).parse(data),
  )
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) return { ok: true as const, skipped: true as const };
    if (!data.token) return { ok: false as const };

    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: data.token }),
      });
      const json = (await res.json()) as { success?: boolean };
      return { ok: json.success === true };
    } catch {
      return { ok: false as const };
    }
  });
