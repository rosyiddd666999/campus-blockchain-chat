"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  X,
  Wallet,
  Compass,
  Droplet,
  CheckSquare,
  KeyRound,
  Loader2,
  UserPlus,
} from "lucide-react";
import { authApi, type VerifyRegistered, type VerifyUnregistered } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useAccount } from "wagmi";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function buildSiweMessage(params: {
  address: string;
  nonce: string;
  chainId: number;
  uri: string;
}): string {
  const { address, nonce, chainId, uri } = params;

  const issuedAt = new Date().toISOString();
  return `${uri} wants you to sign in with your Ethereum account:
${address}

Sign in to Campus Informatika Community Platform

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

export function OnboardingModal({
  isOpen,
  onClose,
}: OnboardingModalProps) {
  const { address } = useAccount();
  const setAuth = useAppStore((s) => s.setAuth);

  const [step, setStep] = useState<"login" | "register">("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regNim, setRegNim] = useState("");
  const [regAngkatan, setRegAngkatan] = useState("");
  const [needsReSign, setNeedsReSign] = useState(false);

  const chainId = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111";
    const n = Number(raw);
    return Number.isFinite(n) ? n : 11155111;
  }, []);

  const uri = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000";
    return window.location.origin || "http://localhost:3000";
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep("login");
      setLoginError(null);
      setRegisterError(null);
      setNeedsReSign(false);
    }
  }, [isOpen]);

  const doSiweSign = useCallback(async (): Promise<
    { token: string; user: { id: string; walletAddress: string; name: string; nim: string; angkatan: number; isVerified: boolean } }
  > => {
    if (!address) throw new Error("Wallet belum terhubung.");

    const nonceRes = await authApi.getNonce(address);
    const message = buildSiweMessage({
      address,
      nonce: nonceRes.nonce,
      chainId,
      uri,
    });

    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) {
      throw new Error("MetaMask tidak terdeteksi.");
    }

    const signature: string = await ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    const verifyRes = await authApi.verify(address, message, signature);

    if (!verifyRes.registered) {
      throw { _unregistered: true, walletAddress: verifyRes.walletAddress };
    }

    return verifyRes as VerifyRegistered;
  }, [address, chainId, uri]);

  const loginSiwe = async () => {
    if (!address) {
      setLoginError("Wallet belum terhubung. Hubungkan wallet dulu.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const verifyRes = await doSiweSign();
      setAuth(verifyRes.user, verifyRes.token);
      onClose();
    } catch (e: any) {
      if (e?._unregistered) {
        setStep("register");
        setNeedsReSign(true);
      } else {
        const msg = e instanceof Error ? e.message : "Login gagal. Coba lagi.";
        setLoginError(msg);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setRegisterError(null);
    setIsRegistering(true);

    try {
      const angkatan = parseInt(regAngkatan, 10);
      if (!regName.trim() || !regNim.trim() || isNaN(angkatan)) {
        setRegisterError("Semua field harus diisi dengan benar.");
        setIsRegistering(false);
        return;
      }

      await authApi.register(address, regName.trim(), regNim.trim(), angkatan);

      // After registration, re-sign SIWE to get JWT
      const verifyRes = await doSiweSign();
      setAuth(verifyRes.user, verifyRes.token);
      onClose();
    } catch (e: any) {
      if (e?._unregistered) {
        setRegisterError("Registrasi berhasil. Silakan login ulang.");
      } else {
        const msg = e instanceof Error ? e.message : "Registrasi gagal. Coba lagi.";
        setRegisterError(msg);
      }
    } finally {
      setIsRegistering(false);
    }
  };

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
          <h2 className="text-xl font-bold bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            {step === "register" ? "Daftar Akun Baru" : "Panduan Memulai Web3 & Faucet"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "register"
              ? "Akun Anda belum terdaftar. Isi data diri untuk melanjutkan."
              : "Ikuti langkah-langkah mudah di bawah ini untuk berinteraksi dengan platform ini di Sepolia Testnet."}
          </p>
        </div>

        {step === "register" ? (
          /* ── Registration Form ── */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Alamat Wallet
              </label>
              <input
                type="text"
                value={address ?? ""}
                disabled
                className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-mono text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: John Doe"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                NIM
              </label>
              <input
                type="text"
                value={regNim}
                onChange={(e) => setRegNim(e.target.value)}
                placeholder="Contoh: 12345678"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Angkatan
              </label>
              <input
                type="number"
                value={regAngkatan}
                onChange={(e) => setRegAngkatan(e.target.value)}
                placeholder="Contoh: 2024"
                min={2000}
                max={2100}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {registerError ? (
              <p className="text-xs text-red-500">{registerError}</p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("login")}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Daftar & Login
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Setelah mendaftar, Anda akan diminta menandatangani pesan SIWE untuk login.
            </p>
          </form>
        ) : (
          /* ── Onboarding Steps ── */
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
                  Pasang ekstensi browser MetaMask di Chrome, Firefox, atau Edge Anda.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-emerald-500 hover:underline"
                >
                  Unduh MetaMask →
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
                  Ubah jaringan MetaMask ke <strong>Sepolia Test Network</strong>.
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
                  Ambil Sepolia ETH (Faucet)
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Gunakan tombol faucet untuk mendapatkan ETH gratis.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                  Login Web3 (SIWE)
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Tandatangani pesan SIWE untuk membuktikan kepemilikan wallet.
                </p>

                {/* Login button */}
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={loginSiwe}
                    disabled={isLoggingIn}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menandatangani...
                      </>
                    ) : needsReSign ? (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Login Ulang
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Login dengan Wallet
                      </>
                    )}
                  </button>

                  {loginError ? (
                    <p className="text-xs text-red-500">{loginError}</p>
                  ) : null}

                  <p className="text-[11px] text-muted-foreground">
                    Dengan menandatangani, Anda mengonfirmasi kepemilikan alamat wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-sm">
                5
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  <Compass className="h-4 w-4 text-emerald-500" />
                  Mulai Chat & Tanya Jawab
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Setelah login berhasil, Anda bisa berinteraksi di halaman chat dan posting pertanyaan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

