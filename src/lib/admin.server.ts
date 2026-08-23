import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type StaffRole = "admin" | "editor";

/**
 * Verifies the caller holds a staff role using their own (RLS-scoped) client,
 * then hands back the privileged client for admin-wide reads/writes.
 */
export async function requireStaff(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: { adminOnly?: boolean } = {},
) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  let isEditor = false;
  if (!isAdmin && !options.adminOnly) {
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "editor" });
    isEditor = Boolean(data);
  }
  if (!isAdmin && !isEditor) throw new Error("Forbidden");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { admin: supabaseAdmin, isAdmin: Boolean(isAdmin) };
}
