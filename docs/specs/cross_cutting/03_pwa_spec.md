# Cross-Cutting: PWA & Offline Support Specification

## 1. Overview
LocalMind's core value proposition is **local-first processing with no data upload**. If the app fails to load because the user is offline (e.g., on an airplane, in a SCIF, or on a flaky network), that value proposition collapses. A PWA Service Worker caches the app shell and WASM bundles so the tool works fully after first load, regardless of network availability.

## 2. Strategy: Cache-First for Static Assets

Use a **cache-first** strategy for all static assets:
- App shell (HTML, CSS, JS bundles)
- WASM engine bundles (`duckdb-browser-*.wasm`, `ffmpeg-core.wasm`, etc.)
- Web Worker scripts

Use a **network-first with cache fallback** strategy for:
- Any dynamic content loaded from `localmind.dev` (e.g., changelog, remote model manifests)

## 3. Implementation

- Use **`vite-plugin-pwa`** (wraps Workbox) for automatic Service Worker generation and precaching manifest.
- The SvelteKit adapter must be configured to serve the Service Worker with correct `Cache-Control: no-cache` headers (so it is always refreshed on network availability).
- WASM bundles are large (2–50MB each). Cache them with a **versioned cache key** tied to the package version. On update, old caches are deleted after the new Service Worker activates.

```typescript
// vite.config.ts addition
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,wasm}'],
    maximumFileSizeToCacheInBytes: 60_000_000, // 60MB — covers large WASM bundles
    runtimeCaching: [
      {
        urlPattern: /\.wasm$/,
        handler: 'CacheFirst',
        options: { cacheName: 'wasm-cache', expiration: { maxAgeSeconds: 86400 * 30 } }
      }
    ]
  }
})
```

## 4. Web App Manifest

```json
{
  "name": "LocalMind",
  "short_name": "LocalMind",
  "description": "Privacy-first local data processing in the browser",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1117",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## 5. COOP/COEP and Service Workers

> ⚠️ **Known constraint:** `Cross-Origin-Embedder-Policy: require-corp` (required for `SharedArrayBuffer`) prevents the Service Worker from caching cross-origin requests. All WASM bundles must be **self-hosted** (not loaded from a CDN) to be cacheable by the Service Worker. This is already the correct approach for DuckDB WASM in the Phase 1 implementation.

## 6. UX

- On first install, show a subtle "App ready for offline use" toast after the Service Worker activates.
- When the app loads from cache while offline, show a discrete offline indicator in the header.
- Do NOT block the user from using local-processing features while offline. Only cloud AI features should be visually disabled when offline.

## 7. Task Reference
See `docs/tasks/cross_cutting/task_pwa.md`.
