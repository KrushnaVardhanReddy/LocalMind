<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { onMount } from 'svelte';
    import type { CryptoWorkerContract } from '$lib/workers/crypto.worker';

    let cryptoWorker: CryptoWorkerContract | null = null;
    let loading = $state(true);
    let activeTab = $state<'encrypt' | 'decrypt' | 'hash' | 'keypair' | 'sign'>('encrypt');

    // UI state
    let encryptKeyHex = $state('');
    let decryptKeyHex = $state('');
    let hashAlgorithm = $state<'sha256' | 'sha512' | 'blake2b'>('sha256');
    let hashResult = $state('');

    // Keypair generation state
    let generatedPublicKey = $state('');
    let generatedPrivateKeyBuf = $state<ArrayBuffer | null>(null);

    // Sign/Verify state
    let verifyPublicKeyHex = $state('');
    let verifyResult = $state<'valid' | 'invalid' | null>(null);

    onMount(async () => {
        cryptoWorker = await WorkerManager.getCrypto();
        loading = false;
    });

    function buf2hex(buffer: ArrayBuffer) {
        return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    function hex2buf(hexString: string) {
        const matches = hexString.match(/.{1,2}/g);
        if (!matches) return new Uint8Array(0).buffer;
        return new Uint8Array(matches.map(byte => parseInt(byte, 16))).buffer;
    }

    function downloadFile(buffer: ArrayBuffer, filename: string, type = 'application/octet-stream') {
        const blob = new Blob([buffer], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function handleGenerateSymmetricKey() {
        if (!cryptoWorker) return;
        const keyBuf = await cryptoWorker.generateSymmetricKey();
        encryptKeyHex = buf2hex(keyBuf);
        downloadFile(keyBuf, 'symmetric.key');
    }

    async function handleEncrypt(event: Event) {
        event.preventDefault();
        if (!cryptoWorker) return;

        const form = event.target as HTMLFormElement;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (!file || !encryptKeyHex) return;

        const keyBuf = hex2buf(encryptKeyHex);
        const fileBuf = await readFileAsArrayBuffer(file);
        const ciphertextBuf = await cryptoWorker.encryptFile(fileBuf, keyBuf);

        downloadFile(ciphertextBuf, `${file.name}.enc`);
    }

    async function handleDecrypt(event: Event) {
        event.preventDefault();
        if (!cryptoWorker) return;

        const form = event.target as HTMLFormElement;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (!file || !decryptKeyHex) return;

        const keyBuf = hex2buf(decryptKeyHex);
        const fileBuf = await readFileAsArrayBuffer(file);

        try {
            const plaintextBuf = await cryptoWorker.decryptFile(fileBuf, keyBuf);
            const originalName = file.name.replace(/\.enc$/, '');
            downloadFile(plaintextBuf, originalName);
        } catch (error) {
            alert("Decryption failed. Please check your key and file.");
        }
    }

    async function handleHash(event: Event) {
        event.preventDefault();
        if (!cryptoWorker) return;

        const form = event.target as HTMLFormElement;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (!file) return;

        const fileBuf = await readFileAsArrayBuffer(file);
        hashResult = await cryptoWorker.hashFile(fileBuf, hashAlgorithm);
    }

    async function handleGenerateKeypair() {
        if (!cryptoWorker) return;
        const keypair = await cryptoWorker.generateKeypair();
        generatedPublicKey = buf2hex(keypair.publicKey);
        generatedPrivateKeyBuf = keypair.privateKey;
        downloadFile(keypair.privateKey, 'ed25519.sk');
    }

    async function handleSign(event: Event) {
        event.preventDefault();
        if (!cryptoWorker) return;

        const form = event.target as HTMLFormElement;
        const dataFileInput = form.querySelector('#sign-data-file') as HTMLInputElement;
        const keyFileInput = form.querySelector('#sign-key-file') as HTMLInputElement;

        const dataFile = dataFileInput.files?.[0];
        const keyFile = keyFileInput.files?.[0];
        if (!dataFile || !keyFile) return;

        const dataBuf = await readFileAsArrayBuffer(dataFile);
        const privateKeyBuf = await readFileAsArrayBuffer(keyFile);

        const signatureBuf = await cryptoWorker.signData(dataBuf, privateKeyBuf);
        downloadFile(signatureBuf, `${dataFile.name}.sig`);
    }

    async function handleVerify(event: Event) {
        event.preventDefault();
        if (!cryptoWorker) return;

        const form = event.target as HTMLFormElement;
        const dataFileInput = form.querySelector('#verify-data-file') as HTMLInputElement;
        const sigFileInput = form.querySelector('#verify-sig-file') as HTMLInputElement;

        const dataFile = dataFileInput.files?.[0];
        const sigFile = sigFileInput.files?.[0];
        if (!dataFile || !sigFile || !verifyPublicKeyHex) return;

        const dataBuf = await readFileAsArrayBuffer(dataFile);
        const sigBuf = await readFileAsArrayBuffer(sigFile);
        const publicKeyBuf = hex2buf(verifyPublicKeyHex);

        const isValid = await cryptoWorker.verifySignature(dataBuf, sigBuf, publicKeyBuf);
        verifyResult = isValid ? 'valid' : 'invalid';
    }

</script>

<div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Cryptography Workspace</h1>

    {#if loading}
        <p>Loading WebAssembly cryptography engine...</p>
    {:else}
        <div class="flex border-b mb-6 space-x-4">
            <button class="pb-2 {activeTab === 'encrypt' ? 'border-b-2 border-blue-500 font-bold' : ''}" onclick={() => activeTab = 'encrypt'}>Encrypt File</button>
            <button class="pb-2 {activeTab === 'decrypt' ? 'border-b-2 border-blue-500 font-bold' : ''}" onclick={() => activeTab = 'decrypt'}>Decrypt File</button>
            <button class="pb-2 {activeTab === 'hash' ? 'border-b-2 border-blue-500 font-bold' : ''}" onclick={() => activeTab = 'hash'}>Hash File</button>
            <button class="pb-2 {activeTab === 'keypair' ? 'border-b-2 border-blue-500 font-bold' : ''}" onclick={() => activeTab = 'keypair'}>Generate Keypair</button>
            <button class="pb-2 {activeTab === 'sign' ? 'border-b-2 border-blue-500 font-bold' : ''}" onclick={() => activeTab = 'sign'}>Sign & Verify</button>
        </div>

        <div class="bg-white p-6 rounded shadow">
            {#if activeTab === 'encrypt'}
                <h2 class="text-xl font-bold mb-4">Encrypt File (AES-256-GCM / XSalsa20-Poly1305)</h2>
                <div class="mb-6 border p-4 rounded bg-gray-50">
                    <button class="bg-blue-500 text-white px-4 py-2 rounded" onclick={handleGenerateSymmetricKey}>Generate Key</button>
                    {#if encryptKeyHex}
                        <p class="mt-2 font-mono text-sm break-all">Key: {encryptKeyHex}</p>
                        <p class="text-sm text-gray-500">Key also downloaded as .key file.</p>
                    {/if}
                </div>

                <form onsubmit={handleEncrypt} class="space-y-4">
                    <div>
                        <label for="encrypt-file" class="block font-semibold mb-1">File to encrypt:</label>
                        <input id="encrypt-file" type="file" required class="border p-2 w-full" />
                    </div>
                    <div>
                        <label for="encrypt-key" class="block font-semibold mb-1">Symmetric Key (.key) or Hex:</label>
                        <input id="encrypt-key-file" type="file" class="border p-2 w-full mb-2" onchange={async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) encryptKeyHex = buf2hex(await readFileAsArrayBuffer(file));
                        }} />
                        <input id="encrypt-key" type="text" bind:value={encryptKeyHex} required class="border p-2 w-full font-mono" placeholder="Paste hex key here..." />
                    </div>
                    <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Encrypt</button>
                </form>

            {:else if activeTab === 'decrypt'}
                <h2 class="text-xl font-bold mb-4">Decrypt File</h2>
                <form onsubmit={handleDecrypt} class="space-y-4">
                    <div>
                        <label for="decrypt-file" class="block font-semibold mb-1">Encrypted File (.enc):</label>
                        <input id="decrypt-file" type="file" required class="border p-2 w-full" />
                    </div>
                    <div>
                        <label for="decrypt-key" class="block font-semibold mb-1">Symmetric Key (.key) or Hex:</label>
                        <input id="decrypt-key-file" type="file" class="border p-2 w-full mb-2" onchange={async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) decryptKeyHex = buf2hex(await readFileAsArrayBuffer(file));
                        }} />
                        <input id="decrypt-key" type="text" bind:value={decryptKeyHex} required class="border p-2 w-full font-mono" placeholder="Paste hex key here..." />
                    </div>
                    <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Decrypt</button>
                </form>

            {:else if activeTab === 'hash'}
                <h2 class="text-xl font-bold mb-4">Hash File</h2>
                <form onsubmit={handleHash} class="space-y-4">
                    <div>
                        <label for="hash-file" class="block font-semibold mb-1">File to hash:</label>
                        <input id="hash-file" type="file" required class="border p-2 w-full" />
                    </div>
                    <div>
                        <label for="hash-algo" class="block font-semibold mb-1">Algorithm:</label>
                        <select id="hash-algo" bind:value={hashAlgorithm} class="border p-2 w-full">
                            <option value="sha256">SHA-256</option>
                            <option value="sha512">SHA-512</option>
                            <option value="blake2b">BLAKE2b</option>
                        </select>
                    </div>
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Hash</button>
                </form>

                {#if hashResult}
                    <div class="mt-6 p-4 border rounded bg-gray-50 flex items-center justify-between">
                        <div>
                            <h3 class="font-bold">Hash Result:</h3>
                            <p class="font-mono text-sm break-all mt-2">{hashResult}</p>
                        </div>
                        <button class="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded shadow text-sm" onclick={() => navigator.clipboard.writeText(hashResult)}>Copy</button>
                    </div>
                {/if}

            {:else if activeTab === 'keypair'}
                <h2 class="text-xl font-bold mb-4">Generate Ed25519 Keypair</h2>
                <button class="bg-blue-500 text-white px-4 py-2 rounded mb-4" onclick={handleGenerateKeypair}>Generate Ed25519 Keypair</button>

                {#if generatedPublicKey}
                    <div class="p-4 border rounded bg-yellow-50 border-yellow-200">
                        <p class="font-bold text-red-600 mb-2">Warning: Your private key is only shown once. Save it securely. It will not be stored by LocalMind.</p>
                        <p class="mb-2"><strong>Public Key (Hex):</strong> <span class="font-mono break-all">{generatedPublicKey}</span></p>
                        <p class="text-sm">The private key has been downloaded as a .sk file.</p>
                    </div>
                {/if}

            {:else if activeTab === 'sign'}
                <div class="grid grid-cols-2 gap-8">
                    <div>
                        <h2 class="text-xl font-bold mb-4">Sign File</h2>
                        <form onsubmit={handleSign} class="space-y-4">
                            <div>
                                <label for="sign-data-file" class="block font-semibold mb-1">File to sign:</label>
                                <input id="sign-data-file" type="file" required class="border p-2 w-full" />
                            </div>
                            <div>
                                <label for="sign-key-file" class="block font-semibold mb-1">Private Key (.sk):</label>
                                <input id="sign-key-file" type="file" required class="border p-2 w-full" />
                            </div>
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Sign File</button>
                        </form>
                    </div>

                    <div>
                        <h2 class="text-xl font-bold mb-4">Verify Signature</h2>
                        <form onsubmit={handleVerify} class="space-y-4">
                            <div>
                                <label for="verify-data-file" class="block font-semibold mb-1">Original File:</label>
                                <input id="verify-data-file" type="file" required class="border p-2 w-full" />
                            </div>
                            <div>
                                <label for="verify-sig-file" class="block font-semibold mb-1">Signature File (.sig):</label>
                                <input id="verify-sig-file" type="file" required class="border p-2 w-full" />
                            </div>
                            <div>
                                <label for="verify-public-key" class="block font-semibold mb-1">Public Key (Hex):</label>
                                <input id="verify-public-key" type="text" bind:value={verifyPublicKeyHex} required class="border p-2 w-full font-mono" placeholder="Paste hex public key..." />
                            </div>
                            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Verify Signature</button>
                        </form>

                        {#if verifyResult === 'valid'}
                            <div class="mt-4 p-2 bg-green-100 text-green-800 rounded font-bold">✅ Valid Signature</div>
                        {:else if verifyResult === 'invalid'}
                            <div class="mt-4 p-2 bg-red-100 text-red-800 rounded font-bold">❌ Invalid Signature</div>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
