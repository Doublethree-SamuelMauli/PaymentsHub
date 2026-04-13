"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL, formatDate, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw } from "lucide-react";

const STATUSES = ["ALL", "RECEIVED", "PREVALIDATED", "UNDER_REVIEW", "APPROVED", "ON_HOLD", "SUBMITTING", "SENT", "SETTLED", "FAILED", "REJECTED", "CANCELED"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    api.getPayments(filter === "ALL" ? undefined : filter).then(setPayments).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Pagamentos</h2>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              filter === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="border-zinc-200">
        <CardHeader className="pb-0 pt-3 px-4">
          <CardTitle className="text-xs text-zinc-400 font-medium">
            {loading ? "Carregando..." : `${payments.length} pagamentos`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
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
              {payments.map((p) => (
                <TableRow key={p.id} className="text-[13px]">
                  <TableCell className="pl-4 font-mono text-xs text-zinc-600">{p.external_id || p.id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.type}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(p.status)}`}>{p.status}</Badge></TableCell>
                  <TableCell className="font-mono text-zinc-700">{formatBRL(p.amount_cents)}</TableCell>
                  <TableCell className="text-zinc-400 max-w-[180px] truncate">{p.description}</TableCell>
                  <TableCell className="text-zinc-400 text-xs">{formatDate(p.created_at)}</TableCell>
                  <TableCell className="pr-4">
                    <Link href={`/dashboard/payments/${p.id}`}>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700 transition-colors" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && payments.length === 0 && <p className="text-center text-sm text-zinc-400 py-8">Nenhum pagamento</p>}
        </CardContent>
      </Card>
    </div>
  );
}
