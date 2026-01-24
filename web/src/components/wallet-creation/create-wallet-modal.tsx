"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateWallet } from "@/hooks/use-create-wallet";

import { MnemonicStep } from "./mnemonic-step";
import { PasswordStep } from "./password-step";
import { ConfirmStep } from "./confirm-step";

interface CreateWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletCreated: () => void;
}

export function CreateWalletModal({
  open,
  onOpenChange,
  onWalletCreated,
}: CreateWalletModalProps) {
  const wallet = useCreateWallet(onWalletCreated);

  const {
    currentStep,
    handleNext,
    handleBack,
    isPasswordValid,
    mnemonicSaved,
    isCreating,
    handleCreateWallet,
  } = wallet;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <MnemonicStep {...wallet} />;
      case 2:
        return <PasswordStep {...wallet} />;
      case 3:
        return <ConfirmStep />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl bg-card/95 border border-border text-foreground rounded-xl shadow-lg backdrop-blur-none modal-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-foreground text-lg font-semibold">
            <span>Create New Wallet</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    step <= currentStep ? "bg-purple-400" : "bg-gray-700",
                  )}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">{renderStep()}</div>

        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Back
          </Button>

          <div className="flex space-x-2">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !mnemonicSaved) ||
                  (currentStep === 2 && !isPasswordValid)
                }
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition-all shadow-md dark:bg-purple-700 dark:hover:bg-purple-800"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-md transition-all shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  "Create Wallet"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
