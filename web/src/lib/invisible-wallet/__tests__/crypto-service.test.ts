import { CryptoService } from '../crypto-service';

describe('CryptoService', () => {
  beforeEach(() => {
    // Reset crypto mocks
    jest.clearAllMocks();
  });

  describe('validatePassphraseStrength', () => {
    it('accepts valid strong passphrase', () => {
      const result = CryptoService.validatePassphraseStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects passphrase shorter than 8 characters', () => {
      const result = CryptoService.validatePassphraseStrength('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must be at least 8 characters long');
    });

    it('rejects passphrase longer than 128 characters', () => {
      const longPass = 'P'.repeat(129) + '1!';
      const result = CryptoService.validatePassphraseStrength(longPass);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must not exceed 128 characters');
    });

    it('rejects passphrase without uppercase letter', () => {
      const result = CryptoService.validatePassphraseStrength('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one uppercase letter');
    });

    it('rejects passphrase without lowercase letter', () => {
      const result = CryptoService.validatePassphraseStrength('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one lowercase letter');
    });

    it('rejects passphrase without digit', () => {
      const result = CryptoService.validatePassphraseStrength('PasswordABC!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one number');
    });

    it('rejects passphrase without special character', () => {
      const result = CryptoService.validatePassphraseStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one special character');
    });

    it('rejects common weak pattern: password', () => {
      const result = CryptoService.validatePassphraseStrength('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must not contain common patterns like "password"');
    });

    it('rejects common weak pattern: qwerty', () => {
      const result = CryptoService.validatePassphraseStrength('Qwerty123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must not contain common patterns like "qwerty"');
    });

    it('rejects common weak pattern: 12345678', () => {
      const result = CryptoService.validatePassphraseStrength('12345678Aa!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must not contain common patterns like "123456"');
    });

    it('accepts exactly 8 characters if strong', () => {
      const result = CryptoService.validatePassphraseStrength('Str0ng!@');
      expect(result.isValid).toBe(true);
    });

    it('accepts exactly 128 characters if strong', () => {
      const pass = 'A' + 'b'.repeat(125) + '1!';
      const result = CryptoService.validatePassphraseStrength(pass);
      expect(result.isValid).toBe(true);
    });

    it('handles unicode characters', () => {
      const result = CryptoService.validatePassphraseStrength('Pässw0rd!');
      expect(result.isValid).toBe(true);
    });

    it('accepts passphrase with spaces', () => {
      const result = CryptoService.validatePassphraseStrength('My Pass123!');
      expect(result.isValid).toBe(true);
    });

    it('returns multiple errors for weak passphrase', () => {
      const result = CryptoService.validatePassphraseStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('encryptPrivateKey', () => {
    it('encrypts private key successfully', async () => {
      const privateKey = 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ';
      const passphrase = 'StrongPass123!';

      const result = await CryptoService.encryptPrivateKey(privateKey, passphrase);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.algorithm).toBe('AES-256-GCM');
      expect(result.metadata.keyDerivation).toBe('PBKDF2');
      expect(result.metadata.iterations).toBe(100000);
    });

    it('produces different ciphertexts for same data', async () => {
      const privateKey = 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ';
      const passphrase = 'StrongPass123!';

      const result1 = await CryptoService.encryptPrivateKey(privateKey, passphrase);
      const result2 = await CryptoService.encryptPrivateKey(privateKey, passphrase);

      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('returns base64-encoded strings', async () => {
      const privateKey = 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ';
      const passphrase = 'StrongPass123!';

      const result = await CryptoService.encryptPrivateKey(privateKey, passphrase);

      expect(result.ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(result.salt).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(result.iv).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('decryptPrivateKey', () => {
    it('decrypts encrypted private key successfully', async () => {
      const originalKey = 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ';
      const passphrase = 'StrongPass123!';

      const encrypted = await CryptoService.encryptPrivateKey(originalKey, passphrase);
      const decrypted = await CryptoService.decryptPrivateKey(
        {
          ciphertext: encrypted.ciphertext,
          salt: encrypted.salt,
          iv: encrypted.iv,
          metadata: encrypted.metadata,
        },
        passphrase,
      );

      expect(decrypted).toBe(originalKey);
    });

    it('throws error with wrong passphrase', async () => {
      const originalKey = 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ';
      const passphrase = 'StrongPass123!';
      const wrongPassphrase = 'WrongPass456!';

      const encrypted = await CryptoService.encryptPrivateKey(originalKey, passphrase);

      await expect(
        CryptoService.decryptPrivateKey(
          {
            ciphertext: encrypted.ciphertext,
            salt: encrypted.salt,
            iv: encrypted.iv,
            metadata: encrypted.metadata,
          },
          wrongPassphrase,
        ),
      ).rejects.toThrow();
    });

    it('validates encryption algorithm', async () => {
      const encrypted = await CryptoService.encryptPrivateKey('STEST', 'Pass123!');
      const invalidData = {
        ...encrypted,
        metadata: {
          ...encrypted.metadata,
          algorithm: 'INVALID' as any,
        },
      };

      await expect(
        CryptoService.decryptPrivateKey(invalidData, 'Pass123!'),
      ).rejects.toThrow('DECRYPTION_FAILED');
    });

    it('validates key derivation method', async () => {
      const encrypted = await CryptoService.encryptPrivateKey('STEST', 'Pass123!');
      const invalidData = {
        ...encrypted,
        metadata: {
          ...encrypted.metadata,
          keyDerivation: 'INVALID' as any,
        },
      };

      await expect(
        CryptoService.decryptPrivateKey(invalidData, 'Pass123!'),
      ).rejects.toThrow('DECRYPTION_FAILED');
    });

    it('handles OperationError for invalid passphrase', async () => {
      // Mock crypto.subtle.decrypt to throw OperationError
      const originalDecrypt = global.crypto.subtle.decrypt;
      global.crypto.subtle.decrypt = jest.fn().mockRejectedValue(
        new DOMException('Decryption failed', 'OperationError'),
      );

      const encrypted = await CryptoService.encryptPrivateKey('STEST', 'Pass123!');

      await expect(
        CryptoService.decryptPrivateKey(encrypted, 'WrongPass!'),
      ).rejects.toThrow('INVALID_PASSPHRASE');

      global.crypto.subtle.decrypt = originalDecrypt;
    });
  });

  describe('generateSecureId', () => {
    it('generates ID with default length', () => {
      const id = CryptoService.generateSecureId();
      expect(id).toHaveLength(32); // default 32 chars
    });

    it('generates ID with custom length', () => {
      const id = CryptoService.generateSecureId(16);
      expect(id).toHaveLength(16); // custom 16 chars
    });

    it('generates unique IDs', () => {
      const id1 = CryptoService.generateSecureId();
      const id2 = CryptoService.generateSecureId();
      const id3 = CryptoService.generateSecureId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('generates base64url-safe string', () => {
      const id = CryptoService.generateSecureId();
      expect(id).toMatch(/^[A-Za-z0-9]+$/); // no +, /, or =
    });
  });

  describe('hashString', () => {
    it('produces consistent hash for same input', async () => {
      const input = 'test-string';
      const hash1 = await CryptoService.hashString(input);
      const hash2 = await CryptoService.hashString(input);

      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await CryptoService.hashString('input1');
      const hash2 = await CryptoService.hashString('input2');

      expect(hash1).not.toBe(hash2);
    });

    it('returns base64-encoded hash', async () => {
      const hash = await CryptoService.hashString('test');
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('handles empty string', async () => {
      const hash = await CryptoService.hashString('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('handles unicode strings', async () => {
      const hash = await CryptoService.hashString('Test 测试 🔐');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('arrayBufferToBase64', () => {
    it('converts ArrayBuffer to base64', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const base64 = CryptoService.arrayBufferToBase64(buffer);
      expect(base64).toBe('AQIDBAU=');
    });

    it('handles empty buffer', () => {
      const buffer = new Uint8Array([]).buffer;
      const base64 = CryptoService.arrayBufferToBase64(buffer);
      expect(base64).toBe('');
    });
  });

  describe('base64ToArrayBuffer', () => {
    it('converts base64 to ArrayBuffer', () => {
      const base64 = 'AQIDBAU=';
      const buffer = CryptoService.base64ToArrayBuffer(base64);
      const array = new Uint8Array(buffer);
      expect(Array.from(array)).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty string', () => {
      const buffer = CryptoService.base64ToArrayBuffer('');
      expect(buffer.byteLength).toBe(0);
    });
  });

  describe('uint8ArrayToBase64', () => {
    it('converts Uint8Array to base64', () => {
      const array = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = CryptoService.uint8ArrayToBase64(array);
      expect(base64).toBe('AQIDBAU=');
    });

    it('handles empty array', () => {
      const array = new Uint8Array([]);
      const base64 = CryptoService.uint8ArrayToBase64(array);
      expect(base64).toBe('');
    });
  });

  describe('base64ToUint8Array', () => {
    it('converts base64 to Uint8Array', () => {
      const base64 = 'AQIDBAU=';
      const array = CryptoService.base64ToUint8Array(base64);
      expect(Array.from(array)).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty string', () => {
      const array = CryptoService.base64ToUint8Array('');
      expect(array.length).toBe(0);
    });
  });

  describe('base64 round-trip', () => {
    it('arrayBuffer round-trip preserves data', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]).buffer;
      const base64 = CryptoService.arrayBufferToBase64(original);
      const restored = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(restored)).toEqual(new Uint8Array(original));
    });

    it('uint8Array round-trip preserves data', () => {
      const original = new Uint8Array([10, 20, 30, 40, 50]);
      const base64 = CryptoService.uint8ArrayToBase64(original);
      const restored = CryptoService.base64ToUint8Array(base64);
      expect(restored).toEqual(original);
    });

    it('handles large data', () => {
      const original = new Uint8Array(1024);
      for (let i = 0; i < original.length; i++) {
        original[i] = i % 256;
      }
      const base64 = CryptoService.uint8ArrayToBase64(original);
      const restored = CryptoService.base64ToUint8Array(base64);
      expect(restored).toEqual(original);
    });
  });

  describe('secureCleanup', () => {
    it('zeros out byte arrays', () => {
      const array1 = new Uint8Array([1, 2, 3, 4, 5]);
      const array2 = new Uint8Array([10, 20, 30]);

      CryptoService.secureCleanup([array1, array2]);

      expect(Array.from(array1)).toEqual([0, 0, 0, 0, 0]);
      expect(Array.from(array2)).toEqual([0, 0, 0]);
    });

    it('handles empty array list', () => {
      expect(() => CryptoService.secureCleanup([])).not.toThrow();
    });

    it('handles single array', () => {
      const array = new Uint8Array([1, 2, 3]);
      CryptoService.secureCleanup([array]);
      expect(Array.from(array)).toEqual([0, 0, 0]);
    });
  });
});
