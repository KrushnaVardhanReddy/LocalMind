import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import JsonFormatter from '../JsonFormatter.svelte';
import JwtInspector from '../JwtInspector.svelte';
import Base64Encoder from '../Base64Encoder.svelte';

describe('JSON Formatter', () => {
    it('should format valid JSON', async () => {
        const { container } = render(JsonFormatter);
        const input = screen.getByPlaceholderText(/Paste JSON here/i);

        await fireEvent.input(input, { target: { value: '{"a":1}' } });

        // Wait for debounce
        await new Promise(r => setTimeout(r, 150));

        const output = container.querySelector('code');
        expect(output).not.toBeNull();
        expect(output?.textContent).toContain('"a": 1');
    });

    it('should validate against JSON schema', async () => {
        const { container } = render(JsonFormatter);
        const jsonInput = screen.getByPlaceholderText(/Paste JSON here/i);
        const schemaInput = screen.getByPlaceholderText(/Paste JSON Schema here/i);

        await fireEvent.input(jsonInput, { target: { value: '{"a":1}' } });
        await fireEvent.input(schemaInput, { target: { value: '{"type": "object", "properties": {"a": {"type": "string"}}}' } });

        // Wait for debounce
        await new Promise(r => setTimeout(r, 150));

        expect(screen.getByText(/must be string/i)).toBeTruthy();
    });
});

describe('JWT Inspector', () => {
    it('should parse valid JWT header and payload', async () => {
        const { container } = render(JwtInspector);
        const input = screen.getByPlaceholderText(/Paste JWT here/i);

        // {"alg":"HS256","typ":"JWT"} . {"sub":"1234567890","name":"John Doe","iat":1516239022}
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

        await fireEvent.input(input, { target: { value: token } });

        expect(screen.getByText(/Header/i)).toBeTruthy();
        expect(screen.getByText(/Payload/i)).toBeTruthy();
        expect(screen.getByText(/Signature Status/i)).toBeTruthy();

        expect(container.textContent).toContain('HS256');
        expect(container.textContent).toContain('John Doe');
    });

    it('should highlight expiration', async () => {
        const { container } = render(JwtInspector);
        const input = screen.getByPlaceholderText(/Paste JWT here/i);

        // expired token: {"exp": 1516239022} -> 2018
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.signature';

        await fireEvent.input(input, { target: { value: token } });

        expect(screen.getByText(/Expired/i)).toBeTruthy();
    });
});

describe('Base64 Encoder', () => {
    it('should encode text to base64', async () => {
        const { container } = render(Base64Encoder);
        const input = screen.getByPlaceholderText(/Type text or drop a file/i);

        await fireEvent.input(input, { target: { value: 'Hello World' } });

        const textareas = document.querySelectorAll('textarea');
        const output = textareas[1];
        expect(output.value).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should decode base64 to text', async () => {
        const { container } = render(Base64Encoder);

        // Switch to decode mode
        const decodeBtn = screen.getByText('Decode');
        await fireEvent.click(decodeBtn);

        const input = screen.getByPlaceholderText(/Paste Base64 string/i);
        await fireEvent.input(input, { target: { value: 'SGVsbG8gV29ybGQ=' } });

        const textareas = document.querySelectorAll('textarea');
        const output = textareas[1];
        expect(output.value).toBe('Hello World');
    });
});