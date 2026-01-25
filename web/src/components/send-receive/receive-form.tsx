"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore } from "@/store/wallet-store";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReceiveForm() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedToken, setSelectedToken] = useState("XLM");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const publicKey = useWalletStore((state) => state.publicKey);
  const { balances, loading, error } = useWalletBalances();

  // Generar dirección corta
  const shortAddress = publicKey
    ? `${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 8)}`
    : "No wallet connected";

  // Generar código QR cuando cambie la clave pública
  useEffect(() => {
    const generateQR = async () => {
      if (publicKey) {
        try {
          const dataUrl = await QRCode.toDataURL(publicKey, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      }
    };

    generateQR();
  }, [publicKey]);

  const handleCopyAddress = () => {
    if (!publicKey) {
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    toast({
      title: "Address copied",
      description: "Stellar address has been copied to clipboard",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = () => {
    if (!publicKey) {
      toast({
        title: "No wallet connected",
        description: "Please connect your wallet first",
      });
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: "My Stellar Address",
          text: `Here's my Stellar address: ${publicKey}`,
        })
        .catch(() => {
          toast({
            title: "Error sharing",
            description: "Could not share address",
          });
        });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(publicKey);
      toast({
        title: "Address copied",
        description: "Address copied to clipboard (share not supported)",
      });
    }
  };

  // Mostrar mensaje si no hay wallet conectado
  if (!publicKey) {
    return (
      <CardContent className="p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F46E5]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        <div className="space-y-6 relative z-10 text-center">
          <div className="text-gray-400">No wallet connected</div>
          <div className="text-gray-500 text-sm">
            Please connect your wallet to receive funds
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F46E5]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="space-y-6 relative z-10">
        <div className="text-gray-400 text-sm text-center">{shortAddress}</div>

        <div className="flex flex-col items-center">
          <div className="w-64 h-64 bg-white p-4 rounded-lg mb-4 shadow-lg flex items-center justify-center">
            {qrCodeDataUrl ? (
              <Image
                src={qrCodeDataUrl}
                alt="QR Code"
                width={224}
                height={224}
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
              className={copied ? "bg-green-500" : ""}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#E5E7EB]">Your Stellar Address</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={publicKey}
              className="bg-muted text-foreground pr-10"
            />
            <Button variant="outline" size="icon" onClick={handleCopyAddress}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Current Balance
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading balances...</span>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center py-4">{error}</div>
          ) : balances.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              No balances found
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((token) => (
                <div
                  key={token.symbol}
                  className="flex justify-between items-center p-2 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                      {token.icon || "🪙"}
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {token.balance.toFixed(token.balance < 1 ? 4 : 2)}
                    </div>
                    {token.value && (
                      <div className="text-xs text-gray-400">
                        ${token.value.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED] shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Payment Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Create Payment Request</DialogTitle>
              <DialogDescription>
                Generate a payment request to share with others.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="request-token">Select Asset</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger
                    id="request-token"
                    className="bg-gray-800 text-white"
                  >
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {balances.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span>{token.icon || "🪙"}</span>
                          <span>{token.symbol}</span>
                          <span className="text-gray-400 text-sm">
                            ({token.balance.toFixed(2)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-amount">Amount</Label>
                <Input
                  id="request-amount"
                  type="number"
                  placeholder="0.00"
                  className="bg-gray-800 text-white pr-16"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-memo">Memo (Optional)</Label>
                <Input
                  id="request-memo"
                  placeholder="Payment for..."
                  className="bg-gray-800 text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Generate Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardContent>
  );
}
