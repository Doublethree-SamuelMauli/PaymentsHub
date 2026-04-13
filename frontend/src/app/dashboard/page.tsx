"use client";

import { useEffect, useState } from "react";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/format";

export default function DashboardPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayments().then(setPayments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusCounts = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const totalAmount = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const settledAmount = payments
    .filter((p) => p.status === "SETTLED")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const pendingCount = payments.filter((p) =>
    ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "APPROVED", "SUBMITTING", "SENT"].includes(p.status)
  ).length;

  if (loading) {
    return <div className="text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">Visão geral dos pagamentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Volume Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Liquidados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatBRL(settledAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className={statusColor(status)}>
                {status}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <div>
                  <span className="font-medium text-sm">{p.external_id || p.id.slice(0, 8)}</span>
                  <span className="ml-2 text-xs text-zinc-500">{p.type}</span>
                  {p.description && (
                    <span className="ml-2 text-xs text-zinc-400">{p.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColor(p.status)}>
                    {p.status}
                  </Badge>
                  <span className="font-mono text-sm">{formatBRL(p.amount_cents)}</span>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="text-sm text-zinc-400">Nenhum pagamento encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
