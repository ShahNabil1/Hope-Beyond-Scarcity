import { createClient } from "@supabase/supabase-js";

import { sendDonationReceipt } from "@/lib/donation-receipt.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

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

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/** Keeps the local subscription row in sync with Stripe. */
export async function upsertSubscriptionFromStripe(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Subscription is missing userId metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) {
    console.error("Subscription is missing a customer", subscription.id);
    return;
  }

  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const { error } = await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      product_id: typeof item?.price?.product === "string" ? item.price.product : null,
      price_id:
        item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id ?? item?.price?.id ?? null,
      amount_cents: item?.price?.unit_amount ?? null,
      currency: item?.price?.currency ?? "cad",
      status: subscription.status,
      current_period_start: isoFromUnix(periodStart),
      current_period_end: isoFromUnix(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) throw new Error(`Subscription sync failed: ${error.message}`);
}

/**
 * Checkout completion is a reliable fallback when subscription webhooks are
 * delayed or unavailable. It also repairs an already-completed monthly gift
 * when the donor revisits the thank-you URL.
 */
export async function syncSubscriptionFromSession(session: any, env: StripeEnv) {
  if (session.mode !== "subscription") return;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    console.error("Monthly checkout is missing a subscription", session.id);
    return;
  }

  const stripe = createStripeClient(env);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscriptionFromStripe(subscription, env);
}

/**
 * Upserts the donation row for a Stripe checkout session and, for paid
 * donations, sends the PDF receipt exactly once (guarded by receipt_sent_at).
 * Safe to call from both the Stripe webhook and the thank-you page.
 */
export async function recordDonationFromSession(session: any, env: StripeEnv, status: string) {
  if (status === "paid" && session.mode === "subscription") {
    await syncSubscriptionFromSession(session, env);
  }

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

/**
 * Records a recurring renewal charge (Stripe invoice) as a donation and emails
 * the PDF receipt once. The first invoice of a subscription is skipped because
 * the checkout session already recorded it.
 */
export async function recordDonationFromInvoice(invoice: any, env: StripeEnv) {
  if (invoice.billing_reason === "subscription_create") return;

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : (invoice.subscription?.id ?? invoice.parent?.subscription_details?.subscription ?? null);

  let userId: string | null = null;
  if (subscriptionId) {
    const { data: sub } = await getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    userId = (sub as any)?.user_id ?? null;
  }

  const email = invoice.customer_email ?? null;
  const amountCents = invoice.amount_paid ?? invoice.total ?? 0;

  const { data, error } = await getSupabase()
    .from("donations")
    .upsert(
      {
        user_id: userId,
        email,
        amount_cents: amountCents,
        currency: invoice.currency ?? "cad",
        donation_type: "monthly",
        status: "paid",
        stripe_session_id: invoice.id,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id, receipt_sent_at, created_at")
    .maybeSingle();

  if (error) console.error("Recurring donation upsert failed:", error.message);
  if (!data || data.receipt_sent_at || !email) return;

  const claim = await getSupabase()
    .from("donations")
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("receipt_sent_at", null)
    .select("id")
    .maybeSingle();
  if (!claim.data) return;

  const result = await sendDonationReceipt({
    receiptNumber: `HBS-${String(invoice.id).slice(-10).toUpperCase()}`,
    donorName: invoice.customer_name ?? undefined,
    donorEmail: email,
    amountCents,
    currency: invoice.currency ?? "cad",
    donationType: "monthly",
    dateIso: data.created_at ?? new Date().toISOString(),
    environment: env,
  });

  if (!result.sent) {
    console.error("Recurring receipt email failed:", result.error);
    await getSupabase().from("donations").update({ receipt_sent_at: null }).eq("id", data.id);
  }
}

/** Marks a declined recurring charge and emails the donor with fix + retry links. */
export async function handleInvoicePaymentFailed(
  invoice: any,
  env: StripeEnv,
  dashboardUrl: string,
) {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : (invoice.subscription?.id ?? invoice.parent?.subscription_details?.subscription ?? null);

  if (subscriptionId) {
    await getSupabase()
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscriptionId);
  }

  const email = invoice.customer_email;
  if (!email) return;

  const { sendPaymentFailedEmail } = await import("@/lib/subscription-email.server");
  const result = await sendPaymentFailedEmail({
    to: email,
    donorName: invoice.customer_name ?? undefined,
    amountCents: invoice.amount_due ?? invoice.total ?? 0,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    dashboardUrl,
    nextAttemptIso: invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000).toISOString()
      : null,
  });
  if (!result.sent) console.error("Decline email failed:", result.error);
}
