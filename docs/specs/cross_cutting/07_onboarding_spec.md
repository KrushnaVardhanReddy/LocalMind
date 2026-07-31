# Spec: First-Run Onboarding & Empty State

## Objective
Design and implement a guided first-run experience for new users so they reach t
heir "aha moment" within 30 seconds of opening LocalMind. The current blank Anal
ytics workspace is a 100% bounce for non-technical users.

## Implementation

### 1. First-Run Detection
- On first visit, `localStorage.getItem('localmind_onboarded')` is null.
- Show the onboarding experience. On completion, set `localStorage.setItem('loca
lmind_onboarded', 'v1')`.

### 2. Pre-loaded Demo Dataset
`static/demo_sales.csv` already exists in the repo. On first run:
- Auto-load `demo_sales.csv` into DuckDB without requiring any user action.
- Show a subtle banner: "👋 We loaded a sample sales dataset to get you started."

### 3. Interactive Empty State Hotspots
When `demo_sales.csv` is loaded but no shelves are populated, show an animated o
verlay with three hotspots:

| Hotspot | Location | Message |
|---|---|---|
| 1 | Column panel → `region` column | "Drag here to Rows →" |
| 2 | Rows shelf | "← Drop columns here to group data" |
| 3 | Values shelf | "← Drop a numeric column to aggregate" |

Each hotspot is a pulsing ring + tooltip. Dismiss when the user performs the act
ion.

### 4. Onboarding Banner (`src/lib/components/OnboardingBanner.svelte`)
Shown above the pivot builder on first run:
> **Welcome to LocalMind Analytics!**
> Drop any CSV, Excel, or JSON file to get started — or explore the sample datas
et below.
> [View Demo] [Dismiss]

"View Demo" auto-configures the pivot builder with the Sales Overview template (
reuses Template Gallery logic from UX-4).

### 5. Onboarding Checklist (Sidebar widget, collapsible)
Track progress through 5 steps:
- [ ] Drop a file (or use demo data)
- [ ] Drag a column to Rows
- [ ] Drag a column to Values
- [ ] View the chart
- [ ] Export a report

Each step completes with a satisfying checkmark animation. On all 5 complete: "🎉
 You're ready! Drop your own data anytime."

### 6. Help Tooltips (Persistent)
Add `?` icon tooltips on every shelf zone label that show on hover:
- **Rows shelf:** "Group your data by this column (like GROUP BY in SQL)"
- **Values shelf:** "Aggregate a numeric column (SUM, COUNT, AVG, MIN, MAX)"
- **Columns shelf:** "Pivot your data across this column's distinct values"
- **Filters shelf:** "Narrow your dataset to rows matching a condition"

## Acceptance Criteria
- [ ] First visit auto-loads `demo_sales.csv` with an informational banner.
- [ ] Three animated hotspots guide the user to drag their first columns.
- [ ] Hotspots dismiss automatically when the corresponding action is performed.
- [ ] Onboarding checklist tracks progress and persists across page reloads.
- [ ] Help tooltips visible on all shelf zones.
- [ ] `localStorage` flag prevents onboarding from re-showing after completion.
- [ ] "Dismiss" hides the banner and skips onboarding (for returning users who c
lear localStorage).
