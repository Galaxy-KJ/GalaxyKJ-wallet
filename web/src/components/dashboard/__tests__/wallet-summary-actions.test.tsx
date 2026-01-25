import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BalanceDisplay } from "../balance-display";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { useOffline } from "@/hooks/use-offline";
import { useRouter } from "next/navigation";

jest.mock("@/store/wallet-store");
jest.mock("@/hooks/use-crypto-prices");
jest.mock("@/hooks/use-offline");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Dashboard wallet summary actions", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
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
    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      balance: {
        xlm: { balance: "100.0" },
        assets: [],
        totalXLMValue: "100.0",
      },
      publicKey: "GDHTHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRGHRG",
      connectionStatus: { isConnected: true, isLoading: false, error: null },
      networkConfig: { type: "testnet" },
    });
    (useCryptoPrices as jest.Mock).mockReturnValue({
      getPrice: jest.fn().mockReturnValue(0.12),
      getChange24h: jest.fn().mockReturnValue(1.8),
    });
  });

  it("navigates via quick action buttons", async () => {
    const user = userEvent.setup();
    render(<BalanceDisplay />);

    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(push).toHaveBeenCalledWith("/send-receive?tab=send");

    await user.click(screen.getByRole("button", { name: /receive/i }));
    expect(push).toHaveBeenCalledWith("/send-receive?tab=receive");

    await user.click(screen.getByRole("button", { name: /transactions/i }));
    expect(push).toHaveBeenCalledWith("/transactions");
  });

  it("copies public key via copy button", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<BalanceDisplay />);
    await user.click(screen.getByRole("button", { name: /copy public key/i }));
    expect(writeText).toHaveBeenCalled();
  });
});

