"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { postsApi, ApiError, type Post } from "@/lib/api";
import { useAppStore } from "@/lib/store";

interface QuestionCardProps {
  post: Post;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortAddress(addr: string) {
  if (!addr) return "0x0000...0000"; // Fallback aman jika alamat undefined atau kosong
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ─────────────────────────────────────────
   QuestionCard
───────────────────────────────────────── */
export function QuestionCard({ post }: QuestionCardProps) {
  const { address, isConnected } = useAccount();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const confirmTransaction = useAppStore((s) => s.confirmTransaction);
  const failTransaction = useAppStore((s) => s.failTransaction);
  const queryClient = useQueryClient();

  // Optimistic like state — mulai dari data backend
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(post.isLikedByMe ?? false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    if (isLiking) return;

    // Optimistic update — UI berubah duluan sebelum API selesai
    const wasLiked = hasLiked;
    setHasLiked(!wasLiked);
    setLikeCount((prev) => prev + (wasLiked ? -1 : 1));
    setIsLiking(true);

    const txHash = addTransaction(
      wasLiked
        ? `Unlike question: "${post.title.slice(0, 40)}..."`
        : `Like question & trigger 2 CSIT reward: "${post.title.slice(0, 40)}..."`,
    );

    try {
      const result = await postsApi.like(post.id, address);

      // Sync dengan response backend (bisa beda dari optimistic)
      setHasLiked(result.liked);
      setLikeCount((prev) =>
        result.liked
          ? wasLiked
            ? prev
            : prev // sudah diupdate optimistically
          : wasLiked
            ? prev
            : prev,
      );

      confirmTransaction(txHash);

      // Invalidate cache supaya feed refresh dengan data terbaru
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      // Rollback optimistic update kalau gagal
      setHasLiked(wasLiked);
      setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
      failTransaction(txHash);

      const message = err instanceof ApiError ? err.message : "Gagal like";
      console.error("Like error:", message);
    } finally {
      setIsLiking(false);
    }
  };

  const explorerUrl = post.txHash
    ? `https://sepolia.etherscan.io/tx/${post.txHash}`
    : null;

  return (
    <article className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/question/${post.id}`} className="block space-y-3">
        {/* Author & Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-foreground shrink-0">
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary"
                aria-hidden
              >
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="truncate max-w-25 sm:max-w-45">
                {post.author?.name || shortAddress(post.author?.walletAddress || "")}
              </span>
            </div>
            <span aria-hidden>&bull;</span>
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3" aria-hidden />
              {formatDate(post.createdAt)}
            </span>
          </div>

          {post.bestAnswerId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/15 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Solusi Terpilih
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Body preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.body}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            {/* Answers */}
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare
                className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500/60 transition-colors"
                aria-hidden
              />
              {post.answersCount} Jawaban
            </span>

            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              aria-label={
                hasLiked ? "Unlike pertanyaan ini" : "Like pertanyaan ini"
              }
              aria-pressed={hasLiked}
              className={`flex items-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-60 ${
                hasLiked ? "text-emerald-500" : "hover:text-emerald-500"
              }`}
            >
              <ThumbsUp
                className={`h-4 w-4 transition-all ${
                  hasLiked ? "fill-emerald-500/20 text-emerald-500" : ""
                } ${isLiking ? "animate-pulse" : ""}`}
                aria-hidden
              />
              <span>{likeCount} Suka</span>
            </button>
          </div>

          {/* Tx hash link ke Etherscan */}
          {explorerUrl ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(explorerUrl, "_blank", "noopener,noreferrer");
              }}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-emerald-500 font-mono tracking-tight transition-colors cursor-pointer"
              title="Lihat transaksi di Sepolia Etherscan"
            >
              Tx: {post.txHash!.slice(0, 6)}...{post.txHash!.slice(-4)}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default QuestionCard;
