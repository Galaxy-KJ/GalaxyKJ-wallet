// web/src/types/context-types.ts

/** Common async error shape for contexts */
export type CtxError = string | null;

/** Encryption/Decryption function types */
export type EncryptFn = (data: Uint8Array | string) => Promise<string>;
export type DecryptFn = (ciphertext: string) => Promise<string | Uint8Array>;

/** Context value for the Secure Key flow */
export interface SecureKeyContextValue {
  /** True if the key material is locked/inaccessible */
  isLocked: boolean;

  /** True while any async key operation is running */
  isLoading: boolean;

  /** Optional identifier for the active key (kid, fingerprint, etc.) */
  keyId?: string | null;

  /** Public key material if applicable (PEM/JWK/base64) */
  publicKey?: string | null;

  /** Last error message (already user-friendly), null when clear */
  error: CtxError;

  /** Encrypt plaintext (string/bytes) to a string (e.g., base64, hex, JWE) */
  encrypt: EncryptFn;

  /** Decrypt a string ciphertext into plaintext (string or bytes) */
  decrypt: DecryptFn;

  /** Lock key material (e.g., wipe from memory / require re-auth) */
  lock: () => Promise<void>;

  /**
   * Unlock key material (e.g., load from secure storage, passphrase, device auth)
   * Returns true when unlocked, false otherwise.
   */
  unlock: (passphrase?: string) => Promise<boolean>;

  /** Rotate or regenerate key material; returns new key id if available */
  rotate: () => Promise<string | null>;

  /** Clear the last error */
  clearError: () => void;
}
