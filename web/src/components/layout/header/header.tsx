"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef } from "react";
import {
  HelpCircle,
  Search,
  Settings,
  ArrowRightLeft,
  BookOpen,
  LayoutGrid,
  Grid3X3,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileMenu } from "./mobile-menu";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { useTransactionSearch } from "@/hooks/use-transaction-search";
import { SearchResults } from "@/components/ui/search-results";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  onCreateWallet: () => void;
  onLogin: () => void;
}

export function Header({ onCreateWallet, onLogin }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const publicKey = useWalletStore((state) => state.publicKey);
  const setPublicKey = useWalletStore((state) => state.setPublicKey);

  // Search functionality
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    transactions,
    isSearching,
    hasSearched,
    hasResults,
  } = useTransactionSearch();

  // Menu options with corrected routes and availability
  const menuOptions = [
    {
      label: "Converter",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      href: "/cryptocurrency-converter",
      available: true,
    },
    {
      label: "Learn",
      icon: <BookOpen className="h-4 w-4" />,
      href: "/education-center",
      available: true,
    },
    {
      label: "Portfolio",
      icon: <LayoutGrid className="h-4 w-4" />,
      href: "/portfolio-analytics",
      available: true,
    },
    {
      label: "Widgets",
      icon: <Grid3X3 className="h-4 w-4" />,
      href: "/widget-configuration",
      available: true,
    },
    {
      label: "Support",
      icon: <HelpCircle className="h-4 w-4" />,
      href: "/support",
      available: true,
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: "/settings",
      available: true,
    },
  ];

  const handleLogout = () => {
    setPublicKey("");
    router.push("/");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Navigate to transactions page with search
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      if (!searchRef.current?.contains(document.activeElement)) {
        setShowSearchResults(false);
      }
    }, 150);
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
    clearSearch();
  };

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-border bg-background/70 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/galaxy-smart-wallet-logo.png"
            alt="Galaxy Smart Wallet Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Galaxy Smart Wallet
          </h1>
        </div>

        {/* Navigation Section */}
        <nav className="hidden xl:flex items-center justify-center flex-1 max-w-4xl mx-8">
          <div className="flex items-center space-x-8">
            {menuOptions.map((option) => (
              <button
                key={option.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  !option.available
                    ? "text-muted-foreground cursor-not-allowed opacity-50"
                    : isActiveRoute(option.href)
                    ? "text-foreground bg-purple-500/10 font-medium shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                onClick={() => option.available && router.push(option.href)}
                disabled={!option.available}
                title={!option.available ? "Coming soon" : undefined}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Right Section - Search & Auth */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ThemeToggle />
          {/* Search Bar - Hidden on smaller screens */}
          <div className="hidden xl:block relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className={`pl-10 rounded-full transition-all ${
                searchFocused ? "ring-1 ring-purple-500/50" : ""
              }`}
            />

            <SearchResults
              transactions={transactions}
              isSearching={isSearching}
              hasSearched={hasSearched}
              hasResults={hasResults}
              searchQuery={searchQuery}
              onClose={closeSearchResults}
              isVisible={showSearchResults}
            />
          </div>

          {/* Auth Buttons */}
          {!publicKey ? (
            <div className="hidden lg:flex items-center gap-3">
              <Button onClick={onLogin}>Login</Button>
              <Button onClick={onCreateWallet}>Create Wallet</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden lg:flex"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}

          {/* Mobile Menu */}
          <div className="xl:hidden">
            <MobileMenu options={menuOptions} />
          </div>
        </div>
      </div>
    </header>
  );
}
