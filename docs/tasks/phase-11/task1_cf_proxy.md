# Task 1: Cloudflare Proxy API for AI Credits

## Objective
Implement the stateless LocalMind AI Credits proxy on Cloudflare Workers — handling subscription JWT validation, credit tracking via KV, and secure forwarding to OpenAI/Anthropic — so users can access AI features without managing their own API keys.

## Prerequisites
- Review `docs/specs/phase-11/01_monetization_proxy_spec.md`.
- Cloudflare Workers, KV, and Secrets must be configured.

## Implementation Steps

### 1. Create the Cloudflare Worker
```bash
bunx wrangler generate localmind-proxy
cd localmind-proxy
```

### 2. Implement JWT Validation Middleware
- Create `src/middleware/auth.ts`.
- Extract `Authorization: Bearer <token>` from the request.
- Verify using `jose` library: `jwtVerify(token, RS256_PUBLIC_KEY)`.
- Validate claims: `tier === 'pro' || 'enterprise'`, `exp > Date.now() / 1000`.
- Return `{ userId, tier }` or a `401` response.

### 3. Credit Ledger (KV)
- Create `src/credits.ts`.
- `getCredits(userId)`: `KV.get('user:{userId}:credits', 'json')`.
- `deductCredits(userId, tokensUsed)`: compute credit cost (`tokensUsed / 1000 * rate`), update KV.
- `resetMonthlyCredits(userId)`: called by a Cloudflare Cron Trigger on the 1st of each month.

### 4. AI Provider Forwarding
- Create `src/handlers/complete.ts`.
- On `POST /api/ai/complete`:
  1. Validate JWT → get `userId`.
  2. Check credits → return `402` if insufficient.
  3. Forward the request body to the appropriate provider (`openai` or `anthropic`).
  4. Stream the response back to the client using `TransformStream`.
  5. After streaming completes, deduct credits based on usage from the response headers.
- The master API key is read from `env.OPENAI_API_KEY` (Cloudflare Secret).

### 5. Rate Limiting
- Configure Cloudflare Rate Limiting rule: 60 requests/minute per IP.
- Apply an additional application-level check: 120 requests/hour per `userId`.

### 6. Deploy
```bash
bunx wrangler secret put OPENAI_API_KEY
bunx wrangler secret put JWT_PUBLIC_KEY
bunx wrangler kv:namespace create LOCALMIND_CREDITS
bunx wrangler deploy
```

## Definition of Done
- A valid Pro-tier JWT + sufficient credits → AI request is forwarded and response is streamed.
- An invalid JWT → `401` response.
- Insufficient credits → `402` response with remaining credit count.
- **No logs of request bodies.** Verify in Cloudflare Dashboard logs that no AI payload content appears.
- Rate limiting returns `429` after 60 requests/minute from the same IP.
