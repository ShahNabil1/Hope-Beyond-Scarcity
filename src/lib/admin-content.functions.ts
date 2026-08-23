import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTENT_COLUMNS, CONTENT_TABLES, type ContentTable } from "@/lib/admin-content";

const tableSchema = z.enum(CONTENT_TABLES as unknown as [ContentTable, ...ContentTable[]]);

const valueSchema = z.union([
  z.string().max(20000),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string().max(1000)).max(60),
]);

/** Keeps writes to the columns we intentionally expose in the CMS. */
function sanitize(table: ContentTable, values: Record<string, unknown>) {
  const allowed = CONTENT_COLUMNS[table];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (allowed.includes(key)) out[key] = value;
  }
  return out;
}

export const adminListContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ table: tableSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { data: rows, error } = await admin
      .from(data.table)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Record<string, any>[];
  });

export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        table: tableSchema,
        id: z.string().uuid().nullable().optional(),
        values: z.record(z.string(), valueSchema),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const values = sanitize(data.table, data.values);
    if (Object.keys(values).length === 0) return { error: "Nothing to save." };

    if (data.id) {
      const { error } = await admin.from(data.table).update(values).eq("id", data.id);
      if (error) return { error: error.message };
      return { ok: true as const, id: data.id };
    }

    const { data: created, error } = await admin
      .from(data.table)
      .insert(values as any)
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { ok: true as const, id: created?.id as string };
  });

export const adminDeleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ table: tableSchema, id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { error } = await admin.from(data.table).delete().eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

export const adminToggleContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        table: tableSchema,
        id: z.string().uuid(),
        field: z.enum(["is_active", "is_featured"]),
        value: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);
    const { error } = await admin
      .from(data.table)
      .update({ [data.field]: data.value })
      .eq("id", data.id);
    if (error) return { error: error.message };
    return { ok: true as const };
  });
