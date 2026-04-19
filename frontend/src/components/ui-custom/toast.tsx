"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type Variant = "success" | "error" | "warning" | "info";
type Toast = { id: number; variant: Variant; title: string; description?: string; duration?: number };

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES: Record<Variant, { icon: ReactNode; cls: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    cls: "border-[color-mix(in_srgb,var(--brand-emerald)_40%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--brand-emerald)_18%,transparent)] to-[color-mix(in_srgb,var(--card)_80%,transparent)] text-[var(--brand-emerald)]",
  },
  error: {
    icon: <XCircle size={18} />,
    cls: "border-red-500/40 bg-gradient-to-b from-red-500/18 to-[color-mix(in_srgb,var(--card)_80%,transparent)] text-red-300",
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    cls: "border-[color-mix(in_srgb,var(--brand-amber)_40%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--brand-amber)_18%,transparent)] to-[color-mix(in_srgb,var(--card)_80%,transparent)] text-[var(--brand-amber)]",
  },
  info: {
    icon: <Info size={18} />,
    cls: "border-[color-mix(in_srgb,var(--brand-cyan)_40%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--brand-cyan)_18%,transparent)] to-[color-mix(in_srgb,var(--card)_80%,transparent)] text-[var(--brand-cyan)]",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<ToastContextValue["push"]>((t) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const duration = t.duration ?? 4500;
    setToasts((cur) => [...cur, { ...t, id }]);
    window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value: ToastContextValue = {
    push,
    success: (title, description) => push({ variant: "success", title, description }),
    error: (title, description) => push({ variant: "error", title, description, duration: 6000 }),
    warning: (title, description) => push({ variant: "warning", title, description, duration: 5500 }),
    info: (title, description) => push({ variant: "info", title, description }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-16 z-[120] flex max-h-[calc(100vh-5rem)] w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-hidden sm:right-6 sm:top-20">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 overflow-hidden rounded-[14px] border p-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.6)] backdrop-blur-xl toast-enter ${style.cls}`}
            >
              <span className="shrink-0">{style.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-semibold text-[var(--foreground)]">{t.title}</p>
                {t.description && (
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[var(--muted-foreground)]">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fechar"
                className="shrink-0 rounded-md p-1 text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// Legacy shim: some code had setToast(string | null). Exports a tiny wrapper so
// existing `flash(msg)` patterns keep working by just calling toast.success.
export function useFlash() {
  const toast = useToast();
  return useCallback((msg: string) => toast.success(msg), [toast]);
}

// Mount a <ToastListener /> once at root; optional ambient usage not needed
// since we route all calls through useToast hook.
export function ToastListener() {
  useEffect(() => {
    // no-op placeholder to keep import tree stable if someone mounts it
  }, []);
  return null;
}
