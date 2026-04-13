"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.post<{ token: string; id: string }>("/v1/admin/api-keys", {
        label: newKeyLabel,
        scopes: ["payments:write", "payments:read", "runs:write", "runs:approve"],
      });
      setCreatedKey(result.token);
      setNewKeyLabel("");
    } catch (err) {
      alert("Erro ao criar API key: " + (err as Error).message);
    }
  }

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.post<{ webhook_url: string; webhook_secret: string }>(
        "/v1/admin/clients/self/webhook",
        { webhook_url: webhookUrl }
      );
      setWebhookResult(`URL: ${result.webhook_url}\nSecret: ${result.webhook_secret}`);
    } catch (err) {
      alert("Erro: " + (err as Error).message);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Configurações</h2>
        <p className="text-sm text-zinc-500 mt-1">Gerencie suas API keys e integrações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Crie chaves de API para integrar seu ERP com o PaymentsHub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-label">Nome da chave</Label>
              <Input
                id="key-label"
                placeholder="ex: erp-producao"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Gerar API Key</Button>
          </form>
          {createdKey && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Chave criada! Copie agora — ela não será exibida novamente.
              </p>
              <code className="block mt-2 text-xs break-all bg-white dark:bg-zinc-900 p-2 rounded border">
                {createdKey}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Webhook</CardTitle>
          <CardDescription>
            Configure o endpoint que receberá notificações quando o status de um pagamento mudar.
            Cada notificação é assinada com HMAC-SHA256.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveWebhook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://seu-erp.com/webhooks/paymentshub"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Salvar Webhook</Button>
          </form>
          {webhookResult && (
            <pre className="mt-4 text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
              {webhookResult}
            </pre>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Integração via API</CardTitle>
          <CardDescription>
            Envie pagamentos para o PaymentsHub usando a API REST
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <p className="font-medium">Endpoint base:</p>
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {typeof window !== "undefined" ? window.location.origin.replace("3000", "8080") : "http://localhost:8080"}
            </code>
          </div>
          <div>
            <p className="font-medium">Criar pagamento:</p>
            <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded mt-1">{`POST /v1/payments
Headers:
  Authorization: Bearer <sua-api-key>
  Idempotency-Key: <uuid-unico>
  Content-Type: application/json

Body:
{
  "type": "PIX",
  "amount_cents": 15000,
  "payer_account_id": "<uuid>",
  "payee_method": "PIX_KEY",
  "payee": {"key_type": "CNPJ", "key_value": "12345678000190"},
  "description": "Pagamento NF 1234"
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
