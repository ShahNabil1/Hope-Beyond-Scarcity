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

    const [{ data: profiles }, { data: roles }, { data: donations }, { data: subs }, { data: apps }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id,full_name,email,phone,location,avatar_url,created_at,policies_accepted_at")
          .order("created_at", { ascending: false })
          .limit(500),
        admin.from("user_roles").select("user_id,role"),
        admin.from("donations").select("user_id,amount_cents,status"),
        admin.from("subscriptions").select("user_id,status"),
        admin.from("volunteer_applications").select("user_id,status"),
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

    return {
      isAdmin,
      members: (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
        giving_cents: givingMap.get(p.id)?.cents ?? 0,
        gifts: givingMap.get(p.id)?.count ?? 0,
        recurring: recurringSet.has(p.id),
        volunteer: volunteerSet.has(p.id),
      })),
    };
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
