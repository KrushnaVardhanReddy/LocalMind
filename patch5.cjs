const fs = require('fs');
let content = fs.readFileSync('src/routes/docs/markdown/+page.svelte', 'utf8');

content = content.replace(
    '/* Additional base styles if needed for the iframe body */\\n\t\t\t\t\t\t\t\tbody { margin: 0; }\\n\t\t\t\t\t\t\t</style>\\n\t\t\t\t\t\t\t<script type="module">\\n\t\t\t\t\t\t\t\timport mermaid from \\'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs\\';\\n\t\t\t\t\t\t\t\tmermaid.initialize({ startOnLoad: true });\\n\t\t\t\t\t\t\t</script>',
    ''
);
fs.writeFileSync('src/routes/docs/markdown/+page.svelte', content);
