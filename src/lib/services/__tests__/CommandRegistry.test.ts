import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry } from '../CommandRegistry';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
    goto: vi.fn().mockResolvedValue(undefined)
}));

describe('CommandRegistry', () => {
    it('returns the correct list of built-in commands', () => {
        const commands = CommandRegistry.getBuiltInCommands();
        expect(commands).toBeInstanceOf(Array);
        expect(commands.length).toBeGreaterThan(0);

        const analyticsCommand = commands.find(c => c.id === 'nav-analytics');
        expect(analyticsCommand).toBeDefined();
        expect(analyticsCommand?.label).toBe('Go to Analytics');
        expect(analyticsCommand?.category).toBe('navigate');
    });

    it('command actions execute without error', () => {
        const commands = CommandRegistry.getBuiltInCommands();

        // Find a navigation command
        const docsCommand = commands.find(c => c.id === 'nav-docs');
        expect(docsCommand).toBeDefined();

        // Execute action, it shouldn't throw
        expect(() => docsCommand?.action()).not.toThrow();
    });
});
