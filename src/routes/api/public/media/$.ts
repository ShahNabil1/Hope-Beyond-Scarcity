import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_BUCKETS = new Set(["program-images"]);

/**
 * Serves CMS media from private storage buckets over a stable public URL:
 *   /api/public/media/<bucket>/<path...>
 * Only read access to whitelisted buckets is exposed.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as Record<string, string>)["_splat"] ?? "";
        const [bucket, ...rest] = splat.split("/");
        const path = rest.join("/");
        if (!bucket || !path || !ALLOWED_BUCKETS.has(bucket) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
