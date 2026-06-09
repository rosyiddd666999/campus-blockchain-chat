"use client";

import React, { useEffect, useState } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Synchronizer to bridge Wagmi wallet connection with our local state store
function WalletSync() {
  const { address, isConnected } = useAccount();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  useEffect(() => {
    if (isConnected && address) {
      setCurrentUser(address);
    } else {
      setCurrentUser(null);
    }
  }, [address, isConnected, setCurrentUser]);

  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium animate-pulse">
            Loading ICP Chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({ accentColor: "#10b981", borderRadius: "medium" }),
            darkMode: darkTheme({ accentColor: "#10b981", borderRadius: "medium" }),
          }}
        >
          <WalletSync />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
