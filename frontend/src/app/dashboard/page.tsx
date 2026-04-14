"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL, statusColor, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "@/components/new-payment-modal";
import { ArrowRight, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function refresh() {
    setLoading(true);
    api.getPayments().then(setPayments).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  const total = payments.length;
  const totalAmount = payments.reduce((s, p) => s + p.amount_cents, 0);
  const settled = payments.filter(p => p.status === "SETTLED");
  const settledAmount = settled.reduce((s, p) => s + p.amount_cents, 0);
  const pending = payments.filter(p => ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT"].includes(p.status));
  const failed = payments.filter(p => ["FAILED", "REJECTED"].includes(p.status));
  const review = payments.filter(p => ["UNDER_REVIEW", "ON_HOLD"].includes(p.status));
  const statusCounts = payments.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Visao geral dos pagamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-[#1a2744] hover:bg-[#0f1a2e] gap-1.5 text-xs h-9 rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Novo pagamento
          </Button>
        </div>
      </div>

      {loading ? <div className="text-sm text-zinc-400 py-10 text-center">Carregando...</div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total" value={total.toString()} subtext={formatBRL(totalAmount)} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Liquidados" value={settled.length.toString()} subtext={formatBRL(settledAmount)} color="text-emerald-600" />
            <StatCard icon={<Clock className="h-4 w-4 text-amber-500" />} label="Em processamento" value={pending.length.toString()} subtext="Aguardando banco" color="text-amber-600" />
            <StatCard icon={<AlertTriangle className="h-4 w-4 text-red-500" />} label="Requerem atencao" value={(failed.length + review.length).toString()} subtext={`${review.length} em revisao`} color="text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2 border-zinc-200">
              <CardHeader className="pb-2 px-4 pt-4 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-zinc-800">Ultimos pagamentos</CardTitle>
                <Link href="/dashboard/payments" className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors">Ver todos</Link>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="divide-y divide-zinc-100">
                  {payments.slice(0, 8).map(p => (
                    <Link key={p.id} href={`/dashboard/payments/${p.id}`} className="flex items-center justify-between py-2.5 hover:bg-zinc-50 -mx-2 px-2 rounded transition-colors group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-zinc-900 truncate">{p.external_id || p.id.slice(0, 8)}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-zinc-50">{p.type}</Badge>
                        </div>
                        {p.description && <p className="text-[11px] text-zinc-400 truncate mt-0.5">{p.description}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${statusColor(p.status)}`}>{p.status}</Badge>
                        <span className="text-[13px] font-mono font-semibold text-zinc-900">{formatBRL(p.amount_cents)}</span>
                        <ArrowRight className="h-3 w-3 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                  {payments.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-sm text-zinc-400 mb-3">Nenhum pagamento ainda</p>
                      <Button size="sm" onClick={() => setModalOpen(true)} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs gap-1.5">
                        <Plus className="h-3 w-3" /> Criar primeiro pagamento
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200">
              <CardHeader className="pb-2 px-4 pt-4"><CardTitle className="text-sm font-semibold text-zinc-800">Por status</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {Object.entries(statusCounts).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                    <Link key={status} href={`/dashboard/payments?status=${status}`} className="flex items-center justify-between hover:bg-zinc-50 -mx-2 px-2 py-1 rounded transition-colors">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(status)}`}>{status}</Badge>
                      <span className="text-[13px] font-mono text-zinc-600 font-semibold">{count}</span>
                    </Link>
                  ))}
                  {Object.keys(statusCounts).length === 0 && <p className="text-[11px] text-zinc-400">Sem dados</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <NewPaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refresh} />
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color = "text-zinc-900" }: { icon: React.ReactNode; label: string; value: string; subtext: string; color?: string }) {
  return (
    <Card className="border-zinc-200">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{subtext}</p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
