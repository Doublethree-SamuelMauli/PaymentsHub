"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Lock, Layers, Receipt, CalendarClock, Webhook } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

const SECTIONS = [
  {
    id: "auth",
    icon: <Lock size={14} />,
    title: "Autenticação",
    body: (
      <>
        <p>Toda chamada exige header <code>Authorization: Bearer &lt;token&gt;</code>. Use API key (formato <code>phk_...</code>) para integrações servidor-a-servidor ou JWT obtido via <code>POST /v1/auth/login</code> para usuários humanos.</p>
        <CodeBlock title="Login (JWT)" lang="bash" code={`curl -X POST https://api.paymentshub.app/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"voce@empresa.com","password":"sua-senha"}'`} />
      </>
    ),
  },
  {
    id: "payments",
    icon: <Receipt size={14} />,
    title: "Pagamentos",
    body: (
      <>
        <p>Crie pagamentos individuais que serão consolidados no lote do dia.</p>
        <CodeBlock title="Criar pagamento PIX" lang="bash" code={`curl -X POST https://api.paymentshub.app/v1/payments \\
  -H "Authorization: Bearer phk_xxx" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "external_id": "INV-2841",
    "type": "PIX",
    "amount_cents": 1243000,
    "payer_account_id": "uuid-da-conta",
    "payee_method": "PIX_KEY",
    "payee": { "key_type": "CNPJ", "key_value": "00000000000000" },
    "description": "Pagamento NF 2841"
  }'`} />
        <Endpoint method="GET" path="/v1/payments?status=APPROVED" desc="Lista pagamentos com filtro opcional por status." />
        <Endpoint method="GET" path="/v1/payments/{id}" desc="Detalhe + timeline de eventos." />
        <Endpoint method="POST" path="/v1/payments/{id}/hold" desc="Pausa pagamento (sai da fila do lote do dia)." />
        <Endpoint method="POST" path="/v1/payments/{id}/reschedule" desc='Reagenda para nova data: {"new_date":"2026-04-20","reason":"..."}' />
      </>
    ),
  },
  {
    id: "runs",
    icon: <CalendarClock size={14} />,
    title: "Lotes (Runs)",
    body: (
      <>
        <p>Lotes consolidam pagamentos do dia. Aprovação e submissão ao banco operam sobre o lote, não sobre pagamentos individuais.</p>
        <Endpoint method="POST" path="/v1/runs" desc='Cria lote para data específica: {"run_date":"2026-04-15"}' />
        <Endpoint method="POST" path="/v1/runs/{id}/attach" desc='Anexa pagamentos ao lote: {"payment_ids":["uuid1","uuid2"]}' />
        <Endpoint method="POST" path="/v1/runs/{id}/approve" desc="Aprova o lote (requer scope runs:approve ou role approver)." />
        <Endpoint method="POST" path="/v1/runs/{id}/submit-to-bank" desc="Envia ao banco em uma única operação (PIX REST + TED CNAB)." />
      </>
    ),
  },
  {
    id: "webhooks",
    icon: <Webhook size={14} />,
    title: "Webhooks",
    body: (
      <>
        <p>O PaymentsHub envia POST para a URL configurada em sua conta toda vez que um pagamento muda de status.</p>
        <CodeBlock title="Payload de exemplo" lang="json" code={`{
  "event": "payment.settled",
  "occurred_at": "2026-04-15T10:02:14Z",
  "payment": {
    "id": "uuid",
    "external_id": "INV-2841",
    "status": "SETTLED",
    "amount_cents": 1243000,
    "bank_reference": "E12345678..."
  }
}`} />
        <p>Eventos disponíveis: <code>payment.received</code>, <code>payment.approved</code>, <code>payment.sent</code>, <code>payment.settled</code>, <code>payment.failed</code>, <code>run.approved</code>, <code>run.submitted</code>.</p>
      </>
    ),
  },
  {
    id: "errors",
    icon: <Layers size={14} />,
    title: "Erros e idempotência",
    body: (
      <>
        <p>Toda criação de pagamento exige header <code>Idempotency-Key</code> (UUID v4). Reenviar a mesma chave retorna o pagamento original sem duplicar.</p>
        <p>Códigos de erro seguem padrão HTTP. Body é sempre <code>{`{"error":"codigo_legivel"}`}</code>:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted-foreground)]">
          <li><code>401 invalid_api_key</code> — token inválido ou expirado</li>
          <li><code>403 missing_scope:X</code> — escopo insuficiente</li>
          <li><code>409 idempotency_conflict</code> — chave reutilizada com payload diferente</li>
          <li><code>422 invalid_payee</code> — chave PIX ou conta TED malformada</li>
        </ul>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="API"
        title="Documentação da API"
        subtitle="REST · JSON · OpenAPI 3.1. Tudo que você precisa para integrar em uma página."
      />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Sumário</p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    {s.icon} {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <p className="text-[11px] font-bold text-[var(--foreground)]">Base URL</p>
                <code className="mt-1 block break-all font-mono text-[10.5px] text-[#1e4ea8]">https://api.paymentshub.app</code>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-12">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-[#1e4ea8]">
                    {s.icon}
                  </span>
                  {s.title}
                </h2>
                <div className="prose prose-sm dark:prose-invert mt-4 max-w-none text-[var(--foreground)] [&_code]:rounded [&_code]:bg-[var(--muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono [&_p]:text-[var(--muted-foreground)]">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-600",
    POST: "bg-blue-500/15 text-blue-600",
    PATCH: "bg-amber-500/15 text-amber-600",
    DELETE: "bg-rose-500/15 text-rose-600",
  };
  return (
    <div className="my-3 flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${colors[method] || ""}`}>{method}</span>
      <div className="min-w-0 flex-1">
        <code className="font-mono text-xs text-[var(--foreground)]">{path}</code>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{desc}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, lang, code }: { title: string; lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[#0a1d44]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-white/60" />
          <span className="text-[11px] font-medium text-white/80">{title}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase text-white/60">{lang}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[12px] leading-relaxed text-white/90"><code>{code}</code></pre>
    </div>
  );
}
