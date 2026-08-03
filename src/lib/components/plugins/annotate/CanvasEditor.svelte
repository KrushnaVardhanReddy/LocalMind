<script lang="ts">
    import { onMount } from 'svelte';

    let { imageFile }: { imageFile: File | null } = $props();

    type Tool = 'select' | 'rect' | 'circle' | 'arrow' | 'text' | 'blur';
    type Shape = {
        type: Tool;
        x: number;
        y: number;
        w?: number;
        h?: number;
        r?: number;
        text?: string;
        color?: string;
        lineWidth?: number;
    };

    let currentTool: Tool = $state('select');
    let shapes: Shape[] = $state([]);
    let isDrawing = $state(false);
    let startX = $state(0);
    let startY = $state(0);
    let currentShape: Shape | null = $state(null);

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = $state(null);
    let imageElement: HTMLImageElement | null = $state(null);
    let blurCanvas: HTMLCanvasElement | null = null;
    let blurCtx: CanvasRenderingContext2D | null = null;

    $effect(() => {
        if (canvas && !ctx) {
            ctx = canvas.getContext('2d');
            blurCanvas = document.createElement('canvas');
            blurCtx = blurCanvas.getContext('2d');
        }
    });

    $effect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            const img = new Image();
            img.onload = () => {
                if (canvas && ctx && blurCanvas && blurCtx) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    blurCanvas.width = img.width;
                    blurCanvas.height = img.height;
                    imageElement = img;

                    // Pre-calculate blurred image
                    blurCtx.filter = 'blur(10px)';
                    blurCtx.drawImage(img, 0, 0);
                    blurCtx.filter = 'none';

                    render();
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } else if (canvas && ctx && blurCanvas && blurCtx) {
             canvas.width = 800;
             canvas.height = 600;
             blurCanvas.width = 800;
             blurCanvas.height = 600;
             imageElement = null;
             shapes = [];
             render();
        }
    });

    function getMousePos(e: MouseEvent) {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function onMouseDown(e: MouseEvent) {
        if (currentTool === 'select' || !imageElement) return;
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;

        currentShape = {
            type: currentTool,
            x: startX,
            y: startY,
            color: '#ff0000',
            lineWidth: 3
        };

        if (currentTool === 'text') {
            const text = prompt('Enter text:');
            if (text) {
                shapes = [...shapes, { ...currentShape, text }];
            }
            isDrawing = false;
            currentShape = null;
            render();
        }
    }

    function onMouseMove(e: MouseEvent) {
        if (!isDrawing || !currentShape) return;
        const pos = getMousePos(e);
        const w = pos.x - startX;
        const h = pos.y - startY;

        if (currentShape.type === 'rect' || currentShape.type === 'blur' || currentShape.type === 'arrow') {
            currentShape.w = w;
            currentShape.h = h;
        } else if (currentShape.type === 'circle') {
            currentShape.r = Math.sqrt(w * w + h * h);
        }

        render();
    }

    function onMouseUp() {
        if (!isDrawing) return;
        isDrawing = false;
        if (currentShape) {
            shapes = [...shapes, currentShape];
            currentShape = null;
        }
        render();
    }

    function drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
        const headlen = 15; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    function render() {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imageElement) {
            ctx.drawImage(imageElement, 0, 0);
        }

        const allShapes = currentShape ? [...shapes, currentShape] : shapes;

        for (const shape of allShapes) {
            ctx.save();
            ctx.strokeStyle = shape.color || '#ff0000';
            ctx.fillStyle = shape.color || '#ff0000';
            ctx.lineWidth = shape.lineWidth || 3;

            if (shape.type === 'rect') {
                if (shape.w !== undefined && shape.h !== undefined) {
                    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
                }
            } else if (shape.type === 'circle') {
                if (shape.r !== undefined) {
                    ctx.beginPath();
                    ctx.arc(shape.x, shape.y, shape.r, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            } else if (shape.type === 'arrow') {
                if (shape.w !== undefined && shape.h !== undefined) {
                    drawArrow(ctx, shape.x, shape.y, shape.x + shape.w, shape.y + shape.h);
                }
            } else if (shape.type === 'text' && shape.text) {
                ctx.font = '24px sans-serif';
                ctx.fillText(shape.text, shape.x, shape.y);
            } else if (shape.type === 'blur') {
                 if (shape.w !== undefined && shape.h !== undefined && blurCanvas) {
                    // Draw the pre-blurred image onto the current context, clipping to the shape
                    const rx = shape.w > 0 ? shape.x : shape.x + shape.w;
                    const ry = shape.h > 0 ? shape.y : shape.y + shape.h;
                    const rw = Math.abs(shape.w);
                    const rh = Math.abs(shape.h);

                    if (rw > 0 && rh > 0) {
                        ctx.beginPath();
                        ctx.rect(rx, ry, rw, rh);
                        ctx.clip();
                        ctx.drawImage(blurCanvas, 0, 0);
                    }
                 }
            }

            ctx.restore();
        }
    }

    function setTool(tool: Tool) {
        currentTool = tool;
    }

    function clearAll() {
        shapes = [];
        render();
    }

    function exportImage() {
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'annotated-image.png';
        a.click();
    }
</script>

<div class="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'select' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('select')}
        >
            Select
        </button>
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'rect' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('rect')}
        >
            Rectangle
        </button>
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'circle' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('circle')}
        >
            Circle
        </button>
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'arrow' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('arrow')}
        >
            Arrow
        </button>
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'text' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('text')}
        >
            Text
        </button>
        <button
            class="rounded px-3 py-1 text-sm font-medium {currentTool === 'blur' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
            onclick={() => setTool('blur')}
        >
            Blur
        </button>

        <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>

        <button
            class="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
            onclick={clearAll}
        >
            Clear All
        </button>

        <button
            class="rounded px-3 py-1 text-sm font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 ml-auto"
            onclick={exportImage}
        >
            Export
        </button>
    </div>

    <!-- Canvas Container -->
    <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800/50">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <canvas
            bind:this={canvas}
            onmousedown={onMouseDown}
            onmousemove={onMouseMove}
            onmouseup={onMouseUp}
            onmouseleave={onMouseUp}
            class="max-h-full max-w-full shadow-md bg-white cursor-crosshair"
        ></canvas>
    </div>
</div>
