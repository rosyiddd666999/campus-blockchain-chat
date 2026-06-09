"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAppStore, ChatMessage } from "@/lib/store";
import { Send, Users, MessageSquare, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

export default function ChatRoom() {
  const { isConnected, address } = useAccount();
  const chatMessages = useAppStore((state) => state.chatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const users = useAppStore((state) => state.users);

  const [activeChannel, setActiveChannel] = useState("general");
  const [inputText, setInputText] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChannel]);

  // Handle typing indicator simulation
  useEffect(() => {
    if (inputText.length > 0) {
      // Pick a random online mock user to simulate "typing" back or show active room
      const timer = setTimeout(() => {
        setTypingUser("Budi Santoso");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setTypingUser(null);
    }
  }, [inputText]);

  // Remove mock typing after some time
  useEffect(() => {
    if (typingUser) {
      const timer = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [typingUser]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownLeft > 0) {
      const timer = setInterval(() => {
        setCooldownLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setIsRateLimited(false);
    }
  }, [cooldownLeft]);

  // Verify whitelist
  const userKey = address?.toLowerCase() || "";
  const userProfile = users[userKey];
  const isVerified = userProfile?.isVerified || false;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!isConnected || !address) {
      alert("Hubungkan wallet MetaMask Anda terlebih dahulu!");
      return;
    }
    if (!isVerified) {
      alert("Wallet Anda belum ter-whitelist. Anda hanya bisa melihat chat.");
      return;
    }

    const success = sendChatMessage(activeChannel, inputText, address);
    if (success) {
      setInputText("");
    } else {
      setIsRateLimited(true);
      setCooldownLeft(3); // 3 seconds cooldown anti spam
    }
  };

  const filteredMessages = chatMessages.filter((m) => m.channel === activeChannel);

  const channels = [
    { id: "general", name: "# umum-general", desc: "Forum diskusi umum mahasiswa TI" },
    { id: "2021", name: "# angkatan-2021", desc: "Komunitas Mahasiswa TI Angkatan 2021" },
    { id: "2022", name: "# angkatan-2022", desc: "Komunitas Mahasiswa TI Angkatan 2022" },
    { id: "2023", name: "# angkatan-2023", desc: "Komunitas Mahasiswa TI Angkatan 2023" },
  ];

  // Mock online users list
  const onlineMockUsers = [
    { name: "Ahmad Rosyid (Admin)", role: "2021", address: "0x1111...1111" },
    { name: "Budi Santoso", role: "2022", address: "0x2222...2222" },
    { name: "Citra Lestari", role: "2023", address: "0x3333...3333" },
  ];

  return (
    <div className="flex flex-col lg:flex-row rounded-2xl border border-border bg-card overflow-hidden h-[calc(100vh-8rem)] min-h-[500px] shadow-xl">
      {/* Channels Sidebar - Left */}
      <div className="w-full lg:w-60 border-r border-border bg-card/60 flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
            <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
            <span>Ruang Chat</span>
          </h2>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto flex-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                activeChannel === channel.id
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              }`}
            >
              <div className="font-bold">{channel.name}</div>
              <div className="text-[10px] opacity-80 mt-0.5 font-normal truncate">
                {channel.desc}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Chat Conversation Pane - Center */}
      <div className="flex-1 flex flex-col bg-background/30 h-full min-w-0">
        {/* Active room header */}
        <div className="px-4 py-3 border-b border-border bg-card/40 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {channels.find((c) => c.id === activeChannel)?.name}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {channels.find((c) => c.id === activeChannel)?.desc}
            </p>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
          {filteredMessages.map((msg) => {
            const isMe = address && msg.authorId.toLowerCase() === address.toLowerCase();
            const displayName = users[msg.authorId.toLowerCase()]?.name || msg.authorName;

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] sm:max-w-[70%] space-y-1 ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                  <span className="font-semibold text-foreground">{displayName}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-emerald-500 text-white font-medium shadow-md shadow-emerald-500/10"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {typingUser && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic px-1.5 animate-pulse">
              <span className="font-semibold">{typingUser}</span> sedang mengetik...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <div className="p-3 border-t border-border bg-card/40 shrink-0">
          {!isConnected ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-600 dark:text-amber-400 text-xs flex gap-2 items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>Hubungkan wallet Anda untuk mengirim pesan di ruang chat ini.</span>
            </div>
          ) : !isVerified ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-600 dark:text-red-400 text-xs flex gap-2 items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>
                Wallet Anda belum ter-whitelist. Anda berada dalam mode lihat-saja (read-only).
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <div className="flex-1 relative rounded-xl border border-border bg-background focus-within:border-emerald-500 transition-all flex items-center">
                <input
                  type="text"
                  placeholder="Ketik pesan komunitas..."
                  value={inputText}
                  disabled={isRateLimited}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0"
                />
                
                {isRateLimited && (
                  <span className="absolute right-3 text-xs text-red-500 font-bold flex items-center gap-1 animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    Spam Cooldown ({cooldownLeft}s)
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isRateLimited || !inputText.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Online Users List - Right */}
      <div className="hidden lg:flex w-52 border-l border-border bg-card/60 flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-1.5 shrink-0">
          <Users className="h-4 w-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-foreground">Online ({onlineMockUsers.length + (isConnected ? 1 : 0)})</h4>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto flex-1">
          {/* Current User */}
          {isConnected && address && (
            <div className="flex items-center gap-2 rounded-lg p-1">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">
                  {users[address.toLowerCase()]?.name || `Saya (${address.slice(0, 6)})`}
                </div>
                <div className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Whitelisted</span>
                </div>
              </div>
            </div>
          )}

          {/* Seed online users */}
          {onlineMockUsers.map((user) => (
            <div key={user.name} className="flex items-center gap-2 rounded-lg p-1 opacity-80">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
                <div className="text-[9px] text-muted-foreground">
                  Angkatan {user.role} &bull; {user.address}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
