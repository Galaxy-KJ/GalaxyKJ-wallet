'use client';

import { useMemo, useState } from 'react';
import { WalletWithBalance, AssetBalance } from '@/types/invisible-wallet';
import { useCryptoPrices } from '@/hooks/use-crypto-prices';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';

type WalletDashboardProps = {
  wallet: WalletWithBalance;
  isLoading?: boolean;
  className?: string;
  onSendAsset?: (asset: AssetBalance) => void;
  onAddAsset?: () => void;
};

type AssetRow = {
  asset: AssetBalance;
  balanceNumber: number;
  priceUSD?: number;
  valueUSD?: number;
};

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatBalance = (value: string) => {
  const numeric = Number.parseFloat(value || '0');
  if (Number.isNaN(numeric)) {
    return '0';
  }

  return numeric.toLocaleString('en-US', {
    maximumFractionDigits: 7,
  });
};

const truncateIssuer = (issuer?: string) => {
  if (!issuer) {
    return 'Native';
  }

  if (issuer.length <= 14) {
    return issuer;
  }

  return `${issuer.slice(0, 6)}...${issuer.slice(-6)}`;
};

const isPositive = (value: string) => Number.parseFloat(value || '0') > 0;

function WalletDashboardSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-56 rounded bg-gray-200" />
        <div className="h-16 w-full rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
          <div className="h-10 w-full rounded bg-gray-100" />
        </div>
      </div>
    </Card>
  );
}

export function WalletDashboard({
  wallet,
  isLoading = false,
  className,
  onSendAsset,
  onAddAsset,
}: WalletDashboardProps) {
  const [showAllTrustlines, setShowAllTrustlines] = useState(false);
  const { getPrice } = useCryptoPrices();

  const rows = useMemo<AssetRow[]>(() => {
    return wallet.balances.map(asset => {
      const balanceNumber = Number.parseFloat(asset.balance || '0');
      const price = getPrice(asset.assetCode || '');
      const hasPrice = price > 0;

      return {
        asset,
        balanceNumber,
        priceUSD: hasPrice ? price : undefined,
        valueUSD: hasPrice ? balanceNumber * price : undefined,
      };
    });
  }, [wallet.balances, getPrice]);

  const visibleRows = useMemo(() => {
    if (showAllTrustlines) {
      return rows;
    }

    return rows.filter(row => isPositive(row.asset.balance));
  }, [rows, showAllTrustlines]);

  const totalPortfolioUSD = useMemo(() => {
    return rows.reduce((sum, row) => sum + (row.valueUSD || 0), 0);
  }, [rows]);

  if (isLoading) {
    return <WalletDashboardSkeleton />;
  }

  const handleSend = (asset: AssetBalance) => {
    if (onSendAsset) {
      onSendAsset(asset);
      return;
    }

    console.info('Send action requested for asset:', asset.assetCode);
  };

  const hasAnyAsset = wallet.balances.length > 0;
  const shouldShowEmpty = !wallet.accountExists || !hasAnyAsset || visibleRows.length === 0;

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Multi-Asset Wallet Dashboard</h3>
          <p className="text-sm text-muted-foreground">View XLM, USDC and custom Stellar assets in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onAddAsset}>
            <span className="mr-2">+</span>
            Add Asset (Trustline)
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Portfolio Value</p>
          <p className="text-2xl font-bold mt-1">{formatUSD(totalPortfolioUSD)}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Address</p>
              <p className="text-sm font-medium mt-1">{truncateIssuer(wallet.publicKey)}</p>
            </div>
            <CopyButton value={wallet.publicKey} copyMessage="Wallet address copied" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="show-all-trustlines"
            checked={showAllTrustlines}
            onCheckedChange={setShowAllTrustlines}
          />
          <Label htmlFor="show-all-trustlines">Show all trustlines</Label>
        </div>
        <Badge className="border border-border bg-transparent text-foreground">{visibleRows.length} assets shown</Badge>
      </div>

      {shouldShowEmpty ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No assets yet - send XLM to activate your wallet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Once funded, your Stellar account can hold USDC and any custom token trustlines.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left p-3 font-medium">Icon</th>
                <th className="text-left p-3 font-medium">Asset Code</th>
                <th className="text-left p-3 font-medium">Balance</th>
                <th className="text-left p-3 font-medium">Issuer</th>
                <th className="text-left p-3 font-medium">USD Value</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => (
                <tr key={`${row.asset.assetCode}-${row.asset.assetIssuer || 'native'}`} className="border-t">
                  <td className="p-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {(row.asset.assetCode || 'X').slice(0, 1)}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{row.asset.assetCode || 'XLM'}</td>
                  <td className="p-3">{formatBalance(row.asset.balance)}</td>
                  <td className="p-3 font-mono text-xs">{truncateIssuer(row.asset.assetIssuer)}</td>
                  <td className="p-3">
                    {row.valueUSD !== undefined ? formatUSD(row.valueUSD) : <span className="text-muted-foreground">N/A</span>}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleSend(row.asset)}>
                      <span className="mr-1">{'>'}</span>
                      Send
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
