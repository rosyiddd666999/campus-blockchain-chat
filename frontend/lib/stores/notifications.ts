"use client";

import { create } from "zustand";

export interface ToastNotification {
  id: string;
  type: "reward" | "info" | "success";
  title: string;
  message: string;
  createdAt: number;
}

export interface BestAnswerHighlight {
  postId: string;
  answerId: string;
  authorId: string;
  authorName: string;
}

interface NotificationState {
  toasts: ToastNotification[];
  unansweredCount: number;
  bestAnswerHighlight: BestAnswerHighlight | null;
  addToast: (toast: Omit<ToastNotification, "id" | "createdAt">) => void;
  removeToast: (id: string) => void;
  incrementUnanswered: () => void;
  decrementUnanswered: () => void;
  setBestAnswerHighlight: (highlight: BestAnswerHighlight | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  unansweredCount: 0,
  bestAnswerHighlight: null,
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
        },
      ].slice(-5),
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  incrementUnanswered: () =>
    set((state) => ({ unansweredCount: state.unansweredCount + 1 })),
  decrementUnanswered: () =>
    set((state) => ({
      unansweredCount: Math.max(0, state.unansweredCount - 1),
    })),
  setBestAnswerHighlight: (highlight) => set({ bestAnswerHighlight: highlight }),
}));
