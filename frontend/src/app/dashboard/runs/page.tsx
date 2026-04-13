"use client";

import { useEffect, useState } from "react";
import { api, type Run, type PaymentListItem } from "@/lib/api";
import { formatBRL, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, RefreshCw, PackagePlus } from "lucide-react";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [prevalidated, setPrevalidated] = useState<PaymentListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    Promise.all([
      api.getRuns().then(setRuns).catch(() => setRuns([])),
      api.getPayments("PREVALIDATED").then(setPrevalidated).catch(() => setPrevalidated([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreateRun() {
    const today = new Date().toISOString().split("T")[0];
    await api.createRun(today);
    refresh();
  }

  async function handleAttach(runId: string) {
    if (selected.size === 0) return;
    setAttaching(runId);
    try {
      await api.attachPayments(runId, Array.from(selected));
      setSelected(new Set());
      refresh();
    } finally {
      setAttaching(null);
    }
  }

  async function handleApprove(runId: string) {
    if (!confirm("Aprovar este lote? Os pagamentos serao enviados ao banco.")) return;
    await api.approveRun(runId);
    refresh();
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === prevalidated.length) setSelected(new Set());
    else setSelected(new Set(prevalidated.map((p) => p.id)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Lotes de Pagamento</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
          <Button size="sm" onClick={handleCreateRun} className="gap-1.5 text-xs">
            <Plus className="h-3 w-3" /> Criar Lote do Dia
          </Button>
        </div>
      </div>

      {prevalidated.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <PackagePlus className="h-4 w-4" />
              {prevalidated.length} pagamentos pre-validados aguardando agrupar em lote
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="mb-2">
              <button onClick={selectAll} className="text-[11px] text-amber-700 underline">
                {selected.size === prevalidated.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {prevalidated.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1 text-[13px] cursor-pointer hover:bg-amber-100/50 px-2 rounded">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-amber-300"
                  />
                  <span className="font-mono text-xs text-zinc-500">{p.external_id || p.id.slice(0, 8)}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{p.type}</Badge>
                  <span className="font-mono text-xs ml-auto">{formatBRL(p.amount_cents)}</span>
                </label>
              ))}
            </div>
            {selected.size > 0 && runs.filter((r) => r.status === "OPEN").length > 0 && (
              <div className="mt-3 flex gap-2">
                {runs.filter((r) => r.status === "OPEN").map((r) => (
                  <Button
                    key={r.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAttach(r.id)}
                    disabled={attaching === r.id}
                    className="text-xs gap-1"
                  >
                    <PackagePlus className="h-3 w-3" />
                    Anexar ao lote {r.run_date}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-200">
        <CardHeader className="pb-0 pt-3 px-4">
          <CardTitle className="text-xs text-zinc-400 font-medium">
            {loading ? "Carregando..." : `${runs.length} lotes`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="pl-4">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>PIX</TableHead>
                <TableHead>TED</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Aprovado por</TableHead>
                <TableHead className="pr-4">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id} className="text-[13px]">
                  <TableCell className="pl-4 font-medium text-zinc-700">{r.run_date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(r.status)}`}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-600">{r.total_items}</TableCell>
                  <TableCell className="text-zinc-600">{r.pix_count}</TableCell>
                  <TableCell className="text-zinc-600">{r.ted_count}</TableCell>
                  <TableCell className="font-mono text-zinc-700">{formatBRL(r.total_amount_cents)}</TableCell>
                  <TableCell className="text-zinc-400 text-xs">{r.approved_by || "-"}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex gap-1">
                      {r.status === "OPEN" && selected.size > 0 && (
                        <Button size="sm" variant="outline" onClick={() => handleAttach(r.id)} className="text-[11px] h-7 gap-1">
                          <PackagePlus className="h-3 w-3" /> Anexar ({selected.size})
                        </Button>
                      )}
                      {r.status === "OPEN" && r.total_items > 0 && (
                        <Button size="sm" onClick={() => handleApprove(r.id)} className="text-[11px] h-7 gap-1 bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Aprovar e Enviar
                        </Button>
                      )}
                      {r.status === "APPROVED" && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Enviado ao banco
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && runs.length === 0 && (
            <p className="text-center text-sm text-zinc-400 py-8">Nenhum lote criado. Clique em "Criar Lote do Dia" para comecar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
