"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { AnswerCard } from "@/components/posts/AnswerCard";
import { PostEditor } from "@/components/posts/PostEditor";
import { Calendar, User, ThumbsUp, MessageSquare, AlertTriangle, Coins, MessageCircle } from "lucide-react";

interface QuestionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { id: postId } = React.use(params);
  
  const { isConnected, address } = useAccount();
  const posts = useAppStore((state) => state.posts);
  const answers = useAppStore((state) => state.answers);
  const comments = useAppStore((state) => state.comments);
  const users = useAppStore((state) => state.users);
  
  const likePost = useAppStore((state) => state.likePost);
  const addAnswer = useAppStore((state) => state.addAnswer);
  const addComment = useAppStore((state) => state.addComment);

  const [commentBody, setCommentBody] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Find post and related data
  const post = posts.find((p) => p.id === postId);
  const postAnswers = answers.filter((a) => a.postId === postId);
  const postComments = comments.filter((c) => c.postId === postId);
  const authorInfo = post ? users[post.authorId.toLowerCase()] : null;
  const authorName = authorInfo?.name || post?.authorName || "Mahasiswa";

  // Check if current user is whitelisted/verified
  const currentUserKey = address?.toLowerCase() || "";
  const currentUserProfile = users[currentUserKey];
  const isVerified = currentUserProfile?.isVerified || false;

  if (!post) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center max-w-md mx-auto mt-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 opacity-80" />
        <h3 className="mt-4 text-base font-bold text-foreground">Pertanyaan Tidak Ditemukan</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pertanyaan dengan ID tersebut tidak tersedia atau telah dihapus.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          Kembali ke Feed
        </Link>
      </div>
    );
  }

  const handleLike = () => {
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    likePost(post.id, address);
  };

  const handlePostAnswer = async (content: string) => {
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    if (!isVerified) {
      alert("Wallet Anda belum masuk whitelist Informatika. Minta Admin untuk mendaftarkannya terlebih dahulu!");
      return;
    }
    addAnswer(post.id, content, address);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    addComment(post.id, null, commentBody, address);
    setCommentBody("");
    setShowCommentForm(false);
  };

  const hasLiked = address ? post.likes.includes(address) : false;

  const formattedDate = new Date(post.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column - Content Thread */}
      <div className="flex-1 space-y-6 w-full">
        {/* Main Question Post */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.authorId}`}
                className="flex items-center gap-1.5 font-semibold text-foreground hover:text-emerald-500 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-zinc-500">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span>{authorName}</span>
              </Link>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            </div>

            {post.txHash && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                Tx: {post.txHash.slice(0, 8)}...{post.txHash.slice(-6)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
            {post.title}
          </h1>

          {/* Body */}
          <div className="text-sm sm:text-base leading-relaxed text-foreground whitespace-pre-wrap">
            {post.body}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-all duration-200 cursor-pointer ${
                  hasLiked
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className={`h-4.5 w-4.5 ${hasLiked ? "fill-emerald-500/10" : ""}`} />
                <span>{post.likes.length} Suka</span>
              </button>

              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground px-3 py-1.5 font-semibold transition-all cursor-pointer"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                <span>Komentar ({postComments.length})</span>
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          <div className="space-y-3 pt-3 border-t border-border/30">
            {/* Comment Form */}
            {showCommentForm && (
              <form onSubmit={handlePostComment} className="flex gap-2 items-stretch animate-fade-in">
                <input
                  type="text"
                  required
                  placeholder="Tulis komentar..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Kirim
                </button>
              </form>
            )}

            {/* Comments List */}
            {postComments.length > 0 && (
              <div className="space-y-2.5 pl-3 border-l-2 border-border/50">
                {postComments.map((comment) => (
                  <div key={comment.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Link href={`/profile/${comment.authorId}`} className="hover:underline text-[11px]">
                        {users[comment.authorId.toLowerCase()]?.name || comment.authorName}
                      </Link>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        &bull; {new Date(comment.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-normal">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Answers List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5 px-1">
            <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
            <span>{postAnswers.length} Jawaban Kontribusi</span>
          </h2>

          {postAnswers.length > 0 ? (
            <div className="grid gap-4">
              {postAnswers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  questionAuthorId={post.authorId}
                  bestAnswerId={post.bestAnswerId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground opacity-40 animate-pulse" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Belum ada jawaban kontribusi</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-0.5">
                Jadilah yang pertama menjawab pertanyaan ini untuk mengklaim reward 10 CSIT!
              </p>
            </div>
          )}
        </div>

        {/* Add Answer Section */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h3 className="text-sm font-bold text-foreground">Berikan Jawaban Kontribusi</h3>
          
          {!isConnected ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-600 dark:text-amber-400 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>
                Silakan hubungkan wallet MetaMask Anda untuk dapat berkontribusi memberikan jawaban pada pertanyaan ini.
              </span>
            </div>
          ) : !isVerified ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-600 dark:text-red-400 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>
                Wallet Anda belum ter-whitelist. Hanya mahasiswa terdaftar yang dapat menjawab untuk mendapatkan reward token CSIT.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <PostEditor onSubmit={handlePostAnswer} placeholder="Tulis jawaban teknis Anda dengan lengkap..." />
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3.5 text-emerald-500 text-xs flex gap-2.5 items-start">
                <Coins className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Menjawab pertanyaan akan memicu smart contract <code>RewardManager.sol</code> untuk mengalokasikan <strong>10 CSIT</strong> ke wallet Anda. Jika jawaban Anda ditandai sebagai "Solusi Terbaik", Anda akan mendapatkan bonus tambahan sebesar <strong>20 CSIT</strong>!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Stats/Sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        {/* Info panel */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
          <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">Informasi Utas</h3>
          
          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diposting Oleh:</span>
              <Link href={`/profile/${post.authorId}`} className="font-semibold text-foreground hover:text-emerald-500 transition-colors">
                {authorName}
              </Link>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Suka:</span>
              <span className="font-bold text-foreground">{post.likes.length} Suka</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Jawaban:</span>
              <span className="font-bold text-foreground">{postAnswers.length} Jawaban</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Solusi:</span>
              <span className={`font-bold ${post.bestAnswerId ? "text-emerald-500" : "text-amber-500"}`}>
                {post.bestAnswerId ? "Selesai Dijawab" : "Menunggu Solusi"}
              </span>
            </div>
          </div>
        </div>

        {/* Reputation block */}
        <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mx-auto">
            <Coins className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Reward Pertanyaan</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Utas Q&A ini berinteraksi langsung dengan kontrak insentif blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
