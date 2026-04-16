"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Receipt } from "lucide-react";

import { api, type Payment } from "@/lib/api";
import { formatBRL, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatusPill } from "@/components/ui-custom/status-pill";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { cn } from "@/lib/utils";

const STATUSES = [
  { v: "ALL", label: "Todos" },
  { v: "RECEIVED", label: "Recebidos" },
  { v: "VALIDATED_LOCAL", label: "Validados" },
  { v: "UNDER_REVIEW", label: "Em revisão" },
  { v: "ON_HOLD", label: "Pausados" },
  { v: "APPROVED", label: "Aprovados" },
  { v: "SENT", label: "Enviados" },
  { v: "SETTLED", label: "Liquidados" },
  { v: "FAILED", label: "Falharam" },
  { v: "REJECTED", label: "Rejeitados" },
];

export default function PaymentsPage() {
  const [status, setStatus] = useState("ALL");
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setPayments(null);
    api.listPayments(status)
      .then((p) => setPayments(p || []))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [status]);

  const filtered = useMemo(() => {
    if (!payments) return [];
    if (!q.trim()) return payments;
    const t = q.toLowerCase();
    return payments.filter((p) =>
      p.external_id?.toLowerCase().includes(t) ||
      p.id.includes(t) ||
      p.payee?.name?.toLowerCase().includes(t) ||
      p.payee?.legal_name?.toLowerCase().includes(t) ||
      p.description?.toLowerCase().includes(t)
    );
  }, [payments, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos"
        description="Todos os pagamentos ingeridos pelo sistema."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por ID, beneficiário, descrição..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="shrink-0 text-[var(--muted-foreground)]" />
          {STATUSES.map((s) => (
            <button
              key={s.v}
              onClick={() => setStatus(s.v)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition",
                status === s.v
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--brand-accent)]/50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {err}
        </div>
      )}

      {!payments ? (
        <LoadingBlock label="Carregando pagamentos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={20} />}
          title="Nenhum pagamento"
          description={q ? "Tente ajustar a busca ou os filtros." : "Não há pagamentos com este status."}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">External ID</th>
                  <th className="px-4 py-2.5 font-medium">Tipo</th>
                  <th className="px-4 py-2.5 font-medium">Beneficiário</th>
                  <th className="px-4 py-2.5 font-medium">Valor</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-[var(--muted)]">
                    <td className="px-4 py-3">
                      <Link href={`/payments/${p.id}`} className="font-mono text-xs text-[var(--brand-accent)] hover:underline">
                        {p.external_id || p.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase text-[var(--muted-foreground)]">{p.type}</td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground)]">
                      {p.payee?.name || p.payee?.legal_name || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{formatBRL(p.amount_cents)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{formatRelative(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted-foreground)]">
            {filtered.length} {filtered.length === 1 ? "pagamento" : "pagamentos"}
          </div>
        </div>
      )}
    </div>
  );
}
