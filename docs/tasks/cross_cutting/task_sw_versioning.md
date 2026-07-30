# Service Worker Cache Versioning & WASM Update Strategy

## Objective
Fix the stale WASM cache problem: currently, when DuckDB or any WASM engine ships an update, existing users never receive it because the PWA Service Worker caches WASM bundles permanently with no invalidation strategy. This also causes silent failures when WASM API contracts change.

## Implementation

### 1. Cache Versioning Strategy
Add a `CACHE_VERSION` constant (e.g., `v1.3.0`) to `vite-pwa` config. When the version changes, the Service Worker automatically purges old caches on activation.

In `vite.config.ts` (vite-pwa plugin config):
```typescript
VitePWA({
  workbox: {
    // Cache WASM files with a versioned cache name
    additionalManifestEntries: [],
    runtimeCaching: [
      {
        urlPattern: /\.wasm$/,
        handler: 'CacheFirst',
        options: {
          cacheName: `wasm-cache-${APP_VERSION}`,
          expiration: {
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
    // Clean up old versioned WASM caches on activation
    cleanupOutdatedCaches: true,
  },
})
```

### 2. Update Notification (Already Exists — Improve It)
The current update toast in `+layout.svelte` shows "A new version is available — Reload". Improve it:
- Show what changed: "🔄 **LocalMind updated** — DuckDB upgraded to v1.2 for faster queries. [Reload Now]"
- Store a simple changelog object in `vite.config.ts` that maps version → description.

### 3. WASM Version Mismatch Detection
When a worker initializes, it logs its WASM module version to the console. Add a runtime check:
- If cached WASM version != expected version, force-clear the WASM cache entry and re-fetch.
- Show a one-time "Updating DuckDB engine..." loading indicator.

### 4. Dependency Update Automation (Renovate)
Create `.github/renovate.json`:
```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchPackagePatterns": ["@duckdb/*", "echarts", "@sqlite.org/*"],
      "automerge": false,
      "labels": ["dependencies", "wasm-update"]
    }
  ],
  "schedule": ["every weekend"]
}
```
This creates weekly PRs for WASM dependency updates, labeled so you can review them as a batch.

## Acceptance Criteria
- [ ] Changing `APP_VERSION` in config causes the Service Worker to purge the old WASM cache on next activation.
- [ ] New version update toast shows a human-readable changelog string.
- [ ] WASM version mismatch triggers a cache-bust and re-fetch.
- [ ] `renovate.json` config present — Renovate bot creates weekly WASM update PRs.
- [ ] Old versioned caches are cleaned up automatically (no unbounded cache growth).
- [ ] Unit tests verify the cache-busting logic.
