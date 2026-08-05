import { test, expect } from '@playwright/test';

test.describe('Macro-Shell Layout', () => {
  test('should render the global shell components and navigation links', async ({ page }) => {
    await page.goto('/');

    // Check Top Navigation (WorkspaceNav)
    await expect(page.locator('nav').filter({ hasText: 'LocalMind' })).toBeVisible();

    // Check Left Sidebar (File Explorer) on desktop viewport
    const explorerSidebar = page.locator('aside').filter({ hasText: 'Explorer' });
    await expect(explorerSidebar).toBeVisible();

    // Ensure the main canvas is visible
    await expect(page.locator('main')).toBeVisible();

    // Verify workspace switcher is visible and test navigation links
    const analyticsLink = page.getByRole('link', { name: '📊 Analytics' }).first();
    await expect(analyticsLink).toBeVisible();
    await analyticsLink.click();

    // Analytics click creates a workspace and redirects to '/', so we check if the workspace changed
    // Top Nav should show "Analytics"
    await expect(page.locator('nav').getByText('Analytics', { exact: true }).first()).toBeVisible();

    // Also check other links
    const docsLink = page.getByRole('link', { name: '📄 Docs' }).first();
    await docsLink.click();
    await expect(page).toHaveURL(/\/docs/);

    const devToolsLink = page.getByRole('link', { name: '🛠️ DevTools' }).first();
    await devToolsLink.click();

    // DevTools also acts like Analytics (goes to '/')
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('nav').getByText('DevTools', { exact: true }).first()).toBeVisible();
  });

  test('should toggle dark/light mode via command palette', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Make sure we have focus on the page body so the keypress goes to the document
    await page.locator('body').click();

    // Open command palette
    await page.keyboard.press('Control+k');

    // Wait for ninja-keys to be visible
    const ninjaKeys = page.locator('ninja-keys');

    // Check if it exists or wait a bit
    await page.waitForTimeout(500);

    // If 'Control+k' didn't work (mac vs windows), try 'Meta+k'
    if (!(await ninjaKeys.isVisible())) {
       await page.keyboard.press('Meta+k');
       await page.waitForTimeout(500);
    }

    // The inner input inside ninja-keys shadow root
    await ninjaKeys.locator('input').fill('Dark Mode');

    // Press Enter to select it
    await ninjaKeys.locator('input').press('Enter');

    // Wait for a brief moment for the class to toggle
    await page.waitForTimeout(200);

    // Assert that html has dark class
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});
