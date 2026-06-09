"use client";

import React from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function TransactionStatus() {
  const transactions = useAppStore((state) => state.transactions);

  // We only show the 3 most recent transactions to avoid cluttering the UI
  const activeTxs = transactions.slice(0, 3);

  if (activeTxs.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full sm:bottom-6 sm:right-6">
      {activeTxs.map((tx) => {
        const isPending = tx.status === "pending";
        const isConfirmed = tx.status === "confirmed";
        const isFailed = tx.status === "failed";

        return (
          <div
            key={tx.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl animate-fade-in transition-all duration-300 ${
              isPending
                ? "bg-zinc-900 border-zinc-700 text-white dark:bg-zinc-900 dark:border-zinc-800"
                : isConfirmed
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
            }`}
          >
            {/* Status Icon */}
            <div className="mt-0.5 shrink-0">
              {isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              )}
              {isConfirmed && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              {isFailed && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            {/* Description & Link */}
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isPending ? "Transaksi Terkirim" : isConfirmed ? "Transaksi Berhasil" : "Transaksi Gagal"}
              </p>
              <p className="text-sm font-medium leading-normal text-foreground dark:text-white">
                {tx.description}
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400"
              >
                <span>Lihat di Etherscan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default TransactionStatus;
