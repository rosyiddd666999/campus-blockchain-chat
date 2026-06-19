"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Home, PlusSquare, MessageSquare, Trophy, Shield, User } from "lucide-react";
import { useCurrentUser } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const currentUser = useCurrentUser();

  // Admin = deployer wallet address dari env
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
  const isAdmin = !!adminAddress && address?.toLowerCase() === adminAddress;

  const navItems = [
    { name: "Forum Feed",    href: "/",           icon: Home },
    { name: "Tanya Diskusi", href: "/ask",         icon: PlusSquare },
    { name: "Chat Realtime", href: "/chat",        icon: MessageSquare },
    { name: "Leaderboard",   href: "/leaderboard", icon: Trophy },
    ...(isAdmin ? [{ name: "Admin Panel", href: "/admin", icon: Shield }] : []),
    ...(address
      ? [{ name: "Profil Saya", href: `/profile/${address}`, icon: User }]
      : [{ name: "Profil Saya", href: "#", icon: User, disabled: true }]
    ),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card/50 p-4 md:block h-[calc(100vh-4rem)] sticky top-16">
        {/* User info — tampil kalau sudah login */}
        {currentUser && (
          <div className="mb-4 rounded-xl bg-secondary px-3 py-2.5">
            <p className="text-xs font-bold text-foreground truncate">{currentUser.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{currentUser.nim}</p>
            {currentUser.isVerified && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                ✓ Terverifikasi
              </span>
            )}
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if ((item as any).disabled) {
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
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-emerald-500" : ""}`} />
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

            if ((item as any).disabled) {
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 opacity-40 cursor-not-allowed"
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