const fs = require('fs');
let content = fs.readFileSync('src/routes/docs/markdown/+page.svelte', 'utf8');

const importsToAdd = `	import { renderMarkdown } from '$lib/utils/markdown-renderer';
	import { templates } from '$lib/templates/markdown';
	import mermaid from 'mermaid';
	import { onMount, onDestroy } from 'svelte';`;

const stateToAdd = `	// Timer for debouncing
	let debounceTimer: ReturnType<typeof setTimeout>;

	let isDark = $state(false);
	let observer: MutationObserver | undefined = $state();

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
		observer = new MutationObserver(() => {
			const newIsDark = document.documentElement.classList.contains('dark');
			if (isDark !== newIsDark) {
				isDark = newIsDark;
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	});

	onDestroy(() => {
		if (observer) observer.disconnect();
	});

	$effect(() => {
		mermaid.initialize({
			startOnLoad: false,
			theme: isDark ? 'dark' : 'default'
		});
	});`;

const effectToReplace = `	// Render HTML when debounced markdown changes
	$effect(() => {
		// Trigger reactivity on isDark change as well
		const currentIsDark = isDark;
		if (debouncedMarkdown !== undefined && debouncedMarkdown !== '') {
			renderMarkdown(debouncedMarkdown).then(result => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(result, 'text/html');
				const mermaidNodes = doc.querySelectorAll('code.language-mermaid, code.hljs.language-mermaid');

				if (mermaidNodes.length === 0) {
					html = result;
					return;
				}

				Promise.all(Array.from(mermaidNodes).map(async (node, i) => {
					const text = node.textContent || '';
					const pre = node.parentElement;
					if (pre && pre.tagName.toLowerCase() === 'pre') {
						try {
							const { svg } = await mermaid.render(\`mermaid-\${Date.now()}-\${i}\`, text);
							pre.outerHTML = \`<div class="mermaid-diagram flex justify-center my-4">\${svg}</div>\`;
						} catch (e: any) {
							pre.outerHTML = \`<div class="text-red-500 border border-red-500 p-4 rounded my-4 bg-red-50 dark:bg-red-900/20 font-mono text-sm overflow-auto">Mermaid Syntax Error: \${e.message}</div>\`;
						}
					}
				})).then(() => {
					html = doc.body.innerHTML;
				});
			});
		} else {
			html = '';
		}
	});`;

let modifiedContent = content.replace(
	/	import \{ renderMarkdown \} from '\$lib\/utils\/markdown-renderer';\n	import \{ templates \} from '\$lib\/templates\/markdown';/,
	importsToAdd
);

modifiedContent = modifiedContent.replace(
	/	\/\/ Timer for debouncing\n	let debounceTimer: ReturnType<typeof setTimeout>;/,
	stateToAdd
);

modifiedContent = modifiedContent.replace(
	/	\/\/ Render HTML when debounced markdown changes\n	\$effect\(\(\) => \{\n		if \(debouncedMarkdown\) \{\n			renderMarkdown\(debouncedMarkdown\)\.then\(result => \{\n				html = result;\n			\}\);\n		\} else \{\n			html = '';\n		\}\n	\}\);/,
	effectToReplace
);

fs.writeFileSync('src/routes/docs/markdown/+page.svelte', modifiedContent);
