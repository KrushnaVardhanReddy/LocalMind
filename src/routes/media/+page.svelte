<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { FFmpegWorkerContract } from '$lib/contracts/phase-3/ffmpeg_worker_contract';
    import { proxy } from 'comlink';

    let file: File | null = $state(null);
    let fileSizeWarning = $state('');
    let activeTab: 'transcode' | 'trim' | 'extract' = $state('transcode');

    // Processing State
    let isProcessing = $state(false);
    let progressRatio = $state(0);
    let downloadUrl = $state('');
    let outputFilename = $state('');
    let errorMsg = $state('');

    // Transcode State
    let transcodeTargetExt = $state('mp4');
    let transcodeVideoBitrate = $state('');
    let transcodeAudioBitrate = $state('');
    let transcodeResolution = $state('');
    let transcodeFps = $state('');

    // Trim State
    let trimStartSeconds = $state('0');
    let trimEndSeconds = $state('10');
    let trimThumbnailUrl = $state('');
    let isGeneratingThumbnail = $state(false);

    // Extract Audio State
    let extractOutputExt: 'mp3' | 'wav' | 'ogg' = $state('mp3');

    function onFileDrop(e: DragEvent) {
        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }

    function onFileInput(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            handleFile(target.files[0]);
        }
    }

    function handleFile(f: File) {
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = '';
        }
        if (trimThumbnailUrl) {
            URL.revokeObjectURL(trimThumbnailUrl);
            trimThumbnailUrl = '';
        }
        file = f;
        fileSizeWarning = '';
        if (file.size > 2 * 1024 * 1024 * 1024) {
            fileSizeWarning = `Large file detected (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). Processing may take several minutes. Warning: Browser memory limits may apply. The Desktop app supports unlimited file sizes.`;
        } else if (file.size > 500 * 1024 * 1024) {
            fileSizeWarning = `Large file detected (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB). Processing may take several minutes.`;
        }
    }

    async function getWorker(): Promise<FFmpegWorkerContract> {
        const ffmpegWorker = await WorkerManager.getFFmpeg();
        ffmpegWorker.onProgress = proxy((ratio: number) => {
            progressRatio = ratio;
        });
        await ffmpegWorker.init();
        return ffmpegWorker;
    }

    async function handleTranscode() {
        if (!file) return;
        isProcessing = true;
        progressRatio = 0;
        errorMsg = '';
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = '';
        }

        try {
            const worker = await getWorker();
            const buffer = await file.arrayBuffer();
            const inputExt = file.name.split('.').pop() || 'mp4';
            outputFilename = `transcoded_${file.name.split('.')[0]}.${transcodeTargetExt}`;

            const options: any = {};
            if (transcodeVideoBitrate) options.videoBitrate = transcodeVideoBitrate;
            if (transcodeAudioBitrate) options.audioBitrate = transcodeAudioBitrate;
            if (transcodeResolution) options.resolution = transcodeResolution;
            if (transcodeFps) options.fps = parseInt(transcodeFps);

            const resultBuffer = await worker.transcode(buffer, inputExt, transcodeTargetExt, options);

            const blob = new Blob([resultBuffer], { type: `video/${transcodeTargetExt}` });
            downloadUrl = URL.createObjectURL(blob);
        } catch (e: any) {
            errorMsg = e.message || 'Transcoding failed.';
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    async function handleTrim() {
        if (!file) return;
        isProcessing = true;
        progressRatio = 0;
        errorMsg = '';
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = '';
        }

        try {
            const worker = await getWorker();
            const buffer = await file.arrayBuffer();
            outputFilename = `trimmed_${file.name.split('.')[0]}.mp4`;

            const startSecs = parseFloat(trimStartSeconds) || 0;
            const endSecs = parseFloat(trimEndSeconds) || 10;

            const resultBuffer = await worker.trimClip(buffer, startSecs, endSecs);

            const blob = new Blob([resultBuffer], { type: 'video/mp4' });
            downloadUrl = URL.createObjectURL(blob);
        } catch (e: any) {
            errorMsg = e.message || 'Trimming failed.';
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    async function handleExtractAudio() {
        if (!file) return;
        isProcessing = true;
        progressRatio = 0;
        errorMsg = '';
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = '';
        }

        try {
            const worker = await getWorker();
            const buffer = await file.arrayBuffer();
            outputFilename = `audio_${file.name.split('.')[0]}.${extractOutputExt}`;

            const resultBuffer = await worker.extractAudio(buffer, extractOutputExt);

            const blob = new Blob([resultBuffer], { type: `audio/${extractOutputExt}` });
            downloadUrl = URL.createObjectURL(blob);
        } catch (e: any) {
            errorMsg = e.message || 'Extracting audio failed.';
            console.error(e);
        } finally {
            isProcessing = false;
        }
    }

    async function generateThumbnailForTrim() {
        if (!file) return;
        isGeneratingThumbnail = true;
        try {
            const worker = await getWorker();
            const buffer = await file.arrayBuffer();
            const atSeconds = parseFloat(trimStartSeconds) || 0;
            const resultBuffer = await worker.generateThumbnail(buffer, atSeconds);
            if (trimThumbnailUrl) {
                URL.revokeObjectURL(trimThumbnailUrl);
            }
            const blob = new Blob([resultBuffer], { type: 'image/png' });
            trimThumbnailUrl = URL.createObjectURL(blob);
        } catch(e) {
            console.error('Thumbnail generation failed', e);
        } finally {
            isGeneratingThumbnail = false;
        }
    }
</script>

<svelte:head>
    <title>LocalMind Media</title>
</svelte:head>

<div class="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950 text-gray-100 min-h-screen">
    <div class="max-w-4xl mx-auto space-y-6">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Media Workspace
        </h1>

        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-xl">
            <div class="flex border-b border-gray-800 mb-6">
                <button
                    class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'transcode' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
                    onclick={() => activeTab = 'transcode'}
                    disabled={isProcessing}
                >
                    Transcode
                </button>
                <button
                    class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'trim' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
                    onclick={() => activeTab = 'trim'}
                    disabled={isProcessing}
                >
                    Trim
                </button>
                <button
                    class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'extract' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
                    onclick={() => activeTab = 'extract'}
                    disabled={isProcessing}
                >
                    Extract Audio
                </button>
            </div>

            <!-- Drop Zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center hover:border-purple-500 transition-colors bg-gray-950/50 cursor-pointer mb-6"
                ondragover={(e) => e.preventDefault()}
                ondrop={onFileDrop}
                onclick={() => !isProcessing && document.getElementById('mediaFileInput')?.click()}
            >
                <input
                    type="file"
                    id="mediaFileInput"
                    class="hidden"
                    accept="video/*,audio/*"
                    onchange={onFileInput}
                    disabled={isProcessing}
                />

                {#if file}
                    <div class="space-y-2">
                        <div class="text-purple-400 font-medium">{file.name}</div>
                        <div class="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                    </div>
                {:else}
                    <div class="space-y-4">
                        <div class="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div class="text-gray-400">
                            <span class="text-purple-400 font-medium">Click to upload</span> or drag and drop<br/>
                            <span class="text-sm text-gray-500">Supports all major video and audio formats</span>
                        </div>
                    </div>
                {/if}
            </div>

            {#if fileSizeWarning}
                <div class="bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 p-4 rounded-lg text-sm mb-6 flex items-start gap-3">
                    <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {fileSizeWarning}
                </div>
            {/if}

            <div id="tabContent">
                {#if activeTab === 'transcode'}
                    <div class="space-y-4">
                        <h2 class="text-xl font-semibold">Transcode Settings</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="targetExt">Target Format</label>
                                <select id="targetExt" bind:value={transcodeTargetExt} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" disabled={isProcessing}>
                                    <option value="mp4">MP4</option>
                                    <option value="webm">WebM</option>
                                    <option value="avi">AVI</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="videoBitrate">Video Bitrate (e.g. 1M, 500k)</label>
                                <input type="text" id="videoBitrate" bind:value={transcodeVideoBitrate} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" placeholder="Auto" disabled={isProcessing} />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="audioBitrate">Audio Bitrate (e.g. 128k)</label>
                                <input type="text" id="audioBitrate" bind:value={transcodeAudioBitrate} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" placeholder="Auto" disabled={isProcessing} />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="resolution">Resolution (e.g. 1280x720)</label>
                                <input type="text" id="resolution" bind:value={transcodeResolution} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" placeholder="Auto" disabled={isProcessing} />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="fps">FPS</label>
                                <input type="number" id="fps" bind:value={transcodeFps} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" placeholder="Auto" disabled={isProcessing} />
                            </div>
                        </div>
                        <div class="pt-4 flex items-center justify-between">
                            <button
                                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded transition-colors"
                                onclick={handleTranscode}
                                disabled={!file || isProcessing}
                            >
                                Convert
                            </button>
                        </div>
                    </div>
                {/if}

                {#if activeTab === 'trim'}
                    <div class="space-y-4">
                        <h2 class="text-xl font-semibold">Trim Settings</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="startSeconds">Start Time (seconds)</label>
                                <div class="flex gap-2">
                                    <input type="number" step="0.1" id="startSeconds" bind:value={trimStartSeconds} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" disabled={isProcessing} />
                                    <button
                                        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors whitespace-nowrap text-sm"
                                        onclick={generateThumbnailForTrim}
                                        disabled={!file || isProcessing || isGeneratingThumbnail}
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="endSeconds">End Time (seconds)</label>
                                <input type="number" step="0.1" id="endSeconds" bind:value={trimEndSeconds} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" disabled={isProcessing} />
                            </div>
                        </div>

                        {#if trimThumbnailUrl}
                            <div class="mt-4 border border-gray-700 rounded-md p-2 bg-gray-800">
                                <div class="text-sm text-gray-400 mb-2">Start Frame Preview:</div>
                                <img src={trimThumbnailUrl} alt="Thumbnail preview" class="max-w-full h-auto max-h-48 rounded" />
                            </div>
                        {/if}

                        <div class="pt-4 flex items-center justify-between">
                            <button
                                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded transition-colors"
                                onclick={handleTrim}
                                disabled={!file || isProcessing}
                            >
                                Trim
                            </button>
                        </div>
                    </div>
                {/if}

                {#if activeTab === 'extract'}
                    <div class="space-y-4">
                        <h2 class="text-xl font-semibold">Extract Audio Settings</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-400 mb-1" for="extractOutputExt">Output Format</label>
                                <select id="extractOutputExt" bind:value={extractOutputExt} class="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white" disabled={isProcessing}>
                                    <option value="mp3">MP3</option>
                                    <option value="wav">WAV</option>
                                    <option value="ogg">OGG</option>
                                </select>
                            </div>
                        </div>
                        <div class="pt-4 flex items-center justify-between">
                            <button
                                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded transition-colors"
                                onclick={handleExtractAudio}
                                disabled={!file || isProcessing}
                            >
                                Extract
                            </button>
                        </div>
                    </div>
                {/if}

                {#if errorMsg}
                    <div class="mt-4 text-red-400 font-medium">
                        Error: {errorMsg}
                    </div>
                {/if}

                {#if isProcessing}
                    <div class="mt-6 space-y-2">
                        <div class="flex justify-between text-sm text-gray-400">
                            <span>Processing...</span>
                            <span>{Math.round(progressRatio * 100)}%</span>
                        </div>
                        <div class="w-full bg-gray-800 rounded-full h-2.5">
                            <div class="bg-purple-500 h-2.5 rounded-full transition-all duration-300" style="width: {progressRatio * 100}%"></div>
                        </div>
                    </div>
                {/if}

                {#if downloadUrl && !isProcessing}
                    <div class="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div>
                            <div class="text-green-400 font-medium">Success!</div>
                            <div class="text-sm text-gray-400">{outputFilename} is ready.</div>
                        </div>
                        <a
                            href={downloadUrl}
                            download={outputFilename}
                            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Download
                        </a>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
