"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps extends React.ComponentPropsWithoutRef<
  typeof Button
> {
  value: string;
  copyMessage?: string;
}

export function CopyButton({
  value,
  copyMessage = "Copied to clipboard",
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const copyToClipboard = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      toast({
        title: "Success",
        description: copyMessage,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [value, copyMessage, toast]);

  return (
    <Button
      size={size}
      variant={variant}
      className={cn(
        "relative h-8 w-8 transition-all hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      onClick={copyToClipboard}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? (
        <Check className="h-4 w-4 text-green-500 transition-all scale-110" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground transition-all hover:text-foreground" />
      )}
    </Button>
  );
}
