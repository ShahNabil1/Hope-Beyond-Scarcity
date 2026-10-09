import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { getAboutPage } from "@/lib/content.functions";

/**
 * Allow-list sanitizer for the About page rich text. Pure string code so it
 * runs identically on the server (on save and on read) and in the browser.
 * Only paragraphs, line breaks, bold, italic, lists and safe links survive.
 */
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"]);

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeHref(raw: string): string | null {
  const href = raw
    .replace(/&amp;/g, "&")
    .replace(/[\u0000-\u001F\u007F\s]+/g, "")
    .trim();
  if (!href) return null;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  return null;
}

export function sanitizeRichText(input: string): string {
  if (!input) return "";
  let html = String(input);
  // Drop whole dangerous blocks including their content.
  html = html.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  return html.replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    const closing = match.startsWith("</");
    if (!ALLOWED_TAGS.has(tag)) return "";
    const norm = tag === "b" ? "strong" : tag === "i" ? "em" : tag;
    if (closing) return norm === "br" ? "" : `</${norm}>`;
    if (norm === "br") return "<br>";
    if (norm === "a") {
      const m = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const href = m ? safeHref(m[1] ?? m[2] ?? m[3] ?? "") : null;
      if (!href) return "<a>";
      const external = /^https?:/i.test(href);
      return `<a href="${escapeAttr(href)}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""}>`;
    }
    return `<${norm}>`;
  });
}

/** Strips tags for plain-text checks (e.g. "is this empty?"). */
export function richTextToPlain(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const line = (max: number) => z.string().trim().max(max);
const required = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be under ${max} characters`);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^(https?:\/\/|\/(?!\/)|mailto:|tel:|#)/i.test(v), "Use a full https:// link or a path like /donate");
const rich = (max: number) =>
  z
    .string()
    .max(max * 2, "Text is too long")
    .transform((v) => sanitizeRichText(v));

export const founderSchema = z.object({
  id: z.string().trim().min(1).max(80),
  visible: z.boolean(),
  name: required(100, "Name"),
  role: line(80),
  location: line(120),
  image_url: line(1000),
  story: rich(8000),
  quote: line(600),
});

export const aboutContentSchema = z.object({
  seo_title: required(70, "SEO title"),
  seo_description: required(200, "SEO description"),
  hero: z.object({
    eyebrow: line(60),
    title: required(160, "Headline"),
    description: line(400),
  }),
  intro: z.object({ visible: z.boolean(), lead: line(1200), sub: line(600) }),
  founders: z.array(founderSchema).max(12, "Up to 12 founders"),
  convergence: z.object({
    visible: z.boolean(),
    eyebrow: line(60),
    title: line(160),
    body: rich(4000),
    highlight: line(400),
  }),
  mission: z.object({
    visible: z.boolean(),
    statement: line(240),
    body: line(600),
    primary_label: line(40),
    primary_url: url,
    secondary_label: line(40),
    secondary_url: url,
  }),
});

export type AboutContent = z.infer<typeof aboutContentSchema>;
export type Founder = AboutContent["founders"][number];

export const ABOUT_FALLBACK: AboutContent = {
  seo_title: "About Us | Hope Beyond Scarcity",
  seo_description:
    "Rajasree Roy and Lilibet Yang founded Hope Beyond Scarcity in Toronto to fund the months after one-time generosity runs out and walk with families toward lasting change.",
  hero: {
    eyebrow: "Our Story",
    title: "Hope begins with people who refuse to look away",
    description:
      "Founded in Toronto by Rajasree Roy and Lilibet Yang, Hope Beyond Scarcity exists to fund the months after one-time generosity runs out.",
  },
  intro: { visible: false, lead: "", sub: "" },
  founders: [],
  convergence: { visible: false, eyebrow: "", title: "", body: "", highlight: "" },
  mission: {
    visible: true,
    statement: "Hope Beyond Scarcity exists to fund the months after that.",
    body: "A Canadian not-for-profit corporation, based in Toronto, walking with families beyond scarcity — one sustained month at a time.",
    primary_label: "Donate Now",
    primary_url: "/donate",
    secondary_label: "Get Involved",
    secondary_url: "/volunteer",
  },
};

/** Merges a stored record over the fallback so a missing key never breaks the page. */
export function normalizeAbout(raw: unknown): AboutContent {
  const parsed = aboutContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const r = (raw ?? {}) as Partial<AboutContent>;
  return {
    ...ABOUT_FALLBACK,
    ...r,
    hero: { ...ABOUT_FALLBACK.hero, ...(r.hero ?? {}) },
    intro: { ...ABOUT_FALLBACK.intro, ...(r.intro ?? {}) },
    convergence: {
      ...ABOUT_FALLBACK.convergence,
      ...(r.convergence ?? {}),
      body: sanitizeRichText(r.convergence?.body ?? ""),
    },
    mission: { ...ABOUT_FALLBACK.mission, ...(r.mission ?? {}) },
    founders: Array.isArray(r.founders)
      ? r.founders.map((f) => ({ ...f, story: sanitizeRichText(f?.story ?? "") }))
      : [],
  } as AboutContent;
}

export const aboutPageQueryOptions = queryOptions({
  queryKey: ["about-page"],
  queryFn: async () => {
    try {
      return await getAboutPage();
    } catch {
      return ABOUT_FALLBACK;
    }
  },
  staleTime: 5 * 60_000,
  gcTime: 24 * 60 * 60_000,
  refetchOnMount: "always",
});
