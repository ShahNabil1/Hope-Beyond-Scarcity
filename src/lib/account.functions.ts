import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Google OAuth signs a brand-new person in and creates the account implicitly.
 * We only consider someone registered once they have accepted our policies
 * through the sign-up form. Anyone else is removed again and sent to sign-up.
 */
export const ensureRegistered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("policies_accepted_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) return { registered: true as const };
    if (data?.policies_accepted_at) return { registered: true as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(context.userId);

    return { registered: false as const };
  });
