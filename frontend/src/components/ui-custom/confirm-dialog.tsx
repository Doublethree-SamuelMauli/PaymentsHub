"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

type Tone = "default" | "destructive" | "success";

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  /** When set, user must type this string to enable the confirm button (e.g. "APROVAR"). */
  typeToConfirm?: string;
}

type Resolver = (ok: boolean) => void;

const ConfirmCtx = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: Resolver } | null>(null);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setTyped("");
      setState({ opts, resolve });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    state?.resolve(result);
    setState(null);
    setTyped("");
  }, [state]);

  // ESC to cancel
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter" && canConfirm()) close(true);
    };
    window.addEventListener("keydown", onKey);
    // focus on open
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, typed]);

  function canConfirm() {
    if (!state) return false;
    if (!state.opts.typeToConfirm) return true;
    return typed.trim().toLowerCase() === state.opts.typeToConfirm.toLowerCase();
  }

  const iconByTone: Record<Tone, ReactNode> = {
    default: <Info size={22} />,
    destructive: <AlertTriangle size={22} />,
    success: <CheckCircle2 size={22} />,
  };
  const iconBgByTone: Record<Tone, string> = {
    default:
      "border-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-cyan)_15%,transparent)] text-[var(--brand-cyan)]",
    destructive: "border-red-500/35 bg-red-500/15 text-red-300",
    success:
      "border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)]",
  };
  const confirmBtnByTone: Record<Tone, string> = {
    default: "btn-glow",
    destructive:
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_8px_24px_-6px_rgba(239,68,68,0.5)] hover:brightness-110",
    success:
      "bg-gradient-to-r from-[var(--brand-emerald)] to-[color-mix(in_srgb,var(--brand-emerald)_70%,var(--brand-cyan)_30%)] text-[#05070d] shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--brand-emerald)_50%,transparent)] hover:brightness-110",
  };

  const opts = state?.opts;
  const tone: Tone = opts?.tone ?? "default";

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && opts && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div className="absolute inset-0 bg-[rgba(5,7,13,0.62)] backdrop-blur-md confirm-overlay" />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_95%,transparent)] to-[color-mix(in_srgb,var(--background)_90%,transparent)] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl confirm-enter"
          >
            <div className="card-topline pointer-events-none absolute inset-x-0 top-0 h-1" />
            <button
              onClick={() => close(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
            >
              <X size={15} />
            </button>
            <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px] border ${iconBgByTone[tone]}`}>
              {iconByTone[tone]}
            </div>
            <h2 className="font-display text-[18.5px] font-semibold tracking-[-0.015em]">{opts.title}</h2>
            {opts.description && (
              <div className="mt-2 text-[13.5px] leading-[1.65] text-[var(--muted-foreground)]">
                {opts.description}
              </div>
            )}
            {opts.typeToConfirm && (
              <div className="mt-5">
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  Digite <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--brand-cyan)]">{opts.typeToConfirm}</code> para confirmar
                </label>
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 py-2.5 font-mono text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_50%,transparent)] px-5 py-2.5 text-[13px] font-medium text-[var(--foreground)] transition hover:border-[color-mix(in_srgb,var(--foreground)_20%,transparent)]"
              >
                {opts.cancelLabel || "Cancelar"}
              </button>
              <button
                onClick={() => close(true)}
                disabled={!canConfirm()}
                className={`rounded-full px-5 py-2.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmBtnByTone[tone]}`}
              >
                {opts.confirmLabel || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
