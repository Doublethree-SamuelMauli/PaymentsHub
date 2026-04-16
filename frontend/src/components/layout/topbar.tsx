"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown, Shield } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  approver: "Aprovador",
  operator: "Operador",
  viewer: "Visualizador",
};

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = api.getUser();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)]/80 px-3 backdrop-blur sm:gap-3 sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--muted)] md:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={16} />
      </button>

      <div className="flex-1" />

      <ThemeToggle />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-1.5 py-1 transition hover:bg-[var(--muted)] sm:gap-2 sm:px-2 sm:py-1.5"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-[var(--foreground)]">{user?.name || "—"}</p>
            <p className="text-[10px] leading-tight text-[var(--muted-foreground)]">{ROLE_LABEL[user?.role || ""] || user?.role}</p>
          </div>
          <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
        </button>

        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl transition",
            menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user?.name}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
              <Shield size={10} />
              {ROLE_LABEL[user?.role || ""] || user?.role}
            </div>
          </div>
          <div className="my-1 h-px bg-[var(--border)]" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
