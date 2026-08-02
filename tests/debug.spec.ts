import { test, expect } from '@playwright/test';

test('debug duckdb', async ({ page }) => {
  test.setTimeout(60000); 
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('/analytics');
  await page.evaluate(() => localStorage.setItem('localmind_onboarded', 'v1'));
  await page.goto('/analytics');
  
  const sqlEditor = page.locator('textarea[placeholder*="Enter SQL query"]');
  await sqlEditor.click();
  await sqlEditor.fill("SELECT 1 AS Region, 500 AS Sales UNION ALL SELECT 2, 1000");
  await sqlEditor.dispatchEvent('input');
  
  console.log("TEST: Clicking Run Query");
  await page.getByRole('button', { name: 'Run Query' }).click();
  
  // Wait 10 seconds for the query to either fail or succeed
  await page.waitForTimeout(10000); 
  
  // Dump the workerCrashes store from the browser
  const crashes = await page.evaluate(() => {
    // Svelte 5 stores might not be globally exposed, but let's see if we can find any error text in the DOM
    return document.body.innerText.includes('OOM') || document.body.innerText.includes('error');
  });
  console.log("TEST: Crashes found in DOM?", crashes);
  
  // Check if we have the execution time text
  const executionTime = await page.evaluate(() => {
    return document.body.innerText.includes('Execution time');
  });
  console.log("TEST: Execution time found?", executionTime);

});
