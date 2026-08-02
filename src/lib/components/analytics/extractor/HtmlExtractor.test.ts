import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import HtmlExtractor from './HtmlExtractor.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getDuckDB: vi.fn().mockResolvedValue({
                registerFile: vi.fn().mockResolvedValue(undefined)
            })
        }
    };
});

describe('HtmlExtractor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show an error if HTML input is empty', async () => {
        const { getByRole, getByText } = render(HtmlExtractor);

        const extractButton = getByRole('button', { name: 'Extract Data' });
        await fireEvent.click(extractButton);

        expect(getByText('Please paste some HTML.')).toBeDefined();
    });

    it('should extract data from an HTML table', async () => {
        const { getByRole, getByPlaceholderText, getByText } = render(HtmlExtractor);

        const textarea = getByPlaceholderText('<html\>...<table\>...<\/table>...</html\>');

        const html = `
            <html>
                <body>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Alice</td>
                                <td>30</td>
                            </tr>
                            <tr>
                                <td>Bob</td>
                                <td>25</td>
                            </tr>
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        await fireEvent.input(textarea, { target: { value: html } });

        const extractButton = getByRole('button', { name: 'Extract Data' });
        await fireEvent.click(extractButton);

        // Success message should appear
        expect(getByText(/Successfully extracted and registered 1 datasets to DuckDB/i)).toBeDefined();

        // DuckDB should have been called
        const db = await WorkerManager.getDuckDB();
        expect(db.registerFile).toHaveBeenCalledTimes(1);

        // Preview should display the extracted rows
        expect(getByText('Alice')).toBeDefined();
        expect(getByText('30')).toBeDefined();
        expect(getByText('Bob')).toBeDefined();
        expect(getByText('25')).toBeDefined();
    });

    it('should extract data from JSON-LD', async () => {
        const { getByRole, getByPlaceholderText, getByText } = render(HtmlExtractor);

        const textarea = getByPlaceholderText('<html\>...<table\>...<\/table>...</html\>');

        const html = `
            <html>
                <head>
                    <script type="application/ld+json">
                    {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": "Jane Doe",
                        "jobTitle": "Engineer"
                    }
                    </script>
                </head>
                <body>
                    <p>Some content</p>
                </body>
            </html>
        `;

        await fireEvent.input(textarea, { target: { value: html } });

        const extractButton = getByRole('button', { name: 'Extract Data' });
        await fireEvent.click(extractButton);

        expect(getByText(/Successfully extracted and registered 1 datasets to DuckDB/i)).toBeDefined();

        // Data should be displayed in preview
        expect(getByText('Jane Doe')).toBeDefined();
        expect(getByText('Engineer')).toBeDefined();
    });

    it('should show error if no tables or JSON-LD are found', async () => {
        const { getByRole, getByPlaceholderText, getByText } = render(HtmlExtractor);

        const textarea = getByPlaceholderText('<html\>...<table\>...<\/table>...</html\>');

        const html = `
            <html>
                <body>
                    <div>No data here</div>
                </body>
            </html>
        `;

        await fireEvent.input(textarea, { target: { value: html } });

        const extractButton = getByRole('button', { name: 'Extract Data' });
        await fireEvent.click(extractButton);

        expect(getByText('No tables or JSON-LD found in the provided HTML.')).toBeDefined();
    });
});
