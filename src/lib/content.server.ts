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

export async function fetchNews() {
  const { data, error } = await publicClient()
    .from("news_posts")
    .select(
      "id,slug,title,excerpt,body,category,author_name,location,cover_image_url,published_at,is_featured",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
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
