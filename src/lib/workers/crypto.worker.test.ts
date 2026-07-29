import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { CryptoService } from './crypto.worker';
import _sodium from 'libsodium-wrappers';

describe('CryptoService', () => {
    let cryptoService: CryptoService;

    beforeAll(async () => {
        await _sodium.ready;
    });

    beforeEach(async () => {
        cryptoService = new CryptoService();
        await cryptoService.init();
    });

    it('should generate a symmetric key', async () => {
        const key = await cryptoService.generateSymmetricKey();
        expect(key).toBeInstanceOf(ArrayBuffer);
        expect(key.byteLength).toBe(_sodium.crypto_secretbox_KEYBYTES);
    });

    it('should encrypt and decrypt a file successfully', async () => {
        const key = await cryptoService.generateSymmetricKey();

        const originalText = "Hello, this is a secret file.";
        const encoder = new TextEncoder();
        const fileBuffer = encoder.encode(originalText).buffer;

        const ciphertext = await cryptoService.encryptFile(fileBuffer, key);
        expect(ciphertext).toBeInstanceOf(ArrayBuffer);
        expect(ciphertext.byteLength).toBeGreaterThan(fileBuffer.byteLength);

        const decryptedBuffer = await cryptoService.decryptFile(ciphertext, key);

        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);

        expect(decryptedText).toBe(originalText);
    });

    it('should generate a correct SHA-256 hash', async () => {
        const text = "test string for hashing";
        const fileBuffer = new TextEncoder().encode(text).buffer;

        const hash = await cryptoService.hashFile(fileBuffer, 'sha256');

        // Expected hash for "test string for hashing"
        // Computed manually:
        // echo -n "test string for hashing" | shasum -a 256 -> e6569751329e15206c31e01f1bf2f7f249236d1394fc926ef39c6437f175cbe1
        const expectedHash = "e6569751329e15206c31e01f1bf2f7f249236d1394fc926ef39c6437f175cbe1";
        expect(hash).toBe(expectedHash);
    });

    it('should generate an Ed25519 keypair', async () => {
        const keypair = await cryptoService.generateKeypair();
        expect(keypair.publicKey).toBeInstanceOf(ArrayBuffer);
        expect(keypair.privateKey).toBeInstanceOf(ArrayBuffer);
        expect(keypair.publicKey.byteLength).toBe(_sodium.crypto_sign_PUBLICKEYBYTES);
        expect(keypair.privateKey.byteLength).toBe(_sodium.crypto_sign_SECRETKEYBYTES);
    });

    it('should sign and verify data successfully', async () => {
        const keypair = await cryptoService.generateKeypair();

        const text = "Data to be signed";
        const fileBuffer = new TextEncoder().encode(text).buffer;

        const signature = await cryptoService.signData(fileBuffer, keypair.privateKey);
        expect(signature).toBeInstanceOf(ArrayBuffer);
        expect(signature.byteLength).toBe(_sodium.crypto_sign_BYTES);

        const isValid = await cryptoService.verifySignature(fileBuffer, signature, keypair.publicKey);
        expect(isValid).toBe(true);
    });

    it('should fail to verify with incorrect public key or data', async () => {
        const keypair1 = await cryptoService.generateKeypair();
        const keypair2 = await cryptoService.generateKeypair();

        const text = "Data to be signed";
        const fileBuffer = new TextEncoder().encode(text).buffer;

        const signature = await cryptoService.signData(fileBuffer, keypair1.privateKey);

        // verify with wrong public key
        const isWrongKeyValid = await cryptoService.verifySignature(fileBuffer, signature, keypair2.publicKey);
        expect(isWrongKeyValid).toBe(false);

        // verify with tampered data
        const tamperedText = "Data to be signed!";
        const tamperedFileBuffer = new TextEncoder().encode(tamperedText).buffer;
        const isTamperedDataValid = await cryptoService.verifySignature(tamperedFileBuffer, signature, keypair1.publicKey);
        expect(isTamperedDataValid).toBe(false);
    });
});
