"use client";

import { X, Shield, ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/use-login";
import { LoginPasswordInput } from "./password-input";
import { LoginErrorAlert } from "./login-error-alert";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface GalaxyLoginProps {
  onLoginSuccess: (privateKey: string) => void;
  onRecoveryClick?: () => void;
  onClose?: () => void;
}

export function GalaxyLogin({
  onLoginSuccess,
  onRecoveryClick,
  onClose,
}: GalaxyLoginProps) {
  const router = useRouter();

  console.log("🚀 GalaxyLogin component rendered");

  const {
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    hasWallet,
    unlockWallet,
  } = useLogin((decryptedPrivateKey: string) => {
    console.log("🎉 Login success callback triggered");
    onLoginSuccess(decryptedPrivateKey);
    router.push("/dashboard");
  });

  console.log("📊 GalaxyLogin state:", { hasWallet, error, isLoading });

  return (
    <div className="relative w-full max-w-md bg-card/50 border border-border backdrop-blur-md p-8 shadow-lg rounded-xl text-foreground">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-accent/90 border border-border rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="text-center mb-6">
        <Image
          src="/images/galaxy-smart-wallet-logo.png"
          alt="Galaxy Logo"
          className="mx-auto mb-4"
          width={32}
          height={32}
        />
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-slate-400 text-sm">
          Enter your password to unlock your wallet
        </p>
      </div>

      {error && <LoginErrorAlert message={error} />}

      <LoginPasswordInput
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        onEnter={unlockWallet}
        disabled={isLoading}
      />

      <Button
        onClick={unlockWallet}
        disabled={isLoading || !password.trim()}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Unlocking...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Unlock Wallet
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </Button>

      <div className="text-center mt-6 space-y-2 text-sm">
        {!hasWallet ? (
          <>
            <button
              onClick={onRecoveryClick}
              className="text-purple-500 hover:text-purple-600 transition-colors"
            >
              Don&apos;t have a wallet?{" "}
              <span className="underline">Create one here</span>
            </button>
            <div className="flex flex-col gap-1 mt-4 text-xs">
              <button className="text-muted-foreground hover:text-foreground transition-colors block">
                Terms of Service
              </button>
              <button className="text-purple-500 hover:text-purple-600 transition-colors block">
                Privacy Policy
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onRecoveryClick}
              className="text-muted-foreground hover:text-foreground transition-colors block"
            >
              Want to use a different wallet?{" "}
              <span className="underline">Recover or create</span>
            </button>
            <button
              onClick={() => router.push("/recover")}
              className="text-purple-500 hover:text-purple-600 transition-colors block"
            >
              Forgot your password?{" "}
              <span className="underline">Recover with phrase</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center space-y-1 text-xs text-slate-500 mt-6">
        <div className="flex items-center justify-center gap-1">
          <LockKeyhole className="h-3 w-3" />
          Your wallet is encrypted and stored locally
        </div>
        <div>Galaxy Wallet never has access to your password</div>
      </div>
    </div>
  );
}
