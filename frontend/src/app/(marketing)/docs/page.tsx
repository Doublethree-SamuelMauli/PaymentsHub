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
      <section className="mx-auto max-w-5xl px-7 py-16">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Sumário</p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--muted)_60%,transparent)] hover:text-[var(--brand-cyan)]"
                  >
                    <span className="text-[var(--brand-cyan)]">{s.icon}</span>
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-3 backdrop-blur">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Base URL</p>
                <code className="mt-1 block break-all font-mono text-[11px] text-[var(--brand-cyan)]">https://api.paymentshub.app</code>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-14">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="flex items-center gap-2.5 font-display text-[24px] font-semibold tracking-[-0.02em]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                    {s.icon}
                  </span>
                  {s.title}
                </h2>
                <div className="mt-5 max-w-none text-[14.5px] leading-[1.7] [&_code]:rounded [&_code]:bg-[var(--secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-[var(--brand-cyan)] [&_p]:text-[var(--muted-foreground)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--muted-foreground)] [&_li]:mb-1">
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
    GET: "bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)] border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)]",
    POST: "bg-[color-mix(in_srgb,var(--brand-cyan)_15%,transparent)] text-[var(--brand-cyan)] border-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]",
    PATCH: "bg-[color-mix(in_srgb,var(--brand-amber)_15%,transparent)] text-[var(--brand-amber)] border-[color-mix(in_srgb,var(--brand-amber)_30%,transparent)]",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <div className="my-3 flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-3 backdrop-blur">
      <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${colors[method] || ""}`}>{method}</span>
      <div className="min-w-0 flex-1">
        <code className="!bg-transparent !p-0 font-mono text-[12.5px] !text-[var(--foreground)]">{path}</code>
        <p className="mt-1 text-[12.5px] text-[var(--muted-foreground)]">{desc}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, lang, code }: { title: string; lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[#05070d]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--brand-deep)_40%,transparent)] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-[var(--brand-cyan)]" />
          <span className="font-mono text-[11px] font-medium text-[var(--foreground)]">{title}</span>
          <span className="rounded bg-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] px-1.5 py-0.5 font-mono text-[9px] uppercase text-[var(--brand-cyan)]">
            {lang}
          </span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="rounded p-1 text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--brand-cyan)]"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] text-[var(--foreground)]/90">
        <code className="!bg-transparent !p-0 !text-[var(--foreground)]/90">{code}</code>
      </pre>
    </div>
  );
}
