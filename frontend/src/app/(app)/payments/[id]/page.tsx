"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, Building, FileText } from "lucide-react";
import { api, type PaymentDetail } from "@/lib/api";
import { formatBRL, formatDate, statusLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui-custom/page-header";
import { StatusPill } from "@/components/ui-custom/status-pill";
import { LoadingBlock } from "@/components/ui-custom/loading";

const PAYEE_LABELS: Record<string, string> = {
  key_type: "Tipo de chave",
  key_value: "Chave PIX",
  name: "Nome",
  legal_name: "Razão social",
  bank_code: "Banco",
  agency: "Agência",
  account_number: "Conta",
  account_digit: "Dígito",
  account_type: "Tipo de conta",
  document_number: "Documento",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CC: "Conta Corrente",
  CP: "Conta Poupança",
};

const KEY_TYPE_LABELS: Record<string, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  EVP: "Chave aleatória",
};

const METHOD_LABELS: Record<string, string> = {
  PIX_KEY: "PIX",
  BANK_ACCOUNT: "Transferência bancária (TED)",
};

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getPayment(id)
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, [id]);

  if (err) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">{err}</div>;
  }

  if (!data) return <LoadingBlock label="Carregando pagamento..." />;

  const { payment, timeline } = data;

  return (
    <div className="space-y-6">
      <Link href="/payments" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft size={12} /> Voltar para pagamentos
      </Link>

      <PageHeader
        title={payment.external_id || payment.id.slice(0, 8)}
        description={payment.description || "Sem descrição"}
        actions={<StatusPill status={payment.status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Resumo */}
          <Card title="Resumo do pagamento" icon={<FileText size={14} />}>
            <Field label="Valor">
              <span className="text-lg font-bold text-[var(--foreground)]">{formatBRL(payment.amount_cents)}</span>
            </Field>
            <Field label="Tipo">{payment.type === "PIX" ? "PIX" : "TED"}</Field>
            <Field label="Forma de envio">{METHOD_LABELS[payment.payee_method] || payment.payee_method}</Field>
            <Field label="Moeda">{payment.currency || "Real (BRL)"}</Field>
            {payment.bank_reference && (
              <Field label="Comprovante do banco">{payment.bank_reference}</Field>
            )}
          </Card>

          {/* Destinatário */}
          <Card title="Quem recebe" icon={<User size={14} />}>
            {Object.entries(payment.payee || {}).map(([k, v]) => {
              const label = PAYEE_LABELS[k] || k;
              let display = String(v);
              if (k === "account_type") display = ACCOUNT_TYPE_LABELS[display] || display;
              if (k === "key_type") display = KEY_TYPE_LABELS[display] || display;
              if (k === "bank_code") display = `${display} — ${bankName(display)}`;
              if (!display || display === "undefined") return null;
              return <Field key={k} label={label}>{display}</Field>;
            })}
          </Card>

          {/* Conta de origem */}
          <Card title="Conta de origem" icon={<Building size={14} />}>
            <Field label="Identificador da conta" mono>{payment.payer_account_id}</Field>
          </Card>
        </div>

        {/* Histórico */}
        <div>
          <Card title="Histórico" icon={<Clock size={14} />}>
            {timeline.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">Nenhum evento registrado.</p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((e, i) => (
                  <li key={i} className="relative border-l-2 border-[var(--brand-accent)]/30 pl-4">
                    <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8]" />
                    <p className="text-[11px] text-[var(--muted-foreground)]">{formatDate(e.at)}</p>
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      {statusLabel(e.from_status)} → {statusLabel(e.to_status)}
                    </p>
                    {e.actor && <p className="text-[11px] text-[var(--muted-foreground)]">por {e.actor}</p>}
                    {e.reason && <p className="mt-1 text-[11px] text-[var(--foreground)]">{e.reason}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function bankName(code: string): string {
  const map: Record<string, string> = {
    "341": "Itaú", "237": "Bradesco", "033": "Santander", "001": "Banco do Brasil",
    "104": "Caixa", "077": "Inter", "756": "Sicoob", "208": "BTG Pactual",
  };
  return map[code] || `Banco ${code}`;
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">{title}</h2>
      </header>
      <div className="space-y-2 px-4 py-3">{children}</div>
    </section>
  );
}

function Field({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/50 py-1.5 last:border-b-0">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span className={mono ? "font-mono text-[11px] text-[var(--foreground)] break-all text-right" : "text-xs font-medium text-[var(--foreground)] text-right"}>{children}</span>
    </div>
  );
}
