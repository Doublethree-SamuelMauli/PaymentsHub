"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type PaymentDetail } from "@/lib/api";
import { formatBRL, formatDate, statusColor } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayment(id).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function handleHold() {
    await api.holdPayment(id, "manual hold via portal");
    api.getPayment(id).then(setData);
  }

  async function handleCancel() {
    if (!confirm("Cancelar este pagamento?")) return;
    await api.cancelPayment(id, "cancelado via portal");
    api.getPayment(id).then(setData);
  }

  if (loading) return <div className="text-zinc-500">Carregando...</div>;
  if (!data) return <div className="text-red-500">Pagamento não encontrado</div>;

  const p = data.payment;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
            Pagamento {p.external_id || p.id.slice(0, 8)}
          </h2>
        </div>
        <div className="flex gap-2">
          {p.status === "APPROVED" && (
            <Button variant="outline" size="sm" onClick={handleHold}>
              Pausar (Hold)
            </Button>
          )}
          {!["SETTLED", "FAILED", "REJECTED", "CANCELED", "EXPIRED"].includes(p.status) && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">ID:</span>
            <span className="ml-2 font-mono">{p.id}</span>
          </div>
          <div>
            <span className="text-zinc-500">Tipo:</span>
            <Badge variant="outline" className="ml-2">{p.type}</Badge>
          </div>
          <div>
            <span className="text-zinc-500">Status:</span>
            <Badge variant="outline" className={`ml-2 ${statusColor(p.status)}`}>{p.status}</Badge>
          </div>
          <div>
            <span className="text-zinc-500">Valor:</span>
            <span className="ml-2 font-mono font-bold">{formatBRL(p.amount_cents)}</span>
          </div>
          <div>
            <span className="text-zinc-500">Método:</span>
            <span className="ml-2">{p.payee_method}</span>
          </div>
          <div>
            <span className="text-zinc-500">Criado em:</span>
            <span className="ml-2">{formatDate(p.created_at)}</span>
          </div>
          {p.description && (
            <div className="col-span-2">
              <span className="text-zinc-500">Descrição:</span>
              <span className="ml-2">{p.description}</span>
            </div>
          )}
          {p.bank_reference && (
            <div className="col-span-2">
              <span className="text-zinc-500">Referência banco:</span>
              <span className="ml-2 font-mono">{p.bank_reference}</span>
            </div>
          )}
          {p.payee && Object.keys(p.payee).length > 0 && (
            <div className="col-span-2">
              <span className="text-zinc-500">Destinatário:</span>
              <pre className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-800 rounded p-2 mt-1">
                {JSON.stringify(p.payee, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.timeline.map((ev, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1" />
                  {i < data.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    {ev.from_status && (
                      <>
                        <Badge variant="outline" className={statusColor(ev.from_status)}>
                          {ev.from_status}
                        </Badge>
                        <span className="text-zinc-400">→</span>
                      </>
                    )}
                    <Badge variant="outline" className={statusColor(ev.to_status)}>
                      {ev.to_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatDate(ev.at)} por {ev.actor}
                  </p>
                  {ev.reason && (
                    <p className="text-xs text-zinc-400 mt-0.5">{ev.reason}</p>
                  )}
                </div>
              </div>
            ))}
            {data.timeline.length === 0 && (
              <p className="text-sm text-zinc-400">Nenhum evento registrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
