import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
const marked = new Marked(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code: string, lang: string) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	}),
	gfmHeadingId()
);

marked.setOptions({
	gfm: true,
	breaks: true
});

/**
 * Parses Markdown to HTML, applies syntax highlighting to code blocks,
 * and sanitizes the output to prevent XSS.
 * @param markdown The raw markdown string
 * @returns The sanitized HTML string
 */
export async function renderMarkdown(markdown: string): Promise<string> {
	if (!markdown) return '';

	try {
		// 1. Parse markdown to raw HTML
		const rawHtml = await marked.parse(markdown);

		// 2. Sanitize HTML
		let cleanHtml = rawHtml;

		if (typeof window !== 'undefined' && DOMPurify && DOMPurify.sanitize) {
			cleanHtml = DOMPurify.sanitize(rawHtml);
		} else if (typeof globalThis !== 'undefined' && DOMPurify && DOMPurify.sanitize) {
            cleanHtml = DOMPurify.sanitize(rawHtml);
        }

		return cleanHtml;
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return '<p>Error rendering markdown.</p>';
	}
}
