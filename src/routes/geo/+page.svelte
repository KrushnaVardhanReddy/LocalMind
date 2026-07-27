<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { GeoFileMetadata, GeoWorkerContract } from '$lib/workers/geo.worker';
    import { onMount } from 'svelte';
    import 'leaflet/dist/leaflet.css';

    let geoService: GeoWorkerContract | null = null;
    let mapElement: HTMLElement | null = $state(null);
    let map: any = null;
    let geoJsonLayer: any = null;
    let L: any = null;

    let file: File | null = $state(null);
    let metadata: GeoFileMetadata | null = $state(null);
    let isProcessing = $state(false);
    let error: string | null = $state(null);

    let fromEPSG = $state(4326);
    let toEPSG = $state(3857);

    onMount(async () => {
        try {
            // Lazy load leaflet for client side only
            L = (await import('leaflet')).default;
            geoService = await WorkerManager.getGeo();
            if (geoService) {
                await geoService.init();
            }

            // Setup map
            if (mapElement) {
                map = L.map(mapElement).setView([0, 0], 2);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);
            }
        } catch (e: any) {
            error = "Failed to initialize GeoWorker: " + e.message;
        }
    });

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        const droppedFile = e.dataTransfer?.files[0];
        if (droppedFile) {
            await loadFile(droppedFile);
        }
    }

    async function handleFileInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const selectedFile = target.files?.[0];
        if (selectedFile) {
            await loadFile(selectedFile);
        }
    }

    async function loadFile(selectedFile: File) {
        if (!geoService || !L) return;

        file = selectedFile;
        metadata = null;
        error = null;
        isProcessing = true;

        try {
            const buffer = await file.arrayBuffer();
            metadata = await geoService.inspect(buffer, file.name);

            // Try auto convert to geojson for map preview
            if (file.name.endsWith('.shp') || file.name.endsWith('.gpkg')) {
                const geoJsonBuffer = await geoService.convert(buffer, file.name, 'geojson');
                const text = new TextDecoder().decode(new Uint8Array(geoJsonBuffer));
                const geoJson = JSON.parse(text);
                updateMap(geoJson);
            } else if (file.name.endsWith('.geojson')) {
                const text = await file.text();
                const geoJson = JSON.parse(text);
                updateMap(geoJson);
            }
        } catch (e: any) {
            error = "Error loading file: " + e.message;
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    function updateMap(geoJson: any) {
        if (!map || !L) return;

        if (geoJsonLayer) {
            map.removeLayer(geoJsonLayer);
        }

        geoJsonLayer = L.geoJSON(geoJson).addTo(map);
        if (geoJsonLayer.getBounds().isValid()) {
            map.fitBounds(geoJsonLayer.getBounds());
        }
    }

    async function convertToGeoJSON() {
        if (!file || !geoService) return;
        isProcessing = true;
        error = null;

        try {
            const buffer = await file.arrayBuffer();
            const outBuffer = await geoService.convert(buffer, file.name, 'geojson');

            const blob = new Blob([outBuffer], { type: 'application/geo+json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace(/\.[^/.]+$/, "") + ".geojson";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            error = "Conversion failed: " + e.message;
        } finally {
            isProcessing = false;
        }
    }

    async function reproject() {
        if (!file || !geoService) return;
        isProcessing = true;
        error = null;

        try {
            const buffer = await file.arrayBuffer();
            const outBuffer = await geoService.reproject(buffer, file.name, fromEPSG, toEPSG);

            const blob = new Blob([outBuffer], { type: 'application/geo+json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reprojected_${toEPSG}_` + file.name.replace(/\.[^/.]+$/, "") + ".geojson";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            error = "Reprojection failed: " + e.message;
        } finally {
            isProcessing = false;
        }
    }
</script>

<div class="p-6 max-w-6xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold">Geo-Spatial Workspace</h1>

    {#if error}
        <div class="bg-red-100 text-red-800 p-4 rounded-md">
            {error}
        </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Input Section -->
        <div class="space-y-4">
            <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors"
                ondragover={(e) => e.preventDefault()}
                ondrop={handleDrop}
                role="region"
                aria-label="File dropzone"
            >
                <p class="text-gray-600 mb-4">Drag and drop spatial files (.shp, .geojson, .gpkg)</p>
                <input
                    type="file"
                    id="fileInput"
                    class="hidden"
                    accept=".shp,.geojson,.gpkg,.kml,.dbf,.shx,.prj"
                    onchange={handleFileInput}
                />
                <label
                    for="fileInput"
                    class="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 inline-block"
                >
                    Browse Files
                </label>
            </div>

            {#if isProcessing}
                <div class="text-blue-600 font-semibold">Processing...</div>
            {/if}

            {#if metadata}
                <div class="bg-white p-4 rounded-lg shadow space-y-2 border">
                    <h2 class="text-xl font-semibold mb-3">Metadata</h2>
                    <p><strong>File:</strong> {file?.name}</p>
                    <p><strong>CRS:</strong> {metadata.crs || 'Unknown'}</p>
                    <p><strong>Geometry:</strong> {metadata.geometryType || 'Unknown'}</p>
                    <p><strong>Features:</strong> {metadata.featureCount ?? 'Unknown'}</p>
                    {#if metadata.extent}
                        <p><strong>Extent:</strong>
                            [{metadata.extent.minX.toFixed(4)}, {metadata.extent.minY.toFixed(4)},
                             {metadata.extent.maxX.toFixed(4)}, {metadata.extent.maxY.toFixed(4)}]
                        </p>
                    {/if}
                </div>
            {/if}

            {#if file}
                <div class="bg-white p-4 rounded-lg shadow space-y-4 border">
                    <h2 class="text-xl font-semibold">Tools</h2>

                    <div>
                        <button
                            onclick={convertToGeoJSON}
                            disabled={isProcessing}
                            class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-700"
                        >
                            Convert to GeoJSON
                        </button>
                    </div>

                    <div class="pt-4 border-t space-y-3">
                        <h3 class="font-medium">Reproject</h3>
                        <div class="flex gap-4 items-end">
                            <div>
                                <label for="fromEPSG" class="block text-sm text-gray-600">From EPSG</label>
                                <input type="number" id="fromEPSG" bind:value={fromEPSG} class="border rounded p-2 w-24" />
                            </div>
                            <div>
                                <label for="toEPSG" class="block text-sm text-gray-600">To EPSG</label>
                                <input type="number" id="toEPSG" bind:value={toEPSG} class="border rounded p-2 w-24" />
                            </div>
                            <button
                                onclick={reproject}
                                disabled={isProcessing}
                                class="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-indigo-700 h-[42px]"
                            >
                                Reproject
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Map Section -->
        <div>
            <div class="bg-white p-2 rounded-lg shadow border h-[600px]">
                <div bind:this={mapElement} class="w-full h-full rounded z-0"></div>
            </div>
        </div>
    </div>
</div>
