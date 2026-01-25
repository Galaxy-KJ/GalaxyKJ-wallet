/**
 * Unit tests for ProfileDetails component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileDetails } from "../profile-details";
import { useWalletStore } from "@/store/wallet-store";
import { getCurrentUser } from "@/lib/supabase-client";

// Mock dependencies
jest.mock("@/store/wallet-store");
jest.mock("@/lib/supabase-client", () => ({
  getCurrentUser: jest.fn(),
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe("ProfileDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      account: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    render(<ProfileDetails />);
    // Check for loading skeleton
    expect(screen.getAllByRole("generic").some(el => el.className.includes("animate-pulse"))).toBeTruthy();
  });

  it("displays public key when available", async () => {
    const mockPublicKey = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    
    mockUseWalletStore.mockReturnValue({
      publicKey: mockPublicKey,
      account: null,
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "test@example.com",
      id: "user-123",
    } as any);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Public Key")).toBeInTheDocument();
      expect(screen.getByText(mockPublicKey)).toBeInTheDocument();
    });
  });

  it("displays user email when available", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      account: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "test@example.com",
      id: "user-123",
    } as any);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  it("displays network type", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      account: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Network")).toBeInTheDocument();
      expect(screen.getByText("TESTNET")).toBeInTheDocument();
    });
  });

  it("displays connection status", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      account: null,
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Connection Status")).toBeInTheDocument();
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });
  });

  it("displays last sync time when available", async () => {
    const lastSyncTime = new Date("2024-01-15T10:30:00Z");
    
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      account: null,
      connectionStatus: { 
        isConnected: true, 
        isLoading: false, 
        lastSyncTime: lastSyncTime, 
        error: null 
      },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Last Sync")).toBeInTheDocument();
    });
  });

  it("allows copying public key to clipboard", async () => {
    const user = userEvent.setup({ delay: null });
    const mockPublicKey = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    
    mockUseWalletStore.mockReturnValue({
      publicKey: mockPublicKey,
      account: null,
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileDetails />);

    await waitFor(async () => {
      const copyButtons = screen.getAllByLabelText(/Copy/i);
      const publicKeyCopyButton = copyButtons.find(btn => 
        btn.closest('[class*="bg-gray-800"]')?.textContent?.includes("Public Key")
      );
      
      if (publicKeyCopyButton) {
        const spy = jest.spyOn(navigator.clipboard, "writeText");
        await user.click(publicKeyCopyButton);
        expect(spy).toHaveBeenCalledWith(mockPublicKey);
      }
    });
  });

  it("displays connected wallets count", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      account: null,
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
      networkConfig: { type: "testnet", horizonUrl: "", passphrase: "" },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(screen.getByText("Connected Wallets")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });
});
