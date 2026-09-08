# ADR 0003: Stripe Checkout with webhook-authoritative activation

- Status: Accepted
- Date: 2026-09-08

## Context

Phase 1 needs one-time package purchases, an auditable platform fee, and coach settlement. Offers can change after a client starts checkout, browser redirects can be forged or abandoned, and payment providers can deliver duplicate or out-of-order events.

## Decision

Use hosted Stripe Checkout in one-time payment mode for the initial USD market. Use Stripe Connect destination charges when a coach has a connected account, with a configurable platform fee whose initial value is 15 percent. Keep a sandbox provider for automated tests and local product rehearsals.

Creating checkout first stores a pending purchase containing an immutable offer snapshot and a pending payment attempt. Only a verified, unprocessed provider webhook may mark the payment paid, activate the purchase, and establish the coaching relationship. The checkout return page reads status and never activates a purchase. Duplicate provider event IDs are recorded once inside the activation transaction.

Phase 1 durations are 4, 8, or 12 weeks. Cancellation before activation cancels the pending purchase. Refunds after payment are recorded as payment transitions and handled through an audited administrative operation until automated refund policy is approved.

## Consequences

Checkout and webhook credentials are required in staging and production. Coaches need a Stripe connected account before live destination charges. Provider fees, refunds, disputes, and cross-border restrictions remain operational responsibilities of the platform.

## Revisit when

The launch market, settlement model, subscription billing, cancellation policy, or payment provider changes.
