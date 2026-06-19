"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi, rewardsApi, type ProfileData, type Post, type ProfileAnswer, ApiError } from "@/lib/api";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { User, Coins, Award, HelpCircle, FileText, CheckCircle2, AlertCircle, Loader2, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";
import { QuestionCard } from "@/components/posts/QuestionCard";

interface ProfilePageProps {
  params: Promise<{ address: string }>;
}

function shortAddress(addr: string) {
  if (!addr) return "0x0000...0000";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { address: rawAddress } = React.use(params);
  const address = rawAddress.toLowerCase();
  const { address: connectedAddress } = useAccount();
  const currentUser = useCurrentUser();

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ["profile", address],
    queryFn: () => profileApi.get(address),
  });

  const profileError = isError && error instanceof ApiError
    ? (error.status === 404 ? "not_found" : "server_error")
    : isError ? "server_error" : null;

  const queryClient = useQueryClient();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const confirmTransaction = useAppStore((s) => s.confirmTransaction);
  const failTransaction = useAppStore((s) => s.failTransaction);

  const [claimLoading, setClaimLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "answers" | "history">("posts");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center p-12 max-w-sm mx-auto mt-12 rounded-2xl border border-border bg-card">
        <AlertCircle className="mx-auto h-12 w-12 text-zinc-500 opacity-60" />
        <h3 className="mt-4 text-base font-bold text-foreground">
          {profileError === "not_found" ? "Profil Tidak Ditemukan" : "Terjadi Kesalahan"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {profileError === "not_found"
            ? "Mahasiswa dengan address tersebut belum terdaftar."
            : "Gagal memuat profil. Silakan coba lagi."}
        </p>
      </div>
    );
  }

  const isMe = connectedAddress?.toLowerCase() === address;

  const handleClaim = async () => {
    if (!connectedAddress) { alert("Connect wallet dulu!"); return; }
    setClaimLoading(true);
    const txId = addTransaction("Claim reward ke wallet...");
    try {
      const res = await rewardsApi.claim(connectedAddress);
      confirmTransaction(txId);
      queryClient.invalidateQueries({ queryKey: ["profile", address] });
    } catch (err) {
      failTransaction(txId);
      alert(err instanceof ApiError ? err.message : "Gagal claim");
    } finally {
      setClaimLoading(false);
    }
  };

  const unclaimed = Math.max(0, (profile?.balance ?? 0) - (profile?.onChainBalance ?? 0));
  const canClaim = unclaimed > 0 && isMe;

  const handleAddToken = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) { alert("MetaMask tidak terdeteksi"); return; }
    try {
      const SEPOLIA_HEX = "0xaa36a7";
      const currentChain = await ethereum.request({ method: "eth_chainId" });
      if (currentChain !== SEPOLIA_HEX) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_HEX }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: SEPOLIA_HEX,
                chainName: "Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }],
            });
          } else { throw switchErr; }
        }
      }
      await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: process.env.NEXT_PUBLIC_CAMPUS_COIN_ADDRESS,
            symbol: "CSIT",
            decimals: 18,
          },
        },
      });
    } catch { /* user rejected */ }
  };

  return (
    <div className="space-y-6">
      {/* Profile Banner */}
      <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
            <User className="h-10 w-10" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground truncate">
                {profile.name}
              </h2>
              {profile.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/15 w-fit mx-auto sm:mx-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mahasiswa TI
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-500/15 w-fit mx-auto sm:mx-0">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Belum Ter-Whitelist
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-mono space-y-0.5">
              <p>NIM: {profile.nim || "Belum diatur"}</p>
              <p>Angkatan: {profile.angkatan || "Belum diatur"}</p>
              <p className="truncate">Wallet: {profile.walletAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total CSIT</span>
            <Coins className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-500 font-mono tracking-tight">{(profile.balance ?? 0).toFixed(2)} CSIT</p>
          <p className="text-[10px] text-muted-foreground">
            On-chain: {(profile.onChainBalance ?? 0).toFixed(2)} | Unclaimed: {unclaimed.toFixed(2)}
          </p>
          {isMe && (
            <button
              onClick={handleAddToken}
              className="w-full mt-1 rounded-lg border border-border hover:bg-secondary text-xs font-semibold py-1.5 transition-colors cursor-pointer"
            >
              + Tambahkan CSIT ke MetaMask
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Unclaimed</span>
            <Award className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{unclaimed.toFixed(2)} CSIT</p>
          {canClaim && (
            <button
              onClick={handleClaim}
              disabled={claimLoading}
              className="w-full mt-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-300 text-white text-xs font-bold py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {claimLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpFromLine className="h-3.5 w-3.5" />
              )}
              {claimLoading ? "Memproses..." : `Claim ${unclaimed.toFixed(2)} CSIT`}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tanya Diskusi</span>
            <HelpCircle className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{profile.posts.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Jawaban</span>
            <FileText className="h-4.5 w-4.5 text-purple-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{profile.answers.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-border text-sm">
          <button
            onClick={() => setActiveTab("posts")}
            className={`border-b-2 px-4 py-2.5 font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === "posts"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Pertanyaan ({profile.posts.length})
          </button>
          <button
            onClick={() => setActiveTab("answers")}
            className={`border-b-2 px-4 py-2.5 font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === "answers"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Jawaban ({profile.answers.length})
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === "posts" && (
            <div className="grid gap-4">
              {profile.posts.map((post: Post) => (
                <QuestionCard key={post.id} post={post} />
              ))}
              {profile.posts.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-2 text-center py-6">
                  Belum memposting pertanyaan diskusi apa pun.
                </p>
              )}
            </div>
          )}

          {activeTab === "answers" && (
            <div className="grid gap-4">
              {profile.answers.map((ans: ProfileAnswer) => (
                <div key={ans.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{formatDate(ans.createdAt)}</span>
                    {ans.isBest && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        Solusi Terpilih
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/question/${ans.postId}`}
                    className="font-bold text-sm text-foreground hover:text-emerald-500 transition-colors line-clamp-1 block"
                  >
                    Q: {ans.postTitle}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {ans.body}
                  </p>
                </div>
              ))}
              {profile.answers.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-2 text-center py-6">
                  Belum berkontribusi memberikan jawaban apa pun.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
