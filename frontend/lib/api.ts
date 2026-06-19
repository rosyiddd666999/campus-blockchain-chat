/**
 * API Client — frontend/lib/api.ts
 *
 * Fetch wrapper that:
 * 1. Uses NEXT_PUBLIC_API_URL (default: http://localhost:4000)
 * 2. Auto-attaches JWT from localStorage if available
 * 3. Returns typed responses or throws ApiError
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const balance = await api.get("/api/rewards/balance");
 *   const post = await api.post("/api/posts", { title, body, tags });
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* ─────────────────────────────────────────
   Error type
───────────────────────────────────────── */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ─────────────────────────────────────────
   Get JWT for the connected wallet address
   Call after SIWE verify stores the token
───────────────────────────────────────── */
export function getJwt(address?: string): string | null {
  if (typeof window === "undefined") return null;
  if (!address) return null;
  return localStorage.getItem(`icp-jwt-${address.toLowerCase()}`);
}

export function saveJwt(address: string, token: string) {
  localStorage.setItem(`icp-jwt-${address.toLowerCase()}`, token);
}

export function clearJwt(address: string) {
  localStorage.removeItem(`icp-jwt-${address.toLowerCase()}`);
}

/* ─────────────────────────────────────────
   Core fetch
───────────────────────────────────────── */
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  address?: string; // wallet address — used to find the right JWT
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, address, signal } = options;

  const jwt = getJwt(address);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // Try parse JSON regardless of status (backend always returns JSON)
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `HTTP ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  // Backend format: { success: true, data: T }
  return ((data as { data?: T } | null)?.data ?? data) as T;
}

/* ─────────────────────────────────────────
   Exported API object
───────────────────────────────────────── */
export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

/* ─────────────────────────────────────────
   Typed API calls (match backend routes)
───────────────────────────────────────── */

// Auth
export interface NonceResponse { nonce: string }

export interface VerifyRegistered {
  registered: true;
  token: string;
  user: UserProfile;
}

export interface VerifyUnregistered {
  registered: false;
  walletAddress: string;
}

export type VerifyResponse = VerifyRegistered | VerifyUnregistered;

export interface UserProfile {
  id: string;
  walletAddress: string;
  name: string;
  nim: string;
  angkatan: number;
  isVerified: boolean;
  reputation?: number;
}

export interface RegisterResponse extends UserProfile {}

export const authApi = {
  getNonce: (address: string) =>
    api.post<NonceResponse>("/api/auth/nonce", { address }),

  verify: (address: string, message: string, signature: string) =>
    api.post<VerifyResponse>("/api/auth/verify", { address, message, signature }),

  register: (
    walletAddress: string,
    name: string,
    nim: string,
    angkatan: number,
    opts?: { address?: string },
  ) =>
    api.post<RegisterResponse>("/api/auth/register", { walletAddress, name, nim, angkatan }, opts),

  me: (opts?: { address?: string }) =>
    api.get<UserProfile>("/api/auth/me", opts),
};

// Rewards
export interface RewardBalance {
  onChain: string;        // raw wei
  unclaimed: string;      // raw wei
  onChainFormatted: number;
  unclaimedFormatted: number;
}

export interface RewardHistoryItem {
  id: string;
  action: string;
  amount: string;
  txHash: string;
  createdAt: string;
}

export const rewardsApi = {
  getBalance: (address: string) =>
    api.get<RewardBalance>("/api/rewards/balance", { address }),

  getHistory: (address: string) =>
    api.get<RewardHistoryItem[]>("/api/rewards/history", { address }),

  claim: (address: string) =>
    api.post<{ txHash: string }>("/api/rewards/claim", undefined, { address }),
};

// Posts
export interface PostAuthor {
  id: string;
  name: string;
  walletAddress: string;
}

export interface PostComment {
  id: string;
  body: string;
  author: PostAuthor;
  createdAt: string;
}

export interface PostAnswer {
  id: string;
  body: string;
  author: PostAuthor;
  isBest: boolean;
  txHash: string | null;
  createdAt: string;
  likesCount: number;
  isLikedByMe?: boolean;
  comments: PostComment[];
}

export interface Post {
  id: string;
  title: string;
  body: string;
  tags: string[];
  author: PostAuthor;
  likesCount: number;
  answersCount: number;
  commentsCount?: number;
  bestAnswerId: string | null;
  txHash: string | null;
  isLikedByMe: boolean;
  createdAt: string;
  answers?: PostAnswer[];
  comments?: PostComment[];
}

export interface PaginatedPosts {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const postsApi = {
  list: (params?: { tag?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get<PaginatedPosts>(`/api/posts${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => api.get<Post>(`/api/posts/${id}`),

  create: (body: Pick<Post, "title" | "body" | "tags">, address: string) =>
    api.post<Post>("/api/posts", body, { address }),

  like: (id: string, address: string) =>
    api.post<{ liked: boolean }>(`/api/posts/${id}/like`, undefined, { address }),

  createAnswer: (id: string, body: string, address: string) =>
    api.post<{ id: string }>(`/api/posts/${id}/answers`, { body }, { address }),

  createComment: (postId: string, body: string, address: string) =>
    api.post<{ id: string }>("/api/comments", { postId, body }, { address }),

  selectBestAnswer: (postId: string, answerId: string, address: string) =>
    api.post<{ txHash: string }>(`/api/posts/${postId}/best`, { answerId }, { address }),

  likeAnswer: (answerId: string, address: string) =>
    api.post<{ liked: boolean }>(`/api/posts/${answerId}/answer-like`, undefined, { address }),
};

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  nim: string;
  totalCsit: string;
  reputation: number;
}

export const leaderboardApi = {
  allTime: () => api.get<LeaderboardEntry[]>("/api/leaderboard"),
  weekly:  () => api.get<LeaderboardEntry[]>("/api/leaderboard/weekly"),
};

// Admin
export interface Student {
  id: string;
  walletAddress: string;
  nim: string;
  name: string;
  angkatan: number;
  isVerified: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalAnswers: number;
  totalComments: number;
  totalRewardsCount: number;
  totalTokensDistributed: number;
}

export interface WhitelistResult {
  walletAddress: string;
  nim: string;
  txHash: string;
}

// Profile
export interface ProfileAnswer {
  id: string;
  body: string;
  txHash: string | null;
  isBest: boolean;
  createdAt: string;
  postId: string;
  postTitle: string;
}

export interface ProfileData {
  id: string;
  walletAddress: string;
  nim: string;
  name: string;
  angkatan: number;
  isVerified: boolean;
  balance: number;
  onChainBalance: number;
  unclaimedBalance: number;
  posts: Post[];
  answers: ProfileAnswer[];
}

export const profileApi = {
  get: (address: string) => api.get<ProfileData>(`/api/profile/${address}`),
};

export const adminApi = {
  addToWhitelist: (walletAddress: string, nim: string, opts?: { address?: string }) =>
    api.post<WhitelistResult>("/api/admin/whitelist", { walletAddress, nim }, opts),

  removeFromWhitelist: (nim: string, opts?: { address?: string }) =>
    api.delete<WhitelistResult>(`/api/admin/whitelist/${nim}`, opts),

  students: (opts?: { address?: string }) =>
    api.get<Student[]>("/api/admin/students", opts),

  stats: (opts?: { address?: string }) =>
    api.get<AdminStats>("/api/admin/stats", opts),
};