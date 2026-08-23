import { createClient } from "@supabase/supabase-js";

import { sendDonationReceipt } from "@/lib/donation-receipt.server";
import type { StripeEnv } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<any>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

/**
 * Upserts the donation row for a Stripe checkout session and, for paid
 * donations, sends the PDF receipt exactly once (guarded by receipt_sent_at).
 * Safe to call from both the Stripe webhook and the thank-you page.
 */
export async function recordDonationFromSession(session: any, env: StripeEnv, status: string) {
  const { data, error } = await getSupabase()
    .from("donations")
    .upsert(
      {
        user_id: session.metadata?.userId ?? null,
        email: session.customer_details?.email ?? null,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "cad",
        donation_type: session.mode === "subscription" ? "monthly" : "one_time",
        status,
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id, receipt_sent_at, created_at")
    .maybeSingle();

  if (error) console.error("Donation upsert failed:", error.message);
  if (status !== "paid" || !data || data.receipt_sent_at) return;

  const email = session.customer_details?.email;
  if (!email) {
    console.error("Paid donation without an email; skipping receipt", session.id);
    return;
  }

  // Claim the receipt first so concurrent webhook + thank-you calls
  // cannot send the same receipt twice.
  const claim = await getSupabase()
    .from("donations")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("receipt_sent_at", null)
    .select("id")
    .maybeSingle();
  if (!claim.data) return;

  const result = await sendDonationReceipt({
    receiptNumber: `HBS-${String(session.id).slice(-10).toUpperCase()}`,
    donorName: session.customer_details?.name ?? undefined,
    donorEmail: email,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? "cad",
    donationType: session.mode === "subscription" ? "monthly" : "one_time",
    dateIso: data.created_at ?? new Date().toISOString(),
    environment: env,
  });

  if (!result.sent) {
    console.error("Receipt email failed:", result.error);
    // Release the claim so a later attempt can retry.
    await getSupabase().from("donations").update({ receipt_sent_at: null }).eq("id", data.id);
  }
}
