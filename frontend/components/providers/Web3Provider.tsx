"use client";

import React, { useState, useEffect } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import "@rainbow-me/rainbowkit/styles.css";

// Jembatan sinkronisasi status dompet dengan Zustand UI state secara aman
function WalletSync() {
  const { address, isConnected } = useAccount();
  const clearAuth = useAppStore((state) => state.clearAuth);

  useEffect(() => {
    // Jika dompet terputus (disconnected) dari MetaMask, bersihkan auth di store
    if (!isConnected || !address) {
      clearAuth();
    }
  }, [address, isConnected, clearAuth]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Inisialisasi QueryClient di dalam state agar instansinya aman (tidak reset tiap render)
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cegah hydration mismatch (Next.js SSR) dengan memuat loading screen minimalis
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
          // Menggunakan skema bawaan yang aman untuk memilah tema gelap/terang secara dinamis
          theme={{
            lightMode: lightTheme({
              accentColor: "#10b981",
              accentColorForeground: "white",
              borderRadius: "medium",
            }),
            darkMode: darkTheme({
              accentColor: "#10b981",
              accentColorForeground: "white",
              borderRadius: "medium",
            }),
          }}
        >
          <WalletSync />
          <NotificationProvider>{children}</NotificationProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}