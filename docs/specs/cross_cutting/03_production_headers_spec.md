# Spec: Production COOP/COEP Headers

## 1. Overview
LocalMind requires `SharedArrayBuffer` to be available in the browser, which is mandatory for DuckDB WASM to use multi-threaded query execution. Modern browsers block `SharedArrayBuffer` unless the page is **cross-origin isolated**, which requires two specific HTTP response headers to be set at the hosting layer.

This spec defines what headers are required, how to configure them on every supported hosting platform, and how to validate they are working correctly.

## 2. Required Headers

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers must be set on **every response** from the origin serving LocalMind — not just the `index.html` — because WASM `.wasm` files, Workers `.js` files, and API responses are all affected.

## 3. Platform Configurations

### 3.1 Vite Dev Server (`vite.config.ts`)
Already handled in Task 1 (Core Scaffolding). Do not modify.

### 3.2 Cloudflare Pages (`public/_headers`)
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

### 3.3 Vercel (`vercel.json`)
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

### 3.4 Nginx (`nginx.conf`)
```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
```

## 4. Validation Checklist
- Open browser DevTools → Application → Security → verify "Cross-Origin Isolated: true".
- Run `crossOriginIsolated` in the browser console — must return `true`.
- Instantiate a `SharedArrayBuffer` — must succeed without a `SecurityError`.
- DuckDB WASM worker initialization must not throw `SharedArrayBuffer is not defined`.

## 5. Invariants
1. **Never ship without validation.** A missing header causes DuckDB to silently fall back to single-threaded mode, or fail entirely on Firefox.
2. **Third-party iframes are blocked** by these headers — document any third-party embeds (e.g., Stripe, analytics) and use `crossorigin="anonymous"` with a CORP-compatible CDN.
3. **Service Worker scope** must also serve COOP/COEP on all cached responses.
