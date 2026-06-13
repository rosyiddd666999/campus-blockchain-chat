"use client";

import { create } from "zustand";
import type { ChatMessage, RoomUser } from "@/lib/socket";

interface ChatState {
  roomId: string;
  messages: ChatMessage[];
  onlineUsers: RoomUser[];
  typingUsers: RoomUser[];
  isConnected: boolean;
  currentUserId: string | null;
  setRoomId: (roomId: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setOnlineUsers: (users: RoomUser[]) => void;
  setTypingUser: (user: RoomUser, isTyping: boolean) => void;
  setConnected: (connected: boolean) => void;
  setCurrentUserId: (userId: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  roomId: "general",
  messages: [],
  onlineUsers: [],
  typingUsers: [],
  isConnected: false,
  currentUserId: null,
  setRoomId: (roomId) => set({ roomId, messages: [], typingUsers: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === message.id)
        ? state.messages
        : [...state.messages, message],
    })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setTypingUser: (user, isTyping) =>
    set((state) => {
      const filtered = state.typingUsers.filter((u) => u.userId !== user.userId);
      return {
        typingUsers: isTyping ? [...filtered, user] : filtered,
      };
    }),
  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  reset: () =>
    set({
      messages: [],
      onlineUsers: [],
      typingUsers: [],
      isConnected: false,
    }),
}));
