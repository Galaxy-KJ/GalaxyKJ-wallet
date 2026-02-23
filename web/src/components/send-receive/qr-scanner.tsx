"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

export function QRScannerModal({
  open,
  onOpenChange,
  onScanSuccess,
}: QRScannerProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    // Reset error state when modal opens
    if (open) {
      setPermissionError(null);
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
            aspectRatio: 1,
            showTorchButtonIfSupported: true,
          },
          false,
        );

        scanner.render(
          (decodedText) => {
            // Handle success
            if (scanner) {
              scanner.clear().catch(console.error);
            }
            onOpenChange(false);
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Check if error is related to permissions
            if (
              errorMessage.includes("NotAllowedError") ||
              errorMessage.includes("Permission denied") ||
              errorMessage.includes("camera")
            ) {
              // Only set the error if we haven't already
              setPermissionError(errorMessage);
            }
          },
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(console.error);
        }
      };
    }
  }, [open, onOpenChange, onScanSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#12132A] border-[#1F2037] text-white overflow-hidden">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription className="text-gray-400">
            Position the Stellar address or payment request within the frame.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-2 min-h-[300px]">
          {permissionError ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-6 w-full max-w-sm rounded-[10px] bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <div className="space-y-2">
                <h3 className="font-semibold text-red-400">
                  Camera Access Denied
                </h3>
                <p className="text-sm text-gray-400">
                  Please allow camera permissions in your browser settings to
                  scan QR codes.
                </p>
                <p className="text-xs text-red-500/70 truncate max-w-[250px]">
                  {permissionError}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Html5QrcodeScanner generates its own UI inside this div. We can override styles with CSS if needed. */}
              <div
                id="qr-reader"
                className="w-full max-w-sm rounded-[10px] bg-black text-white [&_button]:bg-[#7C3AED] [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:mt-2"
              ></div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
