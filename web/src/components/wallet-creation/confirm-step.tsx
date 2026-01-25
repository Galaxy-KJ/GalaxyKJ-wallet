import { Shield, AlertTriangle } from "lucide-react";

export function ConfirmStep() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          Ready to Create
        </h3>
        <p className="text-muted-foreground text-sm">
          Review your wallet setup before creation.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Recovery Phrase
            </span>
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Secured
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Password</span>
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Set
            </span>
          </div>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg dark:bg-red-500/10 dark:border-red-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Final Warning
              </p>
              <p className="text-red-700/80 dark:text-red-300/80 mt-1">
                Your wallet will be created and encrypted with your password.
                Keep your 12-word recovery phrase safe. Galaxy Wallet cannot
                recover it for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
