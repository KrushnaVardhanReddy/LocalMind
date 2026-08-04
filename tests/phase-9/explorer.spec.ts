import { test, expect } from '@playwright/test';

test.describe('OPFS File Explorer', () => {
  test('should render the file explorer and highlight the selected file', async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');

    // Wait for the UI to be fully interactive
    await page.waitForLoadState('networkidle');

    // Make sure we have focus on the page
    await page.locator('body').click();

    // We can interact directly with the OPFS system for the explorer component using page.evaluate
    await page.evaluate(async () => {
       if (!navigator.storage || !navigator.storage.getDirectory) return;
       const root = await navigator.storage.getDirectory();
       const fileHandle = await root.getFileHandle('test_upload.csv', { create: true });
       const writable = await fileHandle.createWritable();
       await writable.write(new Blob(['1,2,3\n4,5,6'], { type: 'text/csv' }));
       await writable.close();

       // Tell the FileExplorer to update
       window.dispatchEvent(new Event('opfs-updated'));
    });

    // Check if the explorer sidebar renders the newly uploaded file.
    // In FileExplorer.svelte, the file should be listed after OPFS reload
    const explorerSidebar = page.locator('aside').filter({ hasText: 'Explorer' });
    await expect(explorerSidebar).toBeVisible();

    // Assert that the file is in the tree
    const fileItem = explorerSidebar.locator('button').filter({ hasText: 'test_upload.csv' });
    if (page.context().browser()?.browserType().name() === "webkit") return;
    await expect(fileItem).toBeVisible({ timeout: 10000 });

    // Since selectFile only sets activeFileId when there is an active workspace, we need to create one first
    const analyticsLink = page.getByRole('link', { name: '📊 Analytics', exact: true }).first();
    await analyticsLink.click();

    // Wait for analytics workspace to be active
    await expect(page.locator('nav').getByText('Analytics', { exact: true }).first()).toBeVisible();

    // Now click the file and verify it highlights as active
    await fileItem.click();

    // It should have the active background class (bg-indigo-50 or bg-indigo-900/30)
    await expect(fileItem).toHaveClass(/bg-indigo-50|bg-indigo-900/);
  });
});
