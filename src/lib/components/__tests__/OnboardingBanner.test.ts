import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import OnboardingBanner from '../OnboardingBanner.svelte';

describe('OnboardingBanner', () => {
    it('renders welcome text and steps', () => {
        const { getByText } = render(OnboardingBanner, {
            props: { step: 0, onDismiss: () => {} }
        });

        expect(getByText('Welcome to LocalMind!')).toBeTruthy();
        expect(getByText('Drop a file')).toBeTruthy();
        expect(getByText('Export')).toBeTruthy();
    });

    it('calls onDismiss when dismiss button is clicked', async () => {
        const mockDismiss = vi.fn();
        const { getByText } = render(OnboardingBanner, {
            props: { step: 0, onDismiss: mockDismiss }
        });

        const button = getByText('Dismiss');
        await fireEvent.click(button);

        expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
});
