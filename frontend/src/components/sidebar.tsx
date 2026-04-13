"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  CreditCard,
  PackageCheck,
  Users,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/dashboard/runs", label: "Lotes", icon: PackageCheck },
  { href: "/dashboard/beneficiaries", label: "Beneficiarios", icon: Users },
  { href: "/dashboard/settings", label: "Configuracoes", icon: Settings },
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
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-zinc-800" />
          <span className="text-sm font-semibold text-zinc-800 tracking-tight">PaymentsHub</span>
        </div>
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
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
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
