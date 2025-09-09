/**
 * --------------------------------
 * Enhancements:
 * - Replaced ad-hoc boolean spinner with a reusable loading state machine (useLoadingState)
 * - Added descriptive, step-by-step labels and a progress bar
 * - Implemented timeout handling with Retry/Cancel (TimeoutNotice)
 * - Success state shows a subtle animation (animate-pop) via Tailwind
 */

"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import { secureKeyHandler } from "@/lib/secure-key-handler";
import {
  getStellarErrorMessage,
  getStellarErrorSuggestions,
} from "@/lib/stellar/error-handler";
import {
  getValidationClassName,
  validateStellarSecretKey,
} from "@/lib/stellar/validation";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Copy,
  Lock,
  RefreshCw,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

// Performance optimizations
import { useAdvancedMemo, useAdvancedCallback } from "@/hooks/use-memoization";
import { measureRenderTime } from "@/lib/performance/optimizations";

// Lazy load heavy components
const LoadingButtonContent = dynamic(
  () => import("../ui/loading-states").then(mod => ({ default: mod.LoadingButtonContent })),
  { loading: () => <span>Loading...</span> }
);

const LoadingProgress = dynamic(
  () => import("../ui/loading-states").then(mod => ({ default: mod.LoadingProgress })),
  { loading: () => null }
);

const TimeoutNotice = dynamic(
  () => import("../ui/loading-states").then(mod => ({ default: mod.TimeoutNotice })),
  { loading: () => null }
);

// New: Reusable loading state + UI primitives
import { useLoadingState } from "../../hooks/use-loading-state";

// Memoized sub-components for better performance
const MemoizedErrorDisplay = memo(({ error, errorSuggestions }: {
  error: string | null;
  errorSuggestions: string[];
}) => {
  if (!error) return null;
  
  return (
    <div className="space-y-3 rounded border border-red-700 bg-red-900/30 p-4 text-red-200">
      <div className="flex items-start text-sm">
        <AlertTriangle
          size={16}
          className="mr-2 mt-0.5 flex-shrink-0"
        />
        <div className="flex-1">
          <p className="mb-2 font-medium">{error}</p>
          {errorSuggestions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-red-300">
                Suggested solutions:
              </p>
              <ul className="space-y-1 text-xs text-red-300">
                {errorSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
MemoizedErrorDisplay.displayName = 'MemoizedErrorDisplay';

const MemoizedSuccessBanner = memo(({ signedSuccessfully, signature }: {
  signedSuccessfully: boolean;
  signature: string;
}) => {
  if (!signedSuccessfully || !signature) return null;
  
  return (
    <div
      className="flex items-center rounded bg-green-900/30 p-3 text-sm text-green-200 ring-1 ring-inset ring-green-700 transition-all"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={16} className="mr-2 animate-pop" />
      {"Message signed successfully! Your signature is ready to use."}
    </div>
  );
});
MemoizedSuccessBanner.displayName = 'MemoizedSuccessBanner';

const MemoizedFeatureCards = memo(() => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center">
        <ShieldCheck size={18} className="mr-2 text-purple-400" />
        <h3 className="font-medium text-gray-200">Security First</h3>
      </div>
      <p className="text-sm text-gray-400">
        All cryptographic operations are performed locally in your browser.
        Your private keys never leave your device.
      </p>
    </div>
    <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center">
        <CheckCircle size={18} className="mr-2 text-purple-400" />
        <h3 className="font-medium text-gray-200">Blockchain Compatible</h3>
      </div>
      <p className="text-sm text-gray-400">
        Our tools are compatible with major blockchain standards including
        Ethereum, Bitcoin, and Stellar.
      </p>
    </div>
    <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center">
        <FileCheck size={18} className="mr-2 text-purple-400" />
        <h3 className="font-medium text-gray-200">Verify Anything</h3>
      </div>
      <p className="text-sm text-gray-400">
        From simple messages to complex transactions, verify signatures and
        prove ownership of blockchain assets.
      </p>
    </div>
  </div>
));
MemoizedFeatureCards.displayName = 'MemoizedFeatureCards';

export const SignMessageTab = memo(function SignMessageTab() {
  // Track render performance
  useEffect(() => {
    measureRenderTime('SignMessageTab', () => {});
  }, []);

  // Form state
  const [message, setMessage] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [signature, setSignature] = useState("");

  // Error and guidance
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);

  // UX flags
  const [signedSuccessfully, setSignedSuccessfully] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Validation
  const [privateKeyValidation, setPrivateKeyValidation] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);
  const privateKeyInputRef = useRef<HTMLInputElement>(null);

  // New: loading lifecycle with timeout + retry, tuned for wallet interactions
  const loading = useLoadingState(12000);

  // Memoized validation to prevent unnecessary recalculations
  const memoizedValidation = useAdvancedMemo(
    () => {
      if (!privateKey.trim()) return null;
      return validateStellarSecretKey(privateKey);
    },
    [privateKey],
    { maxAge: 1000 } // Cache for 1 second
  );

  // Validate the private key as the user types (or when set programmatically).
  useEffect(() => {
    setPrivateKeyValidation(memoizedValidation);
  }, [memoizedValidation]);

  /**
   * Main sign flow:
   * 1) Validate inputs
   * 2) Prepare and request signature
   * 3) Finalize, handle success/error
   * All wrapped with withTimeout for nice UX and retry handling.
   */
  const handleSignMessage = async () => {
    // Clear prior state
    setError(null);
    setErrorSuggestions([]);
    setSignature("");
    setSignedSuccessfully(false);
    setCopySuccess(false);

    // The runner is the actual async work; withTimeout handles lifecycle around it.
    const runner = async () => {
      // Step 1: Validation
      loading.update({ label: "Validating inputs...", progress: 10 });
      const privateKeyValue = privateKey.trim();
      if (!message || !privateKeyValue)
        throw new Error("Please fill in all required fields");

      const validation = validateStellarSecretKey(privateKeyValue);
      if (!validation.isValid)
        throw new Error(validation.error || "Invalid private key");

      // Step 2: Prepare and request signature from secure handler
      loading.update({ label: "Preparing to sign...", progress: 25 });
      loading.update({ label: "Awaiting signature...", progress: 45 });

      const result = await secureKeyHandler.secureSignMessage(
        privateKeyValue,
        message
      );

      // Step 3: Finalize
      loading.update({ label: "Finalizing...", progress: 80 });

      if (result.success) {
        setSignature(result.signature);
        setSignedSuccessfully(true);

        // For safety, clear key input and state
        if (privateKeyInputRef.current) privateKeyInputRef.current.value = "";
        setPrivateKey("");
      } else {
        throw new Error(result.error || "Failed to sign message");
      }
    };

    try {
      await loading.withTimeout(runner, {
        labels: {
          starting: "Starting sign...",
          pending: "Awaiting signature...",
          success: "Message signed",
          timeout: "Waiting for signature",
          error: "Signing failed",
        },
        mapError: (e) =>
          getStellarErrorMessage(
            e instanceof Error ? e : new Error("Failed to sign"),
            {
              operation: "sign_message",
              additionalInfo: { messageLength: message.length },
            }
          ),
        onSuccess: async () => loading.update({ progress: 100 }), // Smoothly reach 100%
      });
    } catch (err) {
      // Surface domain-specific error + suggestions
      const stellarErrorMessage = getStellarErrorMessage(
        err instanceof Error ? err : new Error("Failed to sign"),
        {
          operation: "sign_message",
          additionalInfo: { messageLength: message.length },
        }
      );
      const suggestions = getStellarErrorSuggestions(err as Error, {
        operation: "sign_message",
        additionalInfo: { messageLength: message.length },
      });
      setError(stellarErrorMessage);
      setErrorSuggestions(suggestions);
    }
  };

  /** Reset the form and UX state. */
  const handleReset = () => {
    setMessage("");
    if (privateKeyInputRef.current) privateKeyInputRef.current.value = "";
    setPrivateKey("");
    setSignature("");
    setError(null);
    setErrorSuggestions([]);
    setSignedSuccessfully(false);
    setCopySuccess(false);
    loading.reset();
  };

  /** Copy the signature to clipboard with error handling and transient success state. */
  const handleCopySignature = useAdvancedCallback(async () => {
    if (!signature) return;
    try {
      await navigator.clipboard.writeText(signature);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy signature:", err);
      const error =
        err instanceof Error ? err : new Error("Clipboard operation failed");
      const stellarErrorMessage = getStellarErrorMessage(error, {
        operation: "copy_signature",
      });
      const suggestions = getStellarErrorSuggestions(error, {
        operation: "copy_signature",
      });
      setError(stellarErrorMessage);
      setErrorSuggestions(suggestions);
    }
  }, [signature], { maxAge: 500 }); // Cache callback for 500ms

  const isPending = loading.phase === "pending";

  return (
    <div className="space-y-6">
      {/* Card wrapper */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 shadow-lg backdrop-blur-md">
        {/* Header */}
        <div>
          <h2 className="mb-1 text-xl font-bold">Sign a Message</h2>
          <p className="mb-6 text-sm text-gray-400">
            Create a cryptographic signature using your private key
          </p>
        </div>

        <div className="space-y-4">
          {/* Message input */}
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-200"
            >
              Message
            </label>
            <textarea
              id="message"
              placeholder="Enter the message you want to sign"
              className="h-24 w-full rounded border border-gray-700 bg-gray-900 p-3 text-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Private key input with validation hints */}
          <div className="space-y-2">
            <label
              htmlFor="privateKey"
              className="block text-sm font-medium text-gray-200"
            >
              Private Key
            </label>
            <input
              id="privateKey"
              ref={privateKeyInputRef}
              type="password"
              placeholder="Enter your private key"
              className={`w-full rounded bg-gray-900 p-3 text-gray-300 transition-colors focus:outline-none focus:ring-1 ${getValidationClassName(
                privateKeyValidation?.isValid,
                privateKey.length > 0
              )} ${
                privateKeyValidation?.isValid === false
                  ? "focus:ring-red-400"
                  : "focus:ring-purple-400"
              }`}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
            <div className="space-y-1">
              {privateKeyValidation && !privateKeyValidation.isValid && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {privateKeyValidation.error}
                </p>
              )}
              {privateKeyValidation?.isValid && (
                <p className="flex items-center gap-1.5 text-xs text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid Stellar secret key
                </p>
              )}
              <p className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Warning: Never share your private key with anyone
              </p>
            </div>
          </div>

          {/* Error block with suggestions */}
          <MemoizedErrorDisplay error={error} errorSuggestions={errorSuggestions} />

          {/* Success banner with subtle animation */}
          <MemoizedSuccessBanner signedSuccessfully={signedSuccessfully} signature={signature} />

          {/* Primary actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSignMessage}
              disabled={isPending}
              className="flex-1 justify-center rounded bg-purple-600 px-4 py-3 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              aria-busy={isPending}
            >
              <LoadingButtonContent
                phase={loading.phase}
                idleIcon={<Lock size={16} className="mr-1.5" />}
                idleLabel="Sign Message"
                pendingLabel={loading.label ?? "Signing..."}
                successLabel="Signed"
                errorLabel="Try Again"
                progress={loading.progress}
              />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center rounded border border-gray-700 px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800"
            >
              <RefreshCw size={16} />
              <span className="ml-2">Reset</span>
            </button>
          </div>

          {/* Inline progress + timeout hint */}
          {loading.phase === "pending" && (
            <LoadingProgress
              className="mt-2"
              value={
                typeof loading.progress === "number" &&
                Number.isFinite(loading.progress)
                  ? Math.round(loading.progress)
                  : undefined
              }
              label={loading.label}
            />
          )}
          {loading.phase === "timeout" && (
            <div className="mt-3">
              <TimeoutNotice
                title="Waiting for signature..."
                description="Confirm the signature in your wallet or device. If you've already confirmed, you can retry."
                onRetry={() => loading.retry()}
                onCancel={() => loading.reset()}
              />
            </div>
          )}

          {/* Signature output with copy affordance */}
          {signature && (
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Generated Signature (Base64):
              </label>
              <div className="relative">
                <textarea
                  value={signature}
                  readOnly
                  className="h-24 w-full rounded border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <button
                  onClick={handleCopySignature}
                  className={`absolute right-2 top-2 rounded-md p-2 transition-colors ${
                    copySuccess
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                  title={copySuccess ? "Copied!" : "Copy signature"}
                >
                  {copySuccess ? (
                    <CheckCircle2 size={16} className="text-green-200" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                This signature can be used to verify the message was signed by
                the owner of the private key.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informational feature cards */}
      <MemoizedFeatureCards />
    </div>
  );
});
