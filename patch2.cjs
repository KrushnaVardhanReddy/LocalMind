const fs = require('fs');
let content = fs.readFileSync('src/routes/docs/markdown/+page.svelte', 'utf8');

const toReplace = '/* Additional base styles if needed for the iframe body */';
const replaceWith = `/* Additional base styles if needed for the iframe body */
								body { margin: 0; }
							</style>
						</head>
						<body>
							\${html}
						</body>
						</html>`;

// Actually wait, let's just use string replace.
content = content.replace(
    '</style>',
    '</style>\n\t\t\t\t\t\t\t<script type="module">\n\t\t\t\t\t\t\t\timport mermaid from \'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs\';\n\t\t\t\t\t\t\t\tmermaid.initialize({ startOnLoad: true, theme: document.documentElement.classList.contains(\'dark\') ? \'dark\' : \'default\' });\n\t\t\t\t\t\t\t</script>'
);

fs.writeFileSync('src/routes/docs/markdown/+page.svelte', content);
