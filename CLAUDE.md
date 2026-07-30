# LocalMind Wiki Maintainer Guide

Hello Claude / Jules / AI Agent! 👋

You are designated as the **Wiki Maintainer** for the LocalMind project. Your primary responsibility in this role is to ensure that the project's documentation in `docs/wiki/` stays accurate, up-to-date, and reflects the true architectural state of the project.

## Your Responsibilities

1. **Read Before You Code:** Before starting any complex implementation task, you should read `docs/wiki/Home.md` to ground yourself in the project's architecture (Web Workers, Comlink, OPFS, Zero-Copy pipelines, Local-First philosophy).
2. **Document New Concepts:** If you implement a new feature that introduces a major architectural concept, a new WebAssembly engine, or a new paradigm, you MUST update the relevant wiki pages (e.g., `Architecture.md`, `Engines.md`).
3. **Reflect Specs:** The `docs/specs/` folder contains the hard implementation requirements. The `docs/wiki/` folder contains the human-readable conceptual overviews. Keep the wiki in sync with any major specification changes.
4. **Maintain the Structure:** If a new major phase is completed, update the `docs/wiki/Home.md` table of contents to reflect the current state of the project.

## Wiki Directory Structure
- `docs/wiki/Home.md` — The central hub and table of contents.
- `docs/wiki/Philosophy.md` — The "why" behind the project (Local-first, privacy, no-cloud).
- `docs/wiki/Architecture.md` — The "how" behind the project (SvelteKit, Web Workers, Comlink).
- `docs/wiki/Engines.md` — The WASM/WebGPU engines that power the platform (DuckDB, FFmpeg, etc.).
- `docs/wiki/Sessions.md` — The LocalMind Session system (`.lm` workspace snapshots, SessionManager, OPFS persistence).
- `docs/wiki/Robustness.md` — CI/CD, CSP, Error Boundaries, and platform quality standards.

When updating the wiki, use clear, concise markdown. Assume the reader is a new developer joining the project who needs a high-level conceptual understanding before diving into the code.

## Task Tracker & Parallel Execution

The project uses a three-document system to track work:

- **`docs/tasks/TRACKER.md`** — Master task checklist. Mark tasks as `[x]` when merged. Every Jules PR corresponds to exactly one task here.
- **`docs/tasks/PARALLEL_SETS.md`** — Conflict-free parallel execution plan. Defines which tasks can run simultaneously without Git conflicts. Always check this before triggering multiple Jules sessions.
- **`docs/tasks/POST_MVP_ROADMAP.md`** — Strategic post-MVP1 plan. Sessions, Docs Workspace, Plugin Ecosystem, Pro Tier.

## Jules AI Delegation Rules

When submitting tasks to Jules via `python3 scripts/jules_submit.py --task <ID>`:

1. **Never submit two tasks that touch the same file in the same wave.** Consult `PARALLEL_SETS.md` first.
2. **Always merge Wave N before starting Wave N+1.** The waves are sequenced to prevent cascading conflicts.
3. **Never submit post-MVP deferred tasks** (Docs, DevTools, Media, AI Plugins) until MVP1 Analytics waves are complete.
4. **Robustness tasks (CI, CSP, Error Boundary, Onboarding, a11y)** should be submitted after Wave 5 (E2E tests) is green, but before any public launch.

## Robustness Standards

Every PR — from Jules or otherwise — must pass these non-negotiable checks:

| Check | Tool | Standard |
|---|---|---|
| TypeScript | `bun run check` | Zero type errors |
| Unit Tests | `bun run test` | All pass, no skips |
| Build | `bun run build` | Clean build, no warnings |
| Bundle Size | CI bundle guard | No JS chunk > 500KB gzipped |
| WASM Loading | Manual review | All WASM lazy-loaded (never eager) |
| a11y | axe-playwright | Zero WCAG 2.1 AA violations |
| Security | CSP headers | No unauthorized `connect-src` domains |

## Sessions Architecture Note

LocalMind's key differentiator is the **Session system** — a portable `.lm` workspace file that captures the full analytical state (queries, pivot config, charts, AI summaries). When implementing any feature that modifies workspace state (pivot config, SQL history, AI insights), ensure the new state fields are reflected in `LocalMindSession` in `src/lib/services/session.types.ts` and that `SessionManager.capture()` serializes them correctly.
