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
    default: "bg-[var(--card)] border-[var(--border)]",
    primary: "bg-gradient-to-br from-[#143573] via-[#1e4ea8] to-[#0a1d44] text-white border-transparent",
    success: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-transparent",
    warn: "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent",
    danger: "bg-gradient-to-br from-rose-500 to-red-700 text-white border-transparent",
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
        <>
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10.5px] font-bold uppercase tracking-[0.14em]", isColored ? "text-white/75" : "text-[var(--muted-foreground)]")}>
            {label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tabular-nums tracking-tight sm:mt-2.5 sm:text-3xl", isColored ? "text-white" : "text-[var(--foreground)]")}>
            {value}
          </p>
          {subtext && (
            <p className={cn("mt-1 text-xs", isColored ? "text-white/70" : "text-[var(--muted-foreground)]")}>{subtext}</p>
          )}
          {trend !== undefined && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                trend.value >= 0
                  ? isColored ? "bg-white/15 text-emerald-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : isColored ? "bg-white/15 text-rose-100" : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              )}
            >
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}% {trend.label || "vs último mês"}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition group-hover:scale-105",
              isColored
                ? "border-white/15 bg-white/10 text-white"
                : "border-[var(--border)] bg-[var(--muted)] text-[var(--brand-primary)]"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
