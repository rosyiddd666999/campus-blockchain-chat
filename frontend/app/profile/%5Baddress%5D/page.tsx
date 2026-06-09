"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { User, Coins, Award, HelpCircle, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { QuestionCard } from "@/components/posts/QuestionCard";

interface ProfilePageProps {
  params: Promise<{ address: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { address: rawAddress } = React.use(params);
  
  const address = rawAddress.toLowerCase();
  const { address: connectedAddress } = useAccount();
  
  const users = useAppStore((state) => state.users);
  const posts = useAppStore((state) => state.posts);
  const answers = useAppStore((state) => state.answers);
  const transactions = useAppStore((state) => state.transactions);
  const registerOrUpdateUser = useAppStore((state) => state.registerOrUpdateUser);

  const [activeTab, setActiveTab] = useState<"posts" | "answers" | "history">("posts");

  // Load user profile
  const user = users[address] || null;

  // Sync profile if connected but not registered in state
  useEffect(() => {
    if (address && !users[address]) {
      registerOrUpdateUser(rawAddress, {});
    }
  }, [address, users, registerOrUpdateUser, rawAddress]);

  if (!user) {
    return (
      <div className="text-center p-12 max-w-sm mx-auto mt-12 rounded-2xl border border-border bg-card">
        <AlertCircle className="mx-auto h-12 w-12 text-zinc-500 opacity-60 animate-bounce" />
        <h3 className="mt-4 text-base font-bold text-foreground">Profil Tidak Ditemukan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil mahasiswa untuk address tersebut tidak ditemukan dalam registry lokal.
        </p>
      </div>
    );
  }

  // Filter lists
  const userPosts = posts.filter((p) => p.authorId.toLowerCase() === address);
  const userAnswers = answers.filter((a) => a.authorId.toLowerCase() === address);
  
  // Filter transaction histories involving this wallet
  const userTx = transactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(address.slice(0, 10)) ||
      tx.description.toLowerCase().includes("reward") ||
      connectedAddress?.toLowerCase() === address
  );

  const isMe = connectedAddress?.toLowerCase() === address;

  return (
    <div className="space-y-6">
      {/* Profile Banner */}
      <div className="relative rounded-2xl border border-border bg-card p-6 shadow-xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl" />

        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
          {/* Avatar Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
            <User className="h-10 w-10" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground truncate">
                {user.name}
              </h2>
              {user.isVerified ? (
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
              <p>NIM: {user.nim || "Belum diatur"}</p>
              <p>Angkatan: {user.angkatan || "Belum diatur"}</p>
              <p className="truncate">Wallet: {rawAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Token Balance */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo CSIT</span>
            <Coins className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-500 font-mono tracking-tight">{user.balance} CSIT</p>
        </div>

        {/* Reputation Score */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Reputasi</span>
            <Award className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{user.reputation} Pts</p>
        </div>

        {/* Total Questions */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tanya Diskusi</span>
            <HelpCircle className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{userPosts.length}</p>
        </div>

        {/* Total Answers */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Jawaban</span>
            <FileText className="h-4.5 w-4.5 text-purple-500" />
          </div>
          <p className="text-lg font-black text-foreground font-mono tracking-tight">{userAnswers.length}</p>
        </div>
      </div>

      {/* Profile Tabs Section */}
      <div className="space-y-4">
        {/* Tab Header switchers */}
        <div className="flex border-b border-border text-sm">
          <button
            onClick={() => setActiveTab("posts")}
            className={`border-b-2 px-4 py-2.5 font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === "posts"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Pertanyaan Saya ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab("answers")}
            className={`border-b-2 px-4 py-2.5 font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === "answers"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Jawaban Kontribusi ({userAnswers.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`border-b-2 px-4 py-2.5 font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === "history"
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Riwayat Transaksi ({userTx.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          {/* Questions Tab */}
          {activeTab === "posts" && (
            <div className="grid gap-4">
              {userPosts.map((post) => (
                <QuestionCard key={post.id} post={post} />
              ))}
              {userPosts.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-2 text-center py-6">
                  Belum memposting pertanyaan diskusi apa pun.
                </p>
              )}
            </div>
          )}

          {/* Answers Tab */}
          {activeTab === "answers" && (
            <div className="grid gap-4">
              {userAnswers.map((ans) => {
                const parentPost = posts.find((p) => p.id === ans.postId);
                return (
                  <div key={ans.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Di Menit: {new Date(ans.createdAt).toLocaleString("id-ID")}</span>
                      {ans.isBest && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          Solusi Terpilih
                        </span>
                      )}
                    </div>
                    {parentPost && (
                      <Link
                        href={`/question/${parentPost.id}`}
                        className="font-bold text-sm text-foreground hover:text-emerald-500 transition-colors line-clamp-1 block"
                      >
                        Q: {parentPost.title}
                      </Link>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {ans.body}
                    </p>
                  </div>
                );
              })}
              {userAnswers.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-2 text-center py-6">
                  Belum berkontribusi memberikan jawaban apa pun.
                </p>
              )}
            </div>
          )}

          {/* Transaction History Tab */}
          {activeTab === "history" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Transaksi / Aksi</th>
                    <th className="px-5 py-3">Hash</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {userTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-all text-xs">
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {tx.description}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-zinc-400">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-emerald-500 font-bold"
                        >
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </a>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-tight capitalize ${
                            tx.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {tx.status === "confirmed" ? "Selesai" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}

                  {userTx.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground italic font-semibold">
                        Belum ada riwayat transaksi blockchain terdeteksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
