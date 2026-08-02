# Task: LocalMind "Lite" Mobile iOS/Android App (Capacitor)

## Objective
Convert the LocalMind Svelte 5 web application into a native mobile app wrapper using Capacitor. This will allow the finalized Phase 1 Analytics workspace to run on iOS and Android.

## Requirements

1. **Capacitor Installation**:
   - Install the required Capacitor dependencies: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
   - Initialize Capacitor in the root of the project with the App ID `com.localmind.app` and App Name `LocalMind`.

2. **Configuration**:
   - Ensure `capacitor.config.ts` points to the correct Vite build output directory (usually `build` for SvelteKit static adapters).
   - Update `vite.config.ts` if needed to ensure assets are bundled correctly for local mobile deployment (e.g., relative paths).

3. **Database Architecture**:
   - **CRITICAL**: Do NOT configure or install native SQLite plugins (like `@capacitor-community/sqlite`). 
   - We have decided to stick entirely to the `wa-sqlite` (WASM) implementation. Modern mobile webviews support WebAssembly perfectly, and keeping the WASM implementation avoids complex async bridging over the Capacitor native bridge. No database changes are required.

4. **Platforms**:
   - Add the `ios` and `android` Capacitor platforms.
   - Run `npx cap sync` to generate the native projects (you may need to mock this or ensure the native folders are generated/added to `.gitignore` appropriately).

## Deliverables
Open a PR containing the Capacitor configuration files (`capacitor.config.ts`), `package.json` dependency additions, and any `vite.config.ts` tweaks necessary for the mobile build.
