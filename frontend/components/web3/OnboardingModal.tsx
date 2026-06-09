"use client";

import React, { useEffect } from "react";
import { X, Wallet, Compass, Droplet, CheckSquare } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Panduan Memulai Web3 & Faucet
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ikuti langkah-langkah mudah di bawah ini untuk berinteraksi dengan platform ini di Sepolia Testnet.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-5">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Pasang Wallet Web3 (MetaMask)
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Pasang ekstensi browser MetaMask di Chrome, Firefox, atau Edge Anda. Anda juga bisa menggunakannya di perangkat mobile Anda.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs font-semibold text-emerald-500 hover:underline"
              >
                Unduh MetaMask &rarr;
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                <Compass className="h-4 w-4 text-emerald-500" />
                Pindah ke Jaringan Sepolia
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Buka wallet MetaMask Anda, ubah jaringan dari <strong>Ethereum Mainnet</strong> ke <strong>Sepolia Test Network</strong> (aktifkan opsi "Show test networks" di setelan jika belum terlihat).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                <Droplet className="h-4 w-4 text-emerald-500" />
                Ambil Sepolia ETH Gratis (Faucet)
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Setiap transaksi di blockchain membutuhkan biaya gas. Anda bisa mendapatkan Sepolia ETH gratis tanpa biaya nyata melalui tautan faucet berikut:
              </p>
              <div className="flex flex-wrap gap-2.5 mt-2">
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Sepolia Faucet (Alchemy)
                </a>
                <a
                  href="https://www.infura.io/faucet/sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Infura Faucet
                </a>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                Mint Token & Bergabung Whitelist
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Agar dapat berinteraksi, minting reward, dan menggunakan chat, minting token harus dilakukan oleh wallet yang terdaftar. Hubungkan wallet Anda dan minta Admin mendaftarkan address Anda melalui halaman <strong>Admin Panel</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
export default OnboardingModal;
