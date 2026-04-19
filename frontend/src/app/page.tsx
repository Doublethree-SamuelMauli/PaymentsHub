"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Layers,
  Lock,
  Activity,
  Users,
  Building2,
  FileText,
  Bell,
  ChevronDown,
  GitBranch,
  Fingerprint,
  Radio,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] dark">
      <div className="backdrop-hero" aria-hidden />
      <Header />
      <main>
        <Hero />
        <StatsStrip />
        <Pipeline />
        <FeaturesBento />
        <DashboardShowcase />
        <SecurityBanner />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/* ────────────────────────────── Header ────────────────────────────── */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-7 py-3.5">
        <Link href="/" className="inline-flex items-center gap-2.5 font-display font-semibold">
          <BrandMark />
          <span className="text-[15px] tracking-tight">
            Payments<span className="text-[var(--brand-cyan)]">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="#produto">Produto</NavLink>
          <NavLink href="#bancos">Bancos</NavLink>
          <NavLink href="#preco">Preços</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
          <NavLink href="/docs">API</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-[13px] font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link href="#demo" className="btn-glow inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]">
            Agendar demo
            <ArrowRight size={14} />
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            <ChevronDown size={18} className={open ? "rotate-180 transition" : "transition"} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--border)] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-7 py-4">
            <MobileLink href="#produto">Produto</MobileLink>
            <MobileLink href="#bancos">Bancos</MobileLink>
            <MobileLink href="#preco">Preços</MobileLink>
            <MobileLink href="#faq">FAQ</MobileLink>
            <MobileLink href="/docs">API</MobileLink>
            <MobileLink href="/login">Entrar</MobileLink>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[var(--muted-foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:text-[var(--foreground)]"
    >
      {children}
    </Link>
  );
}
function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-3 py-2.5 text-[14px] font-medium text-[var(--foreground)]">
      {children}
    </Link>
  );
}

function BrandMark() {
  return (
    <div className="relative h-8 w-8">
      <div
        className="absolute inset-0 rounded-[9px]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, var(--brand-glow) 0%, var(--brand-primary) 55%, var(--brand-deep) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px -4px color-mix(in srgb, var(--brand-glow) 40%, transparent)",
        }}
      />
      <svg viewBox="0 0 24 24" fill="none" className="absolute inset-1 text-white/95" aria-hidden>
        <path d="M6 12l4 4 8-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ────────────────────────────── Hero ────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-20 md:pt-28">
      <div className="mx-auto max-w-7xl px-7">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge>
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-cyan)] shadow-[0_0_8px_var(--brand-cyan)]" />
              Live • SISPAG 341 + PIX DICT
            </Badge>

            <h1 className="mt-6 font-display text-[clamp(40px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.035em]">
              <span className="line-through decoration-[2px] decoration-red-500/60 text-[var(--muted-foreground)]">
                Aprovar no banco
              </span>
              <br />
              <span className="gradient-text">Orquestrar no hub.</span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-[1.55] text-[var(--muted-foreground)]">
              Envie, valide, aprove e envie ao banco —{" "}
              <b className="font-semibold text-[var(--foreground)]">PIX, TED e lotes CNAB 240</b>, com assinatura
              humana e retorno em tempo real. <b className="font-semibold text-[var(--foreground)]">Itaú, Bradesco, Santander, BB, Caixa, Inter, Sicoob, BTG.</b>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#demo" className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[14px]">
                Começar grátis
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_60%,transparent)] px-6 py-3.5 text-[14px] font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-cyan)] hover:text-[var(--brand-cyan)]"
              >
                Ver a API
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 border-t border-[var(--border)] pt-6 font-mono text-[12px] text-[var(--muted-foreground)]">
              <TrustRow icon={<ShieldCheck size={14} />}>mTLS + OAuth2</TrustRow>
              <TrustRow icon={<Lock size={14} />}>LGPD · FEBRABAN</TrustRow>
              <TrustRow icon={<Radio size={14} />}>Webhooks HMAC</TrustRow>
              <TrustRow icon={<Fingerprint size={14} />}>Auditoria imutável</TrustRow>
            </div>
          </div>

          <OrbitalFlow />
        </div>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-cyan)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-cyan)_8%,transparent)] px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.04em] text-[var(--brand-cyan)]">
      {children}
    </span>
  );
}
function TrustRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--brand-emerald)]">{icon}</span>
      {children}
    </div>
  );
}

function OrbitalFlow() {
  const banks = ["341 Itaú", "237 Bradesco", "001 BB", "033 Santander", "104 Caixa", "077 Inter"];
  return (
    <div className="relative ml-auto aspect-square w-full max-w-[560px]">
      {/* Rings */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color-mix(in_srgb,var(--brand-glow)_22%,transparent)] orbit-rotate" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full border border-dotted border-[var(--border)] orbit-rotate-slow" />

      {/* Core */}
      <div
        className="absolute left-1/2 top-1/2 flex aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, #3b82f6 0%, #143573 55%, #0a1d44 100%)",
          boxShadow:
            "0 0 0 1px rgba(96,165,250,0.3), 0 0 60px 12px rgba(59,130,246,0.35), inset 0 0 40px rgba(34,211,238,0.35), inset 0 2px 0 rgba(255,255,255,0.12)",
        }}
      >
        <svg viewBox="0 0 48 48" className="h-[52%] w-[52%] text-white/95" fill="none" aria-hidden>
          <path
            d="M8 24l8 8 24-28"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Bank nodes */}
      {banks.map((bank, i) => {
        const angle = (i / banks.length) * Math.PI * 2 - Math.PI / 2;
        const r = 42;
        const x = 50 + Math.cos(angle) * r;
        const y = 50 + Math.sin(angle) * r;
        return (
          <div
            key={bank}
            className="surface-glass absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-emerald)] shadow-[0_0_8px_var(--brand-emerald)]" />
            <span className="text-[var(--brand-cyan)]">{bank.split(" ")[0]}</span>
            <span className="ml-1.5 text-[var(--foreground)]">{bank.split(" ").slice(1).join(" ")}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────── Stats ────────────────────────────── */
function StatsStrip() {
  const stats = [
    { k: "8", s: "bancos", l: "Integrações nativas" },
    { k: "<120", s: "ms", l: "Latência média PIX" },
    { k: "99.98", s: "%", l: "Uptime 90d" },
    { k: "240", s: "", l: "Colunas CNAB FEBRABAN" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-7">
      <div className="grid border-y border-[var(--border)] sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className={`px-6 py-7 ${i !== stats.length - 1 ? "md:border-r" : ""} ${
              i < 2 ? "border-b md:border-b-0" : ""
            } border-[var(--border)]`}
          >
            <div className="font-display text-[44px] font-semibold leading-none tracking-[-0.03em]">
              {s.k}
              <span className="ml-1 text-[22px] text-[var(--brand-cyan)]">{s.s}</span>
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────── Pipeline ────────────────────────────── */
function Pipeline() {
  const steps = [
    {
      n: "01",
      t: "Recebe do ERP",
      d: "Ingressa PIX/TED via POST /v1/payments. Idempotency-Key. Validação local antes do DICT.",
      icon: <FileText size={20} />,
    },
    {
      n: "02",
      t: "Pré-valida no banco",
      d: "Consulta DICT (PIX) e contrato da conta (TED). Regras: lista suja, limite, duplicidade.",
      icon: <Layers size={20} />,
    },
    {
      n: "03",
      t: "Humano aprova",
      d: "Lote do dia com contagem, valor total e beneficiários. Aprovação com 2FA + auditoria imutável.",
      icon: <Users size={20} />,
    },
    {
      n: "04",
      t: "Dispara ao banco",
      d: "PIX por REST, TED/lote por CNAB 240 via SFTP. Callbacks + webhook HMAC para o seu ERP.",
      icon: <Zap size={20} />,
    },
  ];
  return (
    <section id="produto" className="relative py-28">
      <div className="mx-auto max-w-7xl px-7">
        <div className="eyebrow mb-4">Como funciona</div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          Do ERP ao banco,{" "}
          <span className="gradient-cyan">quatro passos auditáveis.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] leading-[1.6] text-[var(--muted-foreground)]">
          Uma API limpa, regras declarativas, aprovação humana obrigatória. Tudo registrado e versionado.
        </p>

        <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="card-topline group relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_55%,transparent)] to-[color-mix(in_srgb,var(--background)_55%,transparent)] p-7 backdrop-blur-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                {s.icon}
              </div>
              <div className="font-mono text-[11px] tracking-[0.1em] text-[var(--brand-cyan)]">{s.n}</div>
              <h3 className="mt-3 font-display text-[19px] font-semibold tracking-[-0.01em]">{s.t}</h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-[var(--muted-foreground)]">{s.d}</p>
              {i < steps.length - 1 && (
                <div className="absolute right-[-14px] top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--brand-cyan)] lg:flex">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── Features Bento ────────────────────────────── */
function FeaturesBento() {
  return (
    <section id="bancos" className="relative py-24">
      <div className="mx-auto max-w-7xl px-7">
        <div className="eyebrow mb-4">Plataforma</div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          <span className="gradient-cyan">Infra bancária</span>
          <br />
          pronta para produção.
        </h2>

        <div className="mt-14 grid auto-rows-[minmax(220px,auto)] grid-cols-2 gap-5 md:grid-cols-6">
          {/* Live dashboard */}
          <FeatureCard className="md:col-span-3 md:row-span-2">
            <FeatureTag>Lote • lote-2026-04-19</FeatureTag>
            <h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.015em]">
              Aprovação em tempo real
            </h3>
            <p className="text-[13px] leading-[1.6] text-[var(--muted-foreground)]">
              Um só lote agrega PIX + TED. Aprove com um clique e monitore o retorno do banco linha a linha.
            </p>
            <MiniDashboard />
          </FeatureCard>

          {/* Latency */}
          <FeatureCard className="md:col-span-3">
            <FeatureTag>Latência · p95</FeatureTag>
            <h3 className="mt-2 font-display text-[22px] font-semibold">118ms ponta a ponta</h3>
            <p className="text-[13px] leading-[1.55] text-[var(--muted-foreground)]">
              Retry exponencial, circuit breaker e token OAuth2 cache por pagador.
            </p>
            <LatencyWave />
          </FeatureCard>

          {/* Security */}
          <FeatureCard className="md:col-span-3">
            <FeatureTag>Segurança</FeatureTag>
            <h3 className="mt-2 font-display text-[22px] font-semibold">Assinatura 2FA + mTLS</h3>
            <p className="text-[13px] leading-[1.55] text-[var(--muted-foreground)]">
              WebAuthn + TOTP nos operadores, mTLS nos bancos, HMAC nos webhooks.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {["OAuth2", "mTLS", "HMAC", "WebAuthn", "LGPD", "FEBRABAN"].map((c) => (
                <span
                  key={c}
                  className="rounded-lg border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-glow)_8%,transparent)] px-3 py-1.5 font-mono text-[11px] font-medium text-[var(--brand-glow)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard className="md:col-span-2">
            <FeatureIcon>
              <GitBranch size={20} />
            </FeatureIcon>
            <FeatureTag>Webhooks</FeatureTag>
            <h3 className="mt-1 font-display text-[18px] font-semibold">Eventos versionados</h3>
            <p className="text-[12px] leading-[1.55] text-[var(--muted-foreground)]">
              `payment.settled`, `batch.dispatched`, `webhook.retry` — HMAC + retries idempotentes.
            </p>
          </FeatureCard>

          <FeatureCard className="md:col-span-2">
            <FeatureIcon>
              <Activity size={20} />
            </FeatureIcon>
            <FeatureTag>Observabilidade</FeatureTag>
            <h3 className="mt-1 font-display text-[18px] font-semibold">Trace + audit imutável</h3>
            <p className="text-[12px] leading-[1.55] text-[var(--muted-foreground)]">
              Cada transição de estado vira evento append-only. Filtre por operador, banco ou retorno SISPAG.
            </p>
          </FeatureCard>

          <FeatureCard className="md:col-span-2">
            <FeatureIcon>
              <Building2 size={20} />
            </FeatureIcon>
            <FeatureTag>Multi-tenant</FeatureTag>
            <h3 className="mt-1 font-display text-[18px] font-semibold">Marca própria + SSO</h3>
            <p className="text-[12px] leading-[1.55] text-[var(--muted-foreground)]">
              Subdomínio customizado, branding, limites e políticas por cliente. SCIM + SSO (SAML/OIDC).
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_60%,transparent)] to-[color-mix(in_srgb,var(--background)_40%,transparent)] p-7 transition hover:-translate-y-[2px] hover:border-[color-mix(in_srgb,var(--foreground)_16%,transparent)] ${className}`}
    >
      {children}
    </div>
  );
}
function FeatureTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--brand-cyan)]">{children}</div>
  );
}
function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_20%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_14%,transparent)] text-[var(--brand-cyan)]">
      {children}
    </div>
  );
}

function MiniDashboard() {
  const rows = [
    { code: "PAY-20281", name: "ACME Distribuidora", amount: "R$ 12.540,00", status: "SENT", variant: "sent" },
    { code: "PAY-20280", name: "Cooperativa Agrária", amount: "R$ 8.900,00", status: "SETTLED", variant: "ok" },
    { code: "PAY-20279", name: "Logística Atlas", amount: "R$ 3.420,18", status: "PENDING", variant: "wait" },
    { code: "PAY-20278", name: "Gráfica Orion", amount: "R$ 1.960,00", status: "SETTLED", variant: "ok" },
  ];
  return (
    <div className="mt-5 rounded-[14px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] p-4 font-mono">
      {rows.map((r, i) => (
        <div
          key={r.code}
          className={`mt-1 flex items-center justify-between rounded-lg px-3 py-2.5 text-[12px] ${
            i === 1
              ? "border border-[color-mix(in_srgb,var(--brand-emerald)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-emerald)_8%,transparent)]"
              : ""
          }`}
        >
          <span className="text-[var(--brand-cyan)]">{r.code}</span>
          <span className="truncate px-3 text-[var(--muted-foreground)]">{r.name}</span>
          <span className="text-[var(--foreground)]">{r.amount}</span>
          <StatusPill variant={r.variant as "ok" | "wait" | "sent"}>{r.status}</StatusPill>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ variant, children }: { variant: "ok" | "wait" | "sent"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)]",
    wait: "bg-[color-mix(in_srgb,var(--brand-amber)_18%,transparent)] text-[var(--brand-amber)]",
    sent: "bg-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] text-[var(--brand-glow)]",
  }[variant];
  return (
    <span className={`ml-3 rounded-md px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>
  );
}

function LatencyWave() {
  // deterministic sparkline
  const points = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 100;
    const y = 50 + Math.sin(i * 0.6) * 14 + Math.cos(i * 0.25) * 6 - (i === 38 ? 12 : 0);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="relative mt-5 h-28 overflow-hidden rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_60%,transparent)]">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#wave-grad)"
        />
        <polyline points={points} fill="none" stroke="var(--brand-cyan)" strokeWidth="1.2" />
      </svg>
      <div className="absolute left-3 top-3 flex gap-4 font-mono text-[10px] text-[var(--muted-foreground)]">
        <span>
          p50 <b className="font-medium text-[var(--brand-cyan)]">84ms</b>
        </span>
        <span>
          p95 <b className="font-medium text-[var(--brand-cyan)]">118ms</b>
        </span>
        <span>
          p99 <b className="font-medium text-[var(--brand-cyan)]">164ms</b>
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────── Dashboard showcase ────────────────────────────── */
function DashboardShowcase() {
  return (
    <section id="demo" className="relative py-28">
      <div className="mx-auto max-w-7xl px-7">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="eyebrow mb-4">Console do tesoureiro</div>
            <h2 className="font-display text-[clamp(32px,4vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Um painel{" "}
              <span className="gradient-cyan">que não é planilha.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-[1.6] text-[var(--muted-foreground)]">
              Veja o fluxo do dia, o total agregado, o status de cada pagamento. Aprove o lote, libere exceções, reconcilie o retorno. Tudo auditado.
            </p>
            <div className="mt-7 space-y-3">
              {[
                "Visão unificada PIX + TED + boleto",
                "Filtros salvos por operador",
                "Exportação CSV/Parquet e webhooks por estado",
                "Timeline por pagamento, evento a evento",
              ].map((f) => (
                <div key={f} className="flex items-start gap-3 text-[14px] text-[var(--foreground)]">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-emerald)_18%,transparent)] text-[var(--brand-emerald)]">
                    <Check size={12} />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div
      className="relative rounded-[24px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--brand-deep)_35%,transparent)] to-[color-mix(in_srgb,var(--background)_25%,transparent)] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6),0_0_120px_-40px_rgba(59,130,246,0.35)]"
    >
      <div className="flex items-center gap-3 px-3 pb-4 pt-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
        </div>
        <div className="flex-1 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_60%,transparent)] px-3 py-1.5 text-center font-mono text-[11px] text-[var(--muted-foreground)]">
          app.paymentshub.com.br/<b className="font-medium text-[var(--brand-cyan)]">runs/2026-04-19</b>
        </div>
      </div>

      <div className="grid min-h-[520px] grid-cols-[220px_1fr] gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--background)] p-4">
        {/* Sidebar */}
        <aside className="hidden text-[12px] md:block">
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-3 font-display font-semibold">
            <BrandMark />
            <span>
              Payments<span className="text-[var(--brand-cyan)]">Hub</span>
            </span>
          </div>
          <SideLabel>Operação</SideLabel>
          <SideItem active icon={<Activity size={14} />}>Dashboard</SideItem>
          <SideItem icon={<FileText size={14} />}>Pagamentos</SideItem>
          <SideItem icon={<Layers size={14} />}>Lotes</SideItem>
          <SideItem icon={<Users size={14} />}>Beneficiários</SideItem>
          <SideLabel>Plataforma</SideLabel>
          <SideItem icon={<Building2 size={14} />}>Bancos</SideItem>
          <SideItem icon={<ShieldCheck size={14} />}>Auditoria</SideItem>
          <SideItem icon={<Bell size={14} />}>Webhooks</SideItem>
        </aside>

        {/* Main */}
        <main className="px-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-display text-[19px] font-semibold tracking-[-0.01em]">Lote do dia — 19 abr 2026</h4>
              <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                142 pagamentos · R$ 284.912,40 · 3 exigem revisão
              </p>
            </div>
            <button className="btn-glow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px]">
              Aprovar lote <ArrowRight size={12} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <KPI label="PIX" value="98" delta="+12" />
            <KPI label="TED" value="41" delta="+3" />
            <KPI label="Revisão" value="3" delta="−2" highlight />
            <KPI label="Total R$" value="284,9k" delta="+8.1%" />
          </div>

          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_30%,transparent)] p-4">
            <div className="mb-2 flex gap-4 font-mono text-[10px] text-[var(--muted-foreground)]">
              <LegendDot color="var(--brand-glow)">aprovados</LegendDot>
              <LegendDot color="var(--brand-cyan)">enviados</LegendDot>
              <LegendDot color="var(--brand-emerald)">liquidados</LegendDot>
            </div>
            <BarChart />
          </div>

          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <DashTableHeader />
            <DashTableRow code="PAY-3102" who="ACME" bank="341" status="SETTLED" variant="ok" />
            <DashTableRow code="PAY-3103" who="Cooperativa" bank="104" status="SENT" variant="sent" />
            <DashTableRow code="PAY-3104" who="Orion" bank="077" status="REVIEW" variant="wait" />
            <DashTableRow code="PAY-3105" who="Atlas" bank="237" status="APPROVED" variant="approved" />
          </div>
        </main>
      </div>
    </div>
  );
}
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]/70">
      {children}
    </div>
  );
}
function SideItem({
  active,
  icon,
  children,
}: {
  active?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] ${
        active
          ? "border border-[color-mix(in_srgb,var(--brand-glow)_28%,transparent)] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-glow)_16%,transparent)] to-transparent text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {icon}
      {children}
    </div>
  );
}
function KPI({ label, value, delta, highlight }: { label: string; value: string; delta: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        highlight
          ? "border-[color-mix(in_srgb,var(--brand-glow)_35%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_15%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_10%,transparent)]"
          : "border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_40%,transparent)] to-[color-mix(in_srgb,var(--background)_40%,transparent)]"
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 font-display text-[22px] font-semibold tracking-[-0.02em]">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] text-[var(--brand-emerald)]">{delta}</div>
    </div>
  );
}
function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {children}
    </div>
  );
}
function BarChart() {
  const data = [40, 68, 56, 82, 72, 94, 78, 112, 96, 124, 108, 140];
  const max = Math.max(...data);
  return (
    <div className="flex h-24 items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1 overflow-hidden rounded-sm" style={{ height: `${(v / max) * 100}%` }}>
          <div className="h-full w-full bg-gradient-to-t from-[var(--brand-glow)] to-[var(--brand-cyan)] opacity-90" />
        </div>
      ))}
    </div>
  );
}
function DashTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_1.2fr_60px_90px] items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_25%,transparent)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      <span>Código</span>
      <span>Beneficiário</span>
      <span>Banco</span>
      <span>Status</span>
    </div>
  );
}
function DashTableRow({
  code,
  who,
  bank,
  status,
  variant,
}: {
  code: string;
  who: string;
  bank: string;
  status: string;
  variant: "ok" | "sent" | "wait" | "approved";
}) {
  const cls = {
    ok: "bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] text-[var(--brand-emerald)]",
    sent: "bg-[color-mix(in_srgb,var(--brand-cyan)_15%,transparent)] text-[var(--brand-cyan)]",
    wait: "bg-[color-mix(in_srgb,var(--brand-amber)_18%,transparent)] text-[var(--brand-amber)]",
    approved: "bg-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] text-[var(--brand-glow)]",
  }[variant];
  return (
    <div className="grid grid-cols-[1fr_1.2fr_60px_90px] items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 font-mono text-[11.5px] last:border-b-0">
      <span className="text-[var(--brand-cyan)]">{code}</span>
      <span className="truncate text-[var(--foreground)]">{who}</span>
      <span className="text-[var(--muted-foreground)]">{bank}</span>
      <span className={`w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>
    </div>
  );
}

/* ────────────────────────────── Security banner ────────────────────────────── */
function SecurityBanner() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-7">
        <div className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-deep)_40%,transparent)] via-[color-mix(in_srgb,var(--background)_80%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_8%,transparent)] p-10 md:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--brand-glow)] opacity-20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[var(--brand-cyan)] opacity-15 blur-[100px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="eyebrow mb-4">Segurança primeiro</div>
              <h3 className="max-w-2xl font-display text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Arquitetura zero-trust, auditoria imutável,{" "}
                <span className="gradient-cyan">aprovação humana obrigatória.</span>
              </h3>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-[var(--muted-foreground)]">
                Separação de privilégios (operador × aprovador × admin), 2FA no envio, mTLS nos bancos e trilha de eventos append-only. Conformidade LGPD e melhores práticas FEBRABAN.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
              {["ISO 27001", "LGPD", "FEBRABAN", "PCI DSS", "SOC 2", "mTLS"].map((s) => (
                <div
                  key={s}
                  className="flex aspect-square items-center justify-center rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_40%,transparent)] p-4 text-center font-mono text-[11px] font-medium text-[var(--muted-foreground)] backdrop-blur-sm"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── Pricing ────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "Grátis",
      price: "R$ 0",
      suffix: "/mês",
      desc: "Para validar o fluxo. 30 dias sem cartão.",
      cta: "Começar grátis",
      features: ["Até 50 pagamentos/mês", "1 usuário", "1 banco conectado", "Auditoria básica"],
      variant: "ghost",
    },
    {
      name: "Business",
      price: "R$ 97",
      suffix: "/usuário/mês",
      desc: "Time financeiro completo. Setup R$ 4.900.",
      cta: "Falar com vendas",
      features: [
        "Pagamentos ilimitados",
        "Multi-banco + CNAB 240",
        "Aprovação com 2FA",
        "Webhooks + API completa",
        "SSO + SCIM",
        "Suporte 9×5 em português",
      ],
      variant: "featured",
    },
    {
      name: "Enterprise",
      price: "Custom",
      suffix: "",
      desc: "SLA dedicado, marca própria, infra isolada.",
      cta: "Conversar",
      features: ["SLA 99.99%", "Infra dedicada", "Marca própria", "Suporte 24×7", "On-call + runbook"],
      variant: "ghost",
    },
  ];
  return (
    <section id="preco" className="relative py-24">
      <div className="mx-auto max-w-7xl px-7">
        <div className="eyebrow mb-4">Preços</div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] font-semibold leading-[1.05] tracking-[-0.03em]">
          Simples, <span className="gradient-cyan">por usuário</span>.
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] leading-[1.6] text-[var(--muted-foreground)]">
          Sem taxa por pagamento, sem taxa por banco. Você paga por quem usa o sistema.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`card-topline relative overflow-hidden rounded-[22px] border p-7 ${
                p.variant === "featured"
                  ? "border-[color-mix(in_srgb,var(--brand-glow)_35%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_15%,transparent)] via-[color-mix(in_srgb,var(--card)_60%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_10%,transparent)]"
                  : "border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)]"
              }`}
            >
              {p.variant === "featured" && (
                <span className="absolute right-5 top-5 rounded-full bg-[var(--brand-cyan)] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#05070d]">
                  Popular
                </span>
              )}
              <div className="font-display text-[13px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                {p.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-[42px] font-semibold tracking-[-0.03em]">{p.price}</span>
                <span className="text-[13px] text-[var(--muted-foreground)]">{p.suffix}</span>
              </div>
              <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">{p.desc}</p>
              <ul className="mt-6 space-y-2.5 text-[13.5px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check size={14} className="mt-1 shrink-0 text-[var(--brand-emerald)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="#demo"
                className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition ${
                  p.variant === "featured"
                    ? "btn-glow"
                    : "border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_60%,transparent)] text-[var(--foreground)] hover:border-[var(--brand-cyan)] hover:text-[var(--brand-cyan)]"
                }`}
              >
                {p.cta}
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── FAQ ────────────────────────────── */
function FAQ() {
  const faqs = [
    {
      q: "Quais bancos vocês integram?",
      a: "Itaú (PIX REST + CNAB 240), Bradesco, Santander, Banco do Brasil, Caixa, Inter, Sicoob e BTG Pactual. Novos bancos entram a cada sprint conforme demanda dos clientes.",
    },
    {
      q: "Preciso do CNAB 240 ou dá pra usar só PIX?",
      a: "Os dois funcionam. PIX é a via rápida (REST síncrono). CNAB 240 é necessário para TED em lote e para bancos que ainda não oferecem PIX REST empresarial — o PaymentsHub gera e assina os arquivos automaticamente.",
    },
    {
      q: "Como funciona a aprovação humana?",
      a: "Todo pagamento passa por um estado APROVADO antes de ir ao banco. A aprovação exige 2FA (TOTP ou WebAuthn) e fica registrada com timestamp, IP e agente. Dá para configurar alçadas por valor, beneficiário ou banco.",
    },
    {
      q: "Vocês guardam dados bancários?",
      a: "Chaves PIX e dados de conta são criptografados no banco (AES-256) com chave por tenant. Certificados mTLS ficam em HSM. LGPD compliance com retenção configurável e direito ao esquecimento.",
    },
    {
      q: "Preciso trocar meu ERP?",
      a: "Não. O PaymentsHub recebe pagamentos via REST e dispara webhooks. Temos templates para SAP, Totvs, Omie, Conta Azul e ContaSimples, ou você usa a API crua.",
    },
  ];
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-4xl px-7">
        <div className="eyebrow mb-4">FAQ</div>
        <h2 className="font-display text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.1] tracking-[-0.03em]">
          Perguntas que todo financeiro faz.
        </h2>

        <div className="mt-10 divide-y divide-[var(--border)] rounded-[20px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_50%,transparent)]">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-7">
      <button
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-display text-[16px] font-semibold">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--muted-foreground)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 pr-10 text-[14px] leading-[1.7] text-[var(--muted-foreground)]">{a}</p>}
    </div>
  );
}

/* ────────────────────────────── CTA ────────────────────────────── */
function CTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-7">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-deep)] to-[var(--background)] p-14 text-center md:p-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--brand-cyan)] opacity-30 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-24 h-72 w-72 rounded-full bg-[var(--brand-glow)] opacity-25 blur-[120px]" />
          <div className="relative">
            <h3 className="mx-auto max-w-3xl font-display text-[clamp(28px,4vw,54px)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
              Pronto pra tirar o financeiro da planilha?
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.6] text-white/70">
              30 dias grátis. Onboarding em 48h. Primeiro lote no ar em menos de uma semana.
            </p>
            <div className="mt-8 inline-flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-glow inline-flex items-center gap-2 rounded-full px-7 py-4 text-[14px]">
                Começar grátis
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-[14px] font-semibold text-white transition hover:border-white/40"
              >
                Falar com vendas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── Footer ────────────────────────────── */
function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_60%,transparent)] py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-7 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold">
            <BrandMark />
            <span>
              Payments<span className="text-[var(--brand-cyan)]">Hub</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-[1.65] text-[var(--muted-foreground)]">
            Orquestração bancária para empresas brasileiras. PIX, TED e CNAB 240 em um só hub, com aprovação humana auditada.
          </p>
          <p className="mt-5 font-mono text-[11px] text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Double Three Tecnologia · CNPJ 33.720.345/0001-79
          </p>
        </div>
        <FooterCol title="Produto">
          <FooterLink href="#produto">Como funciona</FooterLink>
          <FooterLink href="#bancos">Bancos</FooterLink>
          <FooterLink href="#preco">Preços</FooterLink>
          <FooterLink href="/docs">API</FooterLink>
          <FooterLink href="/status">Status</FooterLink>
        </FooterCol>
        <FooterCol title="Empresa">
          <FooterLink href="/about">Sobre</FooterLink>
          <FooterLink href="/careers">Carreiras</FooterLink>
          <FooterLink href="/contact">Contato</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
          <FooterLink href="/changelog">Changelog</FooterLink>
        </FooterCol>
        <FooterCol title="Legal">
          <FooterLink href="/legal/terms">Termos</FooterLink>
          <FooterLink href="/legal/privacy">Privacidade</FooterLink>
          <FooterLink href="/legal/dpa">DPA</FooterLink>
          <FooterLink href="/legal/security">Segurança</FooterLink>
        </FooterCol>
      </div>
    </footer>
  );
}
function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {title}
      </div>
      <div className="flex flex-col gap-2.5 text-[13.5px]">{children}</div>
    </div>
  );
}
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[var(--foreground)]/80 transition hover:text-[var(--brand-cyan)]">
      {children}
    </Link>
  );
}
