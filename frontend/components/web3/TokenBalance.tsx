"use client";

import React, { useEffect, useState } from "react";
import { Coins, RefreshCw } from "lucide-react";
import { useAccount } from "wagmi";
import { rewardsApi, getJwt } from "@/lib/api";

/* ─────────────────────────────────────────
   TokenBalance
───────────────────────────────────────── */
export function TokenBalance() {
  const { address, isConnected } = useAccount();

  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchBalance(addr: string) {
    if (!getJwt(addr)) {
      setValue(null);
      return;
    }
    setLoading(true);
    try {
      const data = await rewardsApi.getBalance(addr);
      const total = (data.onChainFormatted ?? 0) + (data.unclaimedFormatted ?? 0);
      setValue(total.toFixed(2));
    } catch {
      setValue(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!address || !isConnected) {
      setValue(null);
      return;
    }
    fetchBalance(address);
    const interval = setInterval(() => fetchBalance(address), 15_000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  if (!isConnected || !address) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium">
      <Coins className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden />

      {loading && value === null ? (
        <span className="skeleton h-4 w-16 inline-block" aria-label="Memuat balance..." />
      ) : value === null ? (
        <span className="text-xs text-muted-foreground">Login</span>
      ) : (
        <span className="csit-amount tabular-nums">
          {value}{" "}
          <span className="text-muted-foreground font-normal">CSIT</span>
        </span>
      )}

      <button
        onClick={() => address && fetchBalance(address)}
        disabled={loading}
        className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer"
        title="Refresh balance"
        aria-label="Refresh CSIT balance"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          aria-hidden
        />
      </button>
    </div>
  );
}

export default TokenBalance;