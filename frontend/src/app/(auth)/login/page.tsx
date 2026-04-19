"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@teste.com");
  const [password, setPassword] = useState("demo123");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (api.getToken()) router.replace("/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark relative grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="backdrop-hero" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-4 font-mono text-[12px] text-[var(--muted-foreground)]">
            Orquestração de pagamentos para empresas
          </p>
        </div>

        <form
          onSubmit={submit}
          className="card-topline rounded-[20px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_70%,transparent)] to-[color-mix(in_srgb,var(--background)_50%,transparent)] p-7 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.015em]">Entrar</h1>
          <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">
            Use as credenciais de teste abaixo
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]"
                placeholder="voce@empresa.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Senha</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]"
                  tabIndex={-1}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : <><LogIn size={14} /> Entrar</>}
          </button>

          <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--brand-cyan)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-cyan)_8%,transparent)] px-3.5 py-3 font-mono text-[11px]">
            <p className="font-display text-[12px] font-semibold text-[var(--brand-cyan)]">Ambiente de teste (mockup)</p>
            <p className="mt-1 text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)]">demo@teste.com</span> · <span className="text-[var(--foreground)]">demo123</span>
            </p>
            <p className="mt-1.5 opacity-70 text-[var(--muted-foreground)]">
              Qualquer e-mail funciona. Prefira <code className="text-[var(--brand-cyan)]">admin@</code>, <code className="text-[var(--brand-cyan)]">approver@</code>,{" "}
              <code className="text-[var(--brand-cyan)]">operator@</code> ou <code className="text-[var(--brand-cyan)]">viewer@</code> para testar cada perfil.
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Double Three · PaymentsHub
        </p>
      </div>
    </div>
  );
}
