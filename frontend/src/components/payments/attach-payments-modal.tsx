"use client";

import { useEffect, useMemo, useState } from "react";
import { X, CheckSquare, Square, AlertCircle, Search } from "lucide-react";
import { api, type Payment } from "@/lib/api";
import { formatBRL, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AttachPaymentsModal({
  runId, onClose, onDone,
}: {
  runId: string;
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const [list, setList] = useState<Payment[] | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Elegíveis: RECEIVED, VALIDATED_LOCAL, PREVALIDATED sem run associada
    Promise.all(
      ["RECEIVED", "VALIDATED_LOCAL", "PREVALIDATED"].map((s) => api.listPayments(s))
    )
      .then((all) => {
        const flat = all.flat().filter((p) => !!p);
        setList(flat);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }, []);

  const filtered = useMemo(() => {
    if (!list) return [];
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter(
      (p) => p.external_id?.toLowerCase().includes(t) ||
        p.payee?.name?.toLowerCase().includes(t) ||
        p.payee?.legal_name?.toLowerCase().includes(t) ||
        p.description?.toLowerCase().includes(t)
    );
  }, [list, q]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function attach() {
    if (selected.size === 0) return;
    setBusy(true); setErr(null);
    try {
      await api.attachPayments(runId, Array.from(selected));
      onDone(selected.size);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao anexar");
    } finally { setBusy(false); }
  }

  const totalSelected = filtered
    .filter((p) => selected.has(p.id))
    .reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-in">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">Anexar ao lote</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Pagamentos prontos para entrar no lote do dia</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X size={16} />
          </button>
        </header>

        <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID, beneficiário…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8]"
            />
          </div>
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={12} /> : <Square size={12} />}
            {selected.size === filtered.length && filtered.length > 0 ? "Limpar" : "Selecionar todos"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {!list ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Nenhum pagamento elegível. Crie novos em “Novo pagamento”.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((p) => {
                const on = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                        on
                          ? "border-[#1e4ea8] bg-[#143573]/5"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                      )}
                    >
                      {on ? <CheckSquare size={14} className="text-[#1e4ea8]" /> : <Square size={14} className="text-[var(--muted-foreground)]" />}
                      <span className="font-mono text-[11px] text-[#1e4ea8]">{p.external_id || p.id.slice(0, 8)}</span>
                      <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--muted-foreground)]">{p.type}</span>
                      <span className="flex-1 truncate text-xs text-[var(--foreground)]">{p.payee?.name || p.payee?.legal_name || p.description || "—"}</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatBRL(p.amount_cents)}</span>
                      <span className="shrink-0 rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--muted-foreground)]">{statusLabel(p.status)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {err && (
          <div className="mx-6 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle size={14} className="mt-0.5" /> {err}
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3">
          <div className="text-xs">
            <p className="font-semibold text-[var(--foreground)]">{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">Total: <strong className="text-[var(--foreground)]">{formatBRL(totalSelected)}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
              Cancelar
            </button>
            <button
              onClick={attach}
              disabled={busy || selected.size === 0}
              className="rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_20px_-6px_rgba(20,53,115,0.55)] disabled:opacity-60"
            >
              {busy ? "Anexando…" : `Anexar ${selected.size}`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
