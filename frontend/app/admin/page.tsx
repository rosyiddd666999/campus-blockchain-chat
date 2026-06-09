"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { Shield, ShieldAlert, Plus, Trash2, Calendar, UserCheck, AlertTriangle } from "lucide-react";

export default function AdminPanel() {
  const { isConnected, address } = useAccount();
  const whitelist = useAppStore((state) => state.whitelist);
  const addToWhitelist = useAppStore((state) => state.addToWhitelist);
  const removeFromWhitelist = useAppStore((state) => state.removeFromWhitelist);

  // Form states
  const [studentWallet, setStudentWallet] = useState("");
  const [studentNim, setStudentNim] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAngkatan, setStudentAngkatan] = useState(2023);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access check: only Ahmad Rosyid (0x1111...) is the mock contract owner/admin
  const isAdmin = address?.toLowerCase() === "0x1111111111111111111111111111111111111111";

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentWallet.trim() || !studentNim.trim() || !studentName.trim()) return;

    if (!studentWallet.startsWith("0x") || studentWallet.length !== 42) {
      alert("Harap masukkan format address wallet Ethereum yang valid!");
      return;
    }

    try {
      setIsSubmitting(true);
      addToWhitelist(
        studentWallet.trim(),
        studentNim.trim(),
        studentName.trim(),
        Number(studentAngkatan)
      );

      // Reset form
      setStudentWallet("");
      setStudentNim("");
      setStudentName("");
      setStudentAngkatan(2023);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWhitelist = (walletAddress: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin mencabut whitelist untuk mahasiswa ${name}?`)) {
      removeFromWhitelist(walletAddress);
    }
  };

  // Guard checks
  if (!address) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-600 dark:text-amber-400 flex gap-4 items-start max-w-md mx-auto mt-12 shadow-lg">
        <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm">Wallet Belum Terhubung</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            Anda harus menghubungkan wallet Admin Anda (<code>0x1111...1111</code>) untuk mengakses halaman administrasi whitelist ini.
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
            Wallet Anda (<code>{address.slice(0, 6)}...{address.slice(-4)}</code>) bukan pemilik kontrak administrator Whitelist.
          </p>
          <p className="text-xs font-semibold pt-2 border-t border-red-500/10 mt-2">
            Tip: Untuk keperluan pengujian lokal, silakan impor akun admin berikut ke MetaMask Anda:
            <br />
            <code className="bg-red-500/15 select-all px-1.5 py-0.5 rounded font-mono block mt-1 break-all text-[10px]">
              0x1111111111111111111111111111111111111111
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Whitelist Addition Form - Left Pane */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            Panel Admin Whitelist
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen verifikasi wallet mahasiswa Teknik Informatika.
          </p>
        </div>

        <form onSubmit={handleAddWhitelist} className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Plus className="h-4.5 w-4.5 text-emerald-500" />
            <span>Daftarkan Mahasiswa</span>
          </h2>

          {/* Wallet Address */}
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

          {/* NIM */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">NIM</label>
            <input
              type="text"
              required
              placeholder="Contoh: 21.11.4321"
              disabled={isSubmitting}
              value={studentNim}
              onChange={(e) => setStudentNim(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Rosyid"
              disabled={isSubmitting}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          {/* Angkatan */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Angkatan</label>
            <select
              value={studentAngkatan}
              disabled={isSubmitting}
              onChange={(e) => setStudentAngkatan(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
            >
              <option value="2020">TI 2020</option>
              <option value="2021">TI 2021</option>
              <option value="2022">TI 2022</option>
              <option value="2023">TI 2023</option>
              <option value="2024">TI 2024</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !studentWallet.trim() || !studentNim.trim() || !studentName.trim()}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            {isSubmitting ? "Daftar di Blockchain..." : "Tambahkan ke Whitelist"}
          </button>
        </form>
      </div>

      {/* Whitelisted Students List Table - Right Pane */}
      <div className="lg:col-span-2 space-y-4 pt-0 lg:pt-8">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
            <span>Mahasiswa Ter-Whitelist ({whitelist.length})</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-card/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">NIM / Nama</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Angkatan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {whitelist.map((student) => (
                <tr key={student.walletAddress} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3.5 space-y-0.5">
                    <div className="font-bold text-foreground">{student.name}</div>
                    <div className="font-semibold text-[10px] text-muted-foreground">{student.nim}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-zinc-400">
                    {student.walletAddress.slice(0, 8)}...{student.walletAddress.slice(-6)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-muted-foreground">
                    TI {student.angkatan}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleRemoveWhitelist(student.walletAddress, student.name)}
                      className="rounded-lg p-1.5 text-red-500 bg-red-500/10 hover:bg-red-500/25 transition-colors cursor-pointer"
                      title="Hapus Whitelist"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {whitelist.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground italic font-semibold">
                    Belum ada mahasiswa yang masuk whitelist.
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
