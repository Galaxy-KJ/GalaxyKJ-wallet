import * as React from "react";
import { cn } from "@/lib/utils";

const TOAST_VARIANTS = {
  default: {
    container: "bg-background border",
    title: "text-foreground",
    description: "text-muted-foreground",
  },
  destructive: {
    container: "bg-destructive border-destructive",
    title: "text-destructive-foreground",
    description: "text-destructive-foreground",
  },
};

export type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: keyof typeof TOAST_VARIANTS;
  duration?: number;
};

export type ToastActionElement = React.ReactElement<
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>;

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof TOAST_VARIANTS;
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        TOAST_VARIANTS[variant].container,
        className,
      )}
      {...props}
    />
  );
});
Toast.displayName = "Toast";

export const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof TOAST_VARIANTS;
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm font-semibold",
      TOAST_VARIANTS[variant].title,
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

export const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof TOAST_VARIANTS;
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm opacity-90",
      TOAST_VARIANTS[variant].description,
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";
