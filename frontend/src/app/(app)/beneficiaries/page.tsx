"use client";

import { useEffect, useState } from "react";
import { UserSquare2, Plus, Search, X } from "lucide-react";
import { api, type Beneficiary } from "@/lib/api";
import { PageHeader } from "@/components/ui-custom/page-header";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { cn } from "@/lib/utils";

export default function BeneficiariesPage() {
  const [list, setList] = useState<Beneficiary[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canWrite = api.roleCovers("operator");

  function load() {
    api.listBeneficiaries().then((b) => setList(b || [])).catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }
  useEffect(load, []);

  const filtered = (list || []).filter((b) =>
    !q.trim() ||
    b.legal_name.toLowerCase().includes(q.toLowerCase()) ||
    b.document_number.includes(q)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Empresas e pessoas que recebem seus pagamentos."
        actions={canWrite && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={14} /> Novo
          </button>
        )}
      />

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou CNPJ/CPF..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]"
        />
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{err}</div>}

      {!list ? (
        <LoadingBlock label="Carregando..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<UserSquare2 size={20} />} title="Nenhum fornecedor" description="Cadastre o primeiro fornecedor que vai receber pagamentos." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{b.legal_name}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {b.document_type} · {b.document_number}
                  </p>
                </div>
                <span className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  b.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                )}>
                  {b.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {(b.pix_keys || []).map((k, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-[var(--muted)] px-2 py-1 text-[11px]">
                    <span className="font-mono text-[var(--foreground)]">{k.key_value}</span>
                    <span className="rounded bg-[var(--brand-accent)]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--brand-accent)]">
                      PIX · {k.key_type}
                    </span>
                  </div>
                ))}
                {(b.bank_accounts || []).map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-[var(--muted)] px-2 py-1 text-[11px]">
                    <span className="font-mono text-[var(--foreground)]">
                      Banco {a.bank_code} · Ag {a.agency} · Cc {a.account_number}-{a.account_digit}
                    </span>
                    <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-600">
                      TED · {a.account_type}
                    </span>
                  </div>
                ))}
                {(b.pix_keys?.length || 0) + (b.bank_accounts?.length || 0) === 0 && (
                  <p className="text-[11px] italic text-[var(--muted-foreground)]">Sem métodos cadastrados.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [legalName, setLegalName] = useState("");
  const [docType, setDocType] = useState("CPF");
  const [docNumber, setDocNumber] = useState("");
  const [kind, setKind] = useState("PERSON");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      await api.createBeneficiary({
        kind, legal_name: legalName, document_type: docType,
        document_number: docNumber.replace(/\D/g, ""),
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Novo fornecedor</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={14} /></button>
        </div>

        <div className="space-y-3">
          <Input label="Razão social / Nome" value={legalName} onChange={setLegalName} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={kind} onChange={setKind} options={[["PERSON", "Pessoa"], ["COMPANY", "Empresa"]]} />
            <Select label="Documento" value={docType} onChange={(v) => { setDocType(v); setKind(v === "CNPJ" ? "COMPANY" : "PERSON"); }} options={[["CPF", "CPF"], ["CNPJ", "CNPJ"]]} />
          </div>
          <Input label="Número do documento" value={docNumber} onChange={setDocNumber} placeholder="Apenas números" />
        </div>

        {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">Cancelar</button>
          <button onClick={submit} disabled={busy || !legalName || !docNumber} className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {busy ? "..." : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]" />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
