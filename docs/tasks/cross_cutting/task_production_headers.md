# Task: Production COOP/COEP Headers Configuration

## Objective
Ensure the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers required for `SharedArrayBuffer` are configured at the production hosting layer, not just the dev server.

## Background
`vite.config.ts` already sets these headers for local development and preview mode. Without them at the hosting layer, DuckDB WASM silently fails in production because `SharedArrayBuffer` is unavailable.

## Implementation Steps

### 1. Cloudflare Pages
Create `static/_headers`:
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

### 2. Vercel (alternative)
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

### 3. Nginx (self-hosted / on-premise)
```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
```

### 4. Add to SvelteKit Adapter Config
If using `adapter-cloudflare`, `adapter-vercel`, etc., confirm the `_headers` or `vercel.json` file is picked up by the adapter's output step.

### 5. Automated Test
Add a CI check that fetches the deployed preview URL and asserts the response headers are present:
```typescript
// In a CI health check
const res = await fetch(PREVIEW_URL);
assert(res.headers.get('Cross-Origin-Opener-Policy') === 'same-origin');
assert(res.headers.get('Cross-Origin-Embedder-Policy') === 'require-corp');
```

## Acceptance Criteria
- [ ] `static/_headers` (Cloudflare Pages) committed and deployed.
- [ ] DuckDB WASM initializes correctly on the production URL (not just localhost).
- [ ] CI health check validates headers on every deploy.
