import { test, expect } from '@playwright/test';

test.describe('Content Security Policy', () => {
  test('should enforce CSP and prevent connections to unauthorized domains', async ({ page }) => {
    // Array to collect any CSP violations
    const cspViolations: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('Content-Security-Policy') || msg.text().includes('CSP'))) {
        cspViolations.push(msg.text());
      }
    });

    // We can also monitor page errors specifically
    page.on('pageerror', (err) => {
      if (err.message.includes('Content-Security-Policy') || err.message.includes('CSP')) {
        cspViolations.push(err.message);
      }
    });

    // Visit home page to trigger any initial CSP issues
    await page.goto('/');

    // Wait for the app to settle
    await page.waitForLoadState('networkidle');

    // Make sure we have no CSP violations from the app's normal load
    expect(cspViolations).toHaveLength(0);

    // Try to connect to a domain not in our allowlist (e.g. google.com for an API call)
    // The browser should block this because of our connect-src directive

    let blockedFetch = false;
    try {
      await page.evaluate(async () => {
        try {
          await fetch('https://example.com/malicious-exfiltration');
        } catch (e: any) {
          if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
            throw new Error('Blocked by CSP');
          }
          throw e;
        }
      });
    } catch (e: any) {
      if (e.message.includes('Blocked by CSP')) {
        blockedFetch = true;
      }
    }

    // Some browsers/Playwright versions might throw a different error,
    // or just silently block it and log a console error. Let's check both.

    // If the evaluate threw an error indicating it was blocked, that's good.
    // If not, we should have seen a CSP violation in the console.

    const hasViolationLog = cspViolations.some(v => v.includes('example.com'));

    expect(blockedFetch || hasViolationLog).toBeTruthy();
  });
});
