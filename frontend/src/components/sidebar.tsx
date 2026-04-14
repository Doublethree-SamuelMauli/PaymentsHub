"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Logo } from "@/components/logo";
import {
  LayoutDashboard, CalendarCheck, CreditCard, PackageCheck,
  Users, Settings, BookOpen, UserCog, X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  requiredRole?: "viewer" | "operator" | "approver" | "admin";
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/batch", label: "Lote do Dia", icon: CalendarCheck, highlight: true, requiredRole: "operator" },
  { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/dashboard/runs", label: "Historico", icon: PackageCheck },
  { href: "/dashboard/beneficiaries", label: "Beneficiarios", icon: Users, requiredRole: "operator" },
  { href: "/dashboard/users", label: "Usuarios", icon: UserCog, requiredRole: "admin" },
  { href: "/dashboard/settings", label: "Configuracoes", icon: Settings, requiredRole: "admin" },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const user = api.getUser();

  const visibleItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    return api.roleCovers(item.requiredRole);
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} className="lg:hidden fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm" />
      )}

      <aside className={cn(
        "fixed lg:static z-50 w-60 bg-white border-r border-zinc-200 h-screen flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="px-4 py-4 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/dashboard"><Logo size="small" /></Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-zinc-100 rounded">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : item.highlight
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-zinc-100">
            <p className="text-[10px] font-semibold text-zinc-400 px-3 mb-1 uppercase tracking-wider">Recursos</p>
            <a href="http://localhost:8080/docs" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900">
              <BookOpen className="h-4 w-4" /> API Docs
            </a>
          </div>
        </nav>

        {user && (
          <div className="px-3 py-3 border-t border-zinc-100">
            <div className="px-2 py-1.5 rounded-lg bg-zinc-50">
              <p className="text-[11px] font-semibold text-zinc-900 truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              <div className="mt-1.5">
                <span className={cn(
                  "inline-block text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider",
                  user.role === "admin" && "bg-emerald-100 text-emerald-700",
                  user.role === "approver" && "bg-blue-100 text-blue-700",
                  user.role === "operator" && "bg-amber-100 text-amber-700",
                  user.role === "viewer" && "bg-zinc-200 text-zinc-600",
                )}>{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
