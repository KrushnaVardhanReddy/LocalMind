1. **Create `OnboardingBanner.svelte`**:
   - Accepts `step` prop and `onDismiss` callback.
   - Shows the 5 steps: Drop file, Add Rows, Add Values, View Chart, Export.
   - We already sketched this out, just need to finalize it and place it in `src/lib/components/OnboardingBanner.svelte`.
2. **Update `PivotBuilder.svelte`**:
   - Add tooltips to the zone labels (e.g., using `?` circle inside `ShelfZone` or right next to it). Wait, the prompt says "persistent `?` help tooltips on every shelf zone label".
   - Modify `ShelfZone.svelte` to accept an optional `tooltip` prop or hardcode them. Let's add an optional `tooltip` prop to `ShelfZone` and display it next to the label.
   - Add animated overlay hotspots pointing to Rows and Values shelves if they are empty and onboarding is active. We can do this in `PivotBuilder` or `ShelfZone`.
3. **Update `src/routes/analytics/+page.svelte`**:
   - Check `localStorage.getItem('localmind_onboarded')` on mount. If not set, start onboarding flow.
   - If onboarding flow starts:
     - Automatically load `static/demo_sales.csv` using `fetch` and DuckDB `registerFile` or similar. Wait, DuckDB's `registerFileHandle` or we can fetch the file as a Blob and create a File object.
     - Set the table to `demo_sales`.
   - Show `OnboardingBanner` above `PivotBuilder`.
   - Calculate current `step` based on:
     - 0: Initial state (Wait, if we auto-drop `demo_sales.csv`, step 0 is done).
     - 1: Add Rows (check if `rows.length > 0` via a prop or binding from `PivotBuilder`).
     - 2: Add Values (check if `values.length > 0`).
     - 3: View Chart (Wait, chart is always visible in PivotBuilder once there is data, or do they need to change the chart type?).
     - 4: Export (when user clicks Export).
   - Once all 5 steps are done, or user clicks dismiss, set `localmind_onboarded` in `localStorage`.
4. **Fix existing type errors**:
   - `src/lib/components/pivot/PivotChart.svelte` - implicit `any` for `r`.
   - `src/lib/components/pivot/PivotBuilder.svelte` - `toUpperCase` on type `{}`.
   - `tests/phase-1/e2e.spec.ts` - implicit `any`.

Let's refine the onboarding steps:
- "Drop a file": Checked if `$uploadedTables.length > 0`. Since we auto-load demo_sales, this is instantly checked.
- "Add Rows": Check `pivotBuilderComponent?.getPivotData().result` or add a getter for the current state.
- Let's expose state from `PivotBuilder` to `+page.svelte` using bindable props or a getter `export function getOnboardingState()`.
- Wait, the constraints say "Track completion in localStorage ('localmind_onboarded')".
- "auto-load demo_sales.csv into DuckDB."
- "Show animated overlay hotspots pointing to Rows and Values shelves."
- "Show an Onboarding Banner above the PivotBuilder."
- "Add an Onboarding Checklist tracking 5 steps (Drop file, Rows, Values, View Chart, Export)." (Checklist can be inside the Banner).
- "persistent `?` help tooltips on every shelf zone label."
