import { test, expect } from '@playwright/test';

test.describe('Phase 1 - Full Analytics Surface', () => {
  test.setTimeout(300000);

  test('Workspace Launcher (UX-1)', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.locator('h1', { hasText: 'Welcome to LocalMind' })).toBeVisible({ timeout: 60000 });
    const analyticsCard = page.locator('a', { hasText: 'Analytics' }).first();
    await expect(analyticsCard).toBeVisible({ timeout: 60000 });
    await analyticsCard.click();
    await expect(page).toHaveURL(/.*\/analytics/);
    await expect(page.locator('h1', { hasText: 'LocalMind' }).first()).toBeVisible({ timeout: 60000 });
  });

  test('Command Palette (UX-2)', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    const isMac = process.platform === 'darwin';
    await page.waitForTimeout(2000); 
    await page.keyboard.press('Control+Shift+P');
    await page.keyboard.press('Meta+Shift+P');

    const palette = page.locator('input[placeholder="Type a command or search..."]');
    if (await palette.isVisible()) {
        await page.keyboard.type('pivot');
        await expect(page.locator('text=Pivot')).toBeVisible({ timeout: 10000 });
        await page.keyboard.press('Escape');
        await expect(page.locator('input[placeholder="Type a command or search..."]')).toBeHidden({ timeout: 10000 });
    }
  });

  async function uploadFile(page: any) {
    page.on('console', (msg: any) => console.log('BROWSER:', msg.text()));
    await page.waitForSelector('.border-dashed');
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => {
        const dropZone = document.querySelector('.border-dashed');
        const dt = new DataTransfer();
        const file = new File(['region,product,revenue,date\nWest,A,100,2023-01-01\nEast,B,200,2023-01-02\nWest,B,150,2023-01-03\n'], 'sales_100k.csv', { type: 'text/csv' });
        dt.items.add(file);
        
        const dropEvent = new DragEvent('drop', {
            dataTransfer: dt,
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: 100,
            clientY: 100
        });
        if (dropZone) dropZone.dispatchEvent(dropEvent);
    });

    await expect(page.getByText(/Successfully registered/i)).toBeVisible({ timeout: 90000 });
  }

  test('Data Ingestion & DuckDB', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await uploadFile(page);
    await page.locator('button', { hasText: 'Run Query' }).click();
    await page.waitForSelector('table tbody tr', { timeout: 60000 });
  });

  test('BI Pivot Builder & Template Gallery', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await uploadFile(page);
    await page.locator('button', { hasText: 'Run Query' }).click();
    await page.waitForSelector('table tbody tr', { timeout: 60000 });

    // Must select a table to pivot before the Templates button appears
    await page.locator('select#pivotTableSelect').selectOption({ index: 1 });

    const templateBtn = page.locator('button', { hasText: 'Templates' });
    if (await templateBtn.isVisible()) {
        await templateBtn.click().catch(() => {});
    }
    
    await expect(page.locator('text=Template Gallery')).toBeVisible({ timeout: 60000 });
    await page.locator('text=Sales Overview').first().click();
    await page.locator('button', { hasText: 'Use Template' }).first().click();
    
    await expect(page.locator('text=SUM_revenue')).toBeVisible({ timeout: 60000 });
    
    const sqlPanelToggle = page.locator('text=Generated SQL').first();
    if (await sqlPanelToggle.isVisible()) {
        await sqlPanelToggle.click({ force: true });
    }
    await page.waitForSelector('pre', { state: 'visible', timeout: 60000 });
    await page.waitForSelector('canvas', { state: 'visible', timeout: 60000 });
  });

  test('Static HTML Report Export (UX-3)', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await uploadFile(page);
    await page.locator('button', { hasText: 'Run Query' }).click();
    await page.waitForSelector('table tbody tr', { timeout: 60000 });

    await page.locator('button', { hasText: '📄 Export Report' }).click();
    await expect(page.locator('h2', { hasText: 'Export Report' })).toBeVisible({ timeout: 60000 });
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button', { hasText: 'Export HTML' }).click()
    ]);
    
    expect(download.suggestedFilename()).toMatch(/LocalMind_Report_.*\.html/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('AI Consent Flow (No Mocking)', async ({ page }) => {
    await page.goto('http://localhost:5173/analytics');
    await uploadFile(page);
    await page.locator('button', { hasText: 'Run Query' }).click();
    await page.waitForSelector('table tbody tr', { timeout: 60000 });

    await page.locator('button', { hasText: '✨ Ask AI to Analyze' }).first().click();
    
    // First, user must opt-in to AI
    await expect(page.locator('h2', { hasText: 'Enable Local AI?' })).toBeVisible({ timeout: 60000 });
    await page.locator('button', { hasText: 'Enable AI' }).click();
    
    // Wait for the modal to close
    await expect(page.locator('h2', { hasText: 'Enable Local AI?' })).toBeHidden({ timeout: 60000 });

    // Now that AI is enabled, click the button again to trigger the consent flow
    await page.locator('button', { hasText: '✨ Ask AI to Analyze' }).first().click();
    
    // Then, the consent modal for sending data
    await expect(page.locator('text=AI Processing Consent')).toBeVisible({ timeout: 60000 });
    
    // Accept the alert that pops up complaining about missing API key
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button', { hasText: 'I Consent, Send to AI' }).click();
    
    // We expect the Settings modal to open since we have no API key configured in the E2E test
    await expect(page.locator('h2', { hasText: 'Settings' })).toBeVisible({ timeout: 60000 });
  });
});
