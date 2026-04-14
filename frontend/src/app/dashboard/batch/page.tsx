"use client";

import { useEffect, useState } from "react";
import { api, type Run, type PaymentListItem } from "@/lib/api";
import { formatBRL, statusColor } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "@/components/new-payment-modal";
import { CheckCircle2, XCircle, Calendar, Plus, RefreshCw, Send, AlertTriangle, Loader2 } from "lucide-react";

interface RunPayment {
  id: string;
  external_id: string;
  type: string;
  status: string;
  amount_cents: number;
  description: string;
  created_at: string;
}

export default function DailyBatchPage() {
  const [todayRun, setTodayRun] = useState<Run | null>(null);
  const [runPayments, setRunPayments] = useState<RunPayment[]>([]);
  const [prevalidated, setPrevalidated] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState<{ pid: string; kind: "reject" | "reschedule" } | null>(null);
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const runs = await api.getRuns();
      const today = new Date().toISOString().split("T")[0];
      let current = runs.find(r => r.run_date === today && r.status !== "CLOSED");
      if (!current) {
        const open = runs.find(r => r.status === "OPEN");
        if (open) current = open;
      }

      if (current) {
        setTodayRun(current);
        const pays = await api.get<RunPayment[]>(`/v1/runs/${current.id}/payments`);
        setRunPayments(pays);
      } else {
        setTodayRun(null);
        setRunPayments([]);
      }

      const prev = await api.getPayments("PREVALIDATED").catch(() => []);
      setPrevalidated(prev);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createTodayRun() {
    const today = new Date().toISOString().split("T")[0];
    await api.createRun(today);
    refresh();
  }

  async function attachAllPrevalidated() {
    if (!todayRun || prevalidated.length === 0) return;
    await api.attachPayments(todayRun.id, prevalidated.map(p => p.id));
    refresh();
  }

  async function approveRun() {
    if (!todayRun) return;
    if (!confirm(`Aprovar ${runPayments.length} pagamentos (${formatBRL(runPayments.reduce((s,p)=>s+p.amount_cents,0))})?`)) return;
    await api.approveRun(todayRun.id);
    refresh();
  }

  async function submitBatch() {
    if (!todayRun) return;
    if (!confirm("Consolidar e enviar todo o lote ao banco? Esta acao nao pode ser desfeita.")) return;
    await api.post(`/v1/runs/${todayRun.id}/submit-to-bank`);
    refresh();
  }

  async function handleAction() {
    if (!action) return;
    setSubmitting(true);
    try {
      if (action.kind === "reject") {
        if (!reason.trim()) { alert("Informe o motivo"); setSubmitting(false); return; }
        await api.rejectPayment(action.pid, reason);
      } else {
        if (!newDate) { alert("Informe a nova data"); setSubmitting(false); return; }
        await api.post(`/v1/payments/${action.pid}/reschedule`, { new_date: newDate, reason });
      }
      setAction(null);
      setReason("");
      setNewDate("");
      refresh();
    } catch (e) {
      alert("Erro: " + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const runTotal = runPayments.reduce((s, p) => s + p.amount_cents, 0);
  const runPixCount = runPayments.filter(p => p.type === "PIX").length;
  const runTedCount = runPayments.filter(p => p.type === "TED").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Lote do Dia</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie e aprove os pagamentos antes de enviar ao banco</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-[#1a2744] hover:bg-[#0f1a2e] gap-1.5 text-xs h-9 rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Novo pagamento
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-zinc-400">Carregando...</div>
      ) : !todayRun ? (
        <Card className="border-zinc-200">
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-zinc-900">Nenhum lote aberto para hoje</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-6">Crie o lote do dia para agrupar pagamentos</p>
            <Button onClick={createTodayRun} className="bg-[#22863a] hover:bg-[#1a6d2e] rounded-lg gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Criar lote de hoje
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Lote</p>
                    <p className="text-base font-bold text-zinc-900 font-mono mt-0.5">{todayRun.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Data</p>
                    <p className="text-base font-bold text-zinc-900 mt-0.5">{todayRun.run_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Status</p>
                    <Badge variant="outline" className={`mt-0.5 ${statusColor(todayRun.status)}`}>{todayRun.status}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Itens</p>
                    <p className="text-base font-bold text-zinc-900 mt-0.5">
                      {runPayments.length}
                      <span className="text-xs font-normal text-zinc-400 ml-2">({runPixCount} PIX / {runTedCount} TED)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Total</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5 font-mono">{formatBRL(runTotal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {todayRun.status === "OPEN" && runPayments.length > 0 && (
                    <Button onClick={approveRun} className="bg-[#22863a] hover:bg-[#1a6d2e] rounded-lg gap-1.5 h-9 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar lote
                    </Button>
                  )}
                  {todayRun.status === "APPROVED" && (
                    <Button onClick={submitBatch} className="bg-[#1a2744] hover:bg-[#0f1a2e] rounded-lg gap-1.5 h-9 text-xs">
                      <Send className="h-3.5 w-3.5" /> Enviar ao banco
                    </Button>
                  )}
                  {todayRun.status === "EXECUTING" && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-3 py-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Enviado ao banco
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {prevalidated.length > 0 && todayRun.status === "OPEN" && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">{prevalidated.length} pagamentos pre-validados aguardando</p>
                      <p className="text-xs text-amber-700 mt-0.5">Anexe ao lote de hoje para processar</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={attachAllPrevalidated} className="bg-amber-600 hover:bg-amber-700 text-xs h-8 rounded-lg gap-1.5">
                    <Plus className="h-3 w-3" /> Anexar todos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-zinc-200">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">Pagamentos neste lote</p>
              </div>
              {runPayments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400 mb-3">Nenhum pagamento no lote ainda</p>
                  {prevalidated.length > 0 ? (
                    <Button size="sm" onClick={attachAllPrevalidated} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs gap-1.5">
                      <Plus className="h-3 w-3" /> Anexar {prevalidated.length} pre-validados
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setModalOpen(true)} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs gap-1.5">
                      <Plus className="h-3 w-3" /> Criar pagamento
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {runPayments.map(p => (
                    <div key={p.id} className="px-4 py-3 hover:bg-zinc-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-1 h-10 rounded-full ${p.type === "PIX" ? "bg-emerald-400" : "bg-blue-400"}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium text-zinc-900">{p.external_id || p.id.slice(0, 8)}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-zinc-50">{p.type}</Badge>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${statusColor(p.status)}`}>{p.status}</Badge>
                            </div>
                            {p.description && <p className="text-[11px] text-zinc-500 truncate mt-0.5">{p.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-mono font-semibold text-zinc-900">{formatBRL(p.amount_cents)}</span>
                          {todayRun.status === "OPEN" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setAction({ pid: p.id, kind: "reschedule" }); setReason(""); setNewDate(""); }} className="h-7 text-[11px] gap-1 rounded-md border-zinc-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                <Calendar className="h-3 w-3" /> Reagendar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setAction({ pid: p.id, kind: "reject" }); setReason(""); }} className="h-7 text-[11px] gap-1 rounded-md border-zinc-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700">
                                <XCircle className="h-3 w-3" /> Rejeitar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={() => !submitting && setAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-zinc-900">
              {action.kind === "reject" ? "Rejeitar pagamento" : "Reagendar pagamento"}
            </h3>
            <p className="text-sm text-zinc-500 mt-1 mb-5">
              {action.kind === "reject" ? "Informe o motivo da rejeicao" : "Escolha a nova data para este pagamento"}
            </p>
            {action.kind === "reschedule" && (
              <div className="mb-4">
                <label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">Nova data</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
            )}
            <div className="mb-5">
              <label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">
                Motivo {action.kind === "reject" ? "*" : "(opcional)"}
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={action.kind === "reject" ? "Ex: dados bancarios incorretos" : "Ex: aguardando confirmacao"} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAction(null)} disabled={submitting} className="rounded-lg">Cancelar</Button>
              <Button onClick={handleAction} disabled={submitting} className={`rounded-lg ${action.kind === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aplicando...</> : action.kind === "reject" ? "Rejeitar" : "Reagendar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <NewPaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refresh} />
    </div>
  );
}
