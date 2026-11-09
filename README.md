# Hope Beyond Scarcity

The website and donation portal for Hope Beyond Scarcity, a Canadian not-for-profit. It uses TanStack Start, React, and Supabase.

## Local development

Install Node.js and Bun, then run these commands from the repository directory:

```sh
bun install --frozen-lockfile
bun run dev
```

Run `bun run build` to create a production build. Google Analytics is optional and uses `VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID`.

## Deployment configuration

The production build defaults to the Nitro Cloudflare Workers preset. Set build variables and server secrets on the hosting platform.

| Variables | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser access to Supabase |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Server-side access to Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Stripe publishable key for the matching environment |
| `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY` | Direct Stripe API keys for the existing sandbox and live accounts |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET` | Signing secrets for the matching Stripe webhook endpoints |
| `RESEND_API_KEY` | Direct Resend API key with access to the verified receipt sender domain |

The Stripe webhook endpoint is `/api/public/payments/webhook?env=sandbox` for sandbox or `/api/public/payments/webhook?env=live` for live. Verify checkout, webhook delivery, and receipt email in the sandbox before switching the live deployment.
