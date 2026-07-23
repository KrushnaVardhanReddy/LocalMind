<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { EmbeddingsWorkerContract } from '$lib/contracts/embeddings_worker_contract';
    import type { MuPDFWorkerContract } from '$lib/workers/mupdf.worker';
    import type { TesseractWorkerContract } from '$lib/workers/tesseract.worker';
    import type { NERWorkerContract, PIIEntity } from '$lib/workers/ner.worker';
    import type { MammothWorkerContract } from '$lib/contracts/phase-2/mammoth_worker_contract';

    let jobDescriptionText = '';
    let isEmbeddingJobDescription = false;
    let jobDescriptionEmbedding: number[] | null = null;
    let jobDescriptionKeywords: string[] = [];

    let isProcessingFiles = false;
    let totalFiles = 0;
    let processedFilesCount = 0;
    let currentlyProcessingFileName = '';

    interface CandidateResult {
        id: string;
        fileName: string;
        candidateName: string;
        matchScore: number;
        keyMatchingSkills: string;
        isProcessing: boolean;
        error?: string;
    }

    let candidateResults: CandidateResult[] = [];

    let embeddingsWorker: EmbeddingsWorkerContract | null = null;
    let mupdfWorker: MuPDFWorkerContract | null = null;
    let tesseractWorker: TesseractWorkerContract | null = null;
    let nerWorker: NERWorkerContract | null = null;
    let mammothWorker: MammothWorkerContract | null = null;

    let isJobDescriptionDragOver = false;
    let isResumeDragOver = false;

    onMount(async () => {
        try {
            embeddingsWorker = await WorkerManager.getEmbeddings();
            mupdfWorker = await WorkerManager.getMuPDF();
            tesseractWorker = await WorkerManager.getTesseract();
            nerWorker = await WorkerManager.getNER();
            mammothWorker = await WorkerManager.getMammoth();

            await embeddingsWorker?.init();
            await tesseractWorker?.init(['eng']);
            await nerWorker?.init();
        } catch (e) {
            console.error("Failed to initialize workers:", e);
        }
    });

    function extractKeywords(text: string): string[] {
        // Very basic keyword extraction for skill matching.
        // In a real scenario, this could use NLP, but here we just lowercase, strip punctuation,
        // and filter out common stop words to keep only "meaningful" words.
        const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'but', 'with', 'are', 'have', 'be', 'at', 'or', 'as', 'was', 'so', 'if', 'out', 'not', 'we', 'my', 'by', 'an', 'what', 'can', 'do', 'all', 'there', 'your', 'about', 'from', 'when', 'which', 'one', 'would', 'up', 'will', 'they', 'who', 'has', 'their', 'like', 'some', 'me', 'them', 'just', 'more', 'how', 'our', 'know', 'only', 'could', 'other', 'time', 'any', 'these', 'very', 'much', 'also', 'than', 'then', 'now']);
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        const uniqueWords = new Set(words.filter(w => w.length > 2 && !stopWords.has(w)));
        return Array.from(uniqueWords);
    }

    async function handleJobDescriptionSubmit() {
        if (!jobDescriptionText.trim() || !embeddingsWorker) return;
        isEmbeddingJobDescription = true;
        try {
            jobDescriptionKeywords = extractKeywords(jobDescriptionText);
            jobDescriptionEmbedding = await embeddingsWorker.embed(jobDescriptionText);
        } catch (e) {
            console.error("Error embedding job description:", e);
            alert("Failed to embed job description.");
        } finally {
            isEmbeddingJobDescription = false;
        }
    }

    async function handleJobDescriptionDrop(e: DragEvent) {
        e.preventDefault();
        isJobDescriptionDragOver = false;
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file.type === 'text/plain' || file.name.endsWith('.md')) {
            jobDescriptionText = await file.text();
            handleJobDescriptionSubmit();
        } else if (file.type === 'application/pdf' && mupdfWorker && tesseractWorker) {
            try {
                isEmbeddingJobDescription = true; // Show loading state
                const arrayBuffer = await file.arrayBuffer();
                let text = '';

                // Try tesseract for PDF processing as MuPDF doesn't expose extractText directly
                // in the current implementation, it uses Tesseract recognizePDF
                const results = await tesseractWorker.recognizePDF(arrayBuffer);
                text = results.map(r => r.text).join('\n');

                jobDescriptionText = text;
                handleJobDescriptionSubmit();
            } catch (err) {
                 console.error("Failed to parse PDF job description", err);
                 alert("Failed to extract text from PDF job description.");
                 isEmbeddingJobDescription = false;
            }
        } else {
            alert("Unsupported file type for job description. Please use TXT, MD, or PDF.");
        }
    }

    function chunkText(text: string, maxTokens: number = 256): string[] {
        // Approximate token chunking by splitting on words.
        // Assuming ~1.3 words per token, 256 tokens ~ 196 words. Let's use 200 words.
        const words = text.split(/\s+/);
        const chunks: string[] = [];
        const wordsPerChunk = 200;

        for (let i = 0; i < words.length; i += wordsPerChunk) {
            chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
        }
        return chunks;
    }

    function extractCandidateName(entities: PIIEntity[]): string {
        const persons = entities.filter(e => e.type === 'PERSON');
        if (persons.length > 0) {
            // Pick the first person entity as the candidate name, often at the top of resume
            return persons[0].text;
        }
        return "Unknown Candidate";
    }

    function findMatchingSkills(resumeText: string, jobKeywords: string[]): string {
        const resumeTextLower = resumeText.toLowerCase();
        const matches = jobKeywords.filter(keyword => resumeTextLower.includes(keyword));

        // Take top 5 matches to display
        if (matches.length === 0) return "None detected";
        return matches.slice(0, 5).join(', ');
    }

    // A polyfill to compute cosine similarity between two arrays
    function cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async function processResume(file: File) {
        const id = crypto.randomUUID();
        const result: CandidateResult = {
            id,
            fileName: file.name,
            candidateName: 'Extracting...',
            matchScore: 0,
            keyMatchingSkills: 'Analyzing...',
            isProcessing: true
        };

        candidateResults = [...candidateResults, result];
        currentlyProcessingFileName = file.name;

        const updateResult = (updates: Partial<CandidateResult>) => {
            candidateResults = candidateResults.map(r => r.id === id ? { ...r, ...updates } : r);
        };

        try {
            const buffer = await file.arrayBuffer();
            let text = '';

            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                if (tesseractWorker) {
                    const ocrResults = await tesseractWorker.recognizePDF(buffer);
                    text = ocrResults.map(r => r.text).join('\n');
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                if (mammothWorker) {
                    text = await mammothWorker.extractText(buffer);
                }
            } else {
                throw new Error("Unsupported file type");
            }

            if (!text.trim()) {
                throw new Error("No text could be extracted.");
            }

            // NER for Candidate Name
            let candidateName = "Unknown Candidate";
            if (nerWorker) {
                const entities = await nerWorker.detectPII(text.substring(0, 1000)); // check first 1000 chars for name
                candidateName = extractCandidateName(entities);
            }

            // Keyword Matching
            const keyMatchingSkills = findMatchingSkills(text, jobDescriptionKeywords);

            // Semantic Chunking and Embedding
            let maxScore = 0;
            if (embeddingsWorker && jobDescriptionEmbedding) {
                const chunks = chunkText(text, 256);

                // Embed chunks in batch
                const chunkEmbeddings = await embeddingsWorker.embedBatch(chunks);

                // Find max cosine similarity
                for (const chunkEmbedding of chunkEmbeddings) {
                    const score = cosineSimilarity(jobDescriptionEmbedding, chunkEmbedding);
                    if (score > maxScore) {
                        maxScore = score;
                    }
                }
            }

            updateResult({
                candidateName,
                matchScore: Math.round(maxScore * 100),
                keyMatchingSkills,
                isProcessing: false
            });

        } catch (e: any) {
            console.error(`Error processing ${file.name}:`, e);
            updateResult({
                candidateName: "Error",
                keyMatchingSkills: "N/A",
                isProcessing: false,
                error: e.message
            });
        }
    }

    async function handleResumeDrop(e: DragEvent) {
        e.preventDefault();
        isResumeDragOver = false;

        if (!jobDescriptionEmbedding) {
            alert("Please provide and submit a Job Description first.");
            return;
        }

        const files = Array.from(e.dataTransfer?.files || []).filter(f =>
            f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        );

        if (files.length === 0) return;

        isProcessingFiles = true;
        totalFiles += files.length;

        // Process sequentially to not overwhelm memory/workers, could be chunked
        for (const file of files) {
            await processResume(file);
            processedFilesCount++;
        }

        isProcessingFiles = false;
        currentlyProcessingFileName = '';

        // Sort by match score descending
        candidateResults = [...candidateResults].sort((a, b) => b.matchScore - a.matchScore);
    }

    function exportToCsv() {
        // The privacy warning: the CSV contains only names and scores extracted from text — not the raw resume files.
        const header = "Rank,Candidate Name,Match Score,Key Matching Skills,File\n";

        const rows = candidateResults
            .filter(r => !r.isProcessing && !r.error)
            .sort((a, b) => b.matchScore - a.matchScore)
            .map((r, index) => {
                // Escape quotes and wrap in quotes to handle commas in skills/names
                const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
                return `${index + 1},${escapeCsv(r.candidateName)},${r.matchScore}%,${escapeCsv(r.keyMatchingSkills)},${escapeCsv(r.fileName)}`;
            }).join('\n');

        const csvContent = header + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'resume_rankings.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>

<div class="container mx-auto p-8 max-w-7xl">
    <h1 class="text-3xl font-bold mb-2">Local AI Resume Screener</h1>
    <p class="text-gray-600 mb-8 max-w-3xl">
        Private, on-device resume ranking. All processing happens in your browser.
        <strong class="text-blue-800">Your resume files have not been uploaded anywhere.</strong>
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

        <!-- Left Panel: Job Description -->
        <div class="flex flex-col gap-4">
            <h2 class="text-xl font-semibold">1. Job Description</h2>

            <div
                class="border-2 border-dashed rounded-lg p-6 text-center transition-colors {isJobDescriptionDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
                on:dragover|preventDefault={() => isJobDescriptionDragOver = true}
                on:dragleave={() => isJobDescriptionDragOver = false}
                on:drop={handleJobDescriptionDrop}
                role="button"
                tabindex="0"
            >
                <div class="text-gray-600 mb-2">Drag & Drop JD File Here (.txt, .md, .pdf)</div>
                <div class="text-sm text-gray-400">or paste text below</div>
            </div>

            <textarea
                bind:value={jobDescriptionText}
                class="w-full h-64 p-4 border rounded shadow-sm font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the job description here..."
            ></textarea>

            <button
                class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 font-medium"
                on:click={handleJobDescriptionSubmit}
                disabled={isEmbeddingJobDescription || !jobDescriptionText.trim()}
            >
                {isEmbeddingJobDescription ? 'Embedding...' : (jobDescriptionEmbedding ? 'Update JD Embedding' : 'Set Job Description')}
            </button>

            {#if jobDescriptionEmbedding}
                <div class="text-green-600 text-sm font-medium flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Job Description processed and embedded successfully.
                </div>
            {/if}
        </div>

        <!-- Right Panel: Resume Drop & Results -->
        <div class="flex flex-col gap-4">
            <h2 class="text-xl font-semibold">2. Batch Resumes</h2>

            <div
                class="border-2 border-dashed rounded-lg p-12 text-center transition-colors flex flex-col items-center justify-center {isResumeDragOver ? 'border-green-500 bg-green-50' : (jobDescriptionEmbedding ? 'border-gray-300 cursor-pointer hover:bg-gray-50' : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed')}"
                on:dragover|preventDefault={() => { if(jobDescriptionEmbedding) isResumeDragOver = true; }}
                on:dragleave={() => isResumeDragOver = false}
                on:drop={handleResumeDrop}
                role="button"
                tabindex="0"
            >
                <div class="text-gray-600 font-medium mb-2 text-lg">
                    {jobDescriptionEmbedding ? 'Drag & Drop Resumes Here' : 'Set Job Description First'}
                </div>
                <div class="text-sm text-gray-500">
                    Accepts multiple .pdf and .docx files
                </div>
            </div>

            {#if isProcessingFiles || currentlyProcessingFileName}
                <div class="bg-blue-50 border border-blue-200 p-4 rounded mt-4">
                    <div class="text-sm font-medium text-blue-800 mb-2">Processing: {currentlyProcessingFileName}</div>
                    <div class="flex items-center justify-between text-xs text-blue-600 mb-1">
                        <span>{processedFilesCount} / {totalFiles} completed</span>
                        <span>{Math.round((processedFilesCount / totalFiles) * 100)}%</span>
                    </div>
                    <div class="w-full bg-blue-200 rounded-full h-1.5">
                        <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style="width: {(processedFilesCount / totalFiles) * 100}%"></div>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Ranking Table -->
    {#if candidateResults.length > 0}
        <div class="mt-12">
            <div class="flex justify-between items-end mb-4">
                <h2 class="text-2xl font-bold">Candidate Rankings</h2>
                <button
                    class="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 shadow flex items-center gap-2"
                    on:click={exportToCsv}
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export Ranking as CSV
                </button>
            </div>

            <div class="overflow-x-auto border rounded-lg shadow-sm">
                <table class="w-full text-left bg-white text-sm">
                    <thead class="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th class="p-4 font-semibold w-16">Rank</th>
                            <th class="p-4 font-semibold">Candidate Name</th>
                            <th class="p-4 font-semibold text-center w-32">Match Score</th>
                            <th class="p-4 font-semibold">Key Matching Skills</th>
                            <th class="p-4 font-semibold">File</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        {#each candidateResults as result, i}
                            <tr class="hover:bg-gray-50 transition-colors {result.isProcessing ? 'opacity-50' : ''}">
                                <td class="p-4 font-medium text-gray-900">{i + 1}</td>
                                <td class="p-4 text-gray-800 font-medium">
                                    {#if result.isProcessing}
                                        <span class="animate-pulse">Analyzing...</span>
                                    {:else if result.error}
                                        <span class="text-red-600">Error extracting text</span>
                                    {:else}
                                        {result.candidateName}
                                    {/if}
                                </td>
                                <td class="p-4 text-center">
                                    {#if !result.isProcessing && !result.error}
                                        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full {result.matchScore > 80 ? 'bg-green-100 text-green-800 border-green-200' : (result.matchScore > 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-800 border-gray-200')} border font-bold text-lg">
                                            {result.matchScore}
                                        </div>
                                    {/if}
                                </td>
                                <td class="p-4 text-gray-600">
                                    {#if result.isProcessing}
                                        <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                                    {:else}
                                        {result.keyMatchingSkills}
                                    {/if}
                                </td>
                                <td class="p-4 text-gray-500 font-mono text-xs max-w-[200px] truncate" title={result.fileName}>
                                    {result.fileName}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <p class="text-xs text-center text-gray-500 mt-4">
                <strong>Privacy warning:</strong> The CSV export contains only names and scores extracted from text. Your resume files have not been uploaded anywhere.
            </p>
        </div>
    {/if}

</div>
