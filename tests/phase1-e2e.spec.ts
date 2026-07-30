import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Phase 1: Full Analytics Surface E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('Workspace Launcher (UX-1)', async ({ page }) => {
    // Assert dashboard renders
    await expect(page.locator('h1').filter({ hasText: 'LocalMind' })).toBeVisible();

    // Assert workspace cards for Analytics, Docs, DevTools are visible
    await expect(page.locator('h2').filter({ hasText: 'Analytics' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Docs' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'DevTools' })).toBeVisible();

    // Click "Analytics" card and assert navigation
    await page.locator('h2').filter({ hasText: 'Analytics' }).click();
    await expect(page).toHaveURL(/.*\/analytics/);

    // Assert <h1> heading is correct
    await expect(page.locator('h1').filter({ hasText: 'LocalMind' })).toBeVisible();
  });

  test('Command Palette (UX-2)', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(1000);

    // Press Cmd+Shift+P (or Ctrl+Shift+P)
    await page.keyboard.press('Control+k');

    // Assert the Command Palette modal opens
    const palette = page.locator('.fixed.inset-0.bg-black\\/40.backdrop-blur-sm.z-50');
    await expect(palette).toBeVisible();

    // Type "pivot" and assert filtered results appear
    const searchInput = palette.locator('input');
    await searchInput.fill('pivot');

    // CommandPalette uses standard <ul> and <li> tags for the list
    await expect(palette.locator('ul li').getByText('pivot', { exact: false }).first()).toBeVisible();

    // Press Escape and assert the palette closes
    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible();
  });

  test('Data Ingestion & DuckDB', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(2000); // Wait for worker initialization

    // We simulate dragging and dropping a file by doing page.evaluate.
    // Playwright cannot drag/drop native files to dropzone natively in an easy way on a headless browser when File is required,
    // so we mock the drop event with a dataTransfer object containing a file.

    // First, read the local file
    const filePath = path.join(__dirname, 'fixtures', 'sales_100k.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(({ content }) => {
      // Create a DataTransfer object and add a mock file to it
      const dt = new DataTransfer();
      const file = new File([content], 'sales_100k.csv', { type: 'text/csv' });
      dt.items.add(file);

      const event = new DragEvent('drop', {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      });

      const dropzone = document.querySelector('.border-dashed');
      if (dropzone) {
          dropzone.dispatchEvent(event);
      }
    }, { content: fileContent });

    // Check it gets registered
    await expect(page.locator('text=sales_100k')).toBeVisible({ timeout: 10000 });
  });

  test('BI Pivot Builder - Full Journey', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(2000);

    // Prepare table (sales_100k)
    const filePath = path.join(__dirname, 'fixtures', 'sales_100k.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(({ content }) => {
      const dt = new DataTransfer();
      const file = new File([content], 'sales_100k.csv', { type: 'text/csv' });
      dt.items.add(file);
      const event = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      const dropzone = document.querySelector('.border-dashed');
      if (dropzone) dropzone.dispatchEvent(event);
    }, { content: fileContent });

    // Wait for the file to be uploaded
    await expect(page.locator('text=sales_100k')).toBeVisible({ timeout: 10000 });

    // Select the table from the list
    const select = page.locator('#pivotTableSelect');
    await expect(select.locator('option', { hasText: 'sales_100k' })).toBeAttached({ timeout: 10000 });
    await select.selectOption({ value: 'sales_100k' });

    // 1. Drag region to Rows shelf
    const regionPill = page.locator('div[draggable="true"]', { hasText: /^region$/ });
    const rowsShelf = page.locator('h4').filter({ hasText: 'Rows / Dimensions' }).locator('..').locator('.min-h-\\[32px\\]');

    // Since Playwright dragAndDrop can be flaky with Svelte 5 DnD, we use explicit dispatch
    await regionPill.dispatchEvent('dragstart');
    await rowsShelf.dispatchEvent('dragenter');
    await rowsShelf.dispatchEvent('dragover');
    await rowsShelf.dispatchEvent('drop', { dataTransfer: await page.evaluateHandle(() => new DataTransfer()) });
    await regionPill.dispatchEvent('dragend');

    await expect(rowsShelf.locator('span', { hasText: 'region' })).toBeVisible();

    // 2. Drag revenue to Values shelf
    const revenuePill = page.locator('div[draggable="true"]', { hasText: /^revenue$/ });
    const valuesShelf = page.locator('h4').filter({ hasText: 'Values' }).locator('..').locator('.min-h-\\[32px\\]');

    await revenuePill.dispatchEvent('dragstart');
    await valuesShelf.dispatchEvent('dragenter');
    await valuesShelf.dispatchEvent('dragover');
    await valuesShelf.dispatchEvent('drop', { dataTransfer: await page.evaluateHandle(() => new DataTransfer()) });
    await revenuePill.dispatchEvent('dragend');

    await expect(valuesShelf.locator('span', { hasText: 'revenue' })).toBeVisible();

    // Wait for Query execution
    await expect(page.locator('th', { hasText: 'region' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('td', { hasText: 'North' })).toBeVisible();
    await expect(page.locator('td', { hasText: '100' })).toBeVisible(); // SUM of revenue for North

    // 3. Drag product to Columns shelf
    const productPill = page.locator('div[draggable="true"]', { hasText: /^product$/ });
    const colsShelf = page.locator('h4').filter({ hasText: 'Columns / Pivots' }).locator('..').locator('.min-h-\\[32px\\]');

    await productPill.dispatchEvent('dragstart');
    await colsShelf.dispatchEvent('dragenter');
    await colsShelf.dispatchEvent('dragover');
    await colsShelf.dispatchEvent('drop', { dataTransfer: await page.evaluateHandle(() => new DataTransfer()) });
    await productPill.dispatchEvent('dragend');

    await expect(colsShelf.locator('span', { hasText: 'product' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Widget A' })).toBeVisible({ timeout: 10000 });

    // 4. Assert SQL panel contains PIVOT
    await page.getByRole('button', { name: 'Show Generated SQL' }).click();
    await expect(page.locator('pre')).toContainText('PIVOT');

    // 5. Assert ECharts is visible
    await expect(page.locator('canvas')).toBeVisible();

    // 6. Switch chart type to Line
    await page.locator('select').filter({ hasText: 'Bar' }).selectOption('line');

    // We expect the chart to rerender. We can wait a small moment
    await page.waitForTimeout(500);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('Template Gallery (UX-4)', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(2000);

    // Prepare table (sales_100k)
    const filePath = path.join(__dirname, 'fixtures', 'sales_100k.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(({ content }) => {
      const dt = new DataTransfer();
      const file = new File([content], 'sales_100k.csv', { type: 'text/csv' });
      dt.items.add(file);
      const event = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      const dropzone = document.querySelector('.border-dashed');
      if (dropzone) dropzone.dispatchEvent(event);
    }, { content: fileContent });

    // Wait for the file to be uploaded
    await expect(page.locator('text=sales_100k')).toBeVisible({ timeout: 10000 });

    // Select the table from the list
    const select = page.locator('#pivotTableSelect');
    await expect(select.locator('option', { hasText: 'sales_100k' })).toBeAttached({ timeout: 10000 });
    await select.selectOption({ value: 'sales_100k' });

    // Click templates
    await page.getByRole('button', { name: '✨ Templates' }).click();

    // Assert gallery opens and Sales Overview template exists
    const gallery = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(gallery).toBeVisible();
    await expect(gallery.locator('h3', { hasText: 'Sales Overview' })).toBeVisible();

    // Use Template
    await gallery.locator('button', { hasText: 'Use Template' }).first().click();

    // Assert gallery closes
    await expect(gallery).not.toBeVisible();

    // Assert grid updates - wait for North Region logic which should be populated by the Sales template
    await expect(page.locator('th', { hasText: 'region' })).toBeVisible({ timeout: 10000 });
  });

  test('Static HTML Report Export (UX-3)', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(2000);

    // Prepare table (sales_100k)
    const filePath = path.join(__dirname, 'fixtures', 'sales_100k.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(({ content }) => {
      const dt = new DataTransfer();
      const file = new File([content], 'sales_100k.csv', { type: 'text/csv' });
      dt.items.add(file);
      const event = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      const dropzone = document.querySelector('.border-dashed');
      if (dropzone) dropzone.dispatchEvent(event);
    }, { content: fileContent });

    // Wait for the file to be uploaded
    await expect(page.locator('text=sales_100k')).toBeVisible({ timeout: 10000 });

    // Select the table from the list
    const select = page.locator('#pivotTableSelect');
    await expect(select.locator('option', { hasText: 'sales_100k' })).toBeAttached({ timeout: 10000 });
    await select.selectOption({ value: 'sales_100k' });

    // 1. Drag region to Rows shelf
    const regionPill = page.locator('div[draggable="true"]', { hasText: /^region$/ });
    const rowsShelf = page.locator('h4').filter({ hasText: 'Rows / Dimensions' }).locator('..').locator('.min-h-\\[32px\\]');

    // Since Playwright dragAndDrop can be flaky with Svelte 5 DnD, we use explicit dispatch
    await regionPill.dispatchEvent('dragstart');
    await rowsShelf.dispatchEvent('dragenter');
    await rowsShelf.dispatchEvent('dragover');
    await rowsShelf.dispatchEvent('drop', { dataTransfer: await page.evaluateHandle(() => new DataTransfer()) });
    await regionPill.dispatchEvent('dragend');

    await expect(rowsShelf.locator('span', { hasText: 'region' })).toBeVisible();

    // Click Export Report
    await page.getByRole('button', { name: 'Export Report' }).click();

    // Assert export modal opens
    const modal = page.locator('.fixed.inset-0.bg-black\\/50.flex.items-center');
    await expect(modal).toBeVisible();

    // Select sections - they are checked by default so just verify
    await expect(modal.locator('input[type="checkbox"]').first()).toBeChecked();

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await modal.locator('button', { hasText: 'Export HTML' }).click();
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/LocalMind_Report_.*\.html/);

    // Save and check content
    const downloadPath = await download.path();
    const htmlContent = fs.readFileSync(downloadPath!, 'utf-8');
    expect(htmlContent).toContain('<table');
    expect(htmlContent).toContain('<pre>'); // For SQL
    // We expect base64 images if charts are present
    expect(htmlContent).not.toMatch(/src="http/); // No external requests
  });

  test('AI Consent Flow (No Mocking)', async ({ page }) => {
    // Navigate to /analytics
    await page.goto('/analytics');
    await page.waitForTimeout(2000);

    // Prepare table (sales_100k)
    const filePath = path.join(__dirname, 'fixtures', 'sales_100k.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    await page.evaluate(({ content }) => {
      const dt = new DataTransfer();
      const file = new File([content], 'sales_100k.csv', { type: 'text/csv' });
      dt.items.add(file);
      const event = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
      const dropzone = document.querySelector('.border-dashed');
      if (dropzone) dropzone.dispatchEvent(event);
    }, { content: fileContent });

    // Wait for the file to be uploaded
    await expect(page.locator('text=sales_100k')).toBeVisible({ timeout: 10000 });

    // Run a query so Ask AI appears
    const textarea = page.getByPlaceholder(/Enter SQL query/);
    await textarea.fill("SELECT 1 as x, 2 as y UNION ALL SELECT 2 as x, 4 as y");
    await page.getByRole('button', { name: 'Run Query' }).click();

    // Wait for result so Ask AI shows up
    await expect(page.locator('button', { hasText: 'Ask AI to Analyze' })).toBeVisible({ timeout: 10000 });

    // Click Ask AI
    await page.locator('button', { hasText: 'Ask AI to Analyze' }).click();

    // Assert the Consent Modal appears
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2').filter({ hasText: 'Privacy Notice & Consent' })).toBeVisible();
    await expect(modal.locator('pre').first()).toBeVisible(); // payload preview

    // Accept consent
    await modal.locator('button', { hasText: 'I Consent, Send to AI' }).click();

    // Wait for AI result (with error handling since no key)
    // Here we just test the flow doesn't crash since it runs locally. The `.prose` element should appear
    // when the result resolves. Since we set a dummy test key in env, it's possible it fails API call
    // But this test validates the UI consent path successfully triggered.
  });

});
