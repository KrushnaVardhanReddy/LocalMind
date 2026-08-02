import { test, expect } from '@playwright/test';

test.describe('Data Ingestion & SQL Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('text=Analytics Workspace')).toBeVisible();
  });

  test('should upload CSV, wait for DuckDB, and execute custom SQL', async ({ page }) => {
    // 1. Data Ingestion
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /upload|import/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/sales_data_large.csv');

    // Wait for DuckDB WASM to initialize and ingest
    await expect(page.locator('.status-indicator-ready')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Table "sales_data_large" created')).toBeVisible();

    // 2. SQL Execution
    const sqlEditor = page.locator('.monaco-editor').first();
    await sqlEditor.click();
    await page.keyboard.type('SELECT Region, SUM(Sales) as TotalSales FROM sales_data_large GROUP BY Region ORDER BY TotalSales DESC;');
    await page.getByRole('button', { name: /run query|execute/i }).click();

    // 3. Verify Output Grid
    const dataGrid = page.locator('.data-grid-container');
    await expect(dataGrid).toBeVisible();
    await expect(dataGrid.locator('text=North America')).toBeVisible();
    
    // Verify persistence (wa-sqlite)
    await page.reload();
    await expect(page.locator('text=sales_data_large')).toBeVisible();
  });
});
