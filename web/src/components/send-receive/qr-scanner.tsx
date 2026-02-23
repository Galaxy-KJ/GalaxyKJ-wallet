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
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (open) {
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
            // ignore errors as they happen constantly when no QR is in view
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
          {/* Html5QrcodeScanner generates its own UI inside this div. We can override styles with CSS if needed. */}
          <div
            id="qr-reader"
            className="w-full max-w-sm rounded-[10px] bg-black text-white [&_button]:bg-[#7C3AED] [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:mt-2"
          ></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
