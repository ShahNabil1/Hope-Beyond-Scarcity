import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Missing Supabase public environment variables");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchPrograms() {
  const { data, error } = await publicClient()
    .from("programs")
    .select(
      "id,slug,name,summary,description,focus_area,location,icon,impact_stat,impact_label,highlights,image_url,gallery_images",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

const NEWS_FIELDS =
  "id,slug,title,headline,excerpt,body,category,tags,author_name,location,cover_image_url,gallery_images,video_url,read_minutes,published_at,is_featured";

export async function fetchNews() {
  const { data, error } = await publicClient()
    .from("news_posts")
    .select(NEWS_FIELDS)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type NewsPost = Awaited<ReturnType<typeof fetchNews>>[number];

export async function fetchNewsPost(slug: string) {
  const client = publicClient();
  const { data, error } = await client
    .from("news_posts")
    .select(NEWS_FIELDS)
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: related } = await client
    .from("news_posts")
    .select("id,slug,title,excerpt,category,cover_image_url,published_at")
    .eq("is_active", true)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  return { post: data, related: related ?? [] };
}


export async function fetchEvents() {
  const { data, error } = await publicClient()
    .from("events")
    .select(
      "id,slug,title,summary,description,event_type,starts_at,ends_at,venue,city,is_virtual,capacity,registration_url,is_featured",
    )
    .eq("is_active", true)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchSponsors() {
  const { data, error } = await publicClient()
    .from("sponsors")
    .select(
      "id,slug,name,tier,summary,description,website_url,logo_url,contribution_label,location,since_year,is_featured",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchVolunteerRoles() {
  const { data, error } = await publicClient()
    .from("volunteer_roles")
    .select(
      "id,slug,title,summary,description,interest_area,commitment,location,is_remote,skills,spots_available",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchSiteSettings() {
  const { data, error } = await publicClient()
    .from("site_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchImpactStats() {
  const { data, error } = await publicClient()
    .from("impact_stats")
    .select("id,icon,value,suffix,display,label,caption,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPartners() {
  const { data, error } = await publicClient()
    .from("partners")
    .select("id,name,logo_url,url,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Everything the homepage needs, in one round-trip. */
export async function fetchHomeContent() {
  const [settings, stats, partners] = await Promise.all([
    fetchSiteSettings(),
    fetchImpactStats(),
    fetchPartners(),
  ]);
  return { settings, stats, partners };
}

const LEGAL_FIELDS = "id,slug,title,summary,body,effective_date,updated_at";

export async function fetchLegalPages() {
  const { data, error } = await publicClient()
    .from("legal_pages")
    .select(LEGAL_FIELDS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchLegalPage(slug: string) {
  const { data, error } = await publicClient()
    .from("legal_pages")
    .select(LEGAL_FIELDS)
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type LegalPage = NonNullable<Awaited<ReturnType<typeof fetchLegalPage>>>;

/** Monotonic marker bumped whenever staff publish content — drives cache busting. */
export async function fetchContentVersion() {
  const { data, error } = await publicClient()
    .from("site_settings")
    .select("content_version,updated_at")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { version: Number(data?.content_version ?? 1), updatedAt: data?.updated_at ?? null };
}

export async function fetchAboutPage() {
  const { normalizeAbout } = await import("./about-content");
  const { data, error } = await publicClient()
    .from("about_page")
    .select("content")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeAbout(data?.content ?? null);
}
