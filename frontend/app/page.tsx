"use client";

import React, { useState } from "react";
import { Search, Flame, Clock, HelpCircle, Coins, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { QuestionCard } from "@/components/posts/QuestionCard";
import Link from "next/link";

export default function Home() {
  const posts = useAppStore((state) => state.posts);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "likes" | "unanswered">("newest");

  // Extract all unique tags
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  // Filter posts
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.body.toLowerCase().includes(search.toLowerCase());
      const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "likes") {
        return b.likes.length - a.likes.length;
      }
      if (sortBy === "unanswered") {
        return a.answersCount - b.answersCount; // fewer answers first
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 dark:from-zinc-950 dark:to-black">
        {/* Glow Effects */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tanya Jawab & Dapatkan <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">CSIT Token</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              ICP Chat adalah platform komunitas mahasiswa Informatika. Saling berdiskusi dan bantu temanmu menyelesaikan masalah untuk mendapatkan reward on-chain.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-emerald-500" />
                Pertanyaan: +5 CSIT
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-emerald-500" />
                Jawaban: +10 CSIT
              </span>
              <span className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-emerald-500" />
                Jawaban Terbaik: +20 CSIT
              </span>
            </div>
          </div>
          <Link
            href="/ask"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 font-bold text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10 transition-all cursor-pointer self-start md:self-auto hover:-translate-y-0.5"
          >
            <span>Tanya Sekarang</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Feed Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Feed list */}
        <div className="flex-1 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Sort Switcher */}
            <div className="flex rounded-xl bg-secondary p-1 border border-border">
              <button
                onClick={() => setSortBy("newest")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  sortBy === "newest"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Terbaru
              </button>
              <button
                onClick={() => setSortBy("likes")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  sortBy === "likes"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                Populer
              </button>
              <button
                onClick={() => setSortBy("unanswered")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  sortBy === "unanswered"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Belum Terjawab
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          {/* Tag reset indicator */}
          {selectedTag && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Menampilkan tag: <strong className="text-foreground">#{selectedTag}</strong>
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md hover:bg-red-500/20 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Posts Feed list */}
          {filteredPosts.length > 0 ? (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <QuestionCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card/50 p-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 animate-bounce" />
              <h3 className="mt-4 text-base font-bold text-foreground">
                Pertanyaan tidak ditemukan
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                Coba cari dengan kata kunci lain atau ubah filter tag Anda.
              </p>
            </div>
          )}
        </div>

        {/* Right: Tag sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <span>Topik Populer</span>
            </h3>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "bg-secondary text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Belum ada topik tersedia.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
