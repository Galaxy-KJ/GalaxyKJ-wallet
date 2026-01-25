import { Shield, Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MnemonicStepProps {
  mnemonic: string;
  showMnemonic: boolean;
  setShowMnemonic: (v: boolean) => void;
  mnemonicSaved: boolean;
  setMnemonicSaved: (v: boolean) => void;
  copied: boolean;
  copyToClipboard: () => void;
}

export function MnemonicStep({
  mnemonic,
  showMnemonic,
  setShowMnemonic,
  mnemonicSaved,
  setMnemonicSaved,
  copied,
  copyToClipboard,
}: MnemonicStepProps) {
  const words = mnemonic.split(" ");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">
          Secure Your Wallet
        </h3>
        <p className="text-muted-foreground text-sm">
          These words are the key to your wallet. Store them safely. You cannot
          recover them if lost.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Secret Recovery Phrase
          </label>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-purple-400 hover:text-purple-300 h-8 px-2"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMnemonic(!showMnemonic)}
              className="text-purple-400 hover:text-purple-300 h-8 px-2"
            >
              {showMnemonic ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="ml-1 text-xs">
                {showMnemonic ? "Hide" : "Show"}
              </span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg border border-border">
          {words.map((word, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center space-x-2 p-2 bg-background border border-border rounded text-sm shadow-sm",
                !showMnemonic && "blur-sm select-none",
              )}
            >
              <span className="text-muted-foreground/60 text-xs w-6">
                {index + 1}.
              </span>
              <span className="text-foreground font-mono">{word}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start space-x-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg dark:bg-amber-500/10 dark:border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-800 dark:text-amber-200 font-medium">
              Important Security Notice
            </p>
            <p className="text-amber-700/80 dark:text-amber-300/80 mt-1">
              Never share your recovery phrase. Galaxy Wallet will never ask for
              it. Anyone with these words can access your wallet.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Checkbox
            id="saved-phrase"
            checked={mnemonicSaved}
            onCheckedChange={(v) => setMnemonicSaved(v as boolean)}
            className="border-purple-300 data-[state=checked]:bg-purple-500"
          />
          <label
            htmlFor="saved-phrase"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            I have safely stored my secret recovery phrase
          </label>
        </div>
      </div>
    </div>
  );
}
