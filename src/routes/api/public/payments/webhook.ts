import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

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

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: typeof item?.price?.product === "string" ? item.price.product : null,
        price_id: item?.price?.lookup_key ?? item?.price?.id ?? null,
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
}

async function markSubscriptionCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function recordDonation(session: any, env: StripeEnv, status: string) {
  await getSupabase()
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
    );
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markSubscriptionCanceled(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      await recordDonation(session, env, session.payment_status === "unpaid" ? "pending" : "paid");
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await recordDonation(event.data.object, env, "paid");
      break;
    case "checkout.session.async_payment_failed":
      await recordDonation(event.data.object, env, "failed");
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
