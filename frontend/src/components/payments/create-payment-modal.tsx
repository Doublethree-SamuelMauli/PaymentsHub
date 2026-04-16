"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, Zap, FileText, CalendarDays, ChevronRight } from "lucide-react";
import { api, type Beneficiary, type PayerAccount, type CreatePaymentInput } from "@/lib/api";
import { cn } from "@/lib/utils";

type Mode = "single" | "bulk";

export function CreatePaymentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (count: number) => void;
}) {
  const [mode, setMode] = useState<Mode>("single");
  const [accounts, setAccounts] = useState<PayerAccount[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listPayerAccounts(), api.listBeneficiaries()])
      .then(([a, b]) => {
        setAccounts((a || []).filter((x) => x.active));
        setBeneficiaries((b || []).filter((x) => x.active));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-in">
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Novo pagamento</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Criar individual ou importar em lote</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X size={16} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] px-6">
          <TabBtn active={mode === "single"} onClick={() => setMode("single")} icon={<Zap size={13} />}>Individual</TabBtn>
          <TabBtn active={mode === "bulk"} onClick={() => setMode("bulk")} icon={<FileText size={13} />}>Importar lote</TabBtn>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">Carregando…</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--foreground)]">Nenhuma conta pagadora ativa.</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Cadastre uma conta em /settings antes de criar pagamentos.</p>
          </div>
        ) : mode === "single" ? (
          <SingleForm accounts={accounts} beneficiaries={beneficiaries} onClose={onClose} onCreated={onCreated} />
        ) : (
          <BulkForm accounts={accounts} beneficiaries={beneficiaries} onClose={onClose} onCreated={onCreated} />
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition",
        active
          ? "border-[#1e4ea8] text-[var(--foreground)]"
          : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      )}
    >
      {icon} {children}
    </button>
  );
}

/* ---------- single ---------- */

function SingleForm({
  accounts, beneficiaries, onClose, onCreated,
}: {
  accounts: PayerAccount[];
  beneficiaries: Beneficiary[];
  onClose: () => void;
  onCreated: (count: number) => void;
}) {
  const [payerId, setPayerId] = useState(accounts[0]?.id ?? "");
  const [type, setType] = useState<"PIX" | "TED">("PIX");
  const [benId, setBenId] = useState<string>("");
  const [externalId, setExternalId] = useState("");
  const [amountBRL, setAmountBRL] = useState("");
  const [description, setDescription] = useState("");
  const [scheduled, setScheduled] = useState(""); // YYYY-MM-DD opcional
  // PIX key
  const [keyType, setKeyType] = useState<"CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP">("CNPJ");
  const [keyValue, setKeyValue] = useState("");
  // TED bank account
  const [bankCode, setBankCode] = useState("341");
  const [agency, setAgency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountDigit, setAccountDigit] = useState("");
  const [accountType, setAccountType] = useState<"CC" | "CP">("CC");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedBen = beneficiaries.find((b) => b.id === benId);

  // Autofill from beneficiary
  useEffect(() => {
    if (!selectedBen) return;
    if (type === "PIX" && selectedBen.pix_keys?.[0]) {
      setKeyType(selectedBen.pix_keys[0].key_type as typeof keyType);
      setKeyValue(selectedBen.pix_keys[0].key_value);
    } else if (type === "TED" && selectedBen.bank_accounts?.[0]) {
      const a = selectedBen.bank_accounts[0];
      setBankCode(a.bank_code); setAgency(a.agency);
      setAccountNumber(a.account_number); setAccountDigit(a.account_digit);
      setAccountType((a.account_type as "CC" | "CP") || "CC");
    }
  }, [benId, type, selectedBen]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);

    const cents = Math.round(parseFloat(amountBRL.replace(",", ".")) * 100);
    if (!cents || cents <= 0) { setErr("Valor inválido"); setBusy(false); return; }

    const payee: Record<string, string> = type === "PIX"
      ? { key_type: keyType, key_value: keyValue.trim() }
      : { bank_code: bankCode, agency, account_number: accountNumber, account_digit: accountDigit, account_type: accountType };

    const body: CreatePaymentInput = {
      external_id: externalId || undefined,
      type,
      amount_cents: cents,
      payer_account_id: payerId,
      beneficiary_id: benId || undefined,
      payee_method: type === "PIX" ? "PIX_KEY" : "BANK_ACCOUNT",
      payee,
      description: description || undefined,
      scheduled_for: scheduled || undefined,
    };
    try {
      await api.createPayment(body);
      onCreated(1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao criar");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Type selector */}
        <Field label="Tipo" span={2}>
          <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5">
            {(["PIX", "TED"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition",
                  type === t
                    ? "bg-gradient-to-r from-[#143573] to-[#1e4ea8] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {t === "PIX" ? <Zap size={11} /> : <CalendarDays size={11} />}
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Conta pagadora">
          <Select value={payerId} onChange={setPayerId}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.label} · {a.bank_code}/{a.agency}</option>
            ))}
          </Select>
        </Field>

        <Field label="Beneficiário (opcional)">
          <Select value={benId} onChange={setBenId}>
            <option value="">— sem cadastro —</option>
            {beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>{b.legal_name} ({b.document_number})</option>
            ))}
          </Select>
        </Field>

        <Field label="Valor (R$)">
          <Input value={amountBRL} onChange={setAmountBRL} placeholder="1.234,56" />
        </Field>

        <Field label="ID externo (opcional)">
          <Input value={externalId} onChange={setExternalId} placeholder="NF-001234" />
        </Field>

        {type === "PIX" ? (
          <>
            <Field label="Tipo de chave PIX">
              <Select value={keyType} onChange={(v) => setKeyType(v as typeof keyType)}>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone</option>
                <option value="EVP">Chave aleatória</option>
              </Select>
            </Field>
            <Field label="Chave PIX">
              <Input value={keyValue} onChange={setKeyValue} placeholder={keyType === "EMAIL" ? "fornecedor@..." : keyType === "PHONE" ? "+55..." : "000.000.000-00"} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Banco">
              <Input value={bankCode} onChange={setBankCode} placeholder="341" />
            </Field>
            <Field label="Tipo de conta">
              <Select value={accountType} onChange={(v) => setAccountType(v as "CC" | "CP")}>
                <option value="CC">Corrente</option>
                <option value="CP">Poupança</option>
              </Select>
            </Field>
            <Field label="Agência">
              <Input value={agency} onChange={setAgency} placeholder="1234" />
            </Field>
            <Field label="Conta">
              <div className="flex gap-2">
                <Input value={accountNumber} onChange={setAccountNumber} placeholder="12345-6" />
                <div className="w-16">
                  <Input value={accountDigit} onChange={setAccountDigit} placeholder="DV" />
                </div>
              </div>
            </Field>
          </>
        )}

        <Field label="Agendar para (opcional)">
          <Input value={scheduled} onChange={setScheduled} placeholder="" type="date" />
        </Field>
        <Field label="Descrição">
          <Input value={description} onChange={setDescription} placeholder="Ref. NF 001234" />
        </Field>
      </div>

      {err && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{err}</span>
        </div>
      )}

      <footer className="-mx-6 -mb-5 mt-5 flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3">
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Pagamento entra com status <strong>RECEIVED</strong> e será anexado ao lote aberto.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_20px_-6px_rgba(20,53,115,0.55)] transition hover:shadow-[0_8px_28px_-8px_rgba(20,53,115,0.75)] disabled:opacity-60">
            {busy ? "Criando…" : <>Criar pagamento <ChevronRight size={13} /></>}
          </button>
        </div>
      </footer>
    </form>
  );
}

/* ---------- bulk ---------- */

function BulkForm({
  accounts, beneficiaries, onClose, onCreated,
}: {
  accounts: PayerAccount[];
  beneficiaries: Beneficiary[];
  onClose: () => void;
  onCreated: (count: number) => void;
}) {
  const [payerId, setPayerId] = useState(accounts[0]?.id ?? "");
  const [rows, setRows] = useState(`# CSV: external_id;tipo;valor;chave_pix_ou_conta;descricao
NF-1001;PIX;1200.00;fornecedor1@ex.com;Nota 1001
NF-1002;PIX;580.50;12.345.678/0001-90;Nota 1002
NF-1003;TED;4500.00;341/1234/56789-0;Nota 1003`);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const lines = rows.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    if (lines.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: lines.length, errors: [] });
    const errors: string[] = [];
    let done = 0;

    for (const line of lines) {
      const parts = line.split(";").map((p) => p.trim());
      if (parts.length < 4) { errors.push(`${line} → formato inválido`); continue; }
      const [ext, type, amountStr, payeeStr, desc] = parts;
      const cents = Math.round(parseFloat(amountStr.replace(",", ".")) * 100);
      if (!cents || cents <= 0) { errors.push(`${ext} → valor inválido`); continue; }

      let body: CreatePaymentInput;
      if (type.toUpperCase() === "PIX") {
        const kt = detectKeyType(payeeStr);
        body = {
          external_id: ext, type: "PIX", amount_cents: cents,
          payer_account_id: payerId, payee_method: "PIX_KEY",
          payee: { key_type: kt, key_value: payeeStr },
          description: desc,
        };
      } else {
        const m = payeeStr.match(/^(\d{3})\/(\d+)\/(\d+)-(\w+)$/);
        if (!m) { errors.push(`${ext} → TED formato banco/agencia/conta-digito`); continue; }
        body = {
          external_id: ext, type: "TED", amount_cents: cents,
          payer_account_id: payerId, payee_method: "BANK_ACCOUNT",
          payee: { bank_code: m[1], agency: m[2], account_number: m[3], account_digit: m[4], account_type: "CC" },
          description: desc,
        };
      }

      try {
        await api.createPayment(body);
        done++;
      } catch (err) {
        errors.push(`${ext} → ${err instanceof Error ? err.message : "erro"}`);
      }
      setProgress({ done, total: lines.length, errors });
    }
    setBusy(false);
    if (done > 0) {
      setTimeout(() => onCreated(done), 1500);
    }
  }

  return (
    <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
      <Field label="Conta pagadora">
        <Select value={payerId} onChange={setPayerId}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.label} · {a.bank_code}/{a.agency}</option>
          ))}
        </Select>
      </Field>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
          Linhas CSV (uma por linha)
        </label>
        <p className="mb-2 text-[11px] text-[var(--muted-foreground)]">
          Formato: <code className="font-mono">external_id;TIPO;valor;chave_ou_conta;descrição</code><br />
          PIX: chave pode ser CPF, CNPJ, e-mail, telefone ou EVP.<br />
          TED: no formato <code className="font-mono">banco/agencia/conta-digito</code> (ex: <code className="font-mono">341/1234/56789-0</code>).
        </p>
        <textarea
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--foreground)] outline-none focus:border-[#1e4ea8]"
        />
      </div>

      {progress && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Progresso</span>
            <span>{progress.done}/{progress.total} · {progress.errors.length} erro{progress.errors.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          {progress.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-red-600">{progress.errors.length} erro(s)</summary>
              <ul className="mt-1 space-y-0.5 text-[11px] text-red-600">
                {progress.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <footer className="-mx-6 -mb-5 mt-5 flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3">
        <p className="text-[11px] text-[var(--muted-foreground)]">Cada linha é criada com idempotency key única.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            Fechar
          </button>
          <button type="submit" disabled={busy} className="rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {busy ? "Importando…" : "Importar"}
          </button>
        </div>
      </footer>
    </form>
  );
}

function detectKeyType(s: string): string {
  const digits = s.replace(/\D/g, "");
  if (s.includes("@")) return "EMAIL";
  if (digits.length === 11 && !s.startsWith("+")) return "CPF";
  if (digits.length === 14) return "CNPJ";
  if (s.startsWith("+") || digits.length >= 10) return "PHONE";
  return "EVP";
}

/* ---------- primitives ---------- */

const inputBase = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8] focus:ring-2 focus:ring-[#1e4ea8]/20";

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputBase} />;
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className={inputBase}>{children}</select>;
}
