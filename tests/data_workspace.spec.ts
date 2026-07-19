import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Phase 1: Data Workspace E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and initialize engine
    await page.goto('http://localhost:5173/');

    // Initialize
    const initBtn = page.getByRole('button', { name: 'Initialize Engine' });
    await initBtn.waitFor({ state: 'visible' });
    await initBtn.click();

    // Wait a bit to ensure it is initialized before filing input
    await page.waitForTimeout(2000);
  });

  async function loadTestFile(page) {
    const buffer = fs.readFileSync(path.join(__dirname, 'fixtures', 'products.csv'));
    await page.evaluate((bufferArray) => {
         const file = new File([new Uint8Array(bufferArray)], 'products.csv', { type: 'text/csv' });
         const dataTransfer = new DataTransfer();
         dataTransfer.items.add(file);

         const fileInput = document.querySelector('input[type="file"]');
         if (fileInput) {
             fileInput.files = dataTransfer.files;
             fileInput.dispatchEvent(new Event('change', { bubbles: true }));
         }
    }, [...buffer]);

    // Wait for the data to be loaded
    await expect(page.getByText('Active Dataset: products')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  test('Test 1: File Ingestion & Query Execution', async ({ page }) => {
    await loadTestFile(page);

    await expect(page.getByText('Total Rows: 5')).toBeVisible();

    // Verify some column names exist in the schema table
    await expect(page.getByRole('cell', { name: 'category', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'price', exact: true })).toBeVisible();

    // 3. Verify default query executed and data table is visible
    await expect(page.getByRole('heading', { name: 'Query Results' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Laptop' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Electronics' }).first()).toBeVisible();

    // 4. Execute custom SQL query
    await page.locator('.cm-content').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Meta+A'); // For Mac
    await page.keyboard.press('Backspace');

    await page.keyboard.type('SELECT COUNT(*) as cnt FROM products;');

    await page.getByRole('button', { name: 'Execute Query' }).click();

    // Verify the result is updated. Adding a small timeout to let the db execute.
    // Sometimes the cell role may not be immediately obvious if Svelte is re-rendering. Just checking text is safer.
    await expect(page.getByRole('columnheader', { name: 'cnt' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: '5' }).first()).toBeVisible();
  });

  test('Test 2: Visualization & Profiling', async ({ page }) => {
    await loadTestFile(page);

    // 2. Verify column statistics are displayed
    await expect(page.getByRole('heading', { name: 'Column Statistics' })).toBeVisible();
    // Wait for stats to compute (it might take a split second)
    await expect(page.getByText('Unique:').first()).toBeVisible({ timeout: 10000 });

    // 3. Verify chart UI is rendered
    await expect(page.getByRole('heading', { name: 'Visualizations' })).toBeVisible();
    // ECharts uses canvas
    await expect(page.locator('.chart-wrapper canvas')).toBeVisible();

    // 4. Interact with charting UI
    await page.locator('select#chart-type').selectOption('pie');
    // Ensure canvas is still there after re-render
    await expect(page.locator('.chart-wrapper canvas')).toBeVisible();
  });

  test('Test 3: AI Consent Flow', async ({ page }) => {
    await loadTestFile(page);

    // 2. Enable AI Features
    await page.getByRole('button', { name: 'AI Settings' }).click();
    // Wait for modal
    await expect(page.getByText('AI Configuration')).toBeVisible();

    const aiToggle = page.getByLabel('Enable AI Features');
    // Check if it's already checked (from local storage perhaps), if not check it
    const isChecked = await aiToggle.isChecked();
    if (!isChecked) {
      await aiToggle.check();
    }

    await page.getByRole('button', { name: 'Close' }).click();

    // 3. Submit natural language query
    await expect(page.getByText('AI Text-to-SQL')).toBeVisible();
    await page.getByPlaceholder('e.g. Show me the top 10 rows').fill('What is the total price?');
    await page.getByRole('button', { name: 'Generate SQL' }).click();

    // 4. Verify Consent Dialog appears
    await expect(page.getByRole('heading', { name: 'Consent Review: AI Payload' })).toBeVisible();

    // 5. Verify payload content (contains schema info, no raw rows)
    const payloadText = await page.locator('.bg-gray-100.font-mono').textContent();
    expect(payloadText).toContain('"task": "TEXT_TO_SQL"');
    expect(payloadText).toContain('"name": "products"');
    expect(payloadText).toContain('"column": "price"');
    expect(payloadText).toContain('"prompt": "What is the total price?"');

    // Ensure raw data like "Laptop" is not in the payload
    expect(payloadText).not.toContain('Laptop');

    // 6. Approve consent (no mocks as per requirements, real LLM interaction locally)
    await page.getByRole('button', { name: 'Approve & Send Request' }).click();
    // Verify it attempts generation, but we shouldn't assert strict output here
    // unless we know the exact response from the local LLM since it's real E2E
    await expect(page.getByRole('button', { name: 'Generate SQL' })).toBeEnabled({ timeout: 60000 });
  });

});
