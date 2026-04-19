"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Zap,
  Activity,
  TrendingUp,
} from "lucide-react";
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
import { formatBRL, formatCompactBRL, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatusPill } from "@/components/ui-custom/status-pill";
import { LoadingBlock } from "@/components/ui-custom/loading";

const BANK_BY_CODE: Record<string, string> = {
  "341": "Itaú",
  "237": "Bradesco",
  "033": "Santander",
  "001": "BB",
  "104": "Caixa",
  "077": "Inter",
  "756": "Sicoob",
  "208": "BTG",
};

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
    const settled = payments.filter((p) => p.status === "SETTLED").length;
    const pending = payments.filter((p) =>
      ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "UNDER_REVIEW", "ON_HOLD", "APPROVED"].includes(p.status)
    ).length;
    const failed = payments.filter((p) => ["FAILED", "REJECTED"].includes(p.status)).length;
    const volumeSettled = payments.filter((p) => p.status === "SETTLED").reduce((s, p) => s + p.amount_cents, 0);
    const volumeTotal = payments.reduce((s, p) => s + p.amount_cents, 0);
    return { total: payments.length, settled, pending, failed, volumeSettled, volumeTotal };
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

  const byBank = useMemo(() => {
    if (!payments) return [];
    const acc: Record<string, { code: string; name: string; volume: number; count: number }> = {};
    for (const p of payments) {
      const bankCode = (p.payee?.bank_code as string) || "341";
      const k = bankCode;
      if (!acc[k]) acc[k] = { code: k, name: BANK_BY_CODE[k] || k, volume: 0, count: 0 };
      acc[k].volume += p.amount_cents;
      acc[k].count++;
    }
    return Object.values(acc).sort((a, b) => b.volume - a.volume).slice(0, 5);
  }, [payments]);

  const recentPayments = useMemo(() => (payments || []).slice(0, 6), [payments]);
  const openRuns = useMemo(
    () => (runs || []).filter((r) => !["CLOSED", "PARTIALLY_SETTLED"].includes(r.status)).slice(0, 3),
    [runs]
  );

  if (err) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{err}</div>
    );
  }
  if (!payments || !runs || !stats) return <LoadingBlock label="Carregando dashboard..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        description="Resumo dos seus pagamentos, lotes e bancos."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KPI
          highlight
          label="Volume liquidado"
          value={formatCompactBRL(stats.volumeSettled)}
          icon={<CheckCircle2 size={18} />}
          delta={`+${stats.settled} pgs`}
          sub="últimos 14 dias"
        />
        <KPI
          label="Em andamento"
          value={String(stats.pending)}
          icon={<Receipt size={18} />}
          delta={`${openRuns.length} lotes abertos`}
          sub="precisam de aprovação"
        />
        <KPI
          label="Volume total"
          value={formatCompactBRL(stats.volumeTotal)}
          icon={<TrendingUp size={18} />}
          delta={`${stats.total} pagamentos`}
          sub="período"
        />
        <KPI
          label="Com problema"
          value={String(stats.failed)}
          icon={<AlertTriangle size={18} />}
          delta="rejeitados / falha"
          tone="danger"
          sub="revisar"
        />
      </div>

      {/* Chart + Open runs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-topline overflow-hidden rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-6 backdrop-blur-md lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[17px] font-semibold">Volume diário</h2>
              <p className="font-mono text-[11px] text-[var(--muted-foreground)]">últimas 2 semanas</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--brand-cyan)]">
              <Activity size={12} /> live
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity={0} />
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
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Volume"]}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="amountBRL" stroke="var(--brand-cyan)" strokeWidth={2.2} fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-topline rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-semibold">Lotes para aprovar</h2>
            <Link href="/batch" className="font-mono text-[11px] text-[var(--brand-cyan)] hover:underline">
              ver todos
            </Link>
          </div>
          {openRuns.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-6 text-center font-mono text-[11px] text-[var(--muted-foreground)]">
              Nenhum lote em aberto.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {openRuns.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/batch?run=${r.id}`}
                    className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_40%,transparent)] px-4 py-3 transition hover:border-[var(--brand-cyan)]"
                  >
                    <div>
                      <p className="font-display text-[13.5px] font-semibold">
                        {new Date(r.run_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                        {r.total_items} itens · {formatCompactBRL(r.total_amount_cents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={r.status} />
                      <ArrowRight size={13} className="text-[var(--brand-cyan)] transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* By bank + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-topline rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-6 backdrop-blur-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[16px] font-semibold">Top bancos</h2>
              <p className="font-mono text-[11px] text-[var(--muted-foreground)]">volume processado</p>
            </div>
            <Building2 size={16} className="text-[var(--brand-cyan)]" />
          </div>
          <ul className="space-y-3">
            {byBank.map((b) => {
              const pct = stats.volumeTotal ? (b.volume / stats.volumeTotal) * 100 : 0;
              return (
                <li key={b.code}>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[11.5px]">
                    <span className="text-[var(--foreground)]">
                      <span className="mr-2 text-[var(--brand-cyan)]">{b.code}</span>
                      {b.name}
                    </span>
                    <span className="text-[var(--muted-foreground)]">{formatCompactBRL(b.volume)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--muted)_40%,transparent)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--brand-glow)] to-[var(--brand-cyan)]"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card-topline overflow-hidden rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] backdrop-blur-md lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h2 className="font-display text-[16px] font-semibold">Últimos pagamentos</h2>
            <Link href="/payments" className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--brand-cyan)] hover:underline">
              ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[color-mix(in_srgb,var(--background)_30%,transparent)]">
                  <th className="px-6 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Referência</th>
                  <th className="px-2 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Tipo</th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Valor</th>
                  <th className="px-2 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Status</th>
                  <th className="px-6 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Criado</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-[color-mix(in_srgb,var(--brand-glow)_5%,transparent)] ${
                      i > 0 ? "border-t border-[var(--border)]" : ""
                    }`}
                  >
                    <td className="px-6 py-3">
                      <Link href={`/payments/${p.id}`} className="font-mono text-[12px] text-[var(--brand-cyan)] hover:underline">
                        {p.external_id || p.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-2 py-3 font-mono text-[11px] uppercase text-[var(--muted-foreground)]">
                      <span className={`rounded-md border px-1.5 py-0.5 ${
                        p.type === "PIX"
                          ? "border-[color-mix(in_srgb,var(--brand-cyan)_25%,transparent)] text-[var(--brand-cyan)]"
                          : "border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] text-[var(--brand-glow)]"
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold tabular-nums">{formatBRL(p.amount_cents)}</td>
                    <td className="px-2 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-6 py-3 font-mono text-[11px] text-[var(--muted-foreground)]">{formatRelative(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <QuickAction
          href="/payments?action=new"
          icon={<Receipt size={18} />}
          title="Criar pagamento"
          desc="PIX ou TED individual, via API key ou manual."
        />
        <QuickAction
          href="/batch"
          icon={<CalendarClock size={18} />}
          title="Aprovar lote do dia"
          desc="Agrega PIX + TED, assina com 2FA."
        />
        <QuickAction
          href="/settings"
          icon={<Zap size={18} />}
          title="Conectar banco"
          desc="mTLS + OAuth2, validação ao vivo."
        />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  icon,
  delta,
  sub,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: string;
  sub?: string;
  highlight?: boolean;
  tone?: "danger";
}) {
  return (
    <div
      className={`card-topline group relative overflow-hidden rounded-[18px] border p-5 backdrop-blur-md ${
        highlight
          ? "border-[color-mix(in_srgb,var(--brand-glow)_30%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_15%,transparent)] via-[color-mix(in_srgb,var(--card)_60%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_10%,transparent)]"
          : tone === "danger"
          ? "border-red-500/25 bg-gradient-to-br from-red-500/8 to-[color-mix(in_srgb,var(--card)_60%,transparent)]"
          : "border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)]"
      }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand-cyan)]/15 blur-3xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</p>
          <p className="mt-2 font-display text-[28px] font-semibold tabular-nums tracking-[-0.02em]">{value}</p>
          {delta && (
            <p className={`mt-1 font-mono text-[11px] ${tone === "danger" ? "text-red-400" : "text-[var(--brand-emerald)]"}`}>
              {delta}
            </p>
          )}
          {sub && <p className="mt-0.5 font-mono text-[10.5px] text-[var(--muted-foreground)]">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_50%,transparent)] p-5 backdrop-blur transition hover:-translate-y-[2px] hover:border-[var(--brand-cyan)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-display text-[14.5px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">{desc}</p>
      </div>
      <ArrowRight size={15} className="text-[var(--brand-cyan)] transition group-hover:translate-x-1" />
    </Link>
  );
}
