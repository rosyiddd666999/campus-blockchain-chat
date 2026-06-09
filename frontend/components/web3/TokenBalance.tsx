"use client";

import React, { useEffect, useState, useRef } from "react";
import { Coins } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";

export function TokenBalance() {
  const { isConnected, address } = useAccount();
  const users = useAppStore((state) => state.users);
  const registerOrUpdateUser = useAppStore((state) => state.registerOrUpdateUser);

  const [balance, setBalance] = useState(0);
  const [animate, setAnimate] = useState(false);
  const prevBalanceRef = useRef<number>(0);

  useEffect(() => {
    if (address) {
      const userKey = address.toLowerCase();
      const user = users[userKey] || registerOrUpdateUser(address, {});
      const currentBalance = user.balance;

      if (prevBalanceRef.current !== currentBalance) {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 1000);
        prevBalanceRef.current = currentBalance;
        setBalance(currentBalance);
        return () => clearTimeout(timer);
      }
      setBalance(currentBalance);
    }
  }, [address, users, registerOrUpdateUser]);

  if (!isConnected) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-emerald-500 font-bold text-sm transition-all duration-300 ${
        animate ? "scale-110 shadow-lg shadow-emerald-500/20 bg-emerald-500/20" : ""
      }`}
    >
      <Coins className={`h-4.5 w-4.5 ${animate ? "animate-bounce" : ""}`} />
      <span className="tabular-nums">{balance.toLocaleString()} CSIT</span>
    </div>
  );
}
export default TokenBalance;
