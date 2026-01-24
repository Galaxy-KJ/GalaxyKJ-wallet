/**
 * Unit tests for ProfileHeader component
 */

import { render, screen, waitFor } from "@testing-library/react";
import { ProfileHeader } from "../profile-header";
import { useWalletStore } from "@/store/wallet-store";
import { getCurrentUser } from "@/lib/supabase-client";

// Mock dependencies
jest.mock("@/store/wallet-store");
jest.mock("@/lib/supabase-client", () => ({
  getCurrentUser: jest.fn(),
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe("ProfileHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    render(<ProfileHeader />);
    // Check for loading skeleton (animate-pulse class)
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("displays user email as name when available", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "john.doe@example.com",
      id: "user-123",
    } as any);

    render(<ProfileHeader />);

    await waitFor(() => {
      expect(screen.getByText("john.doe")).toBeInTheDocument();
    });
  });

  it("displays default status message when wallet is connected", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      connectionStatus: { isConnected: true, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "test@example.com",
    } as any);

    render(<ProfileHeader />);

    await waitFor(() => {
      expect(screen.getByText(/Your wallet is synced and ready/i)).toBeInTheDocument();
    });
  });

  it("displays custom status message when provided", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "test@example.com",
    } as any);

    render(<ProfileHeader statusMessage="Custom status message" />);

    await waitFor(() => {
      expect(screen.getByText("Custom status message")).toBeInTheDocument();
    });
  });

  it("generates initials from email", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "john.doe@example.com",
    } as any);

    render(<ProfileHeader />);

    await waitFor(() => {
      const avatar = screen.getByRole("img", { name: /Avatar for/i });
      expect(avatar).toHaveTextContent("JD");
    });
  });

  it("displays default 'U' when no email is available", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue(null);

    render(<ProfileHeader />);

    await waitFor(() => {
      const avatar = screen.getByRole("img", { name: /Avatar for User/i });
      expect(avatar).toHaveTextContent("U");
    });
  });

  it("has accessible alt text for avatar", async () => {
    mockUseWalletStore.mockReturnValue({
      publicKey: null,
      connectionStatus: { isConnected: false, isLoading: false, lastSyncTime: null, error: null },
    } as any);

    mockGetCurrentUser.mockResolvedValue({
      email: "test@example.com",
    } as any);

    render(<ProfileHeader />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /Avatar for/i })).toBeInTheDocument();
    });
  });
});
