import { test, expect } from '@playwright/test';

test.describe('Dynamic Inspector Panel', () => {
  test('should open when triggered and collapse when closed', async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');

    // Wait for the UI to be fully interactive
    await page.waitForLoadState('networkidle');

    // Make sure we have focus on the page
    await page.locator('body').click();

    // Setup a workspace by clicking "Try Sample Data"
    const sampleDataBtn = page.locator('button', { hasText: 'Try Sample Data' });
    await sampleDataBtn.click();

    // Wait for the analytics workspace to load (it will have the pivot table select)
    const selectLabel = page.locator('label[for="pivotTableSelect"]');
    await expect(selectLabel).toBeVisible({ timeout: 10000 });

    // Select the demo_sales table
    const tableSelect = page.locator('select#pivotTableSelect');
    await tableSelect.selectOption({ label: 'demo_sales' });

    // Wait for PivotBuilder to show columns
    await expect(page.locator('text=category').first()).toBeVisible({ timeout: 10000 });

    // Use evaluate to simulate a drag and drop via the exposed application keyboard events
    await page.evaluate(() => {
        document.body.dispatchEvent(new CustomEvent('keyboarddragstart', { detail: { label: 'category', type: 'text' } }));
        document.body.dispatchEvent(new CustomEvent('keyboarddrop', { detail: { id: 'rows' } }));

        document.body.dispatchEvent(new CustomEvent('keyboarddragstart', { detail: { label: 'sales', type: 'numeric' } }));
        document.body.dispatchEvent(new CustomEvent('keyboarddrop', { detail: { id: 'values' } }));
    });

    // Click 'Update Chart'
    const updateBtn = page.locator('button', { hasText: 'Update Chart' });
    if (await updateBtn.isVisible()) {
        await updateBtn.click();
    }

    // The chart inspector button is inside PivotChart
    const inspectorBtn = page.locator('button[title="Toggle Chart Inspector"]');

    // Wait for the 🛠️ button to be visible
    await expect(inspectorBtn).toBeVisible({ timeout: 10000 });

    // Click the 🛠️ button
    await inspectorBtn.click();

    // Verify the Chart Inspector appears
    const inspectorAside = page.locator('aside').filter({ hasText: 'Chart Inspector' });
    await expect(inspectorAside).toBeVisible();

    // Check for JSON editor presence
    await expect(inspectorAside.locator('textarea')).toBeVisible();

    // Click the close button
    const closeBtn = inspectorAside.locator('button[title="Close Inspector"]');
    await closeBtn.click();

    // Verify the inspector collapses/disappears
    await expect(inspectorAside).not.toBeVisible();
  });
});
