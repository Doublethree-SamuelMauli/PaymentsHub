"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
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
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Orquestração de pagamentos para empresas
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl backdrop-blur"
        >
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Entrar</h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Use suas credenciais corporativas
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/20"
                placeholder="voce@empresa.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Senha</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  tabIndex={-1}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : <><LogIn size={14} /> Entrar</>}
          </button>

          <div className="mt-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-[11px] text-[var(--muted-foreground)]">
            <p className="font-semibold text-[var(--foreground)]">Credenciais de demonstração</p>
            <p>admin@demo.com · admin123</p>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Double Three · PaymentsHub
        </p>
      </div>
    </div>
  );
}
