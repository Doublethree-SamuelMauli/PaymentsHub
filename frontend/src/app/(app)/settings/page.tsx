"use client";

import { useEffect, useState } from "react";
import { Palette, Building, KeyRound, Link2, Plus, X, Copy, Check, Shield, AlertTriangle, CheckCircle2, RefreshCw, Trash2, Mail } from "lucide-react";
import { api, type PayerAccount, type BankConnection, type Branding, SUPPORTED_BANKS } from "@/lib/api";
import { PageHeader } from "@/components/ui-custom/page-header";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { BankConnectionForm } from "@/components/settings/bank-connection-form";
import { cn } from "@/lib/utils";

type Tab = "branding" | "banks" | "accounts" | "apikeys";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "branding", label: "Marca", icon: <Palette size={14} /> },
  { id: "banks", label: "Bancos", icon: <Link2 size={14} /> },
  { id: "accounts", label: "Contas pagadoras", icon: <Building size={14} /> },
  { id: "apikeys", label: "Chaves API", icon: <KeyRound size={14} /> },
];

const SCOPES = ["admin", "runs:approve", "runs:write", "payments:write", "payments:read", "beneficiaries:write"];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", label: "Rascunho" },
  validating: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", label: "Validando..." },
  active: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", label: "Ativo" },
  failed: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", label: "Falhou" },
  expired: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400", label: "Expirado" },
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("branding");
  const [branding, setBranding] = useState<Branding | null>(null);
  const [banks, setBanks] = useState<BankConnection[] | null>(null);
  const [accounts, setAccounts] = useState<PayerAccount[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  useEffect(() => {
    api.getBranding().then(setBranding).catch(() => {});
    api.listBankConnections().then(setBanks).catch(() => {});
    api.listPayerAccounts().then(setAccounts).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Marca, conexões bancárias, contas pagadoras e chaves de API." />

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition",
              tab === t.id ? "border-[#1e4ea8] text-[var(--foreground)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "branding" && <BrandingTab branding={branding} onSaved={(b) => { setBranding(b); flash("Marca atualizada"); }} />}
      {tab === "banks" && <BanksTab banks={banks} onRefresh={() => api.listBankConnections().then(setBanks)} flash={flash} />}
      {tab === "accounts" && <AccountsTab accounts={accounts} onRefresh={() => api.listPayerAccounts().then(setAccounts)} flash={flash} />}
      {tab === "apikeys" && <ApiKeysTab flash={flash} />}
    </div>
  );
}

/* ─── Branding Tab ─── */
function BrandingTab({ branding, onSaved }: { branding: Branding | null; onSaved: (b: Branding) => void }) {
  const [slug, setSlug] = useState("");
  const [primary, setPrimary] = useState("#143573");
  const [accent, setAccent] = useState("#1e4ea8");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (branding) {
      setSlug(branding.slug || "");
      setPrimary(branding.primary_color || "#143573");
      setAccent(branding.accent_color || "#1e4ea8");
    }
  }, [branding]);

  async function save() {
    setBusy(true);
    try {
      await api.updateBranding({ slug, primary_color: primary, accent_color: accent });
      onSaved({ ...branding!, slug, primary_color: primary, accent_color: accent });
    } catch {} finally { setBusy(false); }
  }

  if (!branding) return <LoadingBlock label="Carregando..." />;

  return (
    <div className="max-w-lg space-y-5">
      <Card title="Identidade visual" icon={<Palette size={14} />}>
        <Field label="Subdomínio">
          <div className="flex items-center gap-0">
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={inputCls + " rounded-r-none"} placeholder="minha-empresa" />
            <span className="inline-flex items-center rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-[11px] text-[var(--muted-foreground)]">.paymentshub.doublethree.com.br</span>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cor primária">
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-[var(--border)]" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} className={inputCls} />
            </div>
          </Field>
          <Field label="Cor de destaque">
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-[var(--border)]" />
              <input value={accent} onChange={(e) => setAccent(e.target.value)} className={inputCls} />
            </div>
          </Field>
        </div>
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
          <p className="text-[11px] text-[var(--muted-foreground)]">Preview do endereço:</p>
          <p className="mt-1 font-mono text-sm font-semibold" style={{ color: primary }}>
            {slug || "slug"}.paymentshub.doublethree.com.br
          </p>
        </div>
        <button onClick={save} disabled={busy} className="mt-3 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {busy ? "Salvando..." : "Salvar marca"}
        </button>
      </Card>
    </div>
  );
}

/* ─── Banks Tab ─── */
function BanksTab({ banks, onRefresh, flash }: { banks: BankConnection[] | null; onRefresh: () => void; flash: (m: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);

  async function validate(id: string) {
    setValidating(id);
    try {
      const res = await api.validateBankConnection(id);
      if (res.status === "active") flash("Conexão bancária validada!");
      else if (res.error === "max_attempts_reached") flash("Limite de tentativas — contate contato@doublethree.com.br");
      else flash(res.message || res.error || "Falha na validação");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Erro na validação");
    } finally {
      setValidating(null);
      onRefresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta conexão bancária?")) return;
    await api.deleteBankConnection(id);
    onRefresh();
    flash("Conexão removida");
  }

  if (!banks) return <LoadingBlock label="Carregando..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Conexões bancárias</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Configure credenciais para cada banco que sua empresa usa.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white">
          <Plus size={13} /> Adicionar banco
        </button>
      </div>

      {banks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Link2 size={24} className="mx-auto text-[var(--muted-foreground)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">Nenhum banco configurado</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Adicione seu primeiro banco para começar a enviar pagamentos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {banks.map((bc) => {
            const st = STATUS_STYLE[bc.status] || STATUS_STYLE.draft;
            return (
              <div key={bc.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-sm font-bold text-[#1e4ea8]">
                      {bc.bank_code}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{bc.bank_name}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        {bc.auth_method.replace(/_/g, " ")} · {bc.has_credentials ? "Credenciais ✓" : "Sem credenciais"} · {bc.has_certificate ? "Certificado ✓" : "Sem certificado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", st.bg, st.text)}>{st.label}</span>
                    <button onClick={() => validate(bc.id)} disabled={validating === bc.id} className="rounded-md p-1.5 text-[#1e4ea8] hover:bg-[var(--muted)]" title="Validar">
                      <RefreshCw size={13} className={validating === bc.id ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => remove(bc.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title="Remover">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {bc.status === "failed" && bc.last_validation_error && (
                  <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 p-2 text-[11px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span>{bc.last_validation_error}</span>
                  </div>
                )}
                {bc.status === "failed" && bc.validation_attempts >= 3 && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
                    <Mail size={12} />
                    <span>Limite de tentativas. <a href="mailto:contato@doublethree.com.br" className="font-semibold underline">Contate o suporte</a></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <BankConnectionForm
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); onRefresh(); flash("Banco adicionado — valide as credenciais."); }}
        />
      )}
    </div>
  );
}

/* ─── Accounts Tab ─── */
function AccountsTab({ accounts, onRefresh, flash }: { accounts: PayerAccount[] | null; onRefresh: () => void; flash: (m: string) => void }) {
  const [showCreate, setShowCreate] = useState(false);

  if (!accounts) return <LoadingBlock label="Carregando..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Contas pagadoras</h3>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white">
          <Plus size={13} /> Nova conta
        </button>
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-xs text-[var(--muted-foreground)]">Nenhuma conta pagadora.</div>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{a.label}</p>
                <p className="font-mono text-[11px] text-[var(--muted-foreground)]">Banco {a.bank_code} · Ag {a.agency} · Cc {a.account_number}-{a.account_digit}</p>
              </div>
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", a.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400")}>
                {a.active ? "Ativa" : "Inativa"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); onRefresh(); flash("Conta criada"); }} />}
    </div>
  );
}

/* ─── API Keys Tab ─── */
function ApiKeysTab({ flash }: { flash: (m: string) => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Chaves de API</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Integre sistemas externos (ERP, webhook, batch).</p>
        </div>
        <button onClick={() => { setNewToken(null); setShowCreate(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white">
          <Plus size={13} /> Gerar chave
        </button>
      </div>
      {showCreate && (
        <CreateApiKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(token) => { setNewToken(token); flash("Chave criada"); }}
          token={newToken}
          copied={copied}
          onCopy={() => { if (newToken) { navigator.clipboard.writeText(newToken); setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
        />
      )}
    </div>
  );
}

/* ─── Modals (reusando pattern do settings anterior) ─── */

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
      await api.createPayerAccount({ label, bank_code: bankCode, agency, account_number: accountNumber, account_digit: accountDigit, active: true });
      onCreated();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Nova conta pagadora" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Apelido"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Conta principal Itaú" /></Field>
        <Field label="Código do banco"><input value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Agência"><input value={agency} onChange={(e) => setAgency(e.target.value)} className={inputCls} /></Field>
          <Field label="Conta"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputCls} /></Field>
          <Field label="Dígito"><input value={accountDigit} onChange={(e) => setAccountDigit(e.target.value)} className={inputCls} maxLength={2} /></Field>
        </div>
      </div>
      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
      <ModalFooter onClose={onClose} onSubmit={submit} busy={busy} disabled={!label || !agency || !accountNumber} label="Criar" />
    </Modal>
  );
}

function CreateApiKeyModal({ onClose, onCreated, token, copied, onCopy }: { onClose: () => void; onCreated: (token: string) => void; token: string | null; copied: boolean; onCopy: () => void }) {
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["payments:write"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(s: string) { setScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]); }

  async function submit() {
    setBusy(true); setErr(null);
    try { const res = await api.createApiKey(label, scopes); onCreated(res.token); }
    catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Gerar chave de API" onClose={onClose}>
      {token ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">Copie a chave agora — ela não será exibida novamente.</p>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3"><code className="block break-all font-mono text-[11px] text-[var(--foreground)]">{token}</code></div>
          <button onClick={onCopy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white">
            {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar chave</>}
          </button>
          <button onClick={onClose} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">Fechar</button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Field label="Identificador"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Sistema ERP" /></Field>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Escopos</label>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[11px] text-[var(--foreground)]">
                    <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} /> <span className="font-mono">{s}</span>
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

/* ─── Shared components ─── */
const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8] focus:ring-2 focus:ring-[#1e4ea8]/20";

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">{title}</h3>
      </header>
      <div className="space-y-3 px-5 py-4">{children}</div>
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>{children}</div>;
}
function ModalFooter({ onClose, onSubmit, busy, disabled, label }: { onClose: () => void; onSubmit: () => void; busy: boolean; disabled: boolean; label: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">Cancelar</button>
      <button onClick={onSubmit} disabled={busy || disabled} className="rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy ? "..." : label}</button>
    </div>
  );
}
