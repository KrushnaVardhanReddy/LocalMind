# Content Security Policy (CSP)

## Objective
Add a strict Content Security Policy to every response header so that even if a malicious WASM plugin or XSS vulnerability is introduced, data exfiltration to unauthorized domains is blocked at the browser level. For a privacy-first product, this is non-negotiable.

## Implementation

### 1. CSP Header Definition
Add to `vite.config.ts` dev server headers and Cloudflare Pages `_headers` file:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self'
    https://api.openai.com
    https://api.anthropic.com
    https://generativelanguage.googleapis.com;
  worker-src 'self' blob:;
  child-src blob:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

**Key decisions:**
- `wasm-unsafe-eval` — required by all WASM modules (DuckDB, FFmpeg, etc.)
- `connect-src` — whitelists only known AI provider domains; any rogue plugin connecting to an unlisted domain is blocked
- `frame-src 'none'` — prevents clickjacking
- `object-src 'none'` — blocks Flash/plugins

### 2. Vite Dev Server (`vite.config.ts`)
```typescript
server: {
  headers: {
    'Content-Security-Policy': CSP_HEADER,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

### 3. Cloudflare Pages (`public/_headers`)
```
/*
  Content-Security-Policy: <full CSP string>
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 4. CSP Report-Only Mode (Development)
During development, use `Content-Security-Policy-Report-Only` with a local report endpoint (`/csp-report`) to catch violations without breaking the dev server. Switch to enforcing mode in production.

### 5. CSP Validation Test
Add a Playwright test that:
- Intercepts all network requests during a typical user flow.
- Asserts no requests go to domains not in the allowlist.
- Asserts no `Content-Security-Policy-Report-Only` violations appear in the browser console.

## Acceptance Criteria
- [ ] CSP header present on all routes in production (validate via `curl -I`).
- [ ] WASM engines (DuckDB, FFmpeg, etc.) continue working with `wasm-unsafe-eval`.
- [ ] Connecting to a non-whitelisted domain is blocked in the browser console.
- [ ] All additional security headers present: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] Playwright test validates no unexpected network connections.
- [ ] No CSP violations in the browser console during normal usage.
