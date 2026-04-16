"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Send,
  Pause,
  XCircle,
  CalendarDays,
  Plus,
  AlertCircle,
  Link2,
} from "lucide-react";

import { api, type Run, type Payment } from "@/lib/api";
import { formatBRL, formatCompactBRL, statusLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatCard } from "@/components/ui-custom/stat-card";
import { StatusPill } from "@/components/ui-custom/status-pill";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { CreatePaymentModal } from "@/components/payments/create-payment-modal";
import { AttachPaymentsModal } from "@/components/payments/attach-payments-modal";
import { cn } from "@/lib/utils";

type ActionKind = "hold" | "reject" | "reschedule" | null;

export default function BatchPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Carregando lotes..." />}>
      <BatchContent />
    </Suspense>
  );
}

function BatchContent() {
  const sp = useSearchParams();
  const initialRun = sp.get("run");
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialRun);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const [action, setAction] = useState<{ kind: ActionKind; payment: Payment | null }>({ kind: null, payment: null });

  const loadRuns = useCallback(async () => {
    try {
      const r = await api.listRuns();
      setRuns(r || []);
      setSelectedId((prev) => {
        if (prev) return prev;
        return r && r.length > 0 ? r[0].id : null;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar lotes");
    }
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  useEffect(() => {
    if (!selectedId) { setPayments(null); return; }
    api.listRunPayments(selectedId)
      .then((p) => setPayments(p || []))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro ao carregar pagamentos"));
  }, [selectedId]);

  const selected = runs?.find((r) => r.id === selectedId) || null;
  const canApprove = api.roleCovers("approver");
  const canSubmit = api.roleCovers("approver");
  const canOperate = api.roleCovers("operator");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function reload() {
    await loadRuns();
    if (selectedId) {
      const p = await api.listRunPayments(selectedId);
      setPayments(p || []);
    }
  }

  async function handleApprove() {
    if (!selected) return;
    setBusy(true); setErr(null);
    try {
      await api.approveRun(selected.id);
      flash("Lote aprovado com sucesso");
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao aprovar");
    } finally { setBusy(false); }
  }

  async function handleSubmit() {
    if (!selected) return;
    if (!confirm("Submeter este lote ao banco? Esta ação é irreversível.")) return;
    setBusy(true); setErr(null);
    try {
      await api.submitRun(selected.id);
      flash("Lote submetido ao banco");
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao submeter");
    } finally { setBusy(false); }
  }

  async function handleCreateToday() {
    setBusy(true); setErr(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const run = await api.createRun(today);
      flash("Lote do dia criado");
      await loadRuns();
      setSelectedId(run.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao criar lote");
    } finally { setBusy(false); }
  }

  if (!runs) return <LoadingBlock label="Carregando lotes..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lote do Dia"
        description="Aprovação consolidada de pagamentos e envio ao banco."
        actions={canOperate && (
          <>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[#1e4ea8]/50 hover:bg-[var(--muted)]"
            >
              <Plus size={14} /> Novo pagamento
            </button>
            <button
              onClick={handleCreateToday}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(20,53,115,0.5)] transition hover:shadow-[0_8px_24px_-8px_rgba(20,53,115,0.7)] disabled:opacity-60"
            >
              <CalendarDays size={14} /> Novo lote (hoje)
            </button>
          </>
        )}
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}
      {err && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle size={14} className="mt-0.5" /> {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[260px_1fr]">
        {/* Lista de Runs */}
        <aside className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0">
          {runs.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={20} />}
              title="Nenhum lote"
              description="Crie o lote do dia para começar a consolidar pagamentos."
            />
          ) : runs.map((r) => {
            const sel = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  "min-w-[200px] shrink-0 rounded-xl border p-3 text-left transition lg:min-w-0 lg:w-full",
                  sel
                    ? "border-[var(--brand-accent)] bg-[var(--card)] shadow-sm"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--brand-accent)]/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                    <CalendarDays size={13} />
                    {new Date(r.run_date).toLocaleDateString("pt-BR")}
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10.5px] text-[var(--muted-foreground)]">
                  <div>{r.total_items} itens</div>
                  <div className="text-right font-semibold text-[var(--foreground)]">
                    {formatCompactBRL(r.total_amount_cents)}
                  </div>
                  <div>PIX: {r.pix_count}</div>
                  <div className="text-right">TED: {r.ted_count}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Detalhe */}
        <section className="space-y-4">
          {!selected ? (
            <EmptyState
              icon={<CalendarClock size={20} />}
              title="Selecione um lote"
              description="Escolha um lote na lista para ver detalhes."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
                <StatCard label="Status" value={statusLabel(selected.status)} icon={<CalendarClock size={16} />} />
                <StatCard label="Itens" value={String(selected.total_items)} subtext={`PIX ${selected.pix_count} · TED ${selected.ted_count}`} />
                <StatCard label="Volume" value={formatCompactBRL(selected.total_amount_cents)} variant="primary" />
                <StatCard
                  label="Aprovado por"
                  value={selected.approved_by ? "✓" : "—"}
                  subtext={selected.approved_at ? new Date(selected.approved_at).toLocaleString("pt-BR") : "Pendente"}
                  variant={selected.approved_by ? "success" : "default"}
                />
              </div>

              {/* Ações do lote */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                {canOperate && selected.status === "OPEN" && (
                  <button
                    onClick={() => setShowAttach(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[#1e4ea8]/50 hover:bg-[var(--muted)]"
                  >
                    <Link2 size={14} /> Anexar pagamentos
                  </button>
                )}
                {canApprove && selected.status === "OPEN" && (
                  <button
                    onClick={handleApprove}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(5,150,105,0.5)] transition hover:brightness-110 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} /> Aprovar lote
                  </button>
                )}
                {canSubmit && selected.status === "APPROVED" && (
                  <button
                    onClick={handleSubmit}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(20,53,115,0.6)] transition hover:brightness-110 disabled:opacity-60"
                  >
                    <Send size={14} /> Submeter ao banco
                  </button>
                )}
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {!canApprove && "Visualização — você não pode aprovar este lote."}
                </span>
              </div>

              {/* Tabela de pagamentos agrupada por fornecedor */}
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">Pagamentos do lote</h2>
                  {payments && payments.length > 0 && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {payments.length} pagamentos · <strong className="text-[var(--foreground)]">{formatBRL(payments.reduce((s, p) => s + p.amount_cents, 0))}</strong>
                    </span>
                  )}
                </div>
                {!payments ? (
                  <div className="p-6"><LoadingBlock label="Carregando..." /></div>
                ) : payments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Nenhum pagamento neste lote.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 text-left text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--card)]">
                        <tr>
                          <th className="px-4 py-2 font-medium">External ID</th>
                          <th className="px-4 py-2 font-medium">Tipo</th>
                          <th className="px-4 py-2 font-medium">Beneficiário</th>
                          <th className="px-4 py-2 font-medium text-right">Valor</th>
                          <th className="px-4 py-2 font-medium">Status</th>
                          {canOperate && <th className="px-4 py-2 font-medium text-right">Ações</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Agrupa por beneficiário
                          const groups = new Map<string, Payment[]>();
                          for (const p of payments) {
                            const key = p.payee?.name || p.payee?.legal_name || p.payee?.key_value || "Sem beneficiário";
                            if (!groups.has(key)) groups.set(key, []);
                            groups.get(key)!.push(p);
                          }
                          const rows: React.ReactNode[] = [];
                          let idx = 0;
                          for (const [beneficiary, items] of groups) {
                            const subtotal = items.reduce((s, p) => s + p.amount_cents, 0);
                            // Header do grupo (se mais de 1 fornecedor)
                            if (groups.size > 1 && items.length > 1) {
                              rows.push(
                                <tr key={`gh-${idx}`} className="bg-[var(--muted)]/50">
                                  <td colSpan={canOperate ? 6 : 5} className="px-4 py-1.5">
                                    <span className="text-[11px] font-semibold text-[var(--foreground)]">{beneficiary}</span>
                                    <span className="ml-2 text-[11px] text-[var(--muted-foreground)]">{items.length} pagamentos</span>
                                  </td>
                                </tr>
                              );
                            }
                            for (const p of items) {
                              rows.push(
                                <tr key={p.id} className="border-t border-[var(--border)] transition hover:bg-[var(--muted)]">
                                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--brand-accent)]">{p.external_id || p.id.slice(0, 8)}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", p.type === "PIX" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>
                                      {p.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-[var(--foreground)]">{p.payee?.name || p.payee?.legal_name || "—"}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[var(--foreground)]">{formatBRL(p.amount_cents)}</td>
                                  <td className="px-4 py-2.5"><StatusPill status={p.status} /></td>
                                  {canOperate && (
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center justify-end gap-1">
                                        {["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "UNDER_REVIEW"].includes(p.status) && (
                                          <button onClick={() => setAction({ kind: "hold", payment: p })} className="rounded-md p-1.5 text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-950/40" title="Pausar"><Pause size={13} /></button>
                                        )}
                                        {["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "UNDER_REVIEW", "ON_HOLD"].includes(p.status) && (
                                          <>
                                            <button onClick={() => setAction({ kind: "reschedule", payment: p })} className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/40" title="Reagendar"><CalendarDays size={13} /></button>
                                            <button onClick={() => setAction({ kind: "reject", payment: p })} className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40" title="Rejeitar"><XCircle size={13} /></button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            }
                            // Subtotal do grupo (se mais de 1 item por fornecedor)
                            if (items.length > 1) {
                              rows.push(
                                <tr key={`sub-${idx}`} className="border-t border-[var(--border)] bg-[var(--muted)]/30">
                                  <td colSpan={3} className="px-4 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                                    Subtotal · {beneficiary}
                                  </td>
                                  <td className="px-4 py-1.5 text-right text-xs font-bold tabular-nums text-[var(--foreground)]">
                                    {formatBRL(subtotal)}
                                  </td>
                                  <td colSpan={canOperate ? 2 : 1} />
                                </tr>
                              );
                            }
                            idx++;
                          }
                          return rows;
                        })()}
                      </tbody>
                      {/* Total geral */}
                      <tfoot className="border-t-2 border-[var(--border)] bg-gradient-to-r from-[#143573]/5 to-[#1e4ea8]/5">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                            Total geral
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-[var(--foreground)]">
                            {formatBRL(payments.reduce((s, p) => s + p.amount_cents, 0))}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-[var(--muted-foreground)]">
                            {payments.length} pgtos
                          </td>
                          {canOperate && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {action.kind && action.payment && (
        <ActionModal
          kind={action.kind}
          payment={action.payment}
          onClose={() => setAction({ kind: null, payment: null })}
          onDone={async (msg) => {
            flash(msg);
            setAction({ kind: null, payment: null });
            await reload();
          }}
        />
      )}

      {showCreate && (
        <CreatePaymentModal
          onClose={() => setShowCreate(false)}
          onCreated={async (n) => {
            flash(`${n} pagamento${n !== 1 ? "s" : ""} criado${n !== 1 ? "s" : ""}`);
            setShowCreate(false);
            await reload();
          }}
        />
      )}

      {showAttach && selected && (
        <AttachPaymentsModal
          runId={selected.id}
          onClose={() => setShowAttach(false)}
          onDone={async (n) => {
            flash(`${n} pagamento${n !== 1 ? "s" : ""} anexado${n !== 1 ? "s" : ""} ao lote`);
            setShowAttach(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function ActionModal({
  kind, payment, onClose, onDone,
}: {
  kind: "hold" | "reject" | "reschedule";
  payment: Payment;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cfg = {
    hold: { title: "Pausar pagamento", btn: "Pausar", color: "bg-amber-600" },
    reject: { title: "Rejeitar pagamento", btn: "Rejeitar", color: "bg-red-600" },
    reschedule: { title: "Reagendar pagamento", btn: "Reagendar", color: "bg-blue-600" },
  }[kind];

  async function submit() {
    setBusy(true); setErr(null);
    try {
      if (kind === "hold") await api.holdPayment(payment.id, reason);
      else if (kind === "reject") {
        if (!reason.trim()) { setErr("Motivo é obrigatório"); setBusy(false); return; }
        await api.rejectPayment(payment.id, reason);
      } else {
        if (!reason.trim()) { setErr("Motivo é obrigatório"); setBusy(false); return; }
        await api.reschedulePayment(payment.id, date, reason);
      }
      onDone(cfg.title.replace(" pagamento", "") + " realizado");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-[var(--foreground)]">{cfg.title}</h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {payment.external_id || payment.id.slice(0, 8)} · {formatBRL(payment.amount_cents)}
        </p>

        <div className="mt-4 space-y-3">
          {kind === "reschedule" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">Nova data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Motivo {kind !== "hold" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]"
              placeholder="Descreva o motivo..."
            />
          </div>
        </div>

        {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">
            Cancelar
          </button>
          <button onClick={submit} disabled={busy} className={cn("rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-60", cfg.color)}>
            {busy ? "..." : cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}
