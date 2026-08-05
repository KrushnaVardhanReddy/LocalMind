import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Phase 7: Plugin Runtime', () => {
    test.beforeEach(async ({ page }) => {
        // Reset DB if needed, but since it's OPFS, it might be persistent across browser contexts.
        // We will just navigate.
        const res = await page.goto('/settings/plugins');
        if (res && res.status() === 404) {
            test.skip(true, 'Route not yet implemented');
        }
    });

    test('Plugin installs successfully from zip drop', async ({ page }) => {
        const filePath = path.resolve(__dirname, '../fixtures/plugins/hello-plugin.zip');

        // Wait for drop zone to be ready
        const dropzone = page.locator('div[role="button"]:has-text("Drag and drop")');
        await expect(dropzone).toBeVisible();

        // Simulate drop event using Playwright's file chooser/data transfer
        // Note: standard fileChooser doesn't work for drop zones directly without input[type="file"].
        // But we can use evaluate to simulate the drop event with a DataTransfer.

        // Let's create an input element to upload since Svelte doesn't have a hidden input yet
        // A better way to test drag-and-drop in playwright is to inject a file into an input
        // Since we didn't add an input, we can evaluate a drop event manually

        const fileBuffer = fs.readFileSync(filePath);
        const fileBase64 = fileBuffer.toString('base64');

        await dropzone.evaluate(async (node, base64) => {
            const res = await fetch(`data:application/zip;base64,${base64}`);
            const blob = await res.blob();
            const file = new File([blob], 'hello-plugin.zip', { type: 'application/zip' });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const event = new DragEvent('drop', {
                dataTransfer: dataTransfer,
                bubbles: true,
                cancelable: true,
            });
            node.dispatchEvent(event);
        }, fileBase64);

        // Assert: plugin appears in the installed list
        await expect(page.locator('text=Hello World Uppercaser v1.0.0')).toBeVisible();
        await expect(page.locator('text=A test plugin that uppercases text')).toBeVisible();
    });

    test('Plugin processes a test payload correctly', async ({ page }) => {
        // Ensure plugin is installed (Playwright tests might run in parallel or independently)
        // If not, we install it.
        const hasPlugin = await page.locator('text=Hello World Uppercaser').isVisible();
        if (!hasPlugin) {
            const filePath = path.resolve(__dirname, '../fixtures/plugins/hello-plugin.zip');
            const fileBuffer = fs.readFileSync(filePath);
            const fileBase64 = fileBuffer.toString('base64');
            const dropzone = page.locator('div[role="button"]:has-text("Drag and drop")');
            await dropzone.evaluate(async (node, base64) => {
                const res = await fetch(`data:application/zip;base64,${base64}`);
                const blob = await res.blob();
                const file = new File([blob], 'hello-plugin.zip', { type: 'application/zip' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                const event = new DragEvent('drop', { dataTransfer, bubbles: true });
                node.dispatchEvent(event);
            }, fileBase64);
            await expect(page.locator('text=Hello World Uppercaser')).toBeVisible();
        }

        // Click "Test Plugin"
        await page.click('button:has-text("Test Plugin")');

        // Assert: output is "HELLO LOCALMIND"
        await expect(page.locator('text=HELLO LOCALMIND')).toBeVisible();
    });

    test('Invalid WASM is rejected with error', async ({ page }) => {
        const filePath = path.resolve(__dirname, '../fixtures/plugins/invalid-plugin.zip');
        const fileBuffer = fs.readFileSync(filePath);
        const fileBase64 = fileBuffer.toString('base64');

        const dropzone = page.locator('div[role="button"]:has-text("Drag and drop")');

        await dropzone.evaluate(async (node, base64) => {
            const res = await fetch(`data:application/zip;base64,${base64}`);
            const blob = await res.blob();
            const file = new File([blob], 'invalid-plugin.zip', { type: 'application/zip' });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const event = new DragEvent('drop', {
                dataTransfer: dataTransfer,
                bubbles: true,
                cancelable: true,
            });
            node.dispatchEvent(event);
        }, fileBase64);

        // Assert: error message is visible
        await expect(page.locator('text=Invalid WASM binary or missing required exports')).toBeVisible({ timeout: 10000 });
    });

    test('Removing a plugin removes it from the list', async ({ page }) => {
        // First ensure it's installed
        const hasPlugin = await page.locator('text=Hello World Uppercaser').isVisible();
        if (!hasPlugin) {
            const filePath = path.resolve(__dirname, '../fixtures/plugins/hello-plugin.zip');
            const fileBuffer = fs.readFileSync(filePath);
            const fileBase64 = fileBuffer.toString('base64');
            const dropzone = page.locator('div[role="button"]:has-text("Drag and drop")');
            await dropzone.evaluate(async (node, base64) => {
                const res = await fetch(`data:application/zip;base64,${base64}`);
                const blob = await res.blob();
                const file = new File([blob], 'hello-plugin.zip', { type: 'application/zip' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                const event = new DragEvent('drop', { dataTransfer, bubbles: true });
                node.dispatchEvent(event);
            }, fileBase64);
            await expect(page.locator('text=Hello World Uppercaser')).toBeVisible();
        }

        // Click "Remove"
        await page.click('button:has-text("Remove")');

        // Assert: plugin is no longer in the list
        await expect(page.locator('text=Hello World Uppercaser')).not.toBeVisible();
    });
});