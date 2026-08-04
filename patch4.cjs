const fs = require('fs');
let content = fs.readFileSync('src/routes/docs/markdown/+page.svelte', 'utf8');

content = content.replace(
    '${css}\n\t</style>\n\t\t\t\t\t\t\t<script type="module">\n\t\t\t\t\t\t\t\timport mermaid from \'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs\';\n\t\t\t\t\t\t\t\tmermaid.initialize({ startOnLoad: true, theme: document.documentElement.classList.contains(\'dark\') ? \'dark\' : \'default\' });\n\t\t\t\t\t\t\t</script>\n</head>',
    '${css}\n\t</style>\n</head>'
);

fs.writeFileSync('src/routes/docs/markdown/+page.svelte', content);
