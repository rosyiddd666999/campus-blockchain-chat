"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AVAILABLE_ROOMS, disconnectSocket, getSocket } from "@/lib/socket";
import { useChatStore } from "@/lib/stores/chat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { UnansweredBadge } from "@/components/notifications/NotificationProvider";

export default function ChatPage() {
  const {
    roomId,
    isConnected,
    setRoomId,
    setMessages,
    addMessage,
    setOnlineUsers,
    setTypingUser,
    setConnected,
    reset,
  } = useChatStore();

  const [showOnline, setShowOnline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const joinRoom = useCallback(
    (newRoomId: string) => {
      const socket = getSocket();
      setRoomId(newRoomId);
      setMessages([]);

      socket.emit("join_room", { roomId: newRoomId }, (res: { success: boolean; error?: string }) => {
        if (!res?.success) {
          setConnectionError(res?.error ?? "Gagal bergabung ke room");
        }
      });
    },
    [setRoomId, setMessages]
  );

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
      joinRoom(roomId);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = (err: Error) => {
      setConnectionError(err.message);
      setConnected(false);
    };

    const onMessageHistory = (data: {
      roomId: string;
      messages: Parameters<typeof setMessages>[0];
    }) => {
      if (data.roomId === useChatStore.getState().roomId) {
        setMessages(data.messages);
      }
    };

    const onMessageReceived = (message: Parameters<typeof addMessage>[0]) => {
      if (message.roomId === useChatStore.getState().roomId) {
        addMessage(message);
      }
    };

    const onRoomUsers = (data: { roomId: string; users: Parameters<typeof setOnlineUsers>[0] }) => {
      if (data.roomId === useChatStore.getState().roomId) {
        setOnlineUsers(data.users);
      }
    };

    const onUserTyping = (data: {
      roomId: string;
      userId: string;
      name: string;
      isTyping: boolean;
    }) => {
      if (data.roomId !== useChatStore.getState().roomId) return;
      const { currentUserId } = useChatStore.getState();
      if (data.userId === currentUserId) return;
      setTypingUser({ userId: data.userId, name: data.name }, data.isTyping);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message_history", onMessageHistory);
    socket.on("message_received", onMessageReceived);
    socket.on("room_users", onRoomUsers);
    socket.on("user_typing", onUserTyping);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("message_history", onMessageHistory);
      socket.off("message_received", onMessageReceived);
      socket.off("room_users", onRoomUsers);
      socket.off("user_typing", onUserTyping);
      reset();
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId);
    }
  }, [roomId, isConnected, joinRoom]);

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Home
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Community Chat
              <UnansweredBadge />
            </h1>
            <p className="text-xs text-zinc-500">
              {isConnected ? (
                <span className="text-green-600 dark:text-green-400">● Terhubung</span>
              ) : (
                <span className="text-amber-600">● Menghubungkan...</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnline((v) => !v)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium lg:hidden dark:border-zinc-700"
          >
            Online
          </button>
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="avatar" />
        </div>
      </header>

      {/* Room selector */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        {AVAILABLE_ROOMS.map((room) => (
          <button
            key={room.id}
            onClick={() => setRoomId(room.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              roomId === room.id
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {room.label}
          </button>
        ))}
      </div>

      {connectionError && (
        <div className="shrink-0 bg-red-50 px-4 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {connectionError} — Pastikan backend berjalan di{" "}
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}
        </div>
      )}

      {/* Main chat area */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatWindow />
          <ChatInput />
        </div>

        {/* Online users sidebar */}
        <div
          className={`${
            showOnline ? "flex" : "hidden"
          } h-48 shrink-0 flex-col lg:flex lg:h-auto lg:w-64`}
        >
          <OnlineUsers />
        </div>
      </div>
    </div>
  );
}
