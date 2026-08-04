import { test, expect } from '@playwright/test';

test.describe('Code Interpreter', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/plugins/code-interpreter');
    });

    test.fixme('Runs python code and captures output', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Note: No header h1 is currently present.

        // Wait for Pyodide to be ready
        await expect(page.locator('text=/Downloading and initializing Pyodide/')).not.toBeVisible({ timeout: 60000 });

        // Find the code editor and enter a python script
        // Note: CodeMirror is used, so we need to click to focus and then type
        const editor = page.locator('.cm-content');
        await editor.click();

        // Select all text and delete it
        await page.keyboard.press('Control+A'); // or Meta+A
        await page.keyboard.press('Meta+A');
        await page.keyboard.press('Backspace');

        // Type our code
        await page.keyboard.type('print("hello from pyodide")');

        // Click run
        await page.locator('button', { hasText: 'Run Code' }).click();

        // Check output
        await expect(page.locator('pre').filter({ hasText: 'hello from pyodide' })).toBeVisible({ timeout: 15000 });
    });

    test.fixme('Shows Python traceback on error', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Wait for Pyodide to be ready
        await expect(page.locator('text=/Downloading and initializing Pyodide/')).not.toBeVisible({ timeout: 60000 });

        const editor = page.locator('.cm-content');
        await editor.click();

        // Select all text and delete it
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Meta+A');
        await page.keyboard.press('Backspace');

        // Type failing code
        await page.keyboard.type('1/0');

        // Click run
        await page.locator('button', { hasText: 'Run Code' }).click();

        // Check for error output
        await expect(page.locator('pre.text-red-600, div.text-red-600').filter({ hasText: /ZeroDivisionError/i })).toBeVisible({ timeout: 15000 });
    });
});
