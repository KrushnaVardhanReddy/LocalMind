# Task: Production COOP/COEP Headers

## Objective
Configure the correct `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` HTTP headers on all deployment targets so that `SharedArrayBuffer` is available in production, enabling DuckDB WASM's multi-threaded query engine.

## Prerequisites
- Review `docs/specs/cross_cutting/03_production_headers_spec.md`.
- Task 1 (Core Scaffolding) must be complete — dev server headers are already set in `vite.config.ts`.

## Implementation Steps

### 1. Cloudflare Pages Config
- Create `static/_headers` (SvelteKit static assets directory).
- Add the following content:
  ```
  /*
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
  ```

### 2. Vercel Config (Fallback)
- Create `vercel.json` in the project root:
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

### 3. Service Worker Header Forwarding
- In `src/service-worker.ts`, intercept fetch requests and append COOP/COEP headers to cached responses before serving them offline.
- This ensures that WASM workers served from Cache Storage remain cross-origin isolated.

### 4. Runtime Validation on Startup
- In `src/lib/utils/env-check.ts`, create an exported function `validateCrossOriginIsolation()`.
- The function checks `window.crossOriginIsolated`.
- If `false`, display a non-dismissible error banner: "SharedArrayBuffer is unavailable. DuckDB multi-threading is disabled. Contact your hosting provider."
- Log the error to the browser console with remediation steps.

### 5. Call Validation on App Init
- Call `validateCrossOriginIsolation()` inside `src/routes/+layout.svelte`'s `onMount`.

## Definition of Done
- Deploying to Cloudflare Pages produces `crossOriginIsolated === true` in the browser console.
- `new SharedArrayBuffer(1024)` does not throw a `SecurityError` in production.
- The DuckDB worker initializes successfully without falling back to single-threaded mode.
- The error banner renders correctly if the headers are misconfigured.
