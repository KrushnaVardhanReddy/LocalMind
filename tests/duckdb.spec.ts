import { test, expect } from '@playwright/test';

test('has title and can run test query', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  await page.goto('http://localhost:5173/');

  // Wait a bit to ensure JS is loaded
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Initialize Engine' }).click();

  // Wait up to 15 seconds for initialization
  await expect(page.getByText('Engine Status: Ready')).toBeVisible({ timeout: 15000 });

  // Click the run query button
  await page.getByRole('button', { name: 'Run Test Query' }).click();

  // Wait for the result to appear
  await expect(page.getByRole('heading', { name: 'Query Result:' })).toBeVisible();

  // Verify the JSON output contains our expected answer
  const resultText = await page.locator('pre').textContent();
  expect(resultText).toContain('"answer": 42');
});
