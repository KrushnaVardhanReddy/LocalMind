# Task 3: Security / Cryptography Workspace

## Objective
Implement a local cryptography toolbox using libsodium.js that provides file encryption/decryption, cryptographic hashing, key generation, and digital signature operations — all running in a Web Worker, with private keys never touching the main thread.

## Prerequisites
- Review `docs/specs/phase-6/01_specialized_plugins_spec.md` (Plugin C).
- Phase 1 WorkerPool must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add libsodium-wrappers
bun add -D @types/libsodium-wrappers
```

### 2. Create the Crypto Worker
- Create `src/lib/workers/crypto.worker.ts`.
- In `init()`, call `sodium.ready` (wait for the WASM to load).
- Implement `CryptoWorkerContract` from `docs/specs/phase-6/01_specialized_plugins_spec.md`.
- **Key principle:** All operations accept and return `ArrayBuffer` — private key material must never be serialized to a string or logged.
- Call `expose(new CryptoService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getCrypto()`.

### 4. Build the Crypto UI
- Create `src/routes/crypto/+page.svelte` with five tool tabs:

  **1. Encrypt File**
  - "Generate Key" button → `generateSymmetricKey()` → displays key as hex, offers download as `.key` file.
  - Drop zone for plaintext file + key file or paste hex key.
  - "Encrypt" → download as `.enc` file.

  **2. Decrypt File**
  - Drop zone for `.enc` file + key file or paste hex key.
  - "Decrypt" → download the original file.

  **3. Hash File**
  - Drop zone for any file.
  - Algorithm selector: SHA-256, SHA-512, BLAKE2b.
  - Displays the hex hash output with copy button.

  **4. Generate Keypair**
  - "Generate Ed25519 Keypair" button → displays public key as hex + downloads private key as `.sk` file.
  - Warning: "Your private key is only shown once. Save it securely. It will not be stored by LocalMind."

  **5. Sign & Verify**
  - Sign: drop file + private key → download `.sig` file.
  - Verify: drop original file + `.sig` + public key → "✅ Valid Signature" or "❌ Invalid Signature".

## Definition of Done
- Encrypting a file and decrypting it with the same key produces the original file.
- SHA-256 hash of a known fixture file matches the expected value.
- Generated Ed25519 keypair produces a valid signature that verifies correctly.
- **No mocks.** Real libsodium.js runs in the Worker thread.
- Private key material never appears in browser DevTools Network tab or console logs.

---

# Phase 6: End-to-End Testing

## Objective
Validate all Phase 6 Specialized Plugin features (Geo, CAD, Crypto) via Playwright E2E.

## Test Cases (`tests/phase-6/`)

```typescript
// geo.spec.ts
test('GeoJSON conversion renders on the map', async ({ page }) => {
    // Drop a test GeoJSON file
    // Assert: map renders with at least one GeoJSON feature visible
    // Assert: metadata panel shows feature count > 0
});

// cad.spec.ts
test('STEP file renders in 3D viewport', async ({ page }) => {
    // Drop test .step fixture
    // Assert: three.js canvas is visible with non-zero bounding box metadata
    // Assert: privacy banner is visible
});

// crypto.spec.ts
test('File encrypt-decrypt round trip produces original file', async ({ page }) => {
    // Generate symmetric key
    // Encrypt fixture file
    // Decrypt using same key
    // Assert: decrypted content matches original file content
});

test('SHA-256 hash matches known value', async ({ page }) => {
    // Hash a known fixture file
    // Assert: displayed hex matches pre-computed SHA-256 value
});
```

## Definition of Done
- All tests pass on Chrome.
- **No mocks.** Real WASM engines process all operations.
- Crypto private key assertions verify key is never visible in network logs.
