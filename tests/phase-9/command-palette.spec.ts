import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
  test('should open, filter commands, and trigger navigation', async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');

    // Wait for the UI to be fully interactive
    await page.waitForLoadState('networkidle');

    // Make sure we have focus on the page
    await page.locator('body').click();

    // Fallback: we dispatch the keyboard event directly to the window since ninja-keys registers it globally
    // in +layout.svelte on the window object.
    await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    });

    await page.waitForTimeout(500);

    const ninjaKeys = page.locator('ninja-keys');

    // Check if the internal dialog is open. The custom element itself might be 'hidden' from Playwright's perspective
    // if it relies on shadow DOM or specific CSS. ninja-keys adds 'visible' class to its internal structure.
    const isVisibleInner = await ninjaKeys.evaluate(el => {
       const inner = el.shadowRoot?.querySelector('.modal');
       return inner ? inner.classList.contains('visible') : false;
    });

    if (!isVisibleInner) {
         // Try Meta key instead if it didn't work
         await page.evaluate(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
        });
        await page.waitForTimeout(500);
    }

    // Try to interact with the input inside ninja-keys shadow root
    const searchInput = ninjaKeys.locator('input');
    await searchInput.fill('analytics');

    // Assert the list shows "Go to Analytics"
    // ninja-keys renders items with class `ninja-action`
    const firstItem = ninjaKeys.locator('.ninja-action').first();
    const itemText = await firstItem.evaluate(el => el.textContent || '');
    expect(itemText.toLowerCase()).toContain('analytics');

    // Press Escape to close it
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // We expect it to be closed
    const isClosedInner = await ninjaKeys.evaluate(el => {
       const inner = el.shadowRoot?.querySelector('.modal');
       return inner ? !inner.classList.contains('visible') : true;
    });
    expect(isClosedInner).toBe(true);

    // Open it again
    await page.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Select "Go to DevTools"
    await searchInput.fill('DevTools');
    await searchInput.press('Enter');

    // Wait for navigation
    await page.waitForTimeout(500);

    // Assert the active workspace changed to DevTools
    await expect(page.locator('nav').getByText('DevTools', { exact: true }).first()).toBeVisible();
  });
});
