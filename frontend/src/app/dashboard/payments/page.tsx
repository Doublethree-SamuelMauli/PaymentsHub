"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL, formatDate, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NewPaymentModal } from "@/components/new-payment-modal";
import { ArrowRight, RefreshCw, Plus } from "lucide-react";

const STATUSES = ["ALL", "RECEIVED", "PREVALIDATED", "UNDER_REVIEW", "APPROVED", "ON_HOLD", "SUBMITTING", "SENT", "SETTLED", "FAILED", "REJECTED", "CANCELED"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function refresh() {
    setLoading(true);
    api.getPayments(filter === "ALL" ? undefined : filter).then(setPayments).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Pagamentos</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie todos os pagamentos da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-[#1a2744] hover:bg-[#0f1a2e] gap-1.5 text-xs h-9 rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Novo pagamento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${filter === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
            {s}
          </button>
        ))}
      </div>

      <Card className="border-zinc-200">
        <CardHeader className="pb-0 pt-3 px-4">
          <CardTitle className="text-xs text-zinc-400 font-semibold">
            {loading ? "Carregando..." : `${payments.length} pagamentos`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase tracking-wider">
                <TableHead className="pl-4">Ref</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="pr-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id} className="text-[13px] hover:bg-zinc-50/50">
                  <TableCell className="pl-4 font-mono text-xs text-zinc-900 font-medium">{p.external_id || p.id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-zinc-50">{p.type}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(p.status)}`}>{p.status}</Badge></TableCell>
                  <TableCell className="font-mono font-semibold text-zinc-900">{formatBRL(p.amount_cents)}</TableCell>
                  <TableCell className="text-zinc-500 max-w-[220px] truncate">{p.description}</TableCell>
                  <TableCell className="text-zinc-400 text-xs">{formatDate(p.created_at)}</TableCell>
                  <TableCell className="pr-4">
                    <Link href={`/dashboard/payments/${p.id}`}>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-900 transition-colors" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && payments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-400 mb-3">Nenhum pagamento encontrado</p>
              <Button size="sm" onClick={() => setModalOpen(true)} className="bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs gap-1.5">
                <Plus className="h-3 w-3" /> Criar pagamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <NewPaymentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refresh} />
    </div>
  );
}
