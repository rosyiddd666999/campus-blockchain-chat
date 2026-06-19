  "use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sun,
  Moon,
  HelpCircle,
  MessageSquare,
  Wifi,
  WifiOff,
} from "lucide-react";
// 1. Import hooks dari wagmi & konektor injected langsung untuk MetaMask
import { useAccount, useDisconnect, useConnect } from "wagmi";

import { TokenBalance } from "../web3/TokenBalance";
import { OnboardingModal } from "../web3/OnboardingModal";
import { useAppStore } from "@/lib/store";

/* ─────────────────────────────────────────
   Theme Hook
───────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // avoid cascading setState; mounted is used only for client-only rendering
    setMounted(true);
    const saved =
      (localStorage.getItem("icp-chat-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("icp-chat-theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  return { theme, toggle, mounted };
}

/* ─────────────────────────────────────────
   Connection status indicator
───────────────────────────────────────── */
function useBackendStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}`,
          { signal: AbortSignal.timeout(3000) },
        );
        if (!cancelled) setIsOnline(res.ok);
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    }

    check();
    const interval = setInterval(check, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}

/* ─────────────────────────────────────────
   Icon Button
───────────────────────────────────────── */
interface IconButtonProps {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

function IconButton({
  onClick,
  title,
  children,
  "aria-label": ariaLabel,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      className="icon-btn"
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   Backend Status Dot
───────────────────────────────────────── */
function BackendStatusDot() {
  const isOnline = useBackendStatus();

  if (isOnline === null) return null;

  return (
    <span
      title={isOnline ? "Backend online" : "Backend offline"}
      className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border border-border"
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          <span className="text-emerald-600 dark:text-emerald-400">API</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-red-500" aria-hidden />
          <span className="text-red-500">Offline</span>
        </>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────
   Navbar Component
───────────────────────────────────────── */
export function Navbar() {
  const { theme, toggle, mounted } = useTheme();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // 2. Gunakan hooks Wagmi murni untuk meluncurkan koneksi MetaMask secara langsung
  const { address, isConnected } = useAccount();
  const currentUser = useAppStore((s) => s.currentUser);
  const jwt = useAppStore((s) => s.jwt);

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white"
            aria-hidden
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div className="leading-none">
            <span className="block text-base font-bold tracking-tight bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Campus Chain
            </span>
            <span className="block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground -mt-0.5">
              Blockchain Chat
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Backend status — only show in dev */}
          {process.env.NODE_ENV === "development" && <BackendStatusDot />}

          {/* CSIT token balance */}
          <TokenBalance />

          {/* 3. TOMBOL CUSTOM METAMASK: Menggantikan ConnectButton RainbowKit */}
          {mounted && isConnected && address ? (
            jwt && currentUser ? (
              <button
                onClick={() => disconnect()}
                className="rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-4 py-2 text-xs font-mono font-bold transition-all cursor-pointer"
                title="Putuskan koneksi dompet"
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </button>
            ) : (
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 text-xs font-bold shadow-md shadow-amber-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                title="Login dulu untuk mengakses fitur"
              >
                Login
              </button>
            )
          ) : (
            <button
              onClick={async () => {
                try {
                  // Ambil connector injected (MetaMask) dari konfigurasi Wagmi Anda
                  // NOTE: connector `id` tidak selalu "injected" tergantung versi / implementasi,
                  // jadi kita pilih lebih robust berdasarkan type/id yang mengandung "injected".
                  // Tambahkan debug supaya ketika tombol diklik tidak terasa "silent".
                  const available = connectors ?? [];
                  console.log(
                    "[Navbar] connect: available connectors count=",
                    available.length,
                    available.map((c: any) => ({
                      id: c?.id,
                      type: c?.type,
                      name: c?.name,
                    })),
                  );

                  const metamaskConnector =
                    available.find((c: any) => {
                      const id = String(c?.id ?? "");
                      const type = String(c?.type ?? "");
                      return (
                        type.toLowerCase() === "injected" ||
                        id.toLowerCase().includes("injected") ||
                        type.toLowerCase().includes("injected")
                      );
                    }) ?? available[0];

                  if (!metamaskConnector) {
                    alert(
                      "MetaMask/injected connector tidak ditemukan di aplikasi ini. Silakan pastikan MetaMask terinstal dan reload halaman.",
                    );
                    window.open("https://metamask.io/download/", "_blank");
                    return;
                  }

                  console.log("[Navbar] connect: using connector=", {
                    id: (metamaskConnector as any).id,
                    type: (metamaskConnector as any).type,
                  });

                  // Fallback paksa popup MetaMask muncul (khusus injected)
                  // Karena sebelumnya connect() menghasilkan undefined dan tidak ada popup.
                  const type = String((metamaskConnector as any).type ?? "").toLowerCase();
                  const isInjected =
                    type === "injected" ||
                    String((metamaskConnector as any).id ?? "")
                      .toLowerCase()
                      .includes("injected");

                  if (isInjected) {
                    const ethereum = (window as any)?.ethereum;
                    if (!ethereum?.request) {
                      alert(
                        "MetaMask tidak terdeteksi di window.ethereum. Silakan instal MetaMask.",
                      );
                      return;
                    }
                    await ethereum.request({ method: "eth_requestAccounts" });
                  }

                  const res = await connect({ connector: metamaskConnector });
                  console.log("[Navbar] connect result=", res);
                } catch (err: any) {
                  console.error("[Navbar] connect failed:", err);
                  alert(
                    `Gagal connect wallet. ${
                      err?.message ? `Error: ${err.message}` : "Cek console untuk detail."
                    }`,
                  );
                }
              }}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 text-xs font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Connect Wallet
            </button>
          )}

          {/* Help / onboarding */}
          <IconButton
            onClick={() => setIsOnboardingOpen(true)}
            title="Cara pakai Web3 & ambil Sepolia ETH"
          >
            <HelpCircle className="h-4.5 w-4.5" aria-hidden />
          </IconButton>

          {/* Theme toggle */}
          <IconButton
            onClick={toggle}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4.5 w-4.5" aria-hidden />
              ) : (
                <Moon className="h-4.5 w-4.5" aria-hidden />
              )
            ) : (
              <span className="h-4.5 w-4.5" />
            )}
          </IconButton>
        </div>
      </div>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </header>
  );
}

export default Navbar;
