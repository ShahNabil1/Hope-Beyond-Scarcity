import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://hopebeyondscarcity.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/** Public, indexable static routes. Admin, dashboard, auth and thank-you pages are excluded. */
const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/news", changefreq: "daily", priority: "0.9" },
  { path: "/events", changefreq: "weekly", priority: "0.8" },
  { path: "/volunteer", changefreq: "weekly", priority: "0.8" },
  { path: "/donate", changefreq: "monthly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { fetchNews, fetchLegalPages } = await import("@/lib/content.server");
          const [news, legal] = await Promise.all([
            fetchNews().catch(() => []),
            fetchLegalPages().catch(() => []),
          ]);

          for (const post of news) {
            const entry: SitemapEntry = {
              path: `/news/${post.slug}`,
              changefreq: "monthly",
              priority: post.is_featured ? "0.8" : "0.7",
            };
            // Authoritative per-page timestamp: the story's publication date.
            if (post.published_at) entry.lastmod = new Date(post.published_at).toISOString();
            entries.push(entry);
          }

          for (const page of legal as { slug: string }[]) {
            entries.push({ path: `/legal/${page.slug}`, changefreq: "yearly", priority: "0.3" });
          }
        } catch {
          // A content outage must never produce a broken sitemap — ship the static set.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${xmlEscape(`${BASE_URL}${e.path}`)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
