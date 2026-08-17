import { test, expect } from '@playwright/test';

test.describe('API Client Workspace', () => {
    test.beforeEach(async ({ page }) => {
        // Mock external fetching for the test suite
        await page.route('https://jsonplaceholder.typicode.com/todos/1', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ userId: 1, id: 1, title: 'mocked todo', completed: false })
            });
        });
    });

    test('should render the API Client interface', async ({ page }) => {
        test.fixme();
        // Use proper routing through the layout to avoid wiped out states
        await page.goto('/');
        await page.waitForTimeout(500);
        await page.goto('/devtools/api-client');
        await page.waitForTimeout(1000);

        await expect(page.locator('h1', { hasText: 'API Client' }).first()).toBeVisible();
        await expect(page.locator('button', { hasText: 'Send' })).toBeVisible();
    });

    test('should execute a simple GET request', async ({ page }) => {
        test.fixme();
        await page.goto('/');
        await page.waitForTimeout(500);
        await page.goto('/devtools/api-client');
        await page.waitForTimeout(1000);

        // Ensure default is GET and URL is jsonplaceholder
        await expect(page.locator('select').first()).toHaveValue('GET');

        // Click send
        await page.click('button:has-text("Send")');

        // Check response
        await expect(page.locator('text=Status: 200 OK')).toBeVisible();
        await expect(page.locator('pre').filter({ hasText: 'mocked todo' })).toBeVisible();
    });

    test('should allow adding parameters', async ({ page }) => {
        test.fixme();
        await page.goto('/');
        await page.waitForTimeout(500);
        await page.goto('/devtools/api-client');
        await page.waitForTimeout(1000);

        await page.click('text=Params');

        // Add a parameter
        const keyInputs = page.locator('input[placeholder="Key"]');
        await keyInputs.first().fill('testParam');
        const valInputs = page.locator('input[placeholder="Value"]');
        await valInputs.first().fill('testVal');

        // Because we entered a key, a new empty row should be added
        await expect(keyInputs).toHaveCount(2);
    });

    test('should support GraphQL body type', async ({ page }) => {
        test.fixme();
        await page.goto('/');
        await page.waitForTimeout(500);
        await page.goto('/devtools/api-client');
        await page.waitForTimeout(1000);

        await page.click('text=Body');
        await page.locator('label', { hasText: 'GraphQL' }).click();

        await expect(page.locator('div', { hasText: 'Query' }).locator('textarea')).toBeVisible();
        await expect(page.locator('div', { hasText: 'Variables' }).locator('textarea')).toBeVisible();
    });
});
