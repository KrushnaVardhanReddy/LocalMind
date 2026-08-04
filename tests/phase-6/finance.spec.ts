import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Finance Workspace', () => {
    test.beforeEach(async ({ page }) => {
        // Go to finance workspace
        await page.goto('/plugins/finance');
    });

    test.fixme('Uploads transactions CSV and populates table', async ({ page }) => {
        // Wait for page load
        await page.waitForLoadState('networkidle');

        // Check for the workspace header
        await expect(page.locator('h1').filter({ hasText: 'Personal Finance & Tax Workspace' })).toBeVisible({ timeout: 15000 });

        // Prepare the fixture file
        const fixturePath = join(__dirname, '../fixtures/transactions.csv');

        // It uses a dropzone component, but also an input file. Let's find the correct input file for transactions
        // Wait for DuckDB worker to load first. (UI might block file input)
        // Ensure no "loading" or similar state is active if any.
        await expect(page.locator('text=/Initializing/')).not.toBeVisible({ timeout: 10000 });

        // Find the file input for bank statements. Use the specific input in TransactionTable.
        // There might be multiple file inputs, so let's scope it to the left column or find one that accepts .csv
        const fileInput = page.locator('input[type="file"][accept=".csv"]');

        // Let's use evaluate to unhide it if necessary, though setInputFiles usually works on hidden inputs
        await fileInput.setInputFiles(fixturePath);

        // Debug: what is on the page right now? Check if error occurred.
        const isErrorVisible = await page.locator('text=/Failed to load CSV/i').isVisible();
        if (isErrorVisible) {
            console.log("Error loading CSV visible on page");
        }

        // Let's also check for 'Loading CSV into DuckDB' to disappear
        await expect(page.locator('text=/Loading CSV into DuckDB/i')).not.toBeVisible({ timeout: 20000 });

        // Sometimes the file input isn't fully processed immediately, so let's wait a bit and verify if the View All button appears.
        await expect(page.locator('button', { hasText: 'View All Transactions' })).toBeVisible({ timeout: 20000 });

        // Wait for the DuckDB worker to process the file and populate the table
        // Wait for table to be visible
        await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });

        // Ensure table has rows
        // Note: transactions.csv has 2 rows + 1 header row
        const rows = page.locator('tbody tr');
        await expect(rows).toHaveCount(2, { timeout: 15000 });

        // Assert that the data from the CSV is rendered correctly
        await expect(page.locator('td', { hasText: 'Groceries' })).toBeVisible();
        await expect(page.locator('td', { hasText: '-50.00' })).toBeVisible();
        await expect(page.locator('td', { hasText: 'Salary' })).toBeVisible();
        await expect(page.locator('td', { hasText: '2000.00' })).toBeVisible();
    });
});
