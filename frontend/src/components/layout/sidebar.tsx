"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Receipt,
  Users as UsersIcon,
  UserSquare2,
  Settings,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { api, type Role } from "@/lib/api";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  minRole: Role;
  group: "main" | "manage" | "settings";
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard, minRole: "viewer", group: "main" },
  { href: "/batch", label: "Aprovar lote", icon: CalendarClock, minRole: "viewer", group: "main" },
  { href: "/payments", label: "Pagamentos", icon: Receipt, minRole: "viewer", group: "main" },
  { href: "/beneficiaries", label: "Fornecedores", icon: UserSquare2, minRole: "operator", group: "manage" },
  { href: "/users", label: "Equipe", icon: UsersIcon, minRole: "admin", group: "manage" },
  { href: "/settings", label: "Configurações", icon: Settings, minRole: "admin", group: "settings" },
];

const GROUP_LABEL: Record<NavItem["group"], string> = {
  main: "Operação",
  manage: "Cadastros",
  settings: "Conta",
};

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => api.roleCovers(n.minRole));
  const groups: NavItem["group"][] = ["main", "manage", "settings"];

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_85%,transparent)] backdrop-blur-xl transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <Logo size="md" />
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] md:hidden"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((g) => {
            const groupItems = items.filter((i) => i.group === g);
            if (groupItems.length === 0) return null;
            return (
              <div key={g} className="mb-5 last:mb-0">
                <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]/70">
                  {GROUP_LABEL[g]}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                          active
                            ? "border border-[color-mix(in_srgb,var(--brand-glow)_28%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-glow)_16%,transparent)] to-transparent text-[var(--foreground)]"
                            : "border border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--muted)_60%,transparent)] hover:text-[var(--foreground)]"
                        )}
                      >
                        <Icon
                          size={16}
                          className={cn(
                            "transition",
                            active ? "text-[var(--brand-cyan)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-cyan)] shadow-[0_0_6px_var(--brand-cyan)]" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_12%,transparent)] via-transparent to-[color-mix(in_srgb,var(--brand-cyan)_8%,transparent)] p-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--brand-cyan)]" />
            <p className="text-[11px] font-semibold text-[var(--foreground)]">Plano Business</p>
          </div>
          <p className="mt-1 font-mono text-[10.5px] text-[var(--muted-foreground)]">
            1.000 pagamentos/mês · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </p>
        </div>
      </aside>
    </>
  );
}
