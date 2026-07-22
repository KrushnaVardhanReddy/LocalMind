import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../markdown-renderer';

describe('markdown-renderer', () => {
	it('should parse basic markdown to HTML', async () => {
		const markdown = '# Hello World\n\nThis is a **test**.';
		const html = await renderMarkdown(markdown);

		expect(html).toContain('<h1 id="hello-world">Hello World</h1>');
		expect(html).toContain('<strong>test</strong>');
	});

	it('should remove malicious scripts (XSS)', async () => {
		const maliciousMarkdown = '# Hello\n\n<script>alert("XSS")</script>\n\n[Link](javascript:alert("XSS"))';
		const html = await renderMarkdown(maliciousMarkdown);

		expect(html).not.toContain('<script>');
		expect(html).not.toContain('javascript:alert');
		expect(html).toContain('<h1 id="hello">Hello</h1>');
		expect(html).toContain('<a>Link</a>');
	});

	it('should apply syntax highlighting to code blocks', async () => {
		const codeMarkdown = '```javascript\nconst a = 1;\n```';
		const html = await renderMarkdown(codeMarkdown);

		expect(html).toContain('class="hljs language-javascript"');
		expect(html).toContain('<span class="hljs-keyword">const</span>');
	});

	it('should handle empty input', async () => {
		const html = await renderMarkdown('');
		expect(html).toBe('');
	});
});
