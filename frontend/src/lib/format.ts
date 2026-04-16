export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function formatCompactBRL(cents: number): string {
  const value = cents / 100;
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(1)}k`;
  return formatBRL(cents);
}

export function formatDate(iso: string, compact = false): string {
  if (!iso || iso === "0001-01-01T00:00:00Z") return "-";
  const d = new Date(iso);
  if (compact) return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(iso: string): string {
  if (!iso || iso === "0001-01-01T00:00:00Z") return "-";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString("pt-BR");
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Recebido",
  VALIDATED_LOCAL: "Validado",
  PREVALIDATED: "Pre-validado",
  UNDER_REVIEW: "Em revisao",
  APPROVED: "Aprovado",
  ON_HOLD: "Pausado",
  SUBMITTING: "Enviando",
  SENT: "Enviado",
  SETTLED: "Liquidado",
  FAILED: "Falhou",
  REJECTED: "Rejeitado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
  OPEN: "Aberto",
  EXECUTING: "Executando",
  PARTIALLY_SETTLED: "Parcial",
  CLOSED: "Fechado",
};

export function statusLabel(s: string): string { return STATUS_LABELS[s] || s; }

export function statusTone(s: string): "success" | "warn" | "info" | "danger" | "neutral" | "progress" {
  if (["SETTLED", "CLOSED"].includes(s)) return "success";
  if (["SENT", "SUBMITTING", "EXECUTING", "APPROVED"].includes(s)) return "progress";
  if (["UNDER_REVIEW", "ON_HOLD"].includes(s)) return "warn";
  if (["FAILED", "REJECTED", "EXPIRED"].includes(s)) return "danger";
  if (["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "OPEN"].includes(s)) return "info";
  return "neutral";
}

export function toneClasses(tone: ReturnType<typeof statusTone>): string {
  const map = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
    progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    warn: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
    danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
    info: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900",
    neutral: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  };
  return map[tone];
}
