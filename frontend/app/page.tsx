"use client";

import React, { useState, useRef } from "react";
import { Search, Flame, Clock, HelpCircle, Coins, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { postsApi, type PaginatedPosts } from "@/lib/api";
import { QuestionCard } from "@/components/posts/QuestionCard";
import Link from "next/link";

type SortBy = "newest" | "likes" | "unanswered";

function usePosts(search: string, tag: string | null) {
  return useQuery({
    queryKey: ["posts", { search, tag }],
    queryFn: () =>
      postsApi.list({
        ...(search ? { search } : {}),
        ...(tag   ? { tag }    : {}),
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

function sortPosts(posts: PaginatedPosts["posts"], sortBy: SortBy) {
  return [...posts].sort((a, b) => {
    if (sortBy === "newest")     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "likes")      return b.likesCount - a.likesCount;
    if (sortBy === "unanswered") return a.answersCount - b.answersCount;
    return 0;
  });
}

function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="skeleton h-5 w-5 rounded-full" />
        <div className="skeleton h-3.5 w-28 rounded" />
        <div className="skeleton h-3.5 w-20 rounded ml-auto" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
      <div className="flex gap-1.5 pt-1">
        <div className="skeleton h-6 w-16 rounded-lg" />
        <div className="skeleton h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export default function Home() {
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [selectedTag, setSelectedTag]   = useState<string | null>(null);
  const [sortBy, setSortBy]             = useState<SortBy>("newest");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebounced(value), 400);
  };

  const { data, isLoading, isError, refetch } = usePosts(debouncedSearch, selectedTag);
  const posts   = data?.posts ?? [];
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const sorted  = sortPosts(posts, sortBy);

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tanya Jawab &amp; Dapatkan{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                CSIT Token
              </span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Platform komunitas mahasiswa Informatika. Setiap kontribusi mendapat reward on-chain di Sepolia Testnet.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs font-semibold text-zinc-300">
              {[
                ["Pertanyaan", "+5 CSIT"],
                ["Jawaban", "+10 CSIT"],
                ["Jawaban Terbaik", "+20 CSIT"],
                ["Like diterima", "+2 CSIT"],
              ].map(([label, reward]) => (
                <span key={label} className="flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                  {label}: <span className="text-emerald-400">{reward}</span>
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/ask"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 font-bold text-white transition-all hover:-translate-y-0.5 self-start md:self-auto"
          >
            Tanya Sekarang
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Feed column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex rounded-xl bg-secondary p-1 border border-border shrink-0">
              {([
                { key: "newest"     as const, icon: Clock,      label: "Terbaru" },
                { key: "likes"      as const, icon: Flame,      label: "Populer" },
                { key: "unanswered" as const, icon: HelpCircle, label: "Belum Terjawab" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    sortBy === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          {/* Active tag indicator */}
          {selectedTag && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Tag aktif: <strong className="text-foreground">#{selectedTag}</strong>
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Content states */}
          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
            </div>

          ) : isError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center space-y-3">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500/60" aria-hidden />
              <p className="text-sm font-bold text-foreground">Gagal memuat postingan</p>
              <p className="text-xs text-muted-foreground">
                Pastikan backend berjalan di <code className="font-mono">localhost:4000</code>
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors cursor-pointer"
              >
                <Loader2 className="h-3.5 w-3.5" aria-hidden />
                Coba lagi
              </button>
            </div>

          ) : sorted.length > 0 ? (
            <div className="grid gap-4">
              {sorted.map((post) => (
                <QuestionCard key={post.id} post={post} />
              ))}
            </div>

          ) : (
            <div className="rounded-2xl border border-border bg-card/50 p-12 text-center space-y-2">
              <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden />
              <p className="font-bold text-foreground">
                {debouncedSearch || selectedTag ? "Tidak ditemukan" : "Belum ada pertanyaan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {debouncedSearch || selectedTag
                  ? "Coba ubah kata kunci atau hapus filter."
                  : "Jadilah yang pertama bertanya!"}
              </p>
              {!debouncedSearch && !selectedTag && (
                <Link
                  href="/ask"
                  className="mt-2 inline-flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors"
                >
                  Buat Pertanyaan <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Tag sidebar */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
            <h2 className="text-sm font-bold text-foreground mb-3">Topik Populer</h2>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-6 w-16 rounded-lg" />
                ))}
              </div>
            ) : allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      selectedTag === tag
                        ? "bg-emerald-500 text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Belum ada topik.</p>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}