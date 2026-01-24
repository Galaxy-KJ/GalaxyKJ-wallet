import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordStepProps {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordValidation: {
    minLength: boolean;
    hasNumber: boolean;
    match: boolean;
  };
}

export function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordValidation,
}: PasswordStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Lock className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">
          Create Password
        </h3>
        <p className="text-muted-foreground text-sm">
          This password will be used to quickly access your wallet from this
          device.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Password requirements:
          </p>
          <div className="space-y-1">
            <ValidationItem
              valid={passwordValidation.minLength}
              label="At least 8 characters"
            />
            <ValidationItem
              valid={passwordValidation.hasNumber}
              label="At least one number"
            />
            <ValidationItem
              valid={passwordValidation.match}
              label="Passwords match"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center space-x-2 text-xs",
        valid ? "text-green-400" : "text-gray-500",
      )}
    >
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          valid ? "bg-green-400" : "bg-gray-500",
        )}
      />
      <span>{label}</span>
    </div>
  );
}
