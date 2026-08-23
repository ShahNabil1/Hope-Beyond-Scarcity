import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { passwordSchema } from "@/lib/password";

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

/** Re-authenticates with the current password before changing credentials. */
export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        currentPassword: z.string().min(1),
        newPassword: passwordSchema,
      })
      .refine((values) => values.currentPassword !== values.newPassword, {
        message: "Your new password must be different from your current password",
        path: ["newPassword"],
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const email = typeof context.claims.email === "string" ? context.claims.email : null;
    if (!email) return { error: "Your account email could not be verified." };

    const supabaseUrl = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!supabaseUrl || !publishableKey) {
      return { error: "Password service is temporarily unavailable." };
    }

    const verificationClient = createClient(supabaseUrl, publishableKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: verified, error: verificationError } =
      await verificationClient.auth.signInWithPassword({
        email,
        password: data.currentPassword,
      });

    if (verificationError || verified.user?.id !== context.userId) {
      return { error: "Your current password is incorrect." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });

    if (updateError) return { error: "Could not update your password. Please try again." };
    return { ok: true };
  });
