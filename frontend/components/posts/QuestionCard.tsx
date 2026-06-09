"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, CheckCircle2, Calendar, User } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppStore, Post } from "@/lib/store";

interface QuestionCardProps {
  post: Post;
}

export function QuestionCard({ post }: QuestionCardProps) {
  const { address, isConnected } = useAccount();
  const likePost = useAppStore((state) => state.likePost);
  const users = useAppStore((state) => state.users);

  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (address) {
      setHasLiked(post.likes.includes(address));
    } else {
      setHasLiked(false);
    }
    setLikeCount(post.likes.length);
  }, [post.likes, address]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page if card is clicked
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    likePost(post.id, address);
  };

  // Get author details
  const authorInfo = users[post.authorId.toLowerCase()];
  const displayAuthorName = authorInfo?.name || post.authorName;

  const formattedDate = new Date(post.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative block rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/2 dark:hover:shadow-emerald-500/[0.02] hover:-translate-y-0.5">
      <Link href={`/question/${post.id}`} className="block space-y-3">
        {/* Author & Date Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.authorId}`}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-emerald-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-zinc-500">
                <User className="h-3 w-3" />
              </div>
              <span className="truncate max-w-[120px] sm:max-w-none">{displayAuthorName}</span>
            </Link>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>

          {post.bestAnswerId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/15">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solusi Terpilih
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold leading-normal text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Body Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {post.body}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground tracking-tight"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            {/* Answer count */}
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500/65 transition-colors" />
              {post.answersCount} Jawaban
            </span>

            {/* Likes count */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 font-semibold transition-all duration-200 cursor-pointer ${
                hasLiked ? "text-emerald-500" : "hover:text-emerald-500"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? "fill-emerald-500/20" : ""}`} />
              <span>{likeCount} Suka</span>
            </button>
          </div>

          {post.txHash && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono tracking-tight">
              Tx: {post.txHash.slice(0, 6)}...{post.txHash.slice(-4)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
export default QuestionCard;
