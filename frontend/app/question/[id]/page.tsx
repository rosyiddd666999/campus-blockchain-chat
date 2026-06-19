"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postsApi, type Post, ApiError } from "@/lib/api";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { PostEditor } from "@/components/posts/PostEditor";
import { AnswerCard } from "@/components/posts/AnswerCard";
import {
  Calendar, User, ThumbsUp, MessageSquare, AlertTriangle,
  Coins, MessageCircle, Loader2, ChevronLeft,
} from "lucide-react";

interface QuestionDetailPageProps {
  params: Promise<{ id: string }>;
}

function shortAddress(addr: string) {
  if (!addr) return "0x0000...0000";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { id: postId } = React.use(params);
  const { address, isConnected } = useAccount();
  const currentUser = useCurrentUser();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const confirmTransaction = useAppStore((s) => s.confirmTransaction);
  const failTransaction = useAppStore((s) => s.failTransaction);
  const queryClient = useQueryClient();

  const [commentBody, setCommentBody] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postsApi.get(postId),
  });

  const isVerified = currentUser?.isVerified ?? false;

  const handleLike = async () => {
    if (!isConnected || !address) { alert("Hubungkan wallet MetaMask dulu!"); return; }

    const txHash = addTransaction(`Like: "${post?.title?.slice(0, 40)}..."`);
    try {
      await postsApi.like(postId, address);
      confirmTransaction(txHash);
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    } catch (err) {
      failTransaction(txHash);
    }
  };

  const handlePostAnswer = async (content: string) => {
    if (!isConnected || !address) { alert("Hubungkan wallet MetaMask dulu!"); return; }
    if (!isVerified) { alert("Wallet belum ter-whitelist."); return; }

    setAnswerError(null);
    const txHash = addTransaction("Mengirim jawaban...");
    try {
      await postsApi.createAnswer(postId, content, address);
      confirmTransaction(txHash);
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    } catch (err) {
      failTransaction(txHash);
      setAnswerError(err instanceof ApiError ? err.message : "Gagal mengirim jawaban");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 1 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center max-w-md mx-auto mt-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 opacity-80" />
        <h3 className="mt-4 text-base font-bold text-foreground">Pertanyaan Tidak Ditemukan</h3>
        <p className="mt-1 text-sm text-muted-foreground">Pertanyaan tidak tersedia atau telah dihapus.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Kembali ke Feed
        </Link>
        <button onClick={() => refetch()} className="mt-3 ml-2 rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors cursor-pointer">Coba lagi</button>
      </div>
    );
  }

  const authorName = post.author?.name || shortAddress(post.author?.walletAddress || "");
  const hasLiked = post.isLikedByMe;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 space-y-6 w-full">
        {/* Main Question */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          {/* Back + Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mr-1">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
              <Link href={`/profile/${post.author?.walletAddress}`} className="flex items-center gap-1.5 font-semibold text-foreground hover:text-emerald-500 transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-zinc-500">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span>{authorName}</span>
              </Link>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.createdAt)}</span>
            </div>
            {post.txHash && (
              <a href={`https://sepolia.etherscan.io/tx/${post.txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 font-mono hover:text-emerald-500 transition-colors">
                Tx: {post.txHash.slice(0, 8)}...{post.txHash.slice(-6)}
              </a>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">{post.title}</h1>
          <div className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap">{post.body}</div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border/50 text-xs">
            <button onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                hasLiked
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-emerald-500/10" : ""}`} />
              <span>{post.likesCount} Suka</span>
            </button>
            <button onClick={() => setShowCommentForm(!showCommentForm)}
              className="flex items-center gap-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground px-3 py-1.5 font-semibold transition-all cursor-pointer">
              <MessageCircle className="h-4 w-4" />
              <span>Komentar</span>
            </button>
          </div>

          {/* Comment form */}
          {showCommentForm && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!commentBody.trim() || !address) return;
              const txHash = addTransaction("Mengirim komentar...");
              try {
                await postsApi.createComment(postId, commentBody.trim(), address);
                confirmTransaction(txHash);
                setCommentBody("");
                setShowCommentForm(false);
                queryClient.invalidateQueries({ queryKey: ["post", postId] });
              } catch { failTransaction(txHash); }
            }} className="flex gap-2 items-stretch animate-fade-in pt-3 border-t border-border/30">
              <input type="text" required placeholder="Tulis komentar..." value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all" />
              <button type="submit" className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3.5 text-xs font-bold text-white transition-colors cursor-pointer">Kirim</button>
            </form>
          )}
        </div>

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5 px-1">
            <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
            <span>{post.answersCount} Jawaban</span>
          </h2>

          {post.answers && post.answers.length > 0 ? (
            <div className="grid gap-4">
              {post.answers.map((ans) => (
                <AnswerCard
                  key={ans.id}
                  answer={ans}
                  postId={post.id}
                  bestAnswerId={post.bestAnswerId}
                  questionAuthorId={post.author?.id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Belum ada jawaban</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jadilah yang pertama menjawab untuk reward 10 CSIT!</p>
            </div>
          )}
        </div>

        {/* Add Answer */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-foreground">Berikan Jawaban</h3>
          {!isConnected ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-600 dark:text-amber-400 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>Hubungkan wallet MetaMask untuk menjawab.</span>
            </div>
          ) : !isVerified ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-600 dark:text-red-400 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>Wallet belum ter-whitelist. Hanya mahasiswa terverifikasi yang bisa menjawab.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <PostEditor onSubmit={handlePostAnswer} placeholder="Tulis jawaban Anda..." />
              {answerError && <p className="text-xs text-red-500">{answerError}</p>}
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 text-emerald-500 text-xs flex gap-2.5 items-start">
                <Coins className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>Menjawab = <strong>10 CSIT</strong>. Jika terpilih sebagai solusi terbaik = bonus <strong>20 CSIT</strong>!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Informasi</h3>
          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Oleh:</span>
              <Link href={`/profile/${post.author?.walletAddress}`} className="font-semibold text-foreground hover:text-emerald-500">{authorName}</Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suka:</span>
              <span className="font-bold text-foreground">{post.likesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jawaban:</span>
              <span className="font-bold text-foreground">{post.answersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-bold ${post.bestAnswerId ? "text-emerald-500" : "text-amber-500"}`}>
                {post.bestAnswerId ? "Terjawab" : "Menunggu"}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mx-auto">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Reward On-Chain</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Setiap kontribusi terverifikasi di blockchain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
