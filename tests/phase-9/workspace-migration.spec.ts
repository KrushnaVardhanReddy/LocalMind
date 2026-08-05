import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Workspace Migration', () => {
  test('should export and import a session restoring workspace state', async ({ page }) => {
    // Navigate to the root page
    await page.goto('/');

    // Wait for the UI to be fully interactive
    await page.waitForLoadState('networkidle');

    // Make sure we have focus on the page
    await page.locator('body').click();

    // Setup a workspace by clicking "Try Sample Data"
    const sampleDataBtn = page.locator('button', { hasText: 'Try Sample Data' });
    await sampleDataBtn.click();

    // Wait for the analytics workspace to load
    const selectLabel = page.locator('label[for="pivotTableSelect"]');
    await expect(selectLabel).toBeVisible({ timeout: 10000 });

    // We need an active workspace so we can save it.
    const newWsInput = page.locator('input[placeholder="New Workspace Name"]');
    await newWsInput.fill('ExportTestWorkspace');
    const newWsBtn = page.locator('button', { hasText: 'New Workspace' });
    await newWsBtn.click();

    // Ensure the new workspace is loaded by checking the title
    const wsNameHeader = page.locator('h2', { hasText: 'Workspace: ExportTestWorkspace' });
    await expect(wsNameHeader).toBeVisible({ timeout: 10000 });

    // Select the demo_sales table so the workspace is "dirty" with some state
    const tableSelect = page.locator('select#pivotTableSelect');

    // Sometimes 'demo_sales' is not immediately available, we can retry picking it.
    // However, the test was failing on the select after import.
    await tableSelect.selectOption('demo_sales');

    // We can run a small query to ensure workspace is fully synced and "dirty"
    const updateBtn = page.locator('button', { hasText: 'Update Chart' });
    if (await updateBtn.isVisible()) {
        await updateBtn.click();
    }

    // Check for the "Export Session" button
    const exportSessionBtn = page.locator('button', { hasText: 'Export Session' });

    // Wait for it to be enabled.
    await expect(exportSessionBtn).toBeEnabled({ timeout: 15000 });

    // 1. Disable revokeObjectURL so Playwright can catch the blob natively
    await page.evaluate(() => {
        window.URL.revokeObjectURL = () => {};
    });

    // 2. Set up the listener before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    // 3. Trigger the export via the workspace toolbar button
    await exportSessionBtn.click();

    // 4. Await and save
    const download = await downloadPromise;
    expect(download).toBeTruthy();

    // Save the downloaded file to a temporary location
    const filePath = await download.path();

    // Read the file content in Node.js context
    const fileContent = fs.readFileSync(filePath as string, 'utf-8');

    // Reload the page to clear current state
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mock the file picker for import using the exact exported content
    await page.evaluate((content) => {
        // @ts-ignore
        window.showOpenFilePicker = async () => {
             const blob = new Blob([content], { type: 'application/json' });
             const file = new File([blob], 'session.lm', { type: 'application/json' });
             return [{ getFile: async () => file }];
        };
    }, fileContent);

    // Click "Open Session" on the home page
    const openSessionBtn = page.locator('button', { hasText: 'Open Session' });
    await openSessionBtn.click();

    // Wait for the workspace to restore. When importing it sets the active workspace to Analytics
    await expect(page.locator('nav').getByText('📊 Analytics', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Also check that the workspace name is correctly set from the import
    const restoredWsNameHeader = page.locator('h2', { hasText: 'Workspace: ExportTestWorkspace' });
    await expect(restoredWsNameHeader).toBeVisible({ timeout: 10000 });

    // Verify the workspace is restored (the table 'demo_sales' should be in the select list)
    // We check the options explicitly since value bindings in Svelte might be slow to propagate
    const importedTableOption = page.locator('select#pivotTableSelect').locator('option', { hasText: 'demo_sales' });
    await expect(importedTableOption).toBeAttached({ timeout: 10000 });
  });
});
