"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/lib/stores/chat";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow() {
  const { messages, currentUserId, typingUsers } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-zinc-500">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          Belum ada pesan
        </p>
        <p className="text-sm">Mulai percakapan dengan mengirim pesan pertama!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {messages.map((message) => {
          const isOwn = message.authorId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                  isOwn
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {!isOwn && (
                  <p className="mb-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {message.authorName}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.body}
                </p>
                <p
                  className={`mt-1 text-right text-[10px] ${
                    isOwn ? "text-blue-200" : "text-zinc-400"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-2 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500">
                {typingUsers.map((u) => u.name).join(", ")}{" "}
                {typingUsers.length === 1 ? "sedang mengetik" : "sedang mengetik"}
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.1s]">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">.</span>
                </span>
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
