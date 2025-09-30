// web/src/contexts/secure-key-context.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  SecureKeyContextValue,
  EncryptFn,
  DecryptFn,
  CtxError,
} from "../types/context-types";

/** Normalize unknown errors to strings */
function toErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

const SecureKeyContext = createContext<SecureKeyContextValue | undefined>(
  undefined
);

type ProviderProps = {
  children: ReactNode;
  /** Optional initial values for hydration/tests */
  initial?: {
    keyId?: string | null;
    publicKey?: string | null;
    isLocked?: boolean;
  };
};

export function SecureKeyProvider({ children, initial }: ProviderProps) {
  const [isLocked, setIsLocked] = useState<boolean>(initial?.isLocked ?? true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<CtxError>(null);
  const [keyId, setKeyId] = useState<string | null>(initial?.keyId ?? null);
  const [publicKey, setPublicKey] = useState<string | null>(
    initial?.publicKey ?? null
  );

  // Ephemeral private key material (never put in React state)
  const privateKeyRef = useRef<CryptoKey | string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const encrypt: EncryptFn = useCallback(
    async (data) => {
      setIsLoading(true);
      clearError();
      try {
        // TODO: replace with real encryption using privateKeyRef/publicKey
        const plain =
          data instanceof Uint8Array ? new TextDecoder().decode(data) : data;
        const encoded =
          typeof btoa !== "undefined"
            ? btoa(plain)
            : Buffer.from(plain, "utf8").toString("base64");
        return encoded;
      } catch (e) {
        const msg = toErrorMessage(e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  const decrypt: DecryptFn = useCallback(
    async (ciphertext) => {
      setIsLoading(true);
      clearError();
      try {
        // TODO: replace with real decryption using privateKeyRef
        const decoded =
          typeof atob !== "undefined"
            ? atob(ciphertext)
            : Buffer.from(ciphertext, "base64").toString("utf8");
        return decoded;
      } catch (e) {
        const msg = toErrorMessage(e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  const lock = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      privateKeyRef.current = null;
      setIsLocked(true);
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  const unlock = useCallback(
    async (passphrase?: string) => {
      setIsLoading(true);
      clearError();
      try {
        // TODO: load/decrypt from secure storage using passphrase / device auth
        // For now, we'll use the passphrase parameter in the mock implementation
        if (passphrase && passphrase.length < 3) {
          throw new Error("Passphrase too short");
        }
        privateKeyRef.current = "mock-private-key";
        setIsLocked(false);
        if (!keyId) setKeyId("mock-key-id");
        if (!publicKey) setPublicKey("mock-public-key");
        return true;
      } catch (e) {
        setError(toErrorMessage(e));
        setIsLocked(true);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [clearError, keyId, publicKey]
  );

  const rotate = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      // TODO: generate a new keypair, persist securely, update refs/state
      const newId = `mock-key-${Math.random().toString(36).slice(2, 8)}`;
      privateKeyRef.current = "mock-private-key-rotated";
      setKeyId(newId);
      setPublicKey("mock-public-key-rotated");
      return newId;
    } catch (e) {
      setError(toErrorMessage(e));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  const value: SecureKeyContextValue = useMemo(
    () => ({
      isLocked,
      isLoading,
      keyId,
      publicKey,
      error,
      encrypt,
      decrypt,
      lock,
      unlock,
      rotate,
      clearError,
    }),
    [
      isLocked,
      isLoading,
      keyId,
      publicKey,
      error,
      encrypt,
      decrypt,
      lock,
      unlock,
      rotate,
      clearError,
    ]
  );

  return (
    <SecureKeyContext.Provider value={value}>
      {children}
    </SecureKeyContext.Provider>
  );
}

export function useSecureKey(): SecureKeyContextValue {
  const ctx = useContext(SecureKeyContext);
  if (!ctx) {
    throw new Error(
      "useSecureKey must be used within a SecureKeyProvider (context unavailable)."
    );
  }
  return ctx;
}
