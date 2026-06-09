"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, HelpCircle, MessageSquare } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TokenBalance } from "../web3/TokenBalance";
import { OnboardingModal } from "../web3/OnboardingModal";

export function Navbar() {
  const [theme, setTheme] = useState("dark");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("icp-chat-theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("icp-chat-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
            <MessageSquare className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent sm:block">
              ICP Community
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 block -mt-1">
              Blockchain Chat
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Realtime Balance */}
          <TokenBalance />

          {/* Connect Button */}
          <ConnectButton chainStatus="icon" showBalance={false} />

          {/* MetaMask Onboarding Helper */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary cursor-pointer"
            title="Cara Pakai Web3 & Faucet"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 transition-transform duration-300 rotate-0 scale-100" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-300 rotate-0 scale-100" />
            )}
          </button>
        </div>
      </div>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </header>
  );
}
export default Navbar;
