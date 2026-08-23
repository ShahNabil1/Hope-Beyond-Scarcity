import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StripeEnv = "sandbox" | "live";

const isEnv = (value: unknown): value is StripeEnv => value === "sandbox" || value === "live";
const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Generates the official PDF receipt for one of the caller's own donations. */
export const downloadReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { donationId: string }) => {
    if (!isUuid(data.donationId)) throw new Error("Invalid donation id");
    return data;
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<{ fileName: string; pdfBase64: string } | { error: string }> => {
      const { data: donation, error } = await context.supabase
        .from("donations")
        .select("id, amount_cents, currency, donation_type, status, created_at, email, environment")
        .eq("id", data.donationId)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (error || !donation) return { error: "Receipt not found for this account." };
      if (donation.status !== "paid") {
        return { error: "A receipt is only available for completed donations." };
      }

      const { data: profile } = await context.supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", context.userId)
        .maybeSingle();

      const { buildReceiptPdfBase64 } = await import("@/lib/receipt.server");
      const receiptNumber = `HBS-${donation.id.replace(/-/g, "").slice(-10).toUpperCase()}`;
      const pdfBase64 = await buildReceiptPdfBase64({
        receiptNumber,
        donorName: profile?.full_name ?? undefined,
        donorEmail: donation.email ?? profile?.email ?? "",
        amountCents: donation.amount_cents,
        currency: donation.currency,
        donationType: donation.donation_type === "monthly" ? "monthly" : "one_time",
        dateIso: donation.created_at,
        environment: donation.environment === "live" ? "live" : "sandbox",
      });

      return { fileName: `${receiptNumber}.pdf`, pdfBase64 };
    },
  );

/** Upgrade or downgrade the caller's monthly gift. */
export const updateRecurringAmount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { subscriptionId: string; amountInCents: number }) => {
    if (!isUuid(data.subscriptionId)) throw new Error("Invalid subscription id");
    if (!Number.isInteger(data.amountInCents)) throw new Error("Invalid amount");
    if (data.amountInCents < 500 || data.amountInCents > 10_000_000) {
      throw new Error("Monthly gifts must be between $5 and $100,000 CAD.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("stripe_subscription_id, environment, status")
      .eq("id", data.subscriptionId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!row || !isEnv(row.environment)) return { error: "Recurring gift not found." };
    if (row.status === "canceled") return { error: "This recurring gift is already cancelled." };

    const { changeRecurringAmount } = await import("@/lib/portal.server");
    return changeRecurringAmount({
      environment: row.environment,
      stripeSubscriptionId: row.stripe_subscription_id,
      amountInCents: data.amountInCents,
    });
  });

/** Cancel (or resume) the caller's monthly gift at the end of the paid period. */
export const setRecurringCancelAtPeriodEnd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { subscriptionId: string; cancel: boolean }) => {
    if (!isUuid(data.subscriptionId)) throw new Error("Invalid subscription id");
    if (typeof data.cancel !== "boolean") throw new Error("Invalid request");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("stripe_subscription_id, environment")
      .eq("id", data.subscriptionId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!row || !isEnv(row.environment)) return { error: "Recurring gift not found." };

    const { setRecurringCancellation } = await import("@/lib/portal.server");
    return setRecurringCancellation({
      environment: row.environment,
      stripeSubscriptionId: row.stripe_subscription_id,
      cancelAtPeriodEnd: data.cancel,
    });
  });

/** Stripe customer portal link for managing the saved payment method. */
export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { subscriptionId: string; returnUrl: string }) => {
    if (!isUuid(data.subscriptionId)) throw new Error("Invalid subscription id");
    if (!data.returnUrl.startsWith("http")) throw new Error("Invalid return URL");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id, environment")
      .eq("id", data.subscriptionId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!row || !isEnv(row.environment)) return { error: "Recurring gift not found." };

    const { createBillingPortalUrl } = await import("@/lib/portal.server");
    return createBillingPortalUrl({
      environment: row.environment,
      stripeCustomerId: row.stripe_customer_id,
      returnUrl: data.returnUrl,
    });
  });

/**
 * Right to be forgotten: purges the caller's profile, roles, volunteer records
 * and login credentials while anonymising donation rows, which must be kept
 * for statutory accounting.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { confirmation: string }) => {
    if (data?.confirmation !== "DELETE") throw new Error("Confirmation text does not match.");
    return data;
  })
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: purgeError } = await supabaseAdmin.rpc("purge_account_data" as never, {
      _user_id: context.userId,
    } as never);
    if (purgeError) return { error: "We could not delete your data. Please contact us." };

    const { data: files } = await supabaseAdmin.storage.from("avatars").list(context.userId);
    if (files?.length) {
      await supabaseAdmin.storage
        .from("avatars")
        .remove(files.map((file) => `${context.userId}/${file.name}`));
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (authError) return { error: "We could not remove your login. Please contact us." };

    return { ok: true };
  });
