# Accessibility (a11y) Audit & Remediation

## Objective
Audit and remediate LocalMind to meet WCAG 2.1 AA — committed to in the README's design principles but not yet formally validated. Integrate `axe-playwright` into the E2E suite so a11y regressions are caught automatically going forward.

## Implementation

### 1. Automated Audit with axe-playwright
Add `@axe-core/playwright` to dev dependencies. In the E2E test suite, add an a11y sweep:
```typescript
import AxeBuilder from '@axe-core/playwright';

test('analytics workspace has no critical a11y violations', async ({ page }) => {
  await page.goto('/analytics');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```
Run against: `/`, `/analytics`, `/docs`, `/diagrams`, `/annotate`.

### 2. Keyboard Navigation Audit
Manually verify and fix:
- All interactive elements reachable via Tab key.
- Focus indicator visible on every interactive element (ring/outline — not removed by `outline: none`).
- Drag-and-drop shelf zones also support keyboard: `Enter` to start drag, Arrow keys to move, `Enter` to drop.
- Command palette fully keyboard-operable.
- Modal dialogs trap focus inside until dismissed.

### 3. ARIA Roles & Labels
Audit and fix missing ARIA:
- Drop zones: `role="region" aria-label="Rows shelf"`.
- Chart canvas: `role="img" aria-label="Bar chart: Revenue by Region"` (dynamically generated from shelf config).
- Pivot table: proper `<thead>`, `<th scope="col">`, `<th scope="row">` structure.
- Loading states: `aria-live="polite"` announcements for async query results.
- Error toasts: `role="alert"` for immediate announcement.

### 4. Color Contrast
- Run `contrast-checker` against all text/background combinations in both light and dark mode.
- Minimum 4.5:1 for body text, 3:1 for large text and UI components.
- Fix any failing color tokens in the design system.

### 5. Screen Reader Testing
Manual test with:
- NVDA + Chrome (Windows) — or VoiceOver + Safari (macOS).
- Verify the pivot builder flow is navigable and understandable without visual context.

## Acceptance Criteria
- [ ] `axe-playwright` audit passes with zero WCAG 2.1 AA violations on all routes.
- [ ] All interactive elements reachable and operable via keyboard.
- [ ] All chart elements have meaningful ARIA labels.
- [ ] Pivot table uses correct semantic `<th scope>` attributes.
- [ ] All async state changes announced via `aria-live`.
- [ ] Focus trapping works in all modals.
- [ ] Color contrast ≥ 4.5:1 for all text in light and dark mode.
- [ ] a11y audit runs automatically in CI on every PR.
