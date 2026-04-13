"use client";

import { useEffect, useState } from "react";
import { api, type Run } from "@/lib/api";
import { formatBRL, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    api.getRuns().then(setRuns).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreateRun() {
    const today = new Date().toISOString().split("T")[0];
    await api.createRun(today);
    refresh();
  }

  async function handleApprove(id: string) {
    if (!confirm("Aprovar este lote? Todos os pagamentos anexados serão executados.")) return;
    await api.approveRun(id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Lotes (Runs)</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie lotes de pagamento para aprovação e execução</p>
        </div>
        <Button onClick={handleCreateRun}>Criar Run do Dia</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {loading ? "Carregando..." : `${runs.length} runs`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>PIX</TableHead>
                <TableHead>TED</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Aprovado por</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                  <TableCell>{r.run_date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{r.total_items}</TableCell>
                  <TableCell>{r.pix_count}</TableCell>
                  <TableCell>{r.ted_count}</TableCell>
                  <TableCell className="font-mono">{formatBRL(r.total_amount_cents)}</TableCell>
                  <TableCell className="text-sm text-zinc-500">{r.approved_by || "-"}</TableCell>
                  <TableCell>
                    {r.status === "OPEN" && (
                      <Button variant="default" size="sm" onClick={() => handleApprove(r.id)}>
                        Aprovar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && runs.length === 0 && (
            <p className="text-center text-sm text-zinc-400 py-8">Nenhum run encontrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
