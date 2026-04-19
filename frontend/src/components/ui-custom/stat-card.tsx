import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  variant?: "default" | "primary" | "success" | "warn" | "danger";
  className?: string;
}

export function StatCard({ label, value, subtext, icon, trend, variant = "default", className }: StatCardProps) {
  const variantStyles = {
    default: "bg-[color-mix(in_srgb,var(--card)_60%,transparent)] border-[var(--border)] backdrop-blur-sm",
    primary: "bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_20%,transparent)] via-[color-mix(in_srgb,var(--card)_70%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_14%,transparent)] border-[color-mix(in_srgb,var(--brand-glow)_30%,transparent)]",
    success: "bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-emerald)_18%,transparent)] to-[color-mix(in_srgb,var(--card)_70%,transparent)] border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)]",
    warn: "bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-amber)_20%,transparent)] to-[color-mix(in_srgb,var(--card)_70%,transparent)] border-[color-mix(in_srgb,var(--brand-amber)_32%,transparent)]",
    danger: "bg-gradient-to-br from-red-500/20 to-[color-mix(in_srgb,var(--card)_70%,transparent)] border-red-500/30",
  };
  const isColored = variant !== "default";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:rounded-2xl sm:p-5",
        isColored && "shadow-[0_12px_32px_-16px_rgba(20,53,115,0.45)]",
        variantStyles[variant],
        className
      )}
    >
      {isColored && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand-cyan)]/15 blur-3xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-[var(--foreground)] sm:mt-2.5 sm:text-3xl">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">{subtext}</p>
          )}
          {trend !== undefined && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                trend.value >= 0
                  ? "bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)]"
                  : "bg-red-500/15 text-red-400"
              )}
            >
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}% {trend.label || "vs último mês"}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)] transition group-hover:scale-105">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
