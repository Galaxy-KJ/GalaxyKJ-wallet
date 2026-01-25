import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ThemeProvider, THEME_STORAGE_KEY } from "@/contexts/theme-context";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(), // legacy
      removeListener: jest.fn(), // legacy
      dispatchEvent: jest.fn(),
    })),
  });
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ThemeProvider / ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    window.localStorage.clear();
    mockMatchMedia(false);
  });

  it("uses stored localStorage theme when present", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithProvider(<ThemeToggle />);

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("falls back to system theme when no stored preference exists", async () => {
    mockMatchMedia(true);
    renderWithProvider(<ThemeToggle />);

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("toggle updates theme immediately and persists preference", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    const user = userEvent.setup();
    renderWithProvider(<ThemeToggle />);

    const btn = await screen.findByRole("button", { name: /toggle theme/i });

    await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));

    await user.click(btn);
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(btn);
    await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});

