"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, HelpCircle, Plus, Info } from "lucide-react";

export default function AskQuestion() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const users = useAppStore((state) => state.users);
  const addQuestion = useAppStore((state) => state.addQuestion);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is whitelisted/verified
  const userKey = address?.toLowerCase() || "";
  const userProfile = users[userKey];
  const isVerified = userProfile?.isVerified || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    if (!isVerified) {
      alert("Wallet Anda belum masuk whitelist Informatika. Minta Admin untuk mendaftarkannya terlebih dahulu!");
      return;
    }
    if (!title.trim() || !body.trim()) return;

    try {
      setIsSubmitting(true);
      // Split tags by comma or space
      const tags = tagsInput
        .split(/[\s,]+/)
        .map((t) => t.replace("#", "").trim())
        .filter(Boolean);

      addQuestion(title, body, tags, address);
      
      // Simulate delay for transaction deployment
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
          Buat Pertanyaan Baru
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bagikan masalah pemprograman atau blockchain Anda di forum komunitas untuk berdiskusi.
        </p>
      </div>

      {!address ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-600 dark:text-amber-400 flex gap-3.5 items-start">
          <AlertTriangle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Wallet Belum Terhubung</h3>
            <p className="text-xs leading-relaxed opacity-90">
              Anda harus menghubungkan wallet MetaMask Anda ke platform untuk dapat menulis pertanyaan. Harap gunakan tombol "Connect Wallet" di sudut kanan atas.
            </p>
          </div>
        </div>
      ) : !isVerified ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-600 dark:text-red-400 flex gap-3.5 items-start">
          <AlertTriangle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Address Belum Ter-Whitelist</h3>
            <p className="text-xs leading-relaxed opacity-90">
              Address wallet Anda (<code>{address.slice(0, 6)}...{address.slice(-4)}</code>) belum terdaftar di whitelist mahasiswa Teknik Informatika. Hanya mahasiswa terverifikasi yang dapat memposting kontribusi dan mengklaim token.
            </p>
            <p className="text-xs font-semibold underline pt-1">
              Silakan minta Admin untuk menambahkan address Anda di panel Admin.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Judul Pertanyaan</label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              placeholder="Contoh: Mengapa deploy contract di Sepolia selalu fail out-of-gas?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
            />
            <p className="text-[11px] text-muted-foreground leading-normal">
              Buat judul yang ringkas dan deskriptif agar mudah dipahami mahasiswa lain.
            </p>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Detail Deskripsi Masalah</label>
            <textarea
              required
              disabled={isSubmitting}
              rows={8}
              placeholder="Jelaskan secara detail kode Anda, lingkungan development (misal Hardhat/Next.js), dan pesan error yang didapatkan..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none font-normal"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Topik / Tag</label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Contoh: solidity hardhat error (pisahkan dengan spasi atau koma)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
            <p className="text-[11px] text-muted-foreground">
              Masukkan maksimal 5 tag yang relevan untuk mempermudah pencarian.
            </p>
          </div>

          {/* Reward Estimation Notice */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 text-emerald-500 text-xs flex gap-3 items-start">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">
              Memposting pertanyaan akan memicu interaksi smart contract <code>RewardManager.sol</code> untuk melakukan mint reward sebesar <strong>5 CSIT</strong> ke wallet Anda setelah transaksi selesai dikonfirmasi.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push("/")}
              className="rounded-xl border border-border hover:bg-secondary px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !body.trim()}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 px-6 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {isSubmitting ? "Mengirim ke Blockchain..." : "Publikasikan Pertanyaan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
