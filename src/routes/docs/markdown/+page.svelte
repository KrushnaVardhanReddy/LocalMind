<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown-renderer';
	import { templates } from '$lib/templates/markdown';

	// The raw markdown input
	let markdown = $state('');

	// A reference to the textarea element for inserting formatting
	let textareaRef: HTMLTextAreaElement | undefined = $state();

	// The debounced markdown content used for rendering
	let debouncedMarkdown = $state('');

	// The rendered HTML output
	let html = $state('');

	// Timer for debouncing
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Update the debounced markdown whenever markdown changes
	$effect(() => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debouncedMarkdown = markdown;
		}, 300);
	});

	// Render HTML when debounced markdown changes
	$effect(() => {
		if (debouncedMarkdown) {
			renderMarkdown(debouncedMarkdown).then(result => {
				html = result;
			});
		} else {
			html = '';
		}
	});

	// Helper to insert text at the cursor position in the textarea
	function insertFormatting(prefix: string, suffix: string = '') {
		if (!textareaRef) return;

		const start = textareaRef.selectionStart;
		const end = textareaRef.selectionEnd;
		const selectedText = markdown.substring(start, end);

		const newText = markdown.substring(0, start) + prefix + selectedText + suffix + markdown.substring(end);
		markdown = newText;

		// Reset cursor position
		setTimeout(() => {
			if (textareaRef) {
				textareaRef.focus();
				textareaRef.setSelectionRange(start + prefix.length, end + prefix.length);
			}
		}, 0);
	}

	function loadTemplate(templateId: string) {
		const template = templates[templateId as keyof typeof templates];
		if (template) {
			markdown = template;
		}
	}

	async function downloadHtml() {
		try {
			// Fetch the CSS file to inline it
			const cssResponse = await fetch('/export-document.css');
			const css = await cssResponse.text();

			const fullHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Exported Document</title>
	<style>
		${css}
	</style>
</head>
<body>
	${html}
</body>
</html>`;

			const blob = new Blob([fullHtml], { type: 'text/html' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'document.html';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading HTML:', error);
			alert('Failed to generate HTML download.');
		}
	}

	function exportPdf() {
		// We can print the iframe's content window
		const iframe = document.querySelector('iframe');
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.print();
		}
	}
</script>

<svelte:head>
	<title>LocalMind Docs - Markdown Editor</title>
</svelte:head>

<div class="h-[calc(100vh-4rem)] flex flex-col">
	<!-- Toolbar -->
	<div class="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
		<div class="flex items-center space-x-1">
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700 font-bold" onclick={() => insertFormatting('**', '**')} title="Bold">B</button>
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700 italic" onclick={() => insertFormatting('*', '*')} title="Italic">I</button>
			<div class="w-px h-6 bg-gray-300 mx-1"></div>
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700 font-mono text-sm" onclick={() => insertFormatting('\`', '\`')} title="Code">\`</button>
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700" onclick={() => insertFormatting('[', '](url)')} title="Link">🔗</button>
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700" onclick={() => insertFormatting('![alt text](', ')')} title="Image">🖼️</button>
			<div class="w-px h-6 bg-gray-300 mx-1"></div>
			<button class="p-1.5 hover:bg-gray-100 rounded text-gray-700" onclick={() => insertFormatting('\\n| Header 1 | Header 2 |\\n|---|---|\\n| Cell 1 | Cell 2 |\\n')} title="Table">📊</button>
		</div>
		<div class="flex items-center space-x-2">
			<select
				class="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
				onchange={(e) => loadTemplate(e.currentTarget.value)}
			>
				<option value="">Load Template...</option>
				<option value="meeting-notes">Meeting Notes</option>
				<option value="technical-report">Technical Report</option>
				<option value="invoice">Invoice</option>
			</select>
			<button
				class="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100 transition-colors border border-blue-200"
				onclick={downloadHtml}
			>
				Download HTML
			</button>
			<button
				class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
				onclick={exportPdf}
			>
				Export to PDF
			</button>
		</div>
	</div>

	<!-- Editor and Preview Panels -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Panel: Editor -->
		<div class="w-1/2 flex flex-col border-r border-gray-200">
			<textarea
				bind:this={textareaRef}
				class="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-0 w-full h-full"
				placeholder="Type your markdown here..."
				bind:value={markdown}
			></textarea>
		</div>

		<!-- Right Panel: Preview -->
		<div class="w-1/2 bg-white overflow-auto relative">
			<div class="absolute inset-0">
				<!-- iframe used to isolate the CSS for the preview -->
				<iframe
					title="Markdown Preview"
					class="w-full h-full border-0"
					srcdoc={\`
						<!DOCTYPE html>
						<html>
						<head>
							<link rel="stylesheet" href="/export-document.css">
							<style>
								/* Additional base styles if needed for the iframe body */
								body { margin: 0; }
							</style>
						</head>
						<body>
							\${html}
						</body>
						</html>
					\`}
				></iframe>
			</div>
		</div>
	</div>
</div>
