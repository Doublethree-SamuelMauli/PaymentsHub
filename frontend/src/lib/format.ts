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
    success: "bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)] border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)]",
    progress: "bg-[color-mix(in_srgb,var(--brand-cyan)_15%,transparent)] text-[var(--brand-cyan)] border-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]",
    warn: "bg-[color-mix(in_srgb,var(--brand-amber)_15%,transparent)] text-[var(--brand-amber)] border-[color-mix(in_srgb,var(--brand-amber)_30%,transparent)]",
    danger: "bg-red-500/15 text-red-300 border-red-500/30",
    info: "bg-[color-mix(in_srgb,var(--brand-glow)_15%,transparent)] text-[var(--brand-glow)] border-[color-mix(in_srgb,var(--brand-glow)_30%,transparent)]",
    neutral: "bg-[color-mix(in_srgb,var(--muted)_80%,transparent)] text-[var(--muted-foreground)] border-[var(--border)]",
  };
  return map[tone];
}
