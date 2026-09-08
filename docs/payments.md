# Payments and settlement

Phase 1 uses one-time Stripe Checkout payments in USD. Stripe Connect destination charges transfer the charge to the coach connected account and return the configured application fee to the platform. The initial fee is 15 percent and remains configurable.

## Required production variables

- `PAYMENT_PROVIDER=stripe`
- `PAYMENT_CURRENCY=usd`
- `PLATFORM_FEE_BPS=1500`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `WEB_APP_URL`

Every coach accepting paid packages must have `coach_profiles.stripeAccountId` populated through an approved Connect onboarding process. Never place Stripe secrets in the web application.

Subscribe the webhook endpoint `/api/commerce/webhook` only to Checkout completion, asynchronous success/failure, and expiration events. The redirect page displays status; it never activates a coaching cycle.

Local and automated tests use `PAYMENT_PROVIDER=sandbox`. Send a JSON event to the same webhook with the `x-sandbox-signature` header set to `PAYMENT_SANDBOX_WEBHOOK_SECRET`. Sandbox mode refuses to create checkout in production.

## Cancellation and reconciliation

A client may cancel a pending purchase before payment. An active paid cycle can transition to completed or cancelled through the authorized operation. Refunds and disputes must be performed in Stripe and recorded against the payment attempt; production support must not alter package or payment rows manually.
