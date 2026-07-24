<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { CADWorkerContract, CADMetadata } from '$lib/workers/cad.worker';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

    let fileInput: HTMLInputElement | undefined = $state();
    let isReady = $state(false);
    let loading = $state(false);
    let errorStr = $state('');
    let dragActive = $state(false);

    let cadWorker: CADWorkerContract;
    let metadata: CADMetadata | null = $state(null);
    let currentFileName = $state('');

    let canvasContainer: HTMLDivElement | undefined = $state();

    // Three.js variables
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let mesh: THREE.Mesh | null = $state(null);
    let wireframeMaterial: THREE.MeshBasicMaterial;
    let solidMaterial: THREE.MeshStandardMaterial;

    let isWireframe = $state(false);

    $effect(() => {
        initWorker();
        initThreeJS();

        return () => {
            if (renderer) {
                renderer.dispose();
            }
            if (controls) {
                controls.dispose();
            }
            window.removeEventListener('resize', onWindowResize);
        };
    });

    async function initWorker() {
        try {
            cadWorker = await WorkerManager.getCAD() as unknown as CADWorkerContract;
            await cadWorker.init();
            isReady = true;
        } catch (e: any) {
            errorStr = `Failed to initialize CAD Engine: ${e.message}`;
        }
    }

    function initThreeJS() {
        if (!canvasContainer || scene) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f4f8); // slate-50 roughly

        const width = canvasContainer.clientWidth || 800;
        const height = canvasContainer.clientHeight || 600;

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(100, 100, 100);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        canvasContainer.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0x404040, 2.5); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(100, 200, 50);
        scene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(200, 50, 0x0000ff, 0x808080);
        gridHelper.position.y = 0;
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        solidMaterial = new THREE.MeshStandardMaterial({
            color: 0x90a4ae,
            roughness: 0.4,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x1e293b,
            wireframe: true,
            side: THREE.DoubleSide
        });

        window.addEventListener('resize', onWindowResize);

        animate();
    }

    function onWindowResize() {
        if (!canvasContainer || !camera || !renderer) return;
        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragActive = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragActive = false;

        const file = e.dataTransfer?.files?.[0];
        if (file) {
            await processFile(file);
        }
    }

    async function handleFileChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            await processFile(file);
        }
    }

    async function processFile(file: File) {
        if (!isReady) return;

        loading = true;
        errorStr = '';
        metadata = null;
        currentFileName = file.name;

        try {
            const buffer = await file.arrayBuffer();

            // Only need to extract metadata for Step/Iges, but for stl we can just load directly or still pass to worker if supported.
            // Our worker explicitly supports step/stp/iges/igs, so if STL, just load it into Three.js directly.
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (['step', 'stp', 'iges', 'igs'].includes(ext || '')) {
                // Pass to worker to load model and get metadata
                metadata = await cadWorker.loadModel(buffer, file.name);

                // Get STL buffer to render
                const stlBuffer = await cadWorker.convertToSTL();
                loadSTLToScene(stlBuffer);
            } else if (ext === 'stl') {
                loadSTLToScene(buffer);
            } else {
                errorStr = 'Unsupported file format. Please upload .step, .iges, or .stl.';
            }

        } catch (e: any) {
            console.error(e);
            errorStr = e.message || 'An error occurred while processing the file.';
        } finally {
            loading = false;
            if (fileInput) fileInput.value = '';
        }
    }

    function loadSTLToScene(buffer: ArrayBuffer) {
        if (mesh) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            mesh = null;
        }

        const loader = new STLLoader();
        const geometry = loader.parse(buffer);

        // Center the geometry
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
        }

        mesh = new THREE.Mesh(geometry, isWireframe ? wireframeMaterial : solidMaterial);

        // Rotate -90 on X so Z is up, which is standard for CAD
        mesh.rotation.x = -Math.PI / 2;

        scene.add(mesh);

        // Adjust camera
        if (boundingBox) {
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.set(maxDim, maxDim, maxDim);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }

    function toggleWireframe() {
        isWireframe = !isWireframe;
        if (mesh) {
            mesh.material = isWireframe ? wireframeMaterial : solidMaterial;
        }
    }

    async function downloadSTL() {
        if (!metadata) return;
        loading = true;
        try {
            const buffer = await cadWorker.convertToSTL();
            downloadBuffer(buffer, currentFileName.replace(/\.(step|stp|iges|igs)$/i, '.stl'));
        } catch(e: any) {
            errorStr = 'Failed to download STL: ' + e.message;
        }
        loading = false;
    }

    async function downloadOBJ() {
        if (!metadata) return;
        loading = true;
        try {
            const buffer = await cadWorker.convertToOBJ();
            downloadBuffer(buffer, currentFileName.replace(/\.(step|stp|iges|igs)$/i, '.obj'));
        } catch(e: any) {
            errorStr = 'Failed to download OBJ: ' + e.message;
        }
        loading = false;
    }

    function downloadBuffer(buffer: ArrayBuffer, name: string) {
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

</script>

<div class="max-w-6xl mx-auto py-8">
    <!-- Privacy Warning (Permanent Banner) -->
    <div class="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded mb-6 flex items-center shadow-sm">
        <svg class="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        <span class="font-medium">🔒 Your CAD files are processed locally. No geometry data is uploaded.</span>
    </div>

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-slate-800">3D CAD Workspace</h1>
        {#if !isReady}
            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded shadow-sm">Loading Engine...</span>
        {:else}
            <span class="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded shadow-sm">Engine Ready</span>
        {/if}
    </div>

    {#if errorStr}
        <div class="p-4 bg-red-100 text-red-800 rounded mb-4 shadow">{errorStr}</div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <!-- Controls & Metadata Sidebar -->
        <div class="lg:col-span-1 space-y-6">
            <div
                class="border-2 border-dashed rounded-lg p-6 text-center transition-colors {dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}"
                ondragenter={handleDragEnter}
                ondragleave={handleDragLeave}
                ondragover={handleDragOver}
                ondrop={handleDrop}
                role="region"
                aria-label="File drop zone"
            >
                <label class="cursor-pointer flex flex-col items-center justify-center h-full">
                    <span class="text-slate-600 font-medium mb-3">Drop a .step, .iges, or .stl file here</span>
                    <input
                        type="file"
                        class="hidden"
                        accept=".step,.stp,.iges,.igs,.stl"
                        bind:this={fileInput}
                        onchange={handleFileChange}
                        disabled={!isReady || loading}
                    />
                    <button
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        disabled={!isReady || loading}
                        onclick={() => fileInput?.click()}
                    >
                        {loading ? 'Processing...' : 'Browse File'}
                    </button>
                </label>
            </div>

            {#if metadata}
                <div class="bg-white border rounded shadow-sm p-4">
                    <h3 class="font-semibold text-slate-800 border-b pb-2 mb-3">Model Details</h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-500">File:</span>
                            <span class="font-medium text-slate-800 max-w-[150px] truncate" title={currentFileName}>{currentFileName}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Faces:</span>
                            <span class="font-medium text-slate-800">{metadata.entityCount.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-500">Volume (cm³):</span>
                            <span class="font-medium text-slate-800">{metadata.volumeCm3 ? metadata.volumeCm3.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div class="flex flex-col mt-2">
                            <span class="text-slate-500 mb-1">Bounding Box:</span>
                            <div class="bg-slate-50 p-2 rounded text-xs font-mono text-slate-700 break-all">
                                Min: [{metadata.boundingBox.min.map(n => n.toFixed(1)).join(', ')}]<br/>
                                Max: [{metadata.boundingBox.max.map(n => n.toFixed(1)).join(', ')}]
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white border rounded shadow-sm p-4 space-y-3">
                    <h3 class="font-semibold text-slate-800 border-b pb-2 mb-2">Export</h3>
                    <button class="w-full px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors text-sm disabled:opacity-50" onclick={downloadSTL} disabled={loading}>
                        Download as STL
                    </button>
                    <button class="w-full px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors text-sm disabled:opacity-50" onclick={downloadOBJ} disabled={loading}>
                        Download as OBJ
                    </button>
                </div>
            {/if}
        </div>

        <!-- 3D Viewer Canvas -->
        <div class="lg:col-span-3 bg-white border rounded shadow-sm flex flex-col relative h-[600px] overflow-hidden">
            <div class="absolute top-4 right-4 z-10">
                <button
                    class="px-3 py-1.5 bg-white/90 border border-slate-300 text-slate-700 text-sm rounded shadow-sm hover:bg-white transition-colors flex items-center gap-2"
                    onclick={toggleWireframe}
                >
                    <div class="w-3 h-3 rounded-full {isWireframe ? 'bg-blue-500' : 'bg-slate-300'}"></div>
                    Wireframe
                </button>
            </div>

            {#if !mesh}
                <div class="absolute inset-0 flex items-center justify-center text-slate-400 font-medium pointer-events-none">
                    {loading ? 'Processing model...' : 'Load a CAD model to view'}
                </div>
            {/if}

            <div bind:this={canvasContainer} class="w-full h-full cursor-move"></div>
        </div>
    </div>
</div>
