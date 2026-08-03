<script lang="ts">
    import mermaid from 'mermaid';
    import { onMount } from 'svelte';
    import { Download } from 'lucide-svelte';

    let { code = '' } = $props<{ code?: string }>();

    let container: HTMLDivElement | undefined = $state();
    let svgContent = $state('');
    let errorMessage = $state('');
    let renderTimer: ReturnType<typeof setTimeout> | null = null;
    let latestRenderId = 0;

    onMount(() => {
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
    });

    $effect(() => {
        if (code && code.trim() !== '') {
            // Debounce rendering
            if (renderTimer) clearTimeout(renderTimer);

            renderTimer = setTimeout(() => {
                renderDiagram(code);
            }, 300); // 300ms debounce
        } else {
            svgContent = '';
            errorMessage = '';
        }
    });

    async function renderDiagram(mermaidCode: string) {
        latestRenderId++;
        const currentRenderId = latestRenderId;

        try {
            const id = 'mermaid-' + Date.now();
            const { svg } = await mermaid.render(id, mermaidCode);

            // Only update if this is the most recent render request
            if (currentRenderId === latestRenderId) {
                svgContent = svg;
                errorMessage = '';
            }
        } catch (e: any) {
            if (currentRenderId === latestRenderId) {
                errorMessage = e.message || 'Syntax error in Mermaid code.';
                // We keep the old svgContent so the diagram doesn't flash empty during typing
            }
        }
    }

    function exportSVG() {
        if (!svgContent) return;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function exportPNG() {
        if (!container) return;
        const svgElement = container.querySelector('svg');
        if (!svgElement) return;

        // Clone the SVG element
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

        // Ensure proper dimensions
        const box = svgElement.getBoundingClientRect();
        clonedSvg.setAttribute('width', box.width.toString());
        clonedSvg.setAttribute('height', box.height.toString());

        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = box.width;
            canvas.height = box.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');

                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'diagram.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
</script>

<div class="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
    <div class="flex justify-between items-center p-3 border-b border-slate-200 bg-slate-50">
        <h3 class="text-sm font-semibold text-slate-700">Preview</h3>
        <div class="flex gap-2">
            <button
                onclick={exportSVG}
                disabled={!svgContent}
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as SVG"
            >
                <Download size={14} />
                SVG
            </button>
            <button
                onclick={exportPNG}
                disabled={!svgContent}
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export as PNG"
            >
                <Download size={14} />
                PNG
            </button>
        </div>
    </div>

    <div class="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50/50">
        {#if !code || code.trim() === ''}
            <div class="text-slate-400 text-sm italic">
                Diagram preview will appear here
            </div>
        {:else}
            <div
                bind:this={container}
                class="mermaid-container transition-opacity duration-200 {errorMessage ? 'opacity-50' : 'opacity-100'}"
            >
                <!-- Using Svelte's html tag rendering instead of manual innerHTML -->
                {@html svgContent}
            </div>
        {/if}

        {#if errorMessage}
            <div class="absolute bottom-4 left-4 right-4 bg-red-50 text-red-600 p-3 rounded text-xs border border-red-200 shadow-sm overflow-auto max-h-32 whitespace-pre-wrap">
                {errorMessage}
            </div>
        {/if}
    </div>
</div>

<style>
    /* Ensure mermaid SVGs are responsive but don't stretch too much */
    :global(.mermaid-container svg) {
        max-width: 100%;
        height: auto;
    }
</style>
