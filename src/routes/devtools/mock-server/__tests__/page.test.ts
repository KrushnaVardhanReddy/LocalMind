import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MockServerPage from '../+page.svelte';

describe('Mock Server UI', () => {
    it('should render the drop zone correctly', () => {
        render(MockServerPage);
        expect(screen.getByText('Local Mock API Server')).toBeTruthy();
        expect(screen.getByText('Drag and drop an OpenAPI spec here')).toBeTruthy();
    });
});
