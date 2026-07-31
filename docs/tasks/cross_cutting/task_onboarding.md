TASK: Robustness Wave — CI-5: First-Run Onboarding & Empty State

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Design and implement a guided first-run experience for new users so they reach their "aha moment" within 30 seconds of opening LocalMind.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/cross_cutting/07_onboarding_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- On first visit, auto-load `demo_sales.csv` into DuckDB.
- Show animated overlay hotspots pointing to Rows and Values shelves.
- Show an Onboarding Banner above the PivotBuilder.
- Add an Onboarding Checklist tracking 5 steps (Drop file, Rows, Values, View Chart, Export).
- Add persistent `?` help tooltips on every shelf zone label.
- Track completion in `localStorage` (`localmind_onboarded`).

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/analytics/+page.svelte`
- `src/lib/components/pivot/PivotBuilder.svelte`
- `src/lib/components/OnboardingBanner.svelte` (to be created)
- `static/demo_sales.csv` (existing)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Hotspots: Use Svelte 5 `$state` and standard Tailwind absolute positioning with `animate-pulse` for the rings.
- Tooltips: Use native `title` attribute or a simple absolute div for the `?` icons. No heavy tooltip libraries.
- Checklist: Can be a collapsible sidebar widget on the right side of the screen.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. CREATE: `src/lib/components/OnboardingBanner.svelte`
2. MODIFY: `src/routes/analytics/+page.svelte`
3. MODIFY: `src/lib/components/pivot/PivotBuilder.svelte`

Commit: "feat: CI-5 first-run onboarding and empty state"
Target branch: feature/dev
