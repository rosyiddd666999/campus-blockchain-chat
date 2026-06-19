"use client";

/**
 * store.ts — Global UI State (Zustand)
 *
 * Store ini hanya menyimpan UI state:
 * - Auth / current user info (dari backend setelah SIWE verify)
 * - Transaction history (untuk TransactionStatus component)
 * - UI preferences
 *
 * Data seperti posts, answers, leaderboard sudah TIDAK ada di sini.
 * Semua data fetching pakai React Query di level komponen masing-masing.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, saveJwt, clearJwt, type UserProfile } from "./api";

/* ─────────────────────────────────────────
   Types — re-export supaya komponen lain
   tidak perlu import dari api.ts langsung
───────────────────────────────────────── */
export type { UserProfile } from "./api";

export interface Web3Tx {
  id: string;
  txHash: string | null;
  status: "pending" | "confirmed" | "failed";
  description: string;
  timestamp: string;
}

/* ─────────────────────────────────────────
   Post type — untuk QuestionCard & feed
   (shape sesuai response backend)
───────────────────────────────────────── */
export interface Post {
  id: string;
  title: string;
  body: string;
  tags: string[];
  
  author: {
    id: string;
    name: string;
    walletAddress: string;
  };
  
  likesCount: number;
  answersCount: number;
  bestAnswerId: string | null;
  txHash: string | null;
  createdAt: string;
  isLikedByMe?: boolean; // diisi di komponen setelah fetch
}

export interface Answer {
  id: string;
  postId: string;
  body: string;
  authorAddress: string;
  authorName: string;
  likesCount: number;
  isBest: boolean;
  txHash: string | null;
  createdAt: string;
  isLikedByMe?: boolean;
}

export interface Comment {
  id: string;
  postId: string | null;
  answerId: string | null;
  body: string;
  authorAddress: string;
  authorName: string;
  createdAt: string;
}

/* ─────────────────────────────────────────
   Auth State
───────────────────────────────────────── */
interface AuthState {
  currentUser: UserProfile | null;
  jwt: string | null;
  isAuthLoading: boolean;
}

/* ─────────────────────────────────────────
   Store interface
───────────────────────────────────────── */
interface AppState extends AuthState {
  transactions: Web3Tx[];

  // Auth actions
  setAuth: (user: UserProfile, jwt: string) => void;
  clearAuth: (address?: string) => void;
  refreshCurrentUser: (address: string) => Promise<void>;

  // Transaction actions (untuk UI feedback, bukan on-chain)
  addTransaction: (description: string, txHash?: string) => string;
  confirmTransaction: (txHash: string) => void;
  failTransaction: (txHash: string) => void;
}

/* ─────────────────────────────────────────
   Store
───────────────────────────────────────── */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      jwt: null,
      isAuthLoading: false,
      transactions: [],

      /* ── Auth ── */
      setAuth: (user, jwt) => {
        saveJwt(user.walletAddress, jwt);
        set({ currentUser: user, jwt });
      },

      clearAuth: (address) => {
        if (address) clearJwt(address);
        set({ currentUser: null, jwt: null });
      },

      refreshCurrentUser: async (address) => {
        const jwt = get().jwt;
        if (!jwt || !address) return;

        set({ isAuthLoading: true });
        try {
          const user = await api.get<UserProfile>("/api/auth/me", { address });
          set({ currentUser: user });
        } catch {
          // JWT mungkin expired — clear auth
          get().clearAuth(address);
        } finally {
          set({ isAuthLoading: false });
        }
      },

      /* ── Transactions (UI feedback) ── */
      addTransaction: (description, txHash) => {
        const hash = txHash ?? ("0x" + Math.random().toString(16).slice(2).padEnd(64, "0"));
        const newTx: Web3Tx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          txHash: hash,
          status: "pending",
          description,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 20),
        }));
        return hash;
      },

      confirmTransaction: (txHash) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.txHash === txHash ? { ...t, status: "confirmed" } : t
          ),
        }));
      },

      failTransaction: (txHash) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.txHash === txHash ? { ...t, status: "failed" } : t
          ),
        }));
      },
    }),
    {
      name: "icp-app-store",
      // Hanya persist hal yang perlu survive page refresh
      partialize: (state) => ({
        currentUser: state.currentUser,
        jwt: state.jwt,
        transactions: state.transactions.slice(0, 5), // hanya 5 terakhir
      }),
    }
  )
);

/* ─────────────────────────────────────────
   Selector hooks — supaya komponen tidak
   subscribe ke seluruh store
───────────────────────────────────────── */
export const useCurrentUser = () => useAppStore((s) => s.currentUser);
export const useJwt = () => useAppStore((s) => s.jwt);
export const useTransactions = () => useAppStore((s) => s.transactions);
export const useAuthActions = () =>
  useAppStore((s) => ({
    setAuth: s.setAuth,
    clearAuth: s.clearAuth,
    refreshCurrentUser: s.refreshCurrentUser,
  }));