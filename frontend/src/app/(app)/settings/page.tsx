"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, X, Building, Copy, Check } from "lucide-react";
import { api, type PayerAccount } from "@/lib/api";
import { PageHeader } from "@/components/ui-custom/page-header";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { EmptyState } from "@/components/ui-custom/empty-state";

const SCOPES = [
  "admin",
  "runs:approve",
  "runs:write",
  "payments:write",
  "payments:read",
  "beneficiaries:write",
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<PayerAccount[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function load() {
    api.listPayerAccounts().then((p) => setAccounts(p || [])).catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Contas pagadoras, chaves de API e parâmetros gerais."
      />

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{err}</div>}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Building size={14} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Contas pagadoras</h2>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={12} /> Nova conta
          </button>
        </header>

        {!accounts ? (
          <div className="p-5"><LoadingBlock label="Carregando..." /></div>
        ) : accounts.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<Building size={20} />} title="Nenhuma conta" description="Cadastre a primeira conta pagadora." />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{a.label}</p>
                  <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                    Banco {a.bank_code} · Ag {a.agency} · Cc {a.account_number}-{a.account_digit}
                  </p>
                </div>
                <span className={a.active ? "rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}>
                  {a.active ? "Ativa" : "Inativa"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <KeyRound size={14} className="text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Chaves de API</h2>
          </div>
          <button
            onClick={() => { setNewToken(null); setShowApiKey(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={12} /> Gerar chave
          </button>
        </header>
        <div className="px-5 py-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Use chaves de API para integrar sistemas externos (ingestão de pagamentos via webhook ou batch).
            <br />
            <span className="italic">Listagem/revogação será disponibilizada em breve.</span>
          </p>
        </div>
      </section>

      {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {showApiKey && (
        <CreateApiKeyModal
          onClose={() => setShowApiKey(false)}
          onCreated={(token) => setNewToken(token)}
          token={newToken}
          copied={copied}
          onCopy={() => { if (newToken) { navigator.clipboard.writeText(newToken); setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
        />
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]";

function CreateAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [bankCode, setBankCode] = useState("341");
  const [agency, setAgency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountDigit, setAccountDigit] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      await api.createPayerAccount({
        label, bank_code: bankCode, agency, account_number: accountNumber, account_digit: accountDigit, active: true,
      });
      onCreated();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Nova conta pagadora" onClose={onClose}>
      <div className="space-y-3">
        <FieldRow label="Apelido"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Conta principal Itaú" /></FieldRow>
        <FieldRow label="Código do banco"><input value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={inputCls} /></FieldRow>
        <div className="grid grid-cols-3 gap-3">
          <FieldRow label="Agência"><input value={agency} onChange={(e) => setAgency(e.target.value)} className={inputCls} /></FieldRow>
          <FieldRow label="Conta"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputCls} /></FieldRow>
          <FieldRow label="Dígito"><input value={accountDigit} onChange={(e) => setAccountDigit(e.target.value)} className={inputCls} maxLength={2} /></FieldRow>
        </div>
      </div>
      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
      <ModalFooter onClose={onClose} onSubmit={submit} busy={busy} disabled={!label || !agency || !accountNumber} label="Criar" />
    </Modal>
  );
}

function CreateApiKeyModal({
  onClose, onCreated, token, copied, onCopy,
}: {
  onClose: () => void;
  onCreated: (token: string) => void;
  token: string | null;
  copied: boolean;
  onCopy: () => void;
}) {
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["payments:write"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(s: string) {
    setScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const res = await api.createApiKey(label, scopes);
      onCreated(res.token);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Gerar chave de API" onClose={onClose}>
      {token ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Copie a chave abaixo agora — ela não será exibida novamente.
          </p>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
            <code className="block break-all font-mono text-[11px] text-[var(--foreground)]">{token}</code>
          </div>
          <button
            onClick={onCopy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar chave</>}
          </button>
          <button onClick={onClose} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <FieldRow label="Identificador"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Sistema ERP" /></FieldRow>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Escopos</label>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[11px] text-[var(--foreground)]">
                    <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} />
                    <span className="font-mono">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
          <ModalFooter onClose={onClose} onSubmit={submit} busy={busy} disabled={!label || scopes.length === 0} label="Gerar" />
        </>
      )}
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>{children}</div>;
}
function ModalFooter({ onClose, onSubmit, busy, disabled, label }: { onClose: () => void; onSubmit: () => void; busy: boolean; disabled: boolean; label: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">Cancelar</button>
      <button onClick={onSubmit} disabled={busy || disabled} className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy ? "..." : label}</button>
    </div>
  );
}
