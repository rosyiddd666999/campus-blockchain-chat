"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  ShieldAlert,
  Plus,
  Trash2,
  UserCheck,
  Loader2,
  RefreshCw,
  Users,
  MessageSquare,
  Award,
  MessageCircle,
  Coins,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminStats, type Student, ApiError } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function AdminPanel() {
  const { address, isConnected } = useAccount();
  const currentUser = useAppStore((s) => s.currentUser);

  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
  const isAdmin = !!adminAddress && address?.toLowerCase() === adminAddress;
  const queryClient = useQueryClient();

  const [studentWallet, setStudentWallet] = useState("");
  const [studentNim, setStudentNim] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAngkatan, setStudentAngkatan] = useState(2023);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionTxHash, setActionTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (actionTxHash) {
      const t = setTimeout(() => setActionTxHash(null), 8000);
      return () => clearTimeout(t);
    }
  }, [actionTxHash]);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats({ address }),
    enabled: isAdmin && !!address,
    refetchInterval: 30_000,
  });

  const {
    data: students,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["admin-students"],
    queryFn: () => adminApi.students({ address }),
    enabled: isAdmin && !!address,
    refetchInterval: 15_000,
  });

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentWallet.trim() || !studentNim.trim() || !studentName.trim()) return;

    if (!studentWallet.startsWith("0x") || studentWallet.length !== 42) {
      setActionError("Format address wallet tidak valid!");
      return;
    }

    setActionError(null);
    setActionTxHash(null);
    setIsSubmitting(true);

    try {
      const result = await adminApi.addToWhitelist(studentWallet.trim(), studentNim.trim(), { address });
      setActionTxHash(result.txHash);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setStudentWallet("");
      setStudentNim("");
      setStudentName("");
      setStudentAngkatan(2023);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menambahkan whitelist";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWhitelist = async (nim: string, name: string) => {
    if (!confirm(`Yakin hapus whitelist ${name}? Mereka tidak bisa posting sampai didaftarkan ulang.`)) return;

    setActionError(null);
    setActionTxHash(null);

    try {
      const result = await adminApi.removeFromWhitelist(nim, { address });
      setActionTxHash(result.txHash);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus whitelist";
      setActionError(msg);
    }
  };

  if (!address) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-600 dark:text-amber-400 flex gap-4 items-start max-w-md mx-auto mt-12 shadow-lg">
        <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm">Wallet Belum Terhubung</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            Hubungkan wallet Admin untuk mengakses panel.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-600 dark:text-red-400 flex gap-4 items-start max-w-md mx-auto mt-12 shadow-lg">
        <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm">Akses Ditolak</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            Wallet Anda bukan admin. Import private key dari <code className="bg-red-500/15 px-1 rounded">backend/.env → BACKEND_WALLET_PRIVATE_KEY</code> ke MetaMask.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
        Panel Admin
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Users, label: "Mahasiswa", value: stats?.totalUsers, loading: statsLoading },
          { icon: MessageSquare, label: "Postingan", value: stats?.totalPosts, loading: statsLoading },
          { icon: MessageCircle, label: "Jawaban", value: stats?.totalAnswers, loading: statsLoading },
          { icon: Award, label: "Rewards", value: stats?.totalRewardsCount, loading: statsLoading },
          { icon: Coins, label: "CSIT Terdistribusi", value: stats?.totalTokensDistributed, loading: statsLoading },
        ].map(({ icon: Icon, label, value, loading }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <Icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">
              {loading ? (
                <span className="skeleton h-5 w-12 inline-block" />
              ) : statsError ? (
                <span className="text-red-500 text-sm">Error</span>
              ) : (
                value?.toLocaleString() ?? "-"
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Action feedback */}
      {actionTxHash && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          Tx: <code className="font-mono">{actionTxHash.slice(0, 10)}...{actionTxHash.slice(-6)}</code>
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500">{actionError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Whitelist Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAddWhitelist} className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-emerald-500" />
              Daftarkan Mahasiswa
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Address Wallet</label>
              <input
                type="text"
                required
                placeholder="0x..."
                disabled={isSubmitting}
                value={studentWallet}
                onChange={(e) => setStudentWallet(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">NIM</label>
              <input
                type="text"
                required
                placeholder="21.11.4321"
                disabled={isSubmitting}
                value={studentNim}
                onChange={(e) => setStudentNim(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Nama</label>
              <input
                type="text"
                required
                placeholder="Nama mahasiswa"
                disabled={isSubmitting}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Angkatan</label>
              <select
                value={studentAngkatan}
                disabled={isSubmitting}
                onChange={(e) => setStudentAngkatan(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
              >
                {[2020, 2021, 2022, 2023, 2024].map((y) => (
                  <option key={y} value={y}>TI {y}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !studentWallet.trim() || !studentNim.trim() || !studentName.trim()}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Proses transaksi...
                </>
              ) : (
                "Tambahkan ke Whitelist"
              )}
            </button>
          </form>
        </div>

        {/* Students Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
              Mahasiswa ({students?.length ?? 0})
            </h2>
            <button
              onClick={() => { refetchStudents(); refetchStats(); }}
              className="icon-btn"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">NIM / Nama</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Angkatan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {studentsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5"><span className="skeleton h-4 w-32 inline-block" /></td>
                      <td className="px-4 py-3.5"><span className="skeleton h-4 w-20 inline-block" /></td>
                      <td className="px-4 py-3.5"><span className="skeleton h-4 w-10 inline-block" /></td>
                      <td className="px-4 py-3.5 text-center"><span className="skeleton h-4 w-12 inline-block" /></td>
                      <td className="px-4 py-3.5 text-right"><span className="skeleton h-6 w-6 inline-block rounded-lg" /></td>
                    </tr>
                  ))
                ) : studentsError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-red-500 text-xs">
                      Gagal memuat data.{" "}
                      <button onClick={() => refetchStudents()} className="underline font-bold cursor-pointer">Coba lagi</button>
                    </td>
                  </tr>
                ) : students && students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-foreground">{student.name}</div>
                        <div className="font-semibold text-[10px] text-muted-foreground">{student.nim}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-zinc-400">
                        {student.walletAddress.slice(0, 8)}...{student.walletAddress.slice(-6)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-muted-foreground">TI {student.angkatan}</td>
                      <td className="px-4 py-3.5 text-center">
                        {student.isVerified ? (
                          <span className="badge text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Verified</span>
                        ) : (
                          <span className="badge text-amber-500 border-amber-500/20 bg-amber-500/10">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleRemoveWhitelist(student.nim, student.name)}
                          className="rounded-lg p-1.5 text-red-500 bg-red-500/10 hover:bg-red-500/25 transition-colors cursor-pointer"
                          title="Hapus Whitelist"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground italic font-semibold text-xs">
                      Belum ada mahasiswa terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
