import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const settingsSchema = z.object({
  emergency_active: z.boolean(),
  emergency_headline: z.string().trim().min(1).max(120),
  emergency_message: z.string().trim().max(600),
  emergency_cta_label: z.string().trim().max(60),
  emergency_cta_url: z.string().trim().max(300),
  emergency_starts_at: z.string().nullable(),
  emergency_ends_at: z.string().nullable(),
  contact_intro: z.string().trim().max(1000),
  contact_address: z.string().trim().max(300),
  contact_email: z.string().trim().max(200),
  contact_phone: z.string().trim().max(80),
  contact_hours: z.string().trim().max(200),
  contact_map_url: z.string().trim().max(500),
  social_facebook: z.string().trim().max(300),
  social_instagram: z.string().trim().max(300),
  social_linkedin: z.string().trim().max(300),
  social_youtube: z.string().trim().max(300),
  social_x: z.string().trim().max(300),
  social_tiktok: z.string().trim().max(300),
  social_whatsapp: z.string().trim().max(300),
  campaign_active: z.boolean().optional(),
  hero_badge: z.string().trim().max(2000).optional(),
  hero_title: z.string().trim().max(2000).optional(),
  hero_subtitle: z.string().trim().max(2000).optional(),
  hero_primary_label: z.string().trim().max(2000).optional(),
  hero_primary_url: z.string().trim().max(2000).optional(),
  hero_secondary_label: z.string().trim().max(2000).optional(),
  hero_secondary_url: z.string().trim().max(2000).optional(),
  hero_trust_note: z.string().trim().max(2000).optional(),
  hero_image_url: z.string().trim().max(2000).optional(),
  mission_eyebrow: z.string().trim().max(2000).optional(),
  mission_title: z.string().trim().max(2000).optional(),
  mission_body_1: z.string().trim().max(2000).optional(),
  mission_body_2: z.string().trim().max(2000).optional(),
  mission_cta_label: z.string().trim().max(2000).optional(),
  mission_cta_url: z.string().trim().max(2000).optional(),
  mission_image_url: z.string().trim().max(2000).optional(),
  impact_eyebrow: z.string().trim().max(2000).optional(),
  impact_title: z.string().trim().max(2000).optional(),
  impact_intro: z.string().trim().max(2000).optional(),
  campaign_eyebrow: z.string().trim().max(2000).optional(),
  campaign_title: z.string().trim().max(2000).optional(),
  campaign_body: z.string().trim().max(2000).optional(),
  campaign_goal_label: z.string().trim().max(2000).optional(),
  campaign_goal_value: z.string().trim().max(2000).optional(),
  campaign_cost_label: z.string().trim().max(2000).optional(),
  campaign_cost_value: z.string().trim().max(2000).optional(),
  campaign_primary_label: z.string().trim().max(2000).optional(),
  campaign_primary_url: z.string().trim().max(2000).optional(),
  campaign_secondary_label: z.string().trim().max(2000).optional(),
  campaign_secondary_url: z.string().trim().max(2000).optional(),
  campaign_image_url: z.string().trim().max(2000).optional(),
  partners_heading: z.string().trim().max(2000).optional(),
  cta_title: z.string().trim().max(2000).optional(),
  cta_body: z.string().trim().max(2000).optional(),
  cta_primary_label: z.string().trim().max(2000).optional(),
  cta_primary_url: z.string().trim().max(2000).optional(),
  cta_secondary_label: z.string().trim().max(2000).optional(),
  cta_secondary_url: z.string().trim().max(2000).optional(),
});

/** Staff view of the site settings singleton. */
export const adminGetSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data, error } = await admin
      .from("site_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const version = Date.now();
    const patch = {
      ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
      // Bumping the version invalidates every visitor's cached copy, on any device.
      content_version: version,
    };
    const { error } = await admin
      .from("site_settings")
      .update(patch as never)
      .eq("id", "default");
    if (error) return { error: error.message };
    return { ok: true as const, version };

  });

/** Counts and totals for the admin overview dashboard. */
export const adminGetOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const count = async (
      table:
        | "programs"
        | "news_posts"
        | "events"
        | "volunteer_roles"
        | "profiles"
        | "contact_messages"
        | "volunteer_applications"
        | "subscriptions",
      apply?: (q: any) => any,
    ) => {
      let q: any = admin.from(table).select("id", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [
      programs,
      news,
      events,
      roles,
      members,
      newMessages,
      pendingApplications,
      activeRecurring,
    ] = await Promise.all([
      count("programs", (q) => q.eq("is_active", true)),
      count("news_posts", (q) => q.eq("is_active", true)),
      count("events", (q) => q.eq("is_active", true)),
      count("volunteer_roles", (q) => q.eq("is_active", true)),
      count("profiles"),
      count("contact_messages", (q) => q.eq("status", "new")),
      count("volunteer_applications", (q) => q.in("status", ["new", "reviewing", "pending"])),
      count("subscriptions", (q) => q.eq("status", "active")),
    ]);

    const { data: monthDonations } = await admin
      .from("donations")
      .select("amount_cents,status,created_at")
      .gte("created_at", monthStart.toISOString());

    const paid = (monthDonations ?? []).filter(
      (d) => d.status === "paid" || d.status === "succeeded" || d.status === "complete",
    );
    const monthTotalCents = paid.reduce((sum, d) => sum + (d.amount_cents ?? 0), 0);

    const { data: recent } = await admin
      .from("donations")
      .select("id,amount_cents,currency,donation_type,status,email,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    return {
      programs,
      news,
      events,
      roles,
      members,
      newMessages,
      pendingApplications,
      activeRecurring,
      monthTotalCents,
      monthCount: paid.length,
      recent: recent ?? [],
    };
  });

/** Contact form inbox. */
export const adminListMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data, error } = await admin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "read", "replied", "archived"]).optional(),
        admin_notes: z.string().max(2000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const patch: { status?: string; admin_notes?: string | null } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    const { error } = await admin.from("contact_messages").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { error } = await admin.from("contact_messages").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

/** Public contact form submission. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        subject: z.string().trim().min(2).max(150),
        message: z.string().trim().min(10).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return { error: "Messaging is temporarily unavailable." };
    const client = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from("contact_messages").insert(data);
    if (error) return { error: "Your message could not be sent. Please try again." };
    return { ok: true as const };
  });

/**
 * Bumps the global content version so every browser and device drops its
 * persisted public cache on the next page load.
 */
export const adminBumpContentVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const version = Date.now();
    const { error } = await (admin as any)
      .from("site_settings")
      .update({ content_version: version })
      .eq("id", "default");
    if (error) return { error: error.message };
    return { ok: true as const, version };
  });

/** Staff view of the About page document. */
export const adminGetAbout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { normalizeAbout } = await import("@/lib/about-content");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data, error } = await admin
      .from("about_page")
      .select("content,updated_at")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { content: normalizeAbout(data?.content ?? null), updatedAt: data?.updated_at ?? null };
  });

export const adminSaveAbout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (data: unknown) => {
    const { aboutContentSchema } = await import("@/lib/about-content");
    return aboutContentSchema.parse(data);
  })
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { error } = await admin
      .from("about_page")
      .upsert({ id: "default", content: data as never });
    if (error) return { error: error.message };
    // Bumping the shared version invalidates every visitor's cached copy.
    const version = Date.now();
    await admin.from("site_settings").update({ content_version: version }).eq("id", "default");
    return { ok: true as const, version };
  });
