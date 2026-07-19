# Task: PWA & Offline Support

## Objective
Add a PWA Service Worker so LocalMind works fully offline after first load, and add a Web App Manifest for installability.

## Spec Reference
`docs/specs/cross_cutting/03_pwa_spec.md`

## Prerequisites
- COOP/COEP headers configured at production hosting layer (see `docs/tasks/cross_cutting/task_production_headers.md`).

## Implementation Steps

### 1. Install vite-plugin-pwa
```bash
npm install -D vite-plugin-pwa
```

### 2. Configure vite.config.ts
Add `VitePWA` plugin with Workbox config as specified in the PWA spec. Key settings:
- `registerType: 'autoUpdate'`
- `globPatterns: ['**/*.{js,css,html,wasm}']`
- `maximumFileSizeToCacheInBytes: 60_000_000`
- Cache-first strategy for `.wasm` files.

### 3. Add Web App Manifest
- Create `static/manifest.webmanifest` with fields from the spec.
- Create icon assets: `static/icon-192.png` and `static/icon-512.png`.
- Link manifest in `src/app.html`.

### 4. Add Offline UI Indicator
- In the root `+layout.svelte`, listen for `navigator.onLine` changes.
- When offline, show a subtle persistent banner: "Offline — local processing available, AI features paused."
- When online again, dismiss the banner after 3 seconds.

### 5. Add "App Ready for Offline Use" Toast
- When the Service Worker fires the `activated` event for the first time (new install), show a toast: "✓ LocalMind is ready for offline use."

### 6. Verify Self-Hosted WASM
- Confirm all WASM bundles are served from the same origin (no CDN fetches). COOP/COEP headers prevent cross-origin WASM from being cached by the Service Worker.

## Acceptance Criteria
- [ ] Lighthouse PWA audit score ≥ 90.
- [ ] App loads and DuckDB processes a file while Chrome DevTools Network is set to "Offline" (after first load).
- [ ] Web App Manifest passes Lighthouse checks.
- [ ] Offline banner appears and disappears correctly.
