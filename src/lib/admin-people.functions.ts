import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["admin", "editor", "donor"] as const;
const APPLICATION_STATUSES = ["new", "reviewing", "approved", "declined", "archived"] as const;
const PITCH_STATUSES = ["new", "reviewing", "approved", "declined", "archived"] as const;

/** Members: profiles joined with roles, giving totals, and volunteer signals. */
export const adminListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin, isAdmin } = await requireStaff(context.supabase, context.userId);

    const [
      { data: profiles },
      { data: roles },
      { data: donations },
      { data: subs },
      { data: apps },
      authUsers,
    ] = await Promise.all([
      admin
        .from("profiles")
        .select("id,full_name,email,phone,location,avatar_url,created_at,policies_accepted_at")
        .order("created_at", { ascending: false })
        .limit(500),
      admin.from("user_roles").select("user_id,role"),
      admin.from("donations").select("user_id,amount_cents,status"),
      admin.from("subscriptions").select("user_id,status"),
      admin.from("volunteer_applications").select("user_id,status"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as string]);
    }
    const givingMap = new Map<string, { cents: number; count: number }>();
    for (const d of donations ?? []) {
      if (!d.user_id) continue;
      const paid = ["paid", "succeeded", "complete"].includes(d.status ?? "");
      if (!paid) continue;
      const prev = givingMap.get(d.user_id) ?? { cents: 0, count: 0 };
      givingMap.set(d.user_id, { cents: prev.cents + (d.amount_cents ?? 0), count: prev.count + 1 });
    }
    const recurringSet = new Set(
      (subs ?? []).filter((s) => s.status === "active").map((s) => s.user_id),
    );
    const volunteerSet = new Set((apps ?? []).map((a) => a.user_id));
    const authMap = new Map<string, { banned_until: string | null; last_sign_in_at: string | null }>();
    for (const u of authUsers.data?.users ?? []) {
      const raw = u as unknown as { banned_until?: string | null };
      authMap.set(u.id, {
        banned_until: raw.banned_until ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      });
    }
    const now = Date.now();

    return {
      isAdmin,
      members: (profiles ?? []).map((p) => {
        const auth = authMap.get(p.id);
        const bannedUntil = auth?.banned_until ?? null;
        return {
          ...p,
          roles: roleMap.get(p.id) ?? [],
          giving_cents: givingMap.get(p.id)?.cents ?? 0,
          gifts: givingMap.get(p.id)?.count ?? 0,
          recurring: recurringSet.has(p.id),
          volunteer: volunteerSet.has(p.id),
          last_sign_in_at: auth?.last_sign_in_at ?? null,
          banned_until: bannedUntil,
          banned: Boolean(bannedUntil && new Date(bannedUntil).getTime() > now),
        };
      }),
    };
  });

/** Everything we know about one member: gifts, recurring gifts, applications, pitches. */
export const adminGetMemberDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ user_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin, isAdmin } = await requireStaff(context.supabase, context.userId);
    const uid = data.user_id;

    const [
      { data: profile },
      { data: roles },
      { data: donations },
      { data: subscriptions },
      { data: applications },
      { data: pitches },
      { data: comments },
      authUser,
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("id", uid).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", uid),
      admin
        .from("donations")
        .select(
          "id,amount_cents,currency,status,donation_type,environment,created_at,receipt_sent_at,stripe_payment_intent_id,stripe_session_id,email",
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("subscriptions")
        .select(
          "id,status,amount_cents,currency,current_period_start,current_period_end,cancel_at_period_end,environment,stripe_subscription_id,created_at",
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      admin
        .from("volunteer_applications")
        .select("id,interest_area,availability,status,message,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      admin
        .from("care_package_pitches")
        .select("id,title,status,estimated_cost_cents,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      admin
        .from("news_comments")
        .select("id,body,is_hidden,created_at,post_id")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
      admin.auth.admin.getUserById(uid),
    ]);

    const authRaw = authUser.data?.user as unknown as
      | { banned_until?: string | null; email_confirmed_at?: string | null }
      | undefined;
    const bannedUntil = authRaw?.banned_until ?? null;

    return {
      isAdmin,
      profile,
      roles: (roles ?? []).map((r) => r.role as string),
      donations: donations ?? [],
      subscriptions: subscriptions ?? [],
      applications: applications ?? [],
      pitches: pitches ?? [],
      comments: comments ?? [],
      auth: {
        email: authUser.data?.user?.email ?? null,
        created_at: authUser.data?.user?.created_at ?? null,
        last_sign_in_at: authUser.data?.user?.last_sign_in_at ?? null,
        email_confirmed_at: authRaw?.email_confirmed_at ?? null,
        provider: (authUser.data?.user?.app_metadata?.["provider"] as string | undefined) ?? null,
        banned_until: bannedUntil,
        banned: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
      },
    };
  });

/** Ban (suspend sign-in) or unban a member. Admin-only. */
export const adminSetMemberBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ user_id: z.string().uuid(), ban: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId, { adminOnly: true });
    if (data.user_id === context.userId) return { error: "You cannot ban your own account." };

    const { error } = await admin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.ban ? "876000h" : "none",
    } as never);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

/** Permanently delete a member's account and personal data. Admin-only. */
export const adminDeleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ user_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId, { adminOnly: true });
    if (data.user_id === context.userId) return { error: "You cannot delete your own account." };

    const { error: purgeError } = await admin.rpc("purge_account_data" as never, {
      _user_id: data.user_id,
    } as never);
    if (purgeError) return { error: purgeError.message };

    const { data: files } = await admin.storage.from("avatars").list(data.user_id);
    if (files?.length) {
      await admin.storage
        .from("avatars")
        .remove(files.map((file) => `${data.user_id}/${file.name}`));
    }

    const { error: authError } = await admin.auth.admin.deleteUser(data.user_id);
    if (authError) return { error: authError.message };
    return { ok: true };
  });


/** Grant or revoke a role. Admin-only. */
export const adminSetMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(ROLES),
        grant: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId, { adminOnly: true });

    if (!data.grant && data.user_id === context.userId && data.role === "admin") {
      return { error: "You cannot remove your own admin role." };
    }

    if (data.grant) {
      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) return { error: error.message };
    } else {
      const { error } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) return { error: error.message };
    }
    return { ok: true as const };
  });

/** Volunteer applications pipeline. */
export const adminListApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data, error } = await admin
      .from("volunteer_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(APPLICATION_STATUSES).optional(),
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
    const { error } = await admin.from("volunteer_applications").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

export const adminDeleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { error } = await admin.from("volunteer_applications").delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

/** Community care-package pitches submitted by supporters. */
export const adminListPitches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data, error } = await admin
      .from("care_package_pitches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdatePitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(PITCH_STATUSES).optional(),
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
    const { error } = await admin.from("care_package_pitches").update(patch).eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });
