"use client";

import { useChatStore } from "@/lib/stores/chat";

export function OnlineUsers() {
  const { onlineUsers, isConnected } = useChatStore();

  return (
    <aside className="flex h-full flex-col border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 lg:border-b-0 lg:border-l">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Online
        </h2>
        <p className="text-xs text-zinc-500">
          {isConnected ? `${onlineUsers.length} pengguna` : "Menghubungkan..."}
        </p>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {onlineUsers.length === 0 ? (
          <li className="px-2 py-4 text-center text-xs text-zinc-400">
            Belum ada pengguna online
          </li>
        ) : (
          onlineUsers.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {user.name.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-50 bg-green-500 dark:border-zinc-900" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {user.name}
                </p>
                {user.angkatan && (
                  <p className="text-xs text-zinc-400">Angkatan {user.angkatan}</p>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
