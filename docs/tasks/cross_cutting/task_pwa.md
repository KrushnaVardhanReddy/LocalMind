# Task: PWA & Offline Support

## Objective
Transform LocalMind into a fully installable Progressive Web App with offline capability. The app shell, all WASM bundles, and static assets must be cached by a Service Worker so the tool functions completely without an internet connection after the first load.

## Prerequisites
- Review `docs/specs/cross_cutting/04_pwa_spec.md`.
- Tasks: Production Headers must be complete (Service Worker needs COOP/COEP forwarding).

## Implementation Steps

### 1. Install vite-plugin-pwa
```bash
bun add -D vite-plugin-pwa
```

### 2. Configure vite-plugin-pwa
- In `vite.config.ts`, add the `VitePWA()` plugin with the following config:
  - `registerType: 'prompt'` — do not auto-update; prompt the user.
  - `includeAssets`: include all `.wasm` files, icons, and fonts.
  - `workbox.runtimeCaching`: configure `CacheFirst` for WASM files (match `/\.wasm$/`), `NetworkOnly` for AI API calls (match `/api\/ai/`).
  - `manifest`: use the manifest defined in `04_pwa_spec.md`.

### 3. Create App Icons
- Generate `static/icons/icon-192.png` and `static/icons/icon-512.png` (maskable-safe).
- Ensure the 512px icon has the LocalMind logo centered with a 20% safe-zone padding.

### 4. Implement Install Prompt UI
- In `src/lib/stores/pwa.store.ts`, capture the `beforeinstallprompt` event and store the deferred prompt.
- In the app header, add an "Install App" button that:
  - Is only visible when the deferred prompt is available.
  - On click, calls `deferredPrompt.prompt()`.
  - Hides itself after the user accepts or dismisses.

### 5. Implement Update Toast
- In `src/routes/+layout.svelte`, use `vite-plugin-pwa`'s `useRegisterSW` composable.
- When `needRefresh` is true, show a Svelte toast/snackbar: "A new version is available. [Reload]"
- The `[Reload]` button calls `updateServiceWorker(true)`.

### 6. Offline Status Indicator
- In `src/lib/components/StatusBar.svelte`, listen to `window.addEventListener('online'/'offline')`.
- Show a subtle pill badge in the footer: `⚡ Offline Mode` when disconnected.
- All local processing buttons must remain enabled; only cloud AI buttons should be disabled with a tooltip: "Requires internet connection."

## Definition of Done
- Lighthouse PWA audit score: 100.
- App installs from Chrome address bar prompt.
- Loading the app with DevTools → Network throttle set to "Offline" renders the full UI.
- All DuckDB and Tesseract operations function while offline.
- **No mocks.** Service Worker must be the real `workbox` implementation — no stub scripts.
