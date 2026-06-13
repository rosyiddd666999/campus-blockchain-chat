"use client";

import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  body: string;
  roomId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface RoomUser {
  userId: string;
  name: string;
  angkatan?: number;
}

export interface SocketAuth {
  token?: string;
  userId?: string;
  name?: string;
  angkatan?: number;
}

let socket: Socket | null = null;

export function getSocket(auth?: SocketAuth): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", {
      auth: auth ?? getDevAuth(),
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  } else if (auth) {
    socket.auth = auth;
  }
  return socket;
}

export function getDevAuth(): SocketAuth {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem("campus-chat-user");
  if (stored) {
    try {
      return JSON.parse(stored) as SocketAuth;
    } catch {
      /* fall through */
    }
  }
  const userId = `user-${Math.random().toString(36).slice(2, 10)}`;
  const auth: SocketAuth = {
    userId,
    name: `Mahasiswa ${userId.slice(-4)}`,
    angkatan: 2022,
  };
  localStorage.setItem("campus-chat-user", JSON.stringify(auth));
  return auth;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const AVAILABLE_ROOMS = [
  { id: "general", label: "General", description: "Chat komunitas umum" },
  { id: "angkatan:2022", label: "Angkatan 2022", description: "Room angkatan 2022" },
  { id: "angkatan:2023", label: "Angkatan 2023", description: "Room angkatan 2023" },
  { id: "angkatan:2024", label: "Angkatan 2024", description: "Room angkatan 2024" },
] as const;
