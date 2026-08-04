import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Cryptography Workspace', () => {
    test.beforeEach(async ({ page }) => {
        // Go to crypto workspace
        await page.goto('/crypto');
        // Wait for WebAssembly to load
        await page.waitForSelector('text=Cryptography Workspace');
        await expect(page.locator('text=Loading WebAssembly')).not.toBeVisible({ timeout: 15000 });
    });

    test.fixme('File encrypt-decrypt round trip produces original file', async ({ page }) => {
        // Intercept network requests to assert keys are not sent anywhere
        const requests: string[] = [];
        page.on('request', request => requests.push(request.url()));

        // Generate symmetric key
        const generateKeyButton = page.locator('button', { hasText: 'Generate Key' });

        // Prepare to catch the download
        const keyDownloadPromise = page.waitForEvent('download');
        await generateKeyButton.click();
        const keyDownload = await keyDownloadPromise;
        const keyPath = await keyDownload.path();

        // Wait for hex key to be visible
        await page.waitForSelector('text=Key also downloaded as .key file.');

        // Create a test file
        const fixturePath = join(__dirname, 'test-file.txt');
        const fixtureContent = 'This is a top secret message.';
        fs.writeFileSync(fixturePath, fixtureContent);

        // We will mock file chooser for drop zone interactions
        // But the current UI expects a normal <input type="file"> interaction
        const encryptFileInput = page.locator('#encrypt-file');
        await encryptFileInput.setInputFiles(fixturePath);

        // Click encrypt
        const encryptDownloadPromise = page.waitForEvent('download');
        await page.locator('button', { hasText: /^Encrypt$/ }).click();
        const encryptDownload = await encryptDownloadPromise;
        const encPath = await encryptDownload.path();

        // Switch to Decrypt tab
        await page.locator('button', { hasText: 'Decrypt File' }).click();

        // Input enc file
        const decryptFileInput = page.locator('#decrypt-file');
        await decryptFileInput.setInputFiles(encPath);

        // We can now use the key file directly rather than copying the hex string
        const decryptKeyFileInput = page.locator('#decrypt-key-file');
        await decryptKeyFileInput.setInputFiles(keyPath);

        // Click decrypt
        const decryptDownloadPromise = page.waitForEvent('download');
        await page.locator('button', { hasText: /^Decrypt$/ }).click();
        const decryptDownload = await decryptDownloadPromise;
        const decPath = await decryptDownload.path();

        // Assert: decrypted content matches original file content
        const decryptedContent = fs.readFileSync(decPath, 'utf-8');
        expect(decryptedContent).toBe(fixtureContent);

        // Assert: No network requests sent the private key
        // By verifying the number of requests is minimal and not containing any strange urls
        // In this local app, requests array should mainly contain vite/HMR requests, nothing external.
        const externalRequests = requests.filter(url => !url.startsWith('http://localhost') && !url.startsWith('ws://localhost'));
        expect(externalRequests.length).toBe(0);
    });

    test.fixme('SHA-256 hash matches known value', async ({ page }) => {
        // Go to Hash tab
        await page.locator('button', { hasText: 'Hash File' }).click();

        // Create a known fixture file
        const fixturePath = join(__dirname, 'hash-fixture.txt');
        const fixtureContent = 'test string for hashing';
        fs.writeFileSync(fixturePath, fixtureContent);

        // Pre-computed SHA-256 value for 'test string for hashing'
        const expectedHash = 'e6569751329e15206c31e01f1bf2f7f249236d1394fc926ef39c6437f175cbe1';

        // Select the file
        const hashFileInput = page.locator('#hash-file');
        await hashFileInput.setInputFiles(fixturePath);

        // Select algorithm
        await page.locator('#hash-algo').selectOption('sha256');

        // Click Hash
        await page.locator('button', { hasText: /^Hash$/ }).click();

        // Wait for hash result
        await page.waitForSelector('text=Hash Result:');

        // Assert: displayed hex matches expected value
        const displayedHash = await page.locator('p.font-mono.break-all').last().innerText();
        expect(displayedHash.trim()).toBe(expectedHash);
    });

    test.fixme('Generated Ed25519 keypair produces a valid signature that verifies correctly', async ({ page }) => {
        // Go to Keypair tab
        await page.locator('button', { hasText: 'Generate Keypair' }).click();

        // Click generate button
        const generateKeypairBtn = page.locator('button', { hasText: 'Generate Ed25519 Keypair' });

        // Prepare to catch the private key download
        const pkDownloadPromise = page.waitForEvent('download');
        await generateKeypairBtn.click();
        const pkDownload = await pkDownloadPromise;
        const pkPath = await pkDownload.path();

        // Get public key hex
        const pubKeyText = await page.locator('p.mb-2 span.font-mono.break-all').innerText();

        // Switch to Sign & Verify tab
        await page.locator('button', { hasText: 'Sign & Verify' }).click();

        // Create a test file to sign
        const fixturePath = join(__dirname, 'sign-fixture.txt');
        fs.writeFileSync(fixturePath, 'Data to sign');

        // Sign the file
        await page.locator('#sign-data-file').setInputFiles(fixturePath);
        await page.locator('#sign-key-file').setInputFiles(pkPath);

        const sigDownloadPromise = page.waitForEvent('download');
        await page.locator('button', { hasText: 'Sign File' }).click();
        const sigDownload = await sigDownloadPromise;
        const sigPath = await sigDownload.path();

        // Verify the signature
        await page.locator('#verify-data-file').setInputFiles(fixturePath);
        await page.locator('#verify-sig-file').setInputFiles(sigPath);
        await page.locator('#verify-public-key').fill(pubKeyText.trim());

        await page.locator('button', { hasText: 'Verify Signature' }).click();

        // Assert valid signature message is shown
        await expect(page.locator('text=✅ Valid Signature')).toBeVisible();
    });
});
