# Platform Robustness

LocalMind's robustness strategy covers five areas: CI/CD, Security, Error Recovery, User Onboarding, and Accessibility. These are non-functional requirements that determine production quality and user trust.

---

## CI/CD Pipeline

Every PR to `feature/dev` or `main` runs the following GitHub Actions checks automatically:

| Check | Command | Failure = Block Merge |
|---|---|---|
| TypeScript | `bun run check` | ✅ Yes |
| ESLint | `bun run lint` | ✅ Yes |
| Unit Tests | `bun run test` | ✅ Yes |
| Production Build | `bun run build` | ✅ Yes |
| Bundle Size Guard | Custom CI step | ✅ Yes (main JS chunk > 500KB gzipped fails) |
| WASM Lazy-Load Check | Manual PR review | ✅ Yes (no WASM imports in main bundle) |
| a11y Audit | `axe-playwright` in E2E suite | ✅ Yes (zero WCAG 2.1 AA violations) |

E2E tests (`playwright test`) run on push to `feature/dev` (post-merge) to avoid slow CI on every PR.

---

## Content Security Policy

A strict CSP header is applied to every response. This prevents unauthorized data exfiltration even if a malicious WASM plugin or XSS vulnerability is introduced.

**Key directives:**
- `connect-src 'self' <AI provider domains only>` — blocks all unlisted outbound connections
- `script-src 'self' 'wasm-unsafe-eval'` — required for WASM; no inline scripts
- `frame-src 'none'` — prevents clickjacking
- `object-src 'none'` — blocks legacy plugin embeds

Additional security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

To add a new AI provider to the allowlist, update the `CSP_HEADER` constant in `vite.config.ts` and `public/_headers`.

---

## Worker Error Boundary

If a WASM worker crashes (OOM, corrupt input, malformed SQL), LocalMind:

1. Catches the error event in `WorkerManager`.
2. Emits a typed `WorkerCrashEvent` to the `workerHealth` Svelte store.
3. `WorkerErrorToast` in `+layout.svelte` shows a recovery toast:
   > ⚠️ DuckDB worker crashed. [Restart Worker]
4. "Restart Worker" calls `WorkerManager.restart('duckdb')` — re-initializes the worker and re-registers OPFS virtual files.

OOM is detected heuristically: if a worker message times out after 30s, it's treated as a crash with a "file may be too large" message.

**Rule:** Never let a worker crash silently. Always emit to `workerCrashes` store.

---

## WASM Cache Versioning

WASM bundles are cached permanently by the PWA Service Worker to enable offline use. Cache invalidation on updates:

- Each cache bucket is named with the app version: `wasm-cache-v1.3.0`
- On `APP_VERSION` bump, the Service Worker purges old cache buckets on activation
- Users see an update toast: "LocalMind updated — DuckDB upgraded for faster queries. [Reload]"
- Renovate bot creates weekly PRs for WASM dependency updates (labeled `wasm-update`)

---

## First-Run Onboarding

New users are guided to their "aha moment" within 30 seconds:

1. **Auto-loaded demo dataset** — `demo_sales.csv` loads automatically on first visit.
2. **Animated hotspots** — Pulsing rings guide the user to drag their first columns.
3. **Onboarding checklist** — 5-step progress tracker persists in `localStorage`.
4. **Shelf tooltips** — `?` icons explain each shelf zone on hover.

Onboarding is gated by `localStorage.getItem('localmind_onboarded')`. Set this to `'v1'` on completion to prevent re-showing.

---

## Accessibility (WCAG 2.1 AA)

LocalMind commits to WCAG 2.1 AA on all core workspaces. Key requirements:

| Requirement | Implementation |
|---|---|
| Keyboard navigation | All elements Tab-reachable; shelves support keyboard drag-and-drop |
| Focus indicators | Visible ring on all interactive elements — never `outline: none` |
| Color contrast | Minimum 4.5:1 for body text; 3:1 for large text and UI components |
| ARIA roles | Drop zones `role="region"`, charts `role="img"`, tables use `scope` |
| Live regions | Async state changes (query results, loading) announced via `aria-live` |
| Modal focus trapping | All modals trap Tab focus inside until dismissed |

a11y is validated automatically via `axe-playwright` in the E2E suite on every PR. Zero violations required to merge.
