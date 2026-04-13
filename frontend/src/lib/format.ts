export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    VALIDATED_LOCAL: "bg-blue-100 text-blue-800",
    PREVALIDATED: "bg-indigo-100 text-indigo-800",
    APPROVED: "bg-green-100 text-green-800",
    SUBMITTING: "bg-yellow-100 text-yellow-800",
    SENT: "bg-amber-100 text-amber-800",
    SETTLED: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELED: "bg-zinc-100 text-zinc-800",
    EXPIRED: "bg-zinc-100 text-zinc-600",
    ON_HOLD: "bg-orange-100 text-orange-800",
    UNDER_REVIEW: "bg-purple-100 text-purple-800",
    OPEN: "bg-blue-100 text-blue-800",
    EXECUTING: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-zinc-100 text-zinc-800",
  };
  return map[status] || "bg-zinc-100 text-zinc-800";
}
