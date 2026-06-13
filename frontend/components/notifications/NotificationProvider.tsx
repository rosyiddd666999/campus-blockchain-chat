"use client";

import { useEffect } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { formatUnits } from "viem";
import { getSocket } from "@/lib/socket";
import { CAMPUS_COIN_ADDRESS, campusCoinAbi, REWARD_ACTION_LABELS } from "@/lib/contracts";
import { useNotificationStore } from "@/lib/stores/notifications";
import { useChatStore } from "@/lib/stores/chat";

function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`animate-in slide-in-from-right flex max-w-sm flex-col gap-1 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
            toast.type === "reward"
              ? "border-amber-300 bg-amber-50/95 text-amber-900 dark:border-amber-700 dark:bg-amber-950/95 dark:text-amber-100"
              : toast.type === "success"
                ? "border-green-300 bg-green-50/95 text-green-900 dark:border-green-700 dark:bg-green-950/95 dark:text-green-100"
                : "border-zinc-300 bg-white/95 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{toast.title}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100"
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
          <p className="text-xs opacity-90">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

function BestAnswerBanner() {
  const { bestAnswerHighlight, setBestAnswerHighlight } = useNotificationStore();
  const currentUserId = useChatStore((s) => s.currentUserId);

  if (!bestAnswerHighlight) return null;

  const isOwnAnswer = bestAnswerHighlight.authorId === currentUserId;

  return (
    <div className="border-b border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/50">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            🏆 Jawaban Terpilih sebagai Best Answer!
          </p>
          <p className="text-xs text-green-700 dark:text-green-400">
            {isOwnAnswer
              ? "Selamat! Jawaban kamu dipilih sebagai best answer (+20 CSIT)"
              : `${bestAnswerHighlight.authorName} mendapat best answer (+20 CSIT)`}
          </p>
        </div>
        <button
          onClick={() => setBestAnswerHighlight(null)}
          className="shrink-0 rounded-lg px-3 py-1 text-xs text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export function UnansweredBadge({ className = "" }: { className?: string }) {
  const count = useNotificationStore((s) => s.unansweredCount);
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const addToast = useNotificationStore((s) => s.addToast);
  const incrementUnanswered = useNotificationStore((s) => s.incrementUnanswered);
  const decrementUnanswered = useNotificationStore((s) => s.decrementUnanswered);
  const setBestAnswerHighlight = useNotificationStore((s) => s.setBestAnswerHighlight);
  const setCurrentUserId = useChatStore((s) => s.setCurrentUserId);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onConnected = (data: { userId: string; name: string }) => {
      setCurrentUserId(data.userId);
    };

    const onNewQuestion = (data: {
      postId: string;
      title: string;
      authorName: string;
    }) => {
      incrementUnanswered();
      addToast({
        type: "info",
        title: "Pertanyaan Baru",
        message: `${data.authorName}: ${data.title}`,
      });
    };

    const onNewAnswer = () => {
      decrementUnanswered();
    };

    const onRewardReceived = (data: {
      walletAddress: string;
      action: string;
      amount: number;
    }) => {
      const label = REWARD_ACTION_LABELS[data.action] ?? data.action;
      addToast({
        type: "reward",
        title: `+${data.amount} CSIT`,
        message: `Reward: ${label}`,
      });
    };

    const onBestAnswer = (data: {
      postId: string;
      answerId: string;
      authorId: string;
      authorName: string;
    }) => {
      setBestAnswerHighlight({
        postId: data.postId,
        answerId: data.answerId,
        authorId: data.authorId,
        authorName: data.authorName,
      });
      addToast({
        type: "success",
        title: "Best Answer!",
        message: `${data.authorName} mendapat +20 CSIT`,
      });
    };

    socket.on("connected", onConnected);
    socket.on("new_question", onNewQuestion);
    socket.on("new_answer", onNewAnswer);
    socket.on("reward_received", onRewardReceived);
    socket.on("best_answer_selected", onBestAnswer);

    return () => {
      socket.off("connected", onConnected);
      socket.off("new_question", onNewQuestion);
      socket.off("new_answer", onNewAnswer);
      socket.off("reward_received", onRewardReceived);
      socket.off("best_answer_selected", onBestAnswer);
    };
  }, [
    addToast,
    incrementUnanswered,
    decrementUnanswered,
    setBestAnswerHighlight,
    setCurrentUserId,
  ]);

  useWatchContractEvent({
    address: CAMPUS_COIN_ADDRESS,
    abi: campusCoinAbi,
    eventName: "Transfer",
    args: address ? { to: address } : undefined,
    enabled: Boolean(address) && CAMPUS_COIN_ADDRESS !== "0x0000000000000000000000000000000000000000",
    onLogs(logs) {
      for (const log of logs) {
        const { from, value } = log.args;
        if (from === "0x0000000000000000000000000000000000000000" || !value) continue;
        const amount = formatUnits(value, 18);
        addToast({
          type: "reward",
          title: `+${parseFloat(amount).toFixed(0)} CSIT`,
          message: "Token diterima on-chain (Sepolia)",
        });
      }
    },
  });

  return (
    <>
      {children}
      <BestAnswerBanner />
      <ToastContainer />
    </>
  );
}
