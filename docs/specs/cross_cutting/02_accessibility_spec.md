# Cross-Cutting: Accessibility (a11y) Specification

## 1. Standard
All LocalMind UI must meet **WCAG 2.1 Level AA** as a baseline. This is a hard requirement for enterprise and regulated-industry customers (Healthcare, Legal, Government) and is enforced at the component level.

## 2. Keyboard Navigation
- Every interactive element (buttons, inputs, dropdowns, file pickers, modals) must be reachable and operable via keyboard alone.
- Tab order must follow a logical, top-to-bottom reading flow.
- No keyboard traps — pressing `Escape` must always close a modal or panel.
- Global shortcuts (see README Design Principles) must not conflict with browser or OS shortcuts.

## 3. Semantic HTML & ARIA
- Use native HTML elements where possible (`<button>`, `<input>`, `<table>`, `<dialog>`) before adding ARIA.
- Every `<input>` must have an associated `<label>` (visible or `aria-label`).
- Data tables must use `<th scope="col">` headers.
- Modals must use `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing to the dialog title.
- Loading states must be announced: use `aria-live="polite"` regions for async status updates (e.g., "Engine initializing…", "Query complete — 5 rows returned").
- Error messages must be programmatically associated with their input via `aria-describedby`.

## 4. Color & Contrast
- Body text and UI labels: minimum **4.5:1** contrast ratio against background.
- Large text (≥18pt / 14pt bold) and UI icons: minimum **3:1** contrast ratio.
- Never use color alone to convey meaning — always pair with an icon or text label (e.g., error states).

## 5. Focus Indicators
- All focusable elements must display a **visible focus ring** (minimum 2px solid outline, 2px offset).
- Do not use `outline: none` without providing a custom, equally visible alternative.

## 6. Async State Announcements
State transitions that happen asynchronously must be announced to screen readers:

| Event | Announcement |
|---|---|
| Engine initializing | "DuckDB engine is loading, please wait." |
| File loaded | "File `{name}` loaded. `{N}` rows, `{M}` columns." |
| Query complete | "Query returned `{N}` rows in `{ms}`ms." |
| Query error | "Query failed: `{error message}`." |
| Worker crashed | "Engine error. Click Restart Engine to recover." |
| AI consent dialog open | "Consent dialog: review the AI payload before sending." |

## 7. Testing
- Use `@axe-core/playwright` to run automated a11y audits inside the existing Playwright E2E suite.
- All existing E2E tests must pass with zero axe violations at `critical` and `serious` impact levels.
- Add an explicit `test('Accessibility audit')` to each phase's E2E test file that runs the full axe scan on the primary UI state.

## 8. Implementation Checklist (Per Component)
- [ ] Keyboard operable
- [ ] Has visible focus ring
- [ ] No color-only information
- [ ] ARIA labels/roles correct
- [ ] Async states announced via `aria-live`
- [ ] axe-core audit passes at `serious` level
