"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL, formatDate, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments().then(setPayments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = payments.length;
  const totalAmount = payments.reduce((s, p) => s + p.amount_cents, 0);
  const settled = payments.filter((p) => p.status === "SETTLED");
  const settledAmount = settled.reduce((s, p) => s + p.amount_cents, 0);
  const pending = payments.filter((p) =>
    ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT"].includes(p.status)
  );
  const failed = payments.filter((p) => ["FAILED", "REJECTED"].includes(p.status));
  const review = payments.filter((p) => ["UNDER_REVIEW", "ON_HOLD"].includes(p.status));

  const statusCounts = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="text-zinc-400 text-sm">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-zinc-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Total</p>
                <p className="text-xl font-bold text-zinc-800 mt-0.5">{total}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatBRL(totalAmount)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-zinc-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Liquidados</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{settled.length}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatBRL(settledAmount)}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Pendentes</p>
                <p className="text-xl font-bold text-amber-600 mt-0.5">{pending.length}</p>
              </div>
              <Clock className="h-5 w-5 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Atencao</p>
                <p className="text-xl font-bold text-red-600 mt-0.5">{failed.length + review.length}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 border-zinc-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-zinc-600">Ultimos pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="divide-y divide-zinc-100">
              {payments.slice(0, 8).map((p) => (
                <Link key={p.id} href={`/dashboard/payments/${p.id}`} className="flex items-center justify-between py-2.5 hover:bg-zinc-50 -mx-2 px-2 rounded transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-zinc-700 truncate">{p.external_id || p.id.slice(0, 8)}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.type}</Badge>
                    </div>
                    {p.description && <p className="text-[11px] text-zinc-400 truncate mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(p.status)}`}>{p.status}</Badge>
                    <span className="text-[13px] font-mono font-medium text-zinc-700">{formatBRL(p.amount_cents)}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-300" />
                  </div>
                </Link>
              ))}
              {payments.length === 0 && <p className="text-sm text-zinc-400 py-6 text-center">Nenhum pagamento</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-zinc-600">Por status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(status)}`}>{status}</Badge>
                    <span className="text-[13px] font-mono text-zinc-600">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
