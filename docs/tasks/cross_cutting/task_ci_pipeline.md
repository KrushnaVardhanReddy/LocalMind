# CI/CD Pipeline — GitHub Actions

## Objective
Establish a GitHub Actions CI pipeline that automatically validates every Jules PR before merge. Without this, Jules-generated PRs can silently break TypeScript types, fail unit tests, or balloon the bundle size — and you'd only catch it after reviewing and merging.

## Implementation

### 1. PR Validation Workflow (`.github/workflows/ci.yml`)
Triggers on: every `pull_request` to `main` or `feature/dev`.

Steps:
1. `bun install`
2. `bun run check` — Svelte type checking
3. `bun run lint` — ESLint
4. `bun run test` — Vitest unit tests (all `*.test.ts` files)
5. `bun run build` — production build (verifies no import errors)
6. **Bundle size report** — compare against baseline, fail if main JS bundle > 500KB or any WASM is eagerly imported on main thread

### 2. E2E Workflow (`.github/workflows/e2e.yml`)
Triggers on: push to `feature/dev` only (after PR merge).

Steps:
1. Install Playwright browsers: `bunx playwright install --with-deps chromium firefox webkit`
2. `bun run dev &` — start dev server
3. `bunx playwright test` — run full E2E suite
4. Upload `playwright-report/` as a GitHub Actions artifact on failure.

### 3. Bundle Size Guard
Create `.github/bundlesize.config.json`:
```json
{
  "files": [
    { "path": ".svelte-kit/output/client/_app/immutable/chunks/*.js", "maxSize": "500 kB" }
  ],
  "compressionAlgorithm": "gzip"
}
```
Fail the PR if any chunk exceeds the limit.

### 4. Branch Protection Rules
Document (for manual setup in GitHub Settings):
- `main` branch: Require PR + CI pass before merge.
- `feature/dev` branch: Require CI pass before merge.
- No direct pushes to `main`.

## Acceptance Criteria
- [ ] `.github/workflows/ci.yml` created and passing on all existing PRs.
- [ ] `.github/workflows/e2e.yml` runs on `feature/dev` merge.
- [ ] Bundle size check fails if a WASM module is eagerly imported.
- [ ] PR check status visible on all open Jules PRs.
- [ ] E2E report uploaded as artifact on failure.
