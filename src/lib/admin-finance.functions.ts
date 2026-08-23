import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DONATION_STATUSES = ["pending", "paid", "failed", "refunded", "canceled"] as const;

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", ...DONATION_STATUSES]).default("all"),
  type: z.enum(["all", "one_time", "monthly"]).default("all"),
  limit: z.number().int().min(1).max(500).default(200),
});

export type AdminDonationRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  donor_name: string | null;
  amount_cents: number;
  currency: string;
  donation_type: string;
  status: string;
  environment: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_sent_at: string | null;
  created_at: string;
};

/** Full donation ledger with donor names, plus headline totals. */
export const adminListDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin, isAdmin } = await requireStaff(context.supabase, context.userId);

    let query = admin
      .from("donations")
      .select(
        "id,user_id,email,amount_cents,currency,donation_type,status,environment,stripe_session_id,stripe_payment_intent_id,receipt_sent_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.type !== "all") query = query.eq("donation_type", data.type);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))] as string[];
    const nameMap = new Map<string, { name: string | null; email: string | null }>();
    if (userIds.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id,full_name,email")
        .in("id", userIds);
      for (const p of profiles ?? []) nameMap.set(p.id, { name: p.full_name, email: p.email });
    }

    const term = (data.search ?? "").toLowerCase();
    const donations: AdminDonationRow[] = (rows ?? [])
      .map((r) => ({
        ...r,
        donor_name: r.user_id ? (nameMap.get(r.user_id)?.name ?? null) : null,
        email: r.email ?? (r.user_id ? (nameMap.get(r.user_id)?.email ?? null) : null),
      }))
      .filter(
        (r) =>
          !term ||
          (r.donor_name ?? "").toLowerCase().includes(term) ||
          (r.email ?? "").toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term) ||
          (r.stripe_payment_intent_id ?? "").toLowerCase().includes(term),
      );

    const paid = donations.filter((d) => d.status === "paid");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return {
      isAdmin,
      donations,
      totals: {
        count: donations.length,
        paidCount: paid.length,
        paidCents: paid.reduce((sum, d) => sum + d.amount_cents, 0),
        monthCents: paid
          .filter((d) => new Date(d.created_at) >= monthStart)
          .reduce((sum, d) => sum + d.amount_cents, 0),
        avgCents: paid.length
          ? Math.round(paid.reduce((sum, d) => sum + d.amount_cents, 0) / paid.length)
          : 0,
      },
    };
  });

/** Recurring gifts across all donors. */
export const adminListSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin, isAdmin } = await requireStaff(context.supabase, context.userId);

    const { data: rows, error } = await admin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const nameMap = new Map<string, { name: string | null; email: string | null }>();
    if (userIds.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id,full_name,email")
        .in("id", userIds);
      for (const p of profiles ?? []) nameMap.set(p.id, { name: p.full_name, email: p.email });
    }

    const subscriptions = (rows ?? []).map((r) => ({
      ...r,
      donor_name: nameMap.get(r.user_id)?.name ?? null,
      donor_email: nameMap.get(r.user_id)?.email ?? null,
    }));

    const active = subscriptions.filter((s) => s.status === "active");
    return {
      isAdmin,
      subscriptions,
      totals: {
        active: active.length,
        mrrCents: active.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0),
        cancelling: active.filter((s) => s.cancel_at_period_end).length,
      },
    };
  });

/** Regenerate any donor's receipt PDF for download. */
export const adminDownloadReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ donationId: z.string().uuid() }).parse(data))
  .handler(
    async ({ data, context }): Promise<{ fileName: string; pdfBase64: string } | { error: string }> => {
      const { requireStaff } = await import("@/lib/admin.server");
      const { admin } = await requireStaff(context.supabase, context.userId);

      const { data: donation } = await admin
        .from("donations")
        .select("id,user_id,email,amount_cents,currency,donation_type,status,created_at,environment")
        .eq("id", data.donationId)
        .maybeSingle();
      if (!donation) return { error: "Donation not found." };

      let donorName: string | undefined;
      let donorEmail = donation.email ?? "";
      if (donation.user_id) {
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name,email")
          .eq("id", donation.user_id)
          .maybeSingle();
        donorName = profile?.full_name ?? undefined;
        donorEmail = donorEmail || (profile?.email ?? "");
      }

      const { buildReceiptPdfBase64 } = await import("@/lib/receipt.server");
      const receiptNumber = `HBS-${donation.id.replace(/-/g, "").slice(-10).toUpperCase()}`;
      const pdfBase64 = await buildReceiptPdfBase64({
        receiptNumber,
        donorName,
        donorEmail,
        amountCents: donation.amount_cents,
        currency: donation.currency,
        donationType: donation.donation_type === "monthly" ? "monthly" : "one_time",
        dateIso: donation.created_at,
        environment: donation.environment === "live" ? "live" : "sandbox",
      });
      return { fileName: `${receiptNumber}.pdf`, pdfBase64 };
    },
  );

/** Email (or re-email) the official receipt to the donor. */
export const adminResendReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ donationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId);

    const { data: donation } = await admin
      .from("donations")
      .select("id,user_id,email,amount_cents,currency,donation_type,status,created_at,environment")
      .eq("id", data.donationId)
      .maybeSingle();
    if (!donation) return { error: "Donation not found." };
    if (donation.status !== "paid") return { error: "Only completed gifts have receipts." };

    let donorName: string | undefined;
    let donorEmail = donation.email ?? "";
    if (donation.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name,email")
        .eq("id", donation.user_id)
        .maybeSingle();
      donorName = profile?.full_name ?? undefined;
      donorEmail = donorEmail || (profile?.email ?? "");
    }
    if (!donorEmail) return { error: "This gift has no email on file." };

    const { sendDonationReceipt } = await import("@/lib/donation-receipt.server");
    try {
      await sendDonationReceipt({
        receiptNumber: `HBS-${donation.id.replace(/-/g, "").slice(-10).toUpperCase()}`,
        donorName,
        donorEmail,
        amountCents: donation.amount_cents,
        currency: donation.currency,
        donationType: donation.donation_type === "monthly" ? "monthly" : "one_time",
        dateIso: donation.created_at,
        environment: donation.environment === "live" ? "live" : "sandbox",
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not send the receipt." };
    }

    await admin
      .from("donations")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", donation.id);

    return { ok: true as const, sentTo: donorEmail };
  });

/** Admin-only manual correction of a donation status. */
export const adminUpdateDonationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ donationId: z.string().uuid(), status: z.enum(DONATION_STATUSES) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId, { adminOnly: true });
    const { error } = await admin
      .from("donations")
      .update({ status: data.status })
      .eq("id", data.donationId);
    if (error) return { error: error.message };
    return { ok: true as const };
  });

/** Admin-only: stop or resume any donor's recurring gift at the period end. */
export const adminSetSubscriptionCancel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ subscriptionId: z.string().uuid(), cancel: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/lib/admin.server");
    const { admin } = await requireStaff(context.supabase, context.userId, { adminOnly: true });

    const { data: row } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, environment")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!row) return { error: "Recurring gift not found." };
    const environment = row.environment === "live" ? "live" : "sandbox";

    const { setRecurringCancellation } = await import("@/lib/portal.server");
    return setRecurringCancellation({
      environment,
      stripeSubscriptionId: row.stripe_subscription_id,
      cancelAtPeriodEnd: data.cancel,
    });
  });
