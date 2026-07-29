import * as comlink from 'comlink';
import _sodium from 'libsodium-wrappers';

export interface CryptoWorkerContract {
    init(): Promise<void>;
    generateSymmetricKey(): Promise<ArrayBuffer>;
    encryptFile(fileBuffer: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer>;
    decryptFile(ciphertextBuffer: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer>;
    hashFile(fileBuffer: ArrayBuffer, algorithm: 'sha256' | 'sha512' | 'blake2b'): Promise<string>;
    generateKeypair(): Promise<{ publicKey: ArrayBuffer; privateKey: ArrayBuffer }>;
    signData(dataBuffer: ArrayBuffer, privateKey: ArrayBuffer): Promise<ArrayBuffer>;
    verifySignature(dataBuffer: ArrayBuffer, signature: ArrayBuffer, publicKey: ArrayBuffer): Promise<boolean>;
}

export class CryptoService implements CryptoWorkerContract {
    private sodium: typeof _sodium | null = null;

    async init(): Promise<void> {
        await _sodium.ready;
        this.sodium = _sodium;
    }

    private getS() {
        if (!this.sodium) throw new Error("libsodium not initialized");
        return this.sodium;
    }

    async generateSymmetricKey(): Promise<ArrayBuffer> {
        const sodium = this.getS();
        const key = sodium.crypto_secretbox_keygen();
        return (key.buffer as ArrayBuffer).slice(key.byteOffset, key.byteOffset + key.byteLength);
    }

    async encryptFile(fileBuffer: ArrayBuffer, keyBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        const sodium = this.getS();
        const file = new Uint8Array(fileBuffer);
        const key = new Uint8Array(keyBuffer);

        // Use XChaCha20-Poly1305 (crypto_secretbox with standard defaults, or crypto_aead_xchacha20poly1305_ietf)
        // For file encryption, we will use crypto_secretbox_easy which is XSalsa20-Poly1305
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = sodium.crypto_secretbox_easy(file, nonce, key);

        // Prepend nonce to ciphertext
        const result = new Uint8Array(nonce.length + ciphertext.length);
        result.set(nonce, 0);
        result.set(ciphertext, nonce.length);

        return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    }

    async decryptFile(ciphertextBuffer: ArrayBuffer, keyBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        const sodium = this.getS();
        const data = new Uint8Array(ciphertextBuffer);
        const key = new Uint8Array(keyBuffer);

        const nonce = data.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = data.slice(sodium.crypto_secretbox_NONCEBYTES);

        const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
        return (plaintext.buffer as ArrayBuffer).slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength);
    }

    async hashFile(fileBuffer: ArrayBuffer, algorithm: 'sha256' | 'sha512' | 'blake2b'): Promise<string> {
        const sodium = this.getS();
        const file = new Uint8Array(fileBuffer);
        let hash: Uint8Array;

        switch (algorithm) {
            case 'sha256':
                // libsodium-wrappers does not expose standard sha256 natively by default in all variants,
                // but crypto_hash is sha512.
                // We'll use Subcrypto to import WebCrypto if available, or just throw if we must stick strictly to libsodium.
                // Wait, libsodium wrappers has `crypto_hash_sha256` in the C library, but maybe not wrapped.
                // Let's use Web Crypto API for standard sha256 since it's built into all workers,
                // or just throw if unsupported.
                if (typeof crypto !== 'undefined' && crypto.subtle) {
                    const digest = await crypto.subtle.digest('SHA-256', fileBuffer);
                    hash = new Uint8Array(digest);
                } else {
                    throw new Error("SHA-256 not supported in this environment (requires Web Crypto API)");
                }
                break;
            case 'sha512':
                hash = sodium.crypto_hash(file);
                break;
            case 'blake2b':
                // crypto_generichash uses blake2b
                hash = sodium.crypto_generichash(sodium.crypto_generichash_BYTES, file, null, 'uint8array') as Uint8Array;
                break;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
        return sodium.to_hex(hash);
    }

    async generateKeypair(): Promise<{ publicKey: ArrayBuffer; privateKey: ArrayBuffer }> {
        const sodium = this.getS();
        const keypair = sodium.crypto_sign_keypair();
        return {
            publicKey: (keypair.publicKey.buffer as ArrayBuffer).slice(keypair.publicKey.byteOffset, keypair.publicKey.byteOffset + keypair.publicKey.byteLength),
            privateKey: (keypair.privateKey.buffer as ArrayBuffer).slice(keypair.privateKey.byteOffset, keypair.privateKey.byteOffset + keypair.privateKey.byteLength),
        };
    }

    async signData(dataBuffer: ArrayBuffer, privateKeyBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        const sodium = this.getS();
        const data = new Uint8Array(dataBuffer);
        const privateKey = new Uint8Array(privateKeyBuffer);

        const signature = sodium.crypto_sign_detached(data, privateKey);
        return (signature.buffer as ArrayBuffer).slice(signature.byteOffset, signature.byteOffset + signature.byteLength);
    }

    async verifySignature(dataBuffer: ArrayBuffer, signatureBuffer: ArrayBuffer, publicKeyBuffer: ArrayBuffer): Promise<boolean> {
        const sodium = this.getS();
        const data = new Uint8Array(dataBuffer);
        const signature = new Uint8Array(signatureBuffer);
        const publicKey = new Uint8Array(publicKeyBuffer);

        return sodium.crypto_sign_verify_detached(signature, data, publicKey);
    }
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
    comlink.expose(new CryptoService());
}
