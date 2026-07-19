# Task: Phase 6 — Security / Cryptography Workspace

## Objective
Implement the Cryptography workspace using `libsodium.js` for local file encryption, key generation, and hash validation.

## Spec Reference
`docs/specs/phase-6/01_specialized_workspace_spec.md` — §2.3

## Implementation Steps

### 1. Add libsodium Worker
- Create `src/lib/workers/libsodium.worker.ts`.
- `libsodium.js` is a pure JS library (no WASM compilation step needed).
- Actions: `ENCRYPT_FILE`, `DECRYPT_FILE`, `GENERATE_KEYPAIR`, `GENERATE_SYMMETRIC_KEY`, `HASH_FILE`, `HASH_PASSWORD`, `VERIFY_HASH`.

### 2. Add Route
- Create `src/routes/crypto/+page.svelte`.
- Tabbed interface: Encrypt/Decrypt | Key Generation | Hash | Password.

### 3. Encryption Tab
- File picker + key input (paste raw key or load a generated key from the Key Generation tab).
- Encrypt: output a `.enc` file download.
- Decrypt: accept an `.enc` file + key, output the decrypted file.

### 4. Key Generation Tab
- Buttons: "Generate Ed25519 Keypair", "Generate X25519 Keypair", "Generate 256-bit Symmetric Key".
- Display key in hex with a copy button.
- **Important**: Show a prominent warning: "This key is displayed once. Save it now — it is not stored anywhere."

### 5. Hash Tab
- File picker → select algorithm (BLAKE2b / SHA-256 / SHA-512) → display hex hash.
- "Verify" mode: enter an expected hash, compute actual, show match/mismatch.

### 6. Key Storage Policy
- Keys are NEVER written to localStorage, IndexedDB, or OPFS.
- Keys displayed in the UI are held in component-local state only (destroyed on unmount).

## Acceptance Criteria
- [ ] A 100MB file encrypts in under 5 seconds.
- [ ] Round-trip test: encrypt then decrypt produces bit-identical output.
- [ ] No key material is written to any persistent storage (verified by checking localStorage, IndexedDB after operations).
- [ ] axe-core passes at `serious` level.
