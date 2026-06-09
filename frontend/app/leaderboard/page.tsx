"use client";

import React, { useState } from "react";
import { Trophy, Award, Search, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function Leaderboard() {
  const users = useAppStore((state) => state.users);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"alltime" | "weekly">("alltime");

  // Transform users object into sorted array by reputation (contribution score)
  const leaderboardData = Object.values(users)
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.nim.includes(search))
    .sort((a, b) => b.reputation - a.reputation);

  // Top 3 Podium Winners
  const podium = leaderboardData.slice(0, 3);
  const remainderList = leaderboardData.slice(3);

  // Order podium as: 2nd, 1st, 3rd for traditional layout display
  const orderedPodium = [];
  if (podium[1]) orderedPodium.push({ ...podium[1], rank: 2, color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" }); // 2nd
  if (podium[0]) orderedPodium.push({ ...podium[0], rank: 1, color: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5" }); // 1st
  if (podium[2]) orderedPodium.push({ ...podium[2], rank: 3, color: "text-amber-700 bg-amber-700/10 border-amber-700/20" }); // 3rd

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Papan Peringkat Kontribusi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Apresiasi mahasiswa Informatika paling aktif berdiskusi dan membantu komunitas.
          </p>
        </div>

        {/* Filter Period toggles */}
        <div className="flex rounded-xl bg-secondary p-1 border border-border shrink-0">
          <button
            onClick={() => setFilterPeriod("alltime")}
            className={`flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filterPeriod === "alltime"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            All-Time
          </button>
          <button
            onClick={() => setFilterPeriod("weekly")}
            className={`flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filterPeriod === "weekly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Mingguan
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {orderedPodium.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 items-end max-w-3xl mx-auto">
          {orderedPodium.map((winner) => {
            const isFirst = winner.rank === 1;
            return (
              <div
                key={winner.walletAddress}
                className={`relative flex flex-col items-center text-center p-5 rounded-2xl border ${winner.color} transition-all duration-300 hover:scale-[1.02] ${
                  isFirst ? "sm:py-8 shadow-xl sm:-translate-y-2" : "sm:py-5"
                }`}
              >
                {/* Crown/Trophy Icon */}
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isFirst ? "bg-amber-500/10 text-amber-500 animate-bounce" : "bg-secondary text-zinc-500"}`}>
                  <Trophy className="h-5.5 w-5.5" />
                </div>
                
                {/* Ranking Badge */}
                <div className="absolute top-3 right-3 text-xs font-black tracking-tight opacity-40">
                  #{winner.rank}
                </div>

                <div className="mt-4 space-y-1">
                  <Link
                    href={`/profile/${winner.walletAddress}`}
                    className="font-bold text-sm text-foreground hover:text-emerald-500 transition-colors block max-w-[150px] truncate"
                  >
                    {winner.name}
                  </Link>
                  <p className="text-[10px] text-muted-foreground font-mono">{winner.nim}</p>
                </div>

                {/* Score */}
                <div className="mt-4 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Reputasi</span>
                  <span className="text-foreground font-bold text-sm">{winner.reputation} Pts</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-500 mt-1">
                  {winner.balance} CSIT
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Ranking Table List */}
      <div className="space-y-4">
        {/* Table Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari mahasiswa NIM / nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>

        {/* Table wrapper */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 w-16 text-center">Rank</th>
                <th className="px-5 py-3.5">Mahasiswa</th>
                <th className="px-5 py-3.5">NIM</th>
                <th className="px-5 py-3.5">Angkatan</th>
                <th className="px-5 py-3.5 text-center">Reputasi</th>
                <th className="px-5 py-3.5 text-right">Saldo CSIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {remainderList.map((user, idx) => {
                const rank = idx + 4;
                return (
                  <tr
                    key={user.walletAddress}
                    className="hover:bg-secondary/40 transition-colors"
                  >
                    <td className="px-5 py-4 text-center font-bold text-zinc-500 font-mono">
                      #{rank}
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">
                      <Link
                        href={`/profile/${user.walletAddress}`}
                        className="hover:text-emerald-500 transition-colors"
                      >
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {user.nim}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-semibold">
                      TI {user.angkatan}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-foreground">
                      {user.reputation}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-500 font-mono text-xs">
                      {user.balance.toLocaleString()} CSIT
                    </td>
                  </tr>
                );
              })}

              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground font-semibold">
                    Tidak ada data peringkat ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
