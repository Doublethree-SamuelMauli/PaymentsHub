"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PaymentListItem } from "@/lib/api";
import { formatBRL, formatDate, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "ALL", "RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED", "UNDER_REVIEW",
  "APPROVED", "ON_HOLD", "SUBMITTING", "SENT", "SETTLED", "FAILED", "REJECTED", "CANCELED",
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const statusParam = filter === "ALL" ? undefined : filter;
    api.getPayments(statusParam).then(setPayments).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Pagamentos</h2>
          <p className="text-sm text-zinc-500 mt-1">Lista completa de pagamentos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading ? "Carregando..." : `${payments.length} pagamentos`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Ref</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">
                    {p.external_id || p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(p.status)}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatBRL(p.amount_cents)}</TableCell>
                  <TableCell className="text-sm text-zinc-500 max-w-[200px] truncate">
                    {p.description}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">{formatDate(p.created_at)}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/payments/${p.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && payments.length === 0 && (
            <p className="text-center text-sm text-zinc-400 py-8">Nenhum pagamento encontrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
