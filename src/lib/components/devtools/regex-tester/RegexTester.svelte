<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let worker = $state.raw<any>(null);
    let workerInitializing = $state(true);
    let errorMsg = $state<string | null>(null);

    let pattern = $state('');
    let flags = $state('g');
    let testString = $state('');

    let matches = $state<any[]>([]);
    let isEvaluating = $state(false);
    let evalError = $state<string | null>(null);
    let executionTimeMs = $state(0);

    let timeoutId = $state<any>(null);

    const availableFlags = ['g', 'i', 'm', 's', 'u', 'y'];

    onMount(async () => {
        try {
            worker = await WorkerManager.getRegex();
            workerInitializing = false;
        } catch (err: any) {
            errorMsg = "Failed to initialize Regex worker: " + err.message;
            workerInitializing = false;
        }
    });

    function toggleFlag(flag: string) {
        if (flags.includes(flag)) {
            flags = flags.replace(flag, '');
        } else {
            flags += flag;
        }
        triggerEvaluation();
    }

    function handlePatternChange(e: Event) {
        pattern = (e.target as HTMLInputElement).value;
        triggerEvaluation();
    }

    function handleTestStringChange(e: Event) {
        testString = (e.target as HTMLTextAreaElement).value;
        triggerEvaluation();
    }

    function triggerEvaluation() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            evaluateRegex();
        }, 300); // debounce
    }

    async function evaluateRegex() {
        if (!worker || !pattern || !testString) {
            matches = [];
            evalError = null;
            return;
        }

        isEvaluating = true;
        evalError = null;

        try {
            // Using Promise.race to implement timeout logic
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Regex evaluation timed out (catastrophic backtracking protection)")), 2000);
            });

            const evalPromise = worker.evaluate(pattern, flags, testString);

            const result: any = await Promise.race([evalPromise, timeoutPromise]);

            if (result.error) {
                evalError = result.error;
                matches = [];
            } else {
                matches = result.matches;
            }
            executionTimeMs = result.executionTimeMs || 0;
        } catch (e: any) {
            evalError = e.message;
            matches = [];
            if (e.message && e.message.includes("timed out")) {
                // If it timed out, the worker is likely stuck in an infinite loop due to catastrophic backtracking.
                // We must terminate it and spawn a new one so the UI remains functional for the next regex.
                WorkerManager.terminate('regex').then(async () => {
                    worker = await WorkerManager.getRegex();
                });
            }
        } finally {
            isEvaluating = false;
        }
    }

    // Highlighting text logic
    function getHighlightedParts() {
        if (!matches || matches.length === 0) {
            return [{ text: testString, isMatch: false, colorClass: '', title: '' }];
        }

        const colors = [
            'bg-blue-500/30 border-b border-blue-400 text-blue-200',
            'bg-emerald-500/30 border-b border-emerald-400 text-emerald-200',
            'bg-purple-500/30 border-b border-purple-400 text-purple-200',
            'bg-amber-500/30 border-b border-amber-400 text-amber-200'
        ];

        let parts: { text: string; isMatch: boolean; colorClass: string; title: string }[] = [];
        let currentIndex = 0;
        let matchCount = 0;

        for (const match of matches) {
            // If overlapping, skip for visual highlighting (simple handling)
            if (match.start < currentIndex) continue;

            // Add text before match
            if (match.start > currentIndex) {
                parts.push({
                    text: testString.substring(currentIndex, match.start),
                    isMatch: false,
                    colorClass: '',
                    title: ''
                });
            }

            // Add match
            const colorClass = colors[matchCount % colors.length];
            parts.push({
                text: testString.substring(match.start, match.end),
                isMatch: true,
                colorClass,
                title: `Match ${matchCount + 1}`
            });

            currentIndex = match.end;
            matchCount++;
        }

        // Add remaining text
        if (currentIndex < testString.length) {
            parts.push({
                text: testString.substring(currentIndex),
                isMatch: false,
                colorClass: '',
                title: ''
            });
        }

        return parts;
    }
</script>

<div class="h-full flex flex-col gap-6 text-slate-200">
    {#if errorMsg}
        <div class="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {errorMsg}
        </div>
    {/if}

    <div class="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
        <label for="regex-pattern" class="block text-sm font-medium text-slate-400 mb-2">Regular Expression</label>
        <div class="flex items-center gap-2">
            <span class="text-slate-500 text-xl font-mono">/</span>
            <input
                type="text" id="regex-pattern"
                class="flex-1 bg-slate-900 border border-slate-700 rounded-md px-4 py-3 font-mono text-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter regex pattern"
                value={pattern}
                oninput={handlePatternChange}
                disabled={workerInitializing}
            />
            <span class="text-slate-500 text-xl font-mono">/</span>

            <div class="flex gap-1 bg-slate-900 border border-slate-700 rounded-md p-1">
                {#each availableFlags as flag}
                    <button
                        class="px-2 py-1 rounded text-sm font-mono transition-colors {flags.includes(flag) ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}"
                        onclick={() => toggleFlag(flag)}
                        title={`Flag: ${flag}`}
                    >
                        {flag}
                    </button>
                {/each}
            </div>
        </div>

        {#if evalError}
            <div class="mt-3 text-red-400 text-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {evalError}
            </div>
        {/if}
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <!-- Test String Editor -->
        <div class="flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <div class="p-3 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <h3 class="text-sm font-medium text-slate-300">Test String</h3>
            </div>

            <div class="relative flex-1">
                <!-- Highlighted background layer -->
                <div
                    class="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto pointer-events-none z-0"
                    aria-hidden="true"
                >
                    {#each getHighlightedParts() as part}
                        {#if part.isMatch}
                            <mark class={part.colorClass} title={part.title}>{part.text}</mark>
                        {:else}
                            <span class="text-transparent">{part.text}</span>
                        {/if}
                    {/each}
                </div>

                <!-- Actual textarea (transparent foreground) -->
                <textarea id="test-string"
                    class="absolute inset-0 p-4 font-mono text-sm bg-transparent text-slate-300 focus:outline-none resize-none z-10 whitespace-pre-wrap break-words caret-white"
                    placeholder="Enter test string here..."
                    value={testString}
                    oninput={handleTestStringChange}
                    spellcheck="false"
                ></textarea>
            </div>
        </div>

        <!-- Match Information Panel -->
        <div class="flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <div class="p-3 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                <h3 class="text-sm font-medium text-slate-300">Match Information</h3>
                {#if isEvaluating}
                    <span class="text-xs text-blue-400 flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Evaluating...
                    </span>
                {:else if matches.length > 0}
                    <span class="text-xs text-slate-500">{executionTimeMs.toFixed(2)}ms</span>
                {/if}
            </div>

            <div class="flex-1 overflow-auto p-4">
                {#if !pattern}
                    <div class="h-full flex items-center justify-center text-slate-500 text-sm">
                        Enter a regex pattern to see matches.
                    </div>
                {:else if matches.length === 0 && !evalError}
                    <div class="h-full flex items-center justify-center text-slate-500 text-sm">
                        No matches found.
                    </div>
                {:else}
                    <div class="text-sm text-slate-300 mb-4 font-medium border-b border-slate-700 pb-2">
                        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                    </div>

                    <div class="space-y-4">
                        {#each matches as match, index}
                            <div class="bg-slate-900 border border-slate-700 rounded p-3">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match {index + 1}</span>
                                    <span class="text-xs text-slate-500 font-mono">{match.start}-{match.end}</span>
                                </div>
                                <div class="font-mono text-sm text-blue-300 bg-slate-950 p-2 rounded mb-3 break-all">
                                    {match.match}
                                </div>

                                <!-- Capture Groups -->
                                {#if Object.keys(match.groupIndices).length > 0 || Object.keys(match.groups).length > 0}
                                    <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Groups</div>
                                    <div class="space-y-2">
                                        {#each Object.entries(match.groupIndices) as [groupIndex, groupValue]}
                                            {#if groupValue !== undefined}
                                                <div class="flex gap-2 text-sm font-mono items-center">
                                                    <span class="text-slate-500 w-6 text-right">Group {groupIndex}:</span>
                                                    <span class="text-emerald-300 bg-slate-950 px-2 py-0.5 rounded break-all flex-1">{groupValue}</span>
                                                </div>
                                            {/if}
                                        {/each}
                                        {#each Object.entries(match.groups) as [groupName, groupValue]}
                                            {#if groupValue !== undefined}
                                                <div class="flex gap-2 text-sm font-mono items-center">
                                                    <span class="text-purple-400 min-w-16 text-right">{groupName}:</span>
                                                    <span class="text-emerald-300 bg-slate-950 px-2 py-0.5 rounded break-all flex-1">{groupValue}</span>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg text-sm text-slate-400">
        <h4 class="font-semibold text-slate-300 mb-2">Regex Cheat Sheet</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <div class="font-mono text-blue-300">.</div>
                <div class="text-xs mt-1">Any character except newline</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">\w \d \s</div>
                <div class="text-xs mt-1">Word, digit, whitespace</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">[abc]</div>
                <div class="text-xs mt-1">A single character of: a, b, or c</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">[^abc]</div>
                <div class="text-xs mt-1">Any single character except: a, b, or c</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">a* a+ a?</div>
                <div class="text-xs mt-1">0 or more, 1 or more, 0 or 1</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">a&lcub;2,4&rcub;</div>
                <div class="text-xs mt-1">Between 2 and 4 of a</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">(a)</div>
                <div class="text-xs mt-1">Capture group</div>
            </div>
            <div>
                <div class="font-mono text-blue-300">(?&lt;name&gt;a)</div>
                <div class="text-xs mt-1">Named capture group</div>
            </div>
        </div>
    </div>
</div>
