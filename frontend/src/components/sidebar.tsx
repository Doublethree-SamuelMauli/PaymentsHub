"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  PackageCheck,
  Users,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/batch", label: "Lote do Dia", icon: CalendarCheck, highlight: true },
  { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/dashboard/runs", label: "Historico Lotes", icon: PackageCheck },
  { href: "/dashboard/beneficiaries", label: "Beneficiarios", icon: Users },
  { href: "/dashboard/settings", label: "Configuracoes", icon: Settings },
];

const externalItems = [
  { href: "http://localhost:8080/docs", label: "API Docs", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    api.clearToken();
    router.push("/login");
  }

  return (
    <aside className="w-56 bg-white border-r border-zinc-200 min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-zinc-100">
        <Logo size="small" />
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : item.highlight && !active
                    ? "text-emerald-700 hover:bg-emerald-50"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-zinc-100">
          <p className="text-[10px] font-semibold text-zinc-400 px-3 mb-1 uppercase tracking-wider">Recursos</p>
          {externalItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
      <div className="px-2 py-3 border-t border-zinc-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
