/**
 * Unit tests for NotificationBanner component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBanner } from "../notification-banner";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("NotificationBanner", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("renders when not previously dismissed", () => {
    render(<NotificationBanner message="Test message" />);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("does not render when previously dismissed", () => {
    localStorageMock.setItem("account-welcome-banner-dismissed", "true");
    render(<NotificationBanner message="Test message" />);
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("dismisses and persists to localStorage when close button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<NotificationBanner message="Test message" />);

    expect(screen.getByText("Test message")).toBeInTheDocument();

    const dismissButton = screen.getByLabelText("Dismiss notification");
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText("Test message")).not.toBeInTheDocument();
      expect(localStorageMock.getItem("account-welcome-banner-dismissed")).toBe("true");
    });
  });

  it("uses custom storage key when provided", async () => {
    const user = userEvent.setup({ delay: null });
    const customKey = "custom-banner-key";
    
    render(<NotificationBanner message="Test message" storageKey={customKey} />);

    const dismissButton = screen.getByLabelText("Dismiss notification");
    await user.click(dismissButton);

    await waitFor(() => {
      expect(localStorageMock.getItem(customKey)).toBe("true");
      expect(localStorageMock.getItem("account-welcome-banner-dismissed")).toBeNull();
    });
  });

  it("displays success type styling", () => {
    render(<NotificationBanner message="Success message" type="success" />);
    
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("bg-green-900/30");
    expect(banner.className).toContain("border-green-700");
  });

  it("displays info type styling", () => {
    render(<NotificationBanner message="Info message" type="info" />);
    
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("bg-blue-900/30");
    expect(banner.className).toContain("border-blue-700");
  });

  it("displays warning type styling", () => {
    render(<NotificationBanner message="Warning message" type="warning" />);
    
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("bg-yellow-900/30");
    expect(banner.className).toContain("border-yellow-700");
  });

  it("has accessible role and dismiss button", () => {
    render(<NotificationBanner message="Test message" />);
    
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText("Dismiss notification")).toBeInTheDocument();
  });
});
