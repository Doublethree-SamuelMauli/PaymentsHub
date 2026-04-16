"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt, CalendarClock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type Payment, type Run } from "@/lib/api";
import { formatBRL, formatCompactBRL, formatRelative, statusLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusPill } from "@/components/ui-custom/status-pill";
import { LoadingBlock } from "@/components/ui-custom/loading";

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listPayments(), api.listRuns()])
      .then(([p, r]) => {
        setPayments(p || []);
        setRuns(r || []);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro ao carregar"));
  }, []);

  const stats = useMemo(() => {
    if (!payments) return null;
    const total = payments.length;
    const settled = payments.filter((p) => p.status === "SETTLED").length;
    const pending = payments.filter((p) =>
      ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "UNDER_REVIEW", "ON_HOLD"].includes(p.status)
    ).length;
    const failed = payments.filter((p) => ["FAILED", "REJECTED"].includes(p.status)).length;
    const volume = payments.filter((p) => p.status === "SETTLED").reduce((s, p) => s + p.amount_cents, 0);
    return { total, settled, pending, failed, volume };
  }, [payments]);

  const chartData = useMemo(() => {
    if (!payments) return [];
    const buckets = new Map<string, { date: string; count: number; amount: number }>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, count: 0, amount: 0 });
    }
    for (const p of payments) {
      const key = (p.created_at || "").slice(0, 10);
      const b = buckets.get(key);
      if (b) {
        b.count++;
        b.amount += p.amount_cents;
      }
    }
    return Array.from(buckets.values()).map((b) => ({
      ...b,
      label: b.date.slice(5).split("-").reverse().join("/"),
      amountBRL: b.amount / 100,
    }));
  }, [payments]);

  const recentPayments = useMemo(() => (payments || []).slice(0, 6), [payments]);
  const openRuns = useMemo(
    () => (runs || []).filter((r) => !["CLOSED", "PARTIALLY_SETTLED"].includes(r.status)).slice(0, 4),
    [runs]
  );

  if (err) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
        {err}
      </div>
    );
  }

  if (!payments || !runs || !stats) return <LoadingBlock label="Carregando dashboard..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral dos pagamentos processados pela sua organização."
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <StatCard
          variant="primary"
          label="Volume liquidado"
          value={formatCompactBRL(stats.volume)}
          subtext={`${stats.settled} pagamentos`}
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Total no período"
          value={String(stats.total)}
          subtext="últimos pagamentos"
          icon={<Receipt size={18} />}
        />
        <StatCard
          variant="warn"
          label="Aguardando"
          value={String(stats.pending)}
          subtext="precisam de ação"
          icon={<CalendarClock size={18} />}
        />
        <StatCard
          variant="danger"
          label="Falhas / rejeitados"
          value={String(stats.failed)}
          subtext="últimos 200"
          icon={<AlertTriangle size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Volume diário</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Últimos 14 dias</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22863a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22863a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Volume"]}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="amountBRL" stroke="#22863a" strokeWidth={2} fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Lotes em aberto</h2>
            <Link href="/batch" className="text-xs text-[var(--brand-accent)] hover:underline">
              Ver todos
            </Link>
          </div>
          {openRuns.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">
              Nenhum lote em aberto.
            </p>
          ) : (
            <ul className="space-y-2">
              {openRuns.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/batch?run=${r.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 transition hover:border-[var(--brand-accent)]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">
                        {new Date(r.run_date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-[10.5px] text-[var(--muted-foreground)]">
                        {r.total_items} itens · {formatCompactBRL(r.total_amount_cents)}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Pagamentos recentes</h2>
          <Link href="/payments" className="inline-flex items-center gap-1 text-xs text-[var(--brand-accent)] hover:underline">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-5 py-2 font-medium">External ID</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Valor</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentPayments.map((p) => (
                <tr key={p.id} className="transition hover:bg-[var(--muted)]">
                  <td className="px-5 py-3">
                    <Link href={`/payments/${p.id}`} className="font-mono text-xs text-[var(--brand-accent)] hover:underline">
                      {p.external_id || p.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{p.type}</td>
                  <td className="px-5 py-3 font-semibold text-[var(--foreground)]">{formatBRL(p.amount_cents)}</td>
                  <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-3 text-xs text-[var(--muted-foreground)]">{formatRelative(p.created_at)}</td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-[var(--muted-foreground)]">
                    Nenhum pagamento ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
