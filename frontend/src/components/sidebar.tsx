"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/payments", label: "Pagamentos", icon: "💳" },
  { href: "/dashboard/runs", label: "Lotes (Runs)", icon: "📦" },
  { href: "/dashboard/beneficiaries", label: "Beneficiários", icon: "👥" },
  { href: "/dashboard/settings", label: "Configurações", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">PaymentsHub</h1>
        <p className="text-xs text-zinc-500 mt-1">Orquestrador de Pagamentos</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
