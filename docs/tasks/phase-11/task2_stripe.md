# Task 2: Stripe Billing Integration

## Objective
Implement the Stripe billing layer — checkout sessions for Pro subscriptions and AI Credit top-ups, webhook handling for payment confirmation and credit issuance, and a usage dashboard for users to track their AI credit consumption.

## Prerequisites
- Review `docs/specs/phase-11/01_monetization_proxy_spec.md` (Section 5).
- Task 1 (Cloudflare Proxy) must be complete — credits are stored in KV.

## Implementation Steps

### 1. Stripe Products Setup
Create in the Stripe Dashboard:
- **Product:** "LocalMind Pro" — $12/month recurring.
- **Product:** "AI Credits — 100k tokens" — $3 one-time.
- **Product:** "AI Credits — 500k tokens" — $12 one-time.

### 2. Checkout Endpoint (`POST /billing/checkout`)
- Create `src/handlers/checkout.ts` in the Cloudflare Worker.
- Accepts `{ product: 'pro' | 'credits_100k' | 'credits_500k', userId }`.
- Creates a Stripe Checkout Session via the Stripe API.
- Returns `{ checkoutUrl }` — the browser redirects the user to Stripe's hosted checkout.
- After payment, Stripe redirects to `https://localmind.dev/billing/success?session_id=...`.

### 3. Stripe Webhook Handler (`POST /billing/webhook`)
- Create `src/handlers/webhook.ts`.
- Verify Stripe signature using `stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)`.
- On `payment_intent.succeeded`:
  - Parse the metadata to determine which product was purchased.
  - Call `creditLedger.addCredits(userId, creditsToAdd)` to top up KV.
- On `customer.subscription.created` (Pro plan): set `KV.put('user:{userId}:tier', 'pro')`.
- On `customer.subscription.deleted`: revert tier to `'free'`.

### 4. Usage Dashboard UI
- Create `src/routes/billing/+page.svelte` (authenticated route).
- Displays:
  - Current tier (Free / Pro / Enterprise) with upgrade CTA.
  - AI Credits remaining this month (from `GET /billing/usage`).
  - Monthly credit reset countdown.
  - Credit purchase options with pricing.
- "Upgrade to Pro" button → calls `POST /billing/checkout` and redirects to Stripe.
- "Buy AI Credits" section with the available top-up options.

### 5. Credit Display in Header
- Show a small credit balance indicator in the app header when the user has < 20% of their monthly credits remaining.
- Tooltip: "X credits remaining. Purchase more →".

## Definition of Done
- Completing a test Stripe Checkout (using Stripe test cards) triggers the webhook and adds credits to KV.
- The billing dashboard shows the correct updated credit balance.
- Cancelling a Pro subscription via Stripe immediately downgrades the tier on next API call.
- **No mocks.** Real Stripe test mode API with real webhook endpoint.
- Webhook signature verification rejects requests without a valid Stripe signature (returns `400`).

---

# Phase 11: End-to-End Testing

## Objective
Validate the billing flow — checkout, webhook credit issuance, and balance display — using Stripe test mode.

## Test Cases (`tests/phase-11/`)

```typescript
// proxy.spec.ts
test('Valid JWT routes AI request through proxy', async () => {
    // Call POST /api/ai/complete with a valid test JWT and sufficient credits
    // Assert: response streams back successfully
    // Assert: credits are deducted in KV
});

test('Insufficient credits returns 402', async () => {
    // Set credits to 0 in KV for test user
    // Call POST /api/ai/complete
    // Assert: 402 response with "insufficient_credits" error
});

// billing.spec.ts
test('Webhook adds credits after payment', async () => {
    // Simulate Stripe webhook POST /billing/webhook with test event
    // Assert: user KV credits increased by expected amount
});
```

## Definition of Done
- Tests pass against the deployed Cloudflare Worker in test environment.
- **No mocks.** Real Stripe test API + real Cloudflare KV.
- Webhook signature validation is tested: invalid signatures return `400`.
