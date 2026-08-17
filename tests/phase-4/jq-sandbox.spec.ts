import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('jq-sandbox e2e', () => {
    test('renders correctly and processes jq queries', async ({ page }) => {
        // Go to devtools hub, then jq-sandbox (or directly to jq-sandbox)
        await page.goto('/devtools/jq-sandbox');
        await expect(page.locator('h1').filter({ hasText: 'JSONPath & jq Sandbox' })).toBeVisible();

        // Wait for monaco editors to appear (there should be two, one for input, one for output)
        await page.waitForSelector('.monaco-editor');

        // Check if there is an input and it executes
        // By default it comes with some JSON and a jq query.
        // There's a button "Run"
        await page.locator('button', { hasText: 'Run' }).click();

        // Check that Executed text appears
        await expect(page.locator('text=/Executed in \\d+ms/')).toBeVisible();
    });
});
