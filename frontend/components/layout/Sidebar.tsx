"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Home, PlusSquare, MessageSquare, Trophy, Shield, User } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();
  
  // Check if current user is admin (Ahmad Rosyid 0x111... is the mock admin)
  const isAdmin = address?.toLowerCase() === "0x1111111111111111111111111111111111111111";

  const navItems = [
    { name: "Forum Feed", href: "/", icon: Home },
    { name: "Tanya Diskusi", href: "/ask", icon: PlusSquare },
    { name: "Chat Realtime", href: "/chat", icon: MessageSquare },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    ...(isAdmin ? [{ name: "Admin Panel", href: "/admin", icon: Shield }] : []),
    ...(address
      ? [{ name: "Profil Saya", href: `/profile/${address}`, icon: User }]
      : [{ name: "Profil Saya", href: "#", icon: User, disabled: true }]),
  ];

  return (
    <>
      {/* Desktop Sidebar - Left */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 p-4 md:block h-[calc(100vh-4rem)] sticky top-16">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                  title="Hubungkan wallet untuk melihat profil"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-500" : "text-muted-foreground group-hover:text-foreground"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 pb-safe-bottom glass md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{item.name.split(" ")[0]}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                  isActive ? "text-emerald-500 font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] mt-0.5 font-medium tracking-tight">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
export default Sidebar;
