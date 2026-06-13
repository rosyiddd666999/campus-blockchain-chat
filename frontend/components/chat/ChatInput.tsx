"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/lib/stores/chat";

export function ChatInput() {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { roomId, isConnected } = useChatStore();

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!isConnected) return;
      getSocket().emit("typing", { roomId, isTyping });
    },
    [roomId, isConnected]
  );

  const handleChange = (value: string) => {
    setBody(value);
    setError(null);

    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !isConnected || sending) return;

    setSending(true);
    setError(null);
    emitTyping(false);

    getSocket().emit(
      "send_message",
      { roomId, body: trimmed },
      (res: { success: boolean; error?: string }) => {
        setSending(false);
        if (res?.success) {
          setBody("");
        } else {
          setError(res?.error ?? "Gagal mengirim pesan");
        }
      }
    );
  };

  return (
    <div className="border-t border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-4">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-1.5"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={
              isConnected ? "Ketik pesan..." : "Menghubungkan ke server..."
            }
            disabled={!isConnected || sending}
            maxLength={2000}
            className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!isConnected || sending || !body.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "Kirim"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </div>
  );
}
