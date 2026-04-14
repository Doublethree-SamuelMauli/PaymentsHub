"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = api.getUser();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100 h-14 flex items-center px-4 lg:px-6 gap-3">
      <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg">
        <Menu className="h-5 w-5 text-zinc-600" />
      </button>
      <div className="flex-1" />
      <div ref={menuRef} className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#1a2744] text-white text-[10px] font-bold flex items-center justify-center">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[12px] font-semibold text-zinc-900 leading-tight">{user?.name || "Usuario"}</p>
            <p className="text-[10px] text-zinc-500 leading-tight">{user?.role || "viewer"}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-zinc-100">
              <p className="text-[13px] font-semibold text-zinc-900">{user?.name}</p>
              <p className="text-[11px] text-zinc-500">{user?.email}</p>
            </div>
            <div className="py-1">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
