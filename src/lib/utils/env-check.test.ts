import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { validateCrossOriginIsolation } from './env-check';

describe('validateCrossOriginIsolation', () => {
    let originalConsoleError: any;

    beforeEach(() => {
        // Setup a mock DOM since Vitest runs in Node
        if (typeof window === 'undefined') {
            (globalThis as any).window = {};
            (globalThis as any).document = {
                body: {
                    appendChild: vi.fn(),
                },
                createElement: vi.fn().mockImplementation((tag) => {
                    if (tag === 'div') {
                        return { style: {} };
                    }
                    return {};
                }),
                getElementById: vi.fn().mockReturnValue(null) // Mock getElementById
            };
        } else {
            // Clean up any existing banners
            if (document.getElementById) {
                const banner = document.getElementById('coop-coep-error-banner');
                if (banner) {
                    banner.remove();
                }
            }
        }

        originalConsoleError = console.error;
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        vi.restoreAllMocks();
    });

    it('should not show error banner or log error if crossOriginIsolated is true', () => {
        Object.defineProperty(window, 'crossOriginIsolated', {
            value: true,
            writable: true,
            configurable: true
        });

        validateCrossOriginIsolation();

        expect(console.error).not.toHaveBeenCalled();
        if (typeof document !== 'undefined' && (document as any).__mock__) {
             expect(document.body.appendChild).not.toHaveBeenCalled();
        } else {
             expect(document.body.appendChild).not.toHaveBeenCalled();
        }
    });

    it('should show error banner and log error if crossOriginIsolated is false', () => {
         Object.defineProperty(window, 'crossOriginIsolated', {
            value: false,
            writable: true,
            configurable: true
        });

        validateCrossOriginIsolation();

        expect(console.error).toHaveBeenCalledWith('SharedArrayBuffer is unavailable. DuckDB multi-threading is disabled. Contact your hosting provider.');
        expect(document.body.appendChild).toHaveBeenCalled();

        // get the argument passed to appendChild
        const appendedElement = (document.body.appendChild as any).mock.calls[0][0];
        expect(appendedElement.id).toBe('coop-coep-error-banner');
        expect(appendedElement.textContent).toBe('SharedArrayBuffer is unavailable. DuckDB multi-threading is disabled. Contact your hosting provider.');
    });
});
