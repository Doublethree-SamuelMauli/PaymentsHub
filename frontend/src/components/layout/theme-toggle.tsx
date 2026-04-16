"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ph_theme");
    // Default = light. Só fica dark se o user escolheu explicitamente.
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ph_theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)]",
        className
      )}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
