<script lang="ts">
    import { onMount } from 'svelte';

    import { WorkerManager } from '$lib/workers/WorkerManager';


    let method = $state('GET');
    let url = $state('https://jsonplaceholder.typicode.com/todos/1');

    // Tabs
    let activeTab = $state<'params' | 'headers' | 'auth' | 'body'>('params');


    // Auth State
    let authType = $state<'none' | 'basic' | 'bearer'>('none');
    let basicAuthUsername = $state('');
    let basicAuthPassword = $state('');
    let bearerToken = $state('');

    // Request State
    let params = $state([{ key: '', value: '', active: true }]);
    let headers = $state([{ key: '', value: '', active: true }]);

    let bodyType = $state<'none' | 'raw' | 'graphql' | 'form-data' | 'x-www-form-urlencoded'>('none');
    let formDataParams = $state([{ key: '', value: '', active: true }]);
    let urlEncodedParams = $state([{ key: '', value: '', active: true }]);

    let bodyContent = $state('');

    let graphqlQuery = $state('');
    let graphqlVariables = $state('');

    // Response State
    let isExecuting = $state(false);
    let responseStatus = $state<number | null>(null);
    let responseStatusText = $state('');
    let responseTime = $state<number | null>(null);
    let responseSize = $state<number | null>(null);

    let responseBody = $state('');
    let responseRawBody = $state('');
    let responseHeaders = $state<[string, string][]>([]);

    let activeResponseTab = $state<'body' | 'headers' | 'raw'>('body');
    let errorMessage = $state<string | null>(null);

    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

    let history = $state<any[]>([]);


    async function exportCollection() {
        const collection = {
            info: {
                name: 'LocalMind Export',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item: history.map(item => ({
                name: item.url,
                request: {
                    method: item.method,
                    url: item.url,
                    header: JSON.parse(item.headers || '[]').map((h: any) => ({ key: h[0], value: h[1] })),
                    body: {
                        mode: 'raw',
                        raw: item.body
                    }
                }
            }))
        };

        const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'localmind-collection.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importCollection() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const text = await file.text();
            try {
                const collection = JSON.parse(text);
                const items = collection.item || [];

                const sqlite = await WorkerManager.getSQLite();

                for (const item of items) {
                    if (item.request) {
                        const method = item.request.method || 'GET';
                        const url = typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '';

                        let headers = [];
                        if (item.request.header) {
                            headers = item.request.header.map((h: any) => [h.key, h.value]);
                        }

                        let body = '';
                        if (item.request.body && item.request.body.raw) {
                            body = item.request.body.raw;
                        }

                        await sqlite.saveApiRequest(
                            'devtools-api-client',
                            method,
                            url,
                            JSON.stringify(headers),
                            body
                        );
                    }
                }

                await loadHistory();
            } catch (err) {
                console.error('Failed to parse collection', err);
            }
        };
        input.click();
    }

    async function loadHistory() {
        try {
            const sqlite = await WorkerManager.getSQLite();
            history = await sqlite.listApiRequests('devtools-api-client');
        } catch (e) {
            console.error('Failed to load history', e);
        }
    }

    onMount(async () => {
        await loadHistory();
    });


    function addParam() {
        params = [...params, { key: '', value: '', active: true }];
    }

    function removeParam(index: number) {
        params = params.filter((_, i) => i !== index);
        if (params.length === 0) addParam();
    }


    function addFormData() {
        formDataParams = [...formDataParams, { key: '', value: '', active: true }];
    }

    function removeFormData(index: number) {
        formDataParams = formDataParams.filter((_, i) => i !== index);
        if (formDataParams.length === 0) addFormData();
    }

    function addUrlEncoded() {
        urlEncodedParams = [...urlEncodedParams, { key: '', value: '', active: true }];
    }

    function removeUrlEncoded(index: number) {
        urlEncodedParams = urlEncodedParams.filter((_, i) => i !== index);
        if (urlEncodedParams.length === 0) addUrlEncoded();
    }

    function addHeader() {
        headers = [...headers, { key: '', value: '', active: true }];
    }

    function removeHeader(index: number) {
        headers = headers.filter((_, i) => i !== index);
        if (headers.length === 0) addHeader();
    }

    // Auto-update URL query string based on params
    $effect(() => {
        try {
            const urlObj = new URL(url);
            let hasChanges = false;

            // This is a simplistic binding that would need debounce in a real app,
            // for now we'll just handle basic URL building when sending.
        } catch(e) {
            // Invalid URL during typing, ignore
        }
    });

    async function executeRequest() {
        if (!url) return;

        isExecuting = true;
        errorMessage = null;
        responseStatus = null;
        responseBody = '';
        responseRawBody = '';
        responseHeaders = [];

        const startTime = performance.now();

        try {
            // Build Final URL
            let finalUrl = url;
            const activeParams = params.filter(p => p.active && p.key);
            if (activeParams.length > 0) {
                try {
                    const urlObj = new URL(url);
                    activeParams.forEach(p => urlObj.searchParams.append(p.key, p.value));
                    finalUrl = urlObj.toString();
                } catch (e) {
                    // if it's not a valid URL yet, just use it as is (might fail in fetch)
                }
            }

            // Build Headers
            const reqHeaders = new Headers();
            headers.filter(h => h.active && h.key).forEach(h => {
                reqHeaders.append(h.key, h.value);
            });

            // Apply Auth
            if (authType === 'basic') {
                const encoded = btoa(`${basicAuthUsername}:${basicAuthPassword}`);
                reqHeaders.set('Authorization', `Basic ${encoded}`);
            } else if (authType === 'bearer') {
                reqHeaders.set('Authorization', `Bearer ${bearerToken}`);
            }

            // Build Body
            let reqBody: any = undefined;
            if (method !== 'GET' && method !== 'HEAD') {
                if (bodyType === 'raw') {
                    reqBody = bodyContent;
                } else if (bodyType === 'graphql') {
                    reqBody = JSON.stringify({
                        query: graphqlQuery,
                        variables: graphqlVariables ? JSON.parse(graphqlVariables) : {}
                    });
                    if (!reqHeaders.has('Content-Type')) {
                        reqHeaders.set('Content-Type', 'application/json');
                    }
                } else if (bodyType === 'form-data') {
                    const fd = new FormData();
                    formDataParams.filter(p => p.active && p.key).forEach(p => {
                        fd.append(p.key, p.value);
                    });
                    reqBody = fd;
                    // Note: Don't set Content-Type manually for FormData, browser needs to set it with boundary
                } else if (bodyType === 'x-www-form-urlencoded') {
                    const params = new URLSearchParams();
                    urlEncodedParams.filter(p => p.active && p.key).forEach(p => {
                        params.append(p.key, p.value);
                    });
                    reqBody = params.toString();
                    if (!reqHeaders.has('Content-Type')) {
                        reqHeaders.set('Content-Type', 'application/x-www-form-urlencoded');
                    }
                }
            }

            const reqOptions: RequestInit = {
                method,
                headers: reqHeaders,
                body: reqBody
            };

            const response = await fetch(finalUrl, reqOptions);
            const endTime = performance.now();

            responseTime = Math.round(endTime - startTime);
            responseStatus = response.status;
            responseStatusText = response.statusText;

            // Extract headers
            const resHeaders: [string, string][] = [];
            response.headers.forEach((value, key) => resHeaders.push([key, value]));
            responseHeaders = resHeaders;

            // Extract body
            const text = await response.text();
            responseRawBody = text;
            responseSize = new TextEncoder().encode(text).length;


            // Save to history
            try {
                const sqlite = await WorkerManager.getSQLite();
                await sqlite.saveApiRequest(
                    'devtools-api-client',
                    method,
                    finalUrl,
                    JSON.stringify(resHeaders),
                    reqBody || ''
                );
                await loadHistory();
            } catch (e) {
                console.error('Failed to save to history', e);
            }

            // Try to format JSON
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    responseBody = JSON.stringify(JSON.parse(text), null, 2);
                } catch {
                    responseBody = text;
                }
            } else {
                responseBody = text;
            }

        } catch (err: any) {
            const endTime = performance.now();
            responseTime = Math.round(endTime - startTime);
            errorMessage = err.message || 'Network Error or CORS restrictions.';
        } finally {
            isExecuting = false;
        }
    }
</script>

<div class="flex flex-col h-full bg-slate-900 text-slate-200">
    <div class="p-4 border-b border-slate-700 bg-slate-800 flex items-center">
        <h1 class="text-xl font-bold text-white">API Client</h1>
    </div>

    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar (History/Collections placeholder) -->
        <div class="w-64 border-r border-slate-700 bg-slate-800 flex flex-col">
            <div class="p-3 border-b border-slate-700 font-semibold text-sm flex justify-between items-center">
                <span>History</span>
                <div class="flex space-x-1">
                    <button onclick={importCollection} class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700" title="Import Postman Collection">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </button>
                    <button onclick={exportCollection} class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700" title="Export Postman Collection">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>
            </div>

            <div class="flex-1 p-3 text-slate-500 text-sm overflow-auto">
                {#if history.length > 0}
                    <div class="flex flex-col space-y-2">
                        {#each history as item}
                            <button class="flex flex-col text-left p-2 hover:bg-slate-700 rounded transition-colors group" onclick={() => {
                                method = item.method;
                                url = item.url;
                            }}>
                                <div class="flex items-center space-x-2">
                                    <span class="font-bold text-xs" class:text-green-400={item.method==='GET'} class:text-yellow-400={item.method==='POST'} class:text-blue-400={item.method==='PUT'} class:text-red-400={item.method==='DELETE'}>{item.method}</span>
                                    <span class="text-slate-300 truncate font-mono text-xs" title={item.url}>{item.url}</span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {:else}
                    No history yet.
                {/if}
            </div>

        </div>

        <!-- Main Panel -->
        <div class="flex-1 flex flex-col h-full overflow-hidden">
            <!-- URL Bar -->
            <div class="p-4 bg-slate-800 border-b border-slate-700">
                <div class="flex items-center space-x-2">
                    <select
                        bind:value={method}
                        class="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 outline-none focus:border-blue-500 w-28 font-bold"
                    >
                        {#each methods as m}
                            <option value={m} class:text-green-400={m==='GET'} class:text-yellow-400={m==='POST'} class:text-blue-400={m==='PUT'} class:text-red-400={m==='DELETE'}>{m}</option>
                        {/each}
                    </select>

                    <input
                        type="text"
                        bind:value={url}
                        placeholder="https://api.example.com/v1/users"
                        class="flex-1 bg-slate-900 text-white border border-slate-600 rounded px-4 py-2 outline-none focus:border-blue-500 font-mono text-sm"
                        onkeydown={(e) => e.key === 'Enter' && executeRequest()}
                    />

                    <button
                        onclick={executeRequest}
                        disabled={isExecuting}
                        class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition-colors min-w-24"
                    >
                        {isExecuting ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>

            <!-- Request Config -->
            <div class="h-1/2 flex flex-col border-b border-slate-700 bg-slate-900">
                <div class="flex border-b border-slate-700 px-4 pt-2 space-x-1">
                    <button class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'params' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeTab = 'params'}>Params</button>
                    <button class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'headers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeTab = 'headers'}>Headers</button>
                    <button class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'auth' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeTab = 'auth'}>Auth</button>
                    <button class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'body' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeTab = 'body'}>Body</button>
                </div>

                <div class="flex-1 overflow-auto p-4">
                    {#if activeTab === 'params'}
                        <div class="flex flex-col space-y-2">
                            <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                                <div class="w-6"></div>
                                <div>Key</div>
                                <div>Value</div>
                                <div></div>
                            </div>
                            {#each params as param, i}
                                <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                    <input type="checkbox" bind:checked={param.active} class="w-4 h-4 cursor-pointer" />
                                    <input type="text" bind:value={param.key} placeholder="Key" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" oninput={() => i === params.length - 1 && param.key && addParam()} />
                                    <input type="text" bind:value={param.value} placeholder="Value" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" />
                                    <button class="text-slate-500 hover:text-red-400 p-1" onclick={() => removeParam(i)} aria-label="Remove parameter">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else if activeTab === 'headers'}
                        <div class="flex flex-col space-y-2">
                            <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                                <div class="w-6"></div>
                                <div>Key</div>
                                <div>Value</div>
                                <div></div>
                            </div>
                            {#each headers as header, i}
                                <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                    <input type="checkbox" bind:checked={header.active} class="w-4 h-4 cursor-pointer" />
                                    <input type="text" bind:value={header.key} placeholder="Key" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" oninput={() => i === headers.length - 1 && header.key && addHeader()} />
                                    <input type="text" bind:value={header.value} placeholder="Value" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" />
                                    <button class="text-slate-500 hover:text-red-400 p-1" onclick={() => removeHeader(i)} aria-label="Remove header">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else if activeTab === 'auth'}
                        <div class="flex flex-col space-y-4">
                            <div class="flex items-center space-x-4 mb-2">
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={authType} value="none" class="cursor-pointer" />
                                    <span>No Auth</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={authType} value="basic" class="cursor-pointer" />
                                    <span>Basic Auth</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={authType} value="bearer" class="cursor-pointer" />
                                    <span>Bearer Token</span>
                                </label>
                            </div>

                            {#if authType === 'basic'}
                                <div class="grid grid-cols-[100px_1fr] gap-4 items-center">
                                    <div class="text-sm font-semibold text-slate-400">Username</div>
                                    <input type="text" bind:value={basicAuthUsername} class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono" />

                                    <div class="text-sm font-semibold text-slate-400">Password</div>
                                    <input type="password" bind:value={basicAuthPassword} class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono" />
                                </div>
                            {:else if authType === 'bearer'}
                                <div class="flex flex-col space-y-2">
                                    <div class="text-sm font-semibold text-slate-400">Token</div>
                                    <textarea bind:value={bearerToken} class="w-full h-24 bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono resize-none" placeholder="Enter token..."></textarea>
                                </div>
                            {:else}
                                <div class="text-slate-500 text-sm">This request does not use any authorization.</div>
                            {/if}
                        </div>
                    {:else if activeTab === 'body'}
                        <div class="h-full flex flex-col">
                            <div class="flex items-center space-x-4 mb-4 flex-wrap gap-y-2">
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={bodyType} value="none" class="cursor-pointer" />
                                    <span>none</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={bodyType} value="form-data" class="cursor-pointer" />
                                    <span>form-data</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={bodyType} value="x-www-form-urlencoded" class="cursor-pointer" />
                                    <span>x-www-form-urlencoded</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={bodyType} value="raw" class="cursor-pointer" />
                                    <span>raw</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="radio" bind:group={bodyType} value="graphql" class="cursor-pointer" />
                                    <span>GraphQL</span>
                                </label>
                            </div>

                            {#if bodyType === 'raw'}
                                <textarea bind:value={bodyContent} class="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded p-3 font-mono text-sm outline-none focus:border-blue-500 resize-none" placeholder="Enter request body here..."></textarea>
                            {:else if bodyType === 'graphql'}
                                <div class="flex flex-1 space-x-4">
                                    <div class="flex-1 flex flex-col">
                                        <div class="text-xs text-slate-400 mb-1 uppercase font-semibold">Query</div>
                                        <textarea bind:value={graphqlQuery} class="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded p-3 font-mono text-sm outline-none focus:border-blue-500 resize-none" placeholder="query"></textarea>
                                    </div>
                                    <div class="w-1/3 flex flex-col">
                                        <div class="text-xs text-slate-400 mb-1 uppercase font-semibold">Variables</div>
                                        <textarea bind:value={graphqlVariables} class="flex-1 bg-slate-800 text-slate-200 border border-slate-700 rounded p-3 font-mono text-sm outline-none focus:border-blue-500 resize-none" placeholder="variables"></textarea>
                                    </div>
                                </div>
                            {:else if bodyType === 'form-data'}
                                <div class="flex flex-col space-y-2 flex-1 overflow-auto">
                                    <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                                        <div class="w-6"></div>
                                        <div>Key</div>
                                        <div>Value</div>
                                        <div></div>
                                    </div>
                                    {#each formDataParams as param, i}
                                        <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                            <input type="checkbox" bind:checked={param.active} class="w-4 h-4 cursor-pointer" />
                                            <input type="text" bind:value={param.key} placeholder="Key" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" oninput={() => i === formDataParams.length - 1 && param.key && addFormData()} />
                                            <input type="text" bind:value={param.value} placeholder="Value" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" />
                                            <button class="text-slate-500 hover:text-red-400 p-1" onclick={() => removeFormData(i)} aria-label="Remove param">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {:else if bodyType === 'x-www-form-urlencoded'}
                                <div class="flex flex-col space-y-2 flex-1 overflow-auto">
                                    <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                                        <div class="w-6"></div>
                                        <div>Key</div>
                                        <div>Value</div>
                                        <div></div>
                                    </div>
                                    {#each urlEncodedParams as param, i}
                                        <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                                            <input type="checkbox" bind:checked={param.active} class="w-4 h-4 cursor-pointer" />
                                            <input type="text" bind:value={param.key} placeholder="Key" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" oninput={() => i === urlEncodedParams.length - 1 && param.key && addUrlEncoded()} />
                                            <input type="text" bind:value={param.value} placeholder="Value" class="bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 font-mono" />
                                            <button class="text-slate-500 hover:text-red-400 p-1" onclick={() => removeUrlEncoded(i)} aria-label="Remove param">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <div class="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                    This request does not have a body.
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Response View -->
            <div class="h-1/2 flex flex-col bg-slate-800">
                <div class="flex items-center justify-between border-b border-slate-700 px-4 pt-2">
                    <div class="flex space-x-1">
                        <button class="px-4 py-2 text-sm font-medium border-b-2 {activeResponseTab === 'body' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeResponseTab = 'body'}>Body</button>
                        <button class="px-4 py-2 text-sm font-medium border-b-2 {activeResponseTab === 'raw' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeResponseTab = 'raw'}>Raw</button>
                        <button class="px-4 py-2 text-sm font-medium border-b-2 {activeResponseTab === 'headers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}" onclick={() => activeResponseTab = 'headers'}>Headers {#if responseHeaders.length}<span class="text-xs bg-slate-700 px-1.5 py-0.5 rounded ml-1">{responseHeaders.length}</span>{/if}</button>
                    </div>

                    <div class="flex items-center space-x-4 text-xs font-mono">
                        {#if responseStatus}
                            {@const isOk = responseStatus >= 200 && responseStatus < 300}
                            <span class={isOk ? 'text-green-400' : 'text-red-400'}>Status: {responseStatus} {responseStatusText}</span>
                        {/if}
                        {#if responseTime !== null}
                            <span class="text-blue-400">Time: {responseTime} ms</span>
                        {/if}
                        {#if responseSize !== null}
                            <span class="text-purple-400">Size: {responseSize} B</span>
                        {/if}
                    </div>
                </div>

                <div class="flex-1 overflow-auto p-4 relative bg-slate-900">
                    {#if isExecuting}
                        <div class="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                            <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    {/if}

                    {#if errorMessage}
                        <div class="text-red-400 font-mono text-sm whitespace-pre-wrap">{errorMessage}</div>
                    {:else if responseStatus}
                        {#if activeResponseTab === 'body'}
                            <pre class="text-sm font-mono text-slate-300 w-full min-h-full whitespace-pre-wrap break-all">{responseBody}</pre>
                        {:else if activeResponseTab === 'raw'}
                            <pre class="text-sm font-mono text-slate-300 w-full min-h-full whitespace-pre-wrap break-all">{responseRawBody}</pre>
                        {:else if activeResponseTab === 'headers'}
                            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-mono">
                                {#each responseHeaders as [key, value]}
                                    <div class="font-bold text-slate-400 text-right">{key}:</div>
                                    <div class="text-slate-200 break-all">{value}</div>
                                {/each}
                            </div>
                        {/if}
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-600 text-sm">
                            Enter a URL and click Send to get a response.
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
