# LocalMind AI Proxy: Architecture Specification

## 1. Overview
Phase 1 implements a strict **BYOK (Bring Your Own Key)** model: users supply their own OpenAI-compatible API key, held in-memory and sent directly from the browser to the AI provider. LocalMind's servers never see the key or the request.

The **LocalMind Proxy** is an optional, subscription-funded alternative that removes BYOK friction for non-technical users. Instead of managing API keys, a user pays a LocalMind subscription and the proxy forwards their request using LocalMind's organizational API keys.

> **This does not compromise privacy.** The proxy is strictly a request forwarder — it logs nothing, stores nothing, and never sees raw file content (only the aggregated, user-approved payload).

## 2. Architecture

```
Browser → HTTPS → LocalMind Proxy (Cloudflare Worker)
                        │
                        │  (forwards with org API key, drops all metadata)
                        ▼
                  AI Provider (OpenAI / Anthropic / etc.)
                        │
                        ▼
                  Response → Browser
```

## 3. The Stateless Guarantee

The Cloudflare Worker MUST:
- **Not** log request bodies, response bodies, or IP addresses.
- **Not** write to KV, D1, R2, or any storage binding.
- **Not** attach any identifying headers to the upstream request.
- Strip the `X-Forwarded-For` header before forwarding.
- Add a `X-LocalMind-Proxy: 1` header (for provider-side debugging only — contains no user data).

The worker's only job is:
1. Verify the user's LocalMind subscription JWT (via a lightweight KV-backed token validation — only the token hash is checked, not the payload content).
2. Swap the `Authorization` header with the org-level API key.
3. Forward the request body verbatim.
4. Return the response verbatim.

## 4. Authentication

```
User logs in → LocalMind Auth (Cloudflare Access / JWT)
                     → Issues a short-lived session token (24h TTL)
                     → Token stored in-memory in the Svelte app

On proxy request:
  Authorization: Bearer <session_token>
  → Worker validates token hash against KV (no user data in KV — only token hashes + expiry)
  → Swaps for org API key
  → Forwards to AI provider
```

## 5. Rate Limiting & Metering

- Use **Cloudflare Workers Rate Limiting** to cap requests per token per minute (prevents abuse).
- Track usage (request count, token count from response headers) in **Cloudflare Analytics Engine** — no request bodies, only aggregate counters keyed to an anonymous user ID.
- When a user exceeds their plan's monthly AI credit allocation, the worker returns `429 Too Many Requests` with a `Retry-After` header and a body of `{ "error": "monthly_ai_credits_exhausted" }`.

## 6. Privacy Audit Points

| Claim | How It Is Enforced |
|---|---|
| Proxy logs nothing | No `console.log` of body/headers; Cloudflare logpush disabled for this worker |
| No raw file data | Client-side consent flow strips raw data before building the payload |
| Stateless | No storage bindings in `wrangler.jsonc` for this worker |
| Open source | Proxy Worker source is published in the `localmind-proxy` public repo |

## 7. Stripe Metering Integration

- On successful upstream response, the worker publishes a metering event to the **Stripe Billing Meters API** via a Cloudflare Queue (fire-and-forget, non-blocking).
- The queue consumer worker increments the usage meter for the user's subscription.
- The event contains: `{ meter: 'ai_tokens', quantity: <tokens_used>, customer: <stripe_customer_id> }` — no request content.

## 8. Deployment

- Deployed as a standalone Cloudflare Worker in the `localmind-proxy` repository.
- `wrangler.jsonc` bindings: KV (token hashes only), Queue (metering events), Rate Limiter.
- No D1, no R2, no AI binding.

## 9. Task Reference
See `docs/tasks/cross_cutting/task_proxy.md`.
