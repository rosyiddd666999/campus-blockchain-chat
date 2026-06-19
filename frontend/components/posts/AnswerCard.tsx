"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThumbsUp, CheckCircle2, User, Calendar } from "lucide-react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { postsApi, ApiError } from "@/lib/api";
import { useAppStore } from "@/lib/store";

interface AnswerAuthor {
  id: string;
  name: string;
  walletAddress: string;
}

interface AnswerWithAuthor {
  id: string;
  body: string;
  author: AnswerAuthor;
  isBest: boolean;
  txHash: string | null;
  createdAt: string;
  likesCount: number;
  isLikedByMe?: boolean;
}

interface AnswerCardProps {
  answer: AnswerWithAuthor;
  postId: string;
  bestAnswerId: string | null;
  questionAuthorId: string;
}

function shortAddress(addr: string) {
  if (!addr) return "0x0000...0000";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function AnswerCard({ answer, postId, bestAnswerId, questionAuthorId }: AnswerCardProps) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const confirmTransaction = useAppStore((s) => s.confirmTransaction);
  const failTransaction = useAppStore((s) => s.failTransaction);

  const [hasLiked, setHasLiked] = useState(answer.isLikedByMe || false);
  const [likeCount, setLikeCount] = useState(answer.likesCount || 0);

  const handleLike = async () => {
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    const txHash = addTransaction(`Like jawaban...`);
    try {
      const res = await postsApi.likeAnswer(answer.id, address);
      setHasLiked(res.liked);
      setLikeCount((c) => c + (res.liked ? 1 : -1));
      confirmTransaction(txHash);
    } catch (err) {
      failTransaction(txHash);
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const handleSelectBest = async () => {
    if (!isConnected || !address) return;
    if (!confirm("Pilih jawaban ini sebagai solusi terbaik? Reward 20 CSIT akan dikirim ke penulis jawaban.")) return;
    const txHash = addTransaction("Memilih solusi terbaik...");
    try {
      await postsApi.selectBestAnswer(postId, answer.id, address);
      confirmTransaction(txHash);
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    } catch (err) {
      failTransaction(txHash);
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const isQuestionAuthor = !!address && !!questionAuthorId && address.toLowerCase() === questionAuthorId.toLowerCase();
  const isBestAnswer = answer.isBest || bestAnswerId === answer.id;
  const displayAuthorName = answer.author?.name || shortAddress(answer.author?.walletAddress || "");

  const formattedDate = new Date(answer.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        isBestAnswer
          ? "border-emerald-500 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/[0.01]"
          : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${answer.author?.walletAddress}`}
            className="flex items-center gap-1.5 font-semibold text-foreground hover:text-emerald-500 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-zinc-500">
              <User className="h-3 w-3" />
            </div>
            <span>{displayAuthorName}</span>
          </Link>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>

        {isBestAnswer && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Solusi Terbaik
          </span>
        )}
      </div>

      {/* Answer Body */}
      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mb-4">
        {answer.body}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-3">
          {/* Like Answer */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-all duration-200 cursor-pointer ${
              hasLiked
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className={`h-4.5 w-4.5 ${hasLiked ? "fill-emerald-500/10" : ""}`} />
            <span>{likeCount} Suka</span>
          </button>

          {/* Select Best Answer Button */}
          {isQuestionAuthor && !bestAnswerId && (
            <button
              onClick={handleSelectBest}
              className="flex items-center gap-1 text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Pilih Solusi Terbaik
            </button>
          )}
        </div>

        {answer.txHash && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
            Tx: {answer.txHash.slice(0, 6)}...{answer.txHash.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}
export default AnswerCard;
