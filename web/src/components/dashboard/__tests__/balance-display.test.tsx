import React from "react";
import { render, screen } from "@testing-library/react";
import { BalanceDisplay } from "../balance-display";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { useOffline } from "@/hooks/use-offline";
import { useRouter } from "next/navigation";
import "@testing-library/jest-dom";

// Mock the hooks
jest.mock("@/store/wallet-store");
jest.mock("@/hooks/use-crypto-prices");
jest.mock("@/hooks/use-offline");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("BalanceDisplay", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      balance: {
        xlm: { balance: "100.0" },
        assets: [],
        totalXLMValue: "100.0",
      },
      publicKey: "GDHTHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRG",
      connectionStatus: {
        isConnected: true,
        isLoading: false,
        error: null,
      },
      networkConfig: { type: "testnet" },
    });

    (useCryptoPrices as jest.Mock).mockReturnValue({
      getPrice: jest.fn().mockReturnValue(0.12),
      getChange24h: jest.fn().mockReturnValue(1.8),
    });

    (useOffline as jest.Mock).mockReturnValue({
      isOnline: true,
      isOffline: false,
      stats: { pendingTransactions: 0, cachedItems: 0, lastSync: null },
      queueTransaction: jest.fn(),
      getPendingTransactions: jest.fn(),
      cacheData: jest.fn(),
      getCachedData: jest.fn(),
      syncData: jest.fn(),
      clearCache: jest.fn(),
      refreshStats: jest.fn(),
    });
  });

  it("renders wallet name and shortened public key", () => {
    render(<BalanceDisplay />);
    expect(screen.getByText("Primary Wallet")).toBeInTheDocument();
    expect(screen.getByText(/GDHTHR.*GHRG/)).toBeInTheDocument();
  });

  it("renders the primary balance correctly", () => {
    render(<BalanceDisplay />);
    // 100 XLM * 0.12 = $12.00
    // It appears in both total balance and the asset list
    const balances = screen.getAllByText("$12.00");
    expect(balances.length).toBeGreaterThan(0);
    expect(balances[0]).toBeInTheDocument();
  });

  it("renders quick action buttons", () => {
    render(<BalanceDisplay />);
    expect(screen.getByText(/send/i)).toBeInTheDocument();
    expect(screen.getByText(/receive/i)).toBeInTheDocument();
    expect(screen.getByText(/transactions/i)).toBeInTheDocument();
  });

  it("shows status indicator", () => {
    render(<BalanceDisplay />);
    const indicator = screen.getByTitle("Online");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("bg-green-500");
  });
});
