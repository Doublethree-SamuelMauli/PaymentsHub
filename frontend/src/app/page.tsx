"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Calendar,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  Play,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ScrollReveal, Parallax, StaggerChildren } from "@/components/motion/scroll-reveal";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <Header />
      <Hero />
      <LogosBar />
      <ProblemSolution />
      <Features />
      <DashboardPreview />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------- Header ---------- */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Logo size="md" />

        <nav className="hidden items-center gap-1 md:flex">
          <NavMenu
            label="Produto"
            items={[
              ["Funcionalidades", "#features"],
              ["Para quem é", "#solutions"],
              ["Segurança", "#security"],
            ]}
          />
          <NavLink href="#pricing">Preços</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
          <NavLink href="/docs">API</NavLink>
          <NavLink href="/about">Sobre</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="#demo"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(20,53,115,0.55)] transition hover:shadow-[0_8px_30px_-8px_rgba(20,53,115,0.75)]"
          >
            Agendar demo
            <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--foreground)] md:hidden"
          >
            <ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-3 md:hidden">
          <a href="#features" className="block py-1.5 text-sm text-[var(--foreground)]">Funcionalidades</a>
          <a href="#pricing" className="block py-1.5 text-sm text-[var(--foreground)]">Preços</a>
          <a href="#faq" className="block py-1.5 text-sm text-[var(--foreground)]">FAQ</a>
          <Link href="/login" className="block py-1.5 text-sm text-[var(--foreground)]">Entrar</Link>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      className="rounded-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
    >
      {children}
    </a>
  );
}

function NavMenu({ label, items }: { label: string; items: [string, string][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
        {label} <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl">
          {items.map(([l, h]) => (
            <a key={l} href={h} className="block rounded-md px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--muted)]">
              {l}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Parallax speed={-0.08}><div className="glow-orb left-[-10%] top-[10%] h-[480px] w-[480px] bg-[#1e4ea8]" /></Parallax>
      <Parallax speed={0.06}><div className="glow-orb right-[-15%] top-[-5%] h-[520px] w-[520px] bg-[#3b82f6]" /></Parallax>
      <div className="noise" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/70 px-3 py-1 text-[11px] font-medium text-[var(--muted-foreground)] backdrop-blur transition hover:border-[#1e4ea8]/40"
          >
            <span className="rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-2 py-0.5 text-[10px] font-bold text-white">
              NOVO
            </span>
            Aprovação consolidada com PIX + TED no mesmo lote
            <ArrowRight size={11} />
          </a>

          <h1 className="text-balance mt-6 text-[28px] font-bold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl">
            O fim da{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-white">planilha</span>
              <span className="absolute inset-x-[-4px] inset-y-[-2px] -z-0 -rotate-1 rounded-md bg-gradient-to-r from-[#143573] to-[#1e4ea8]" />
            </span>
            {" "}de pagamentos do dia a dia
          </h1>

          <p className="text-pretty mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Receba pagamentos do seu sistema, junte tudo em um lote diário,
            aprove com 2 cliques e dispare PIX e TED para o banco — em uma única operação auditável.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(20,53,115,0.65)] transition hover:shadow-[0_16px_40px_-12px_rgba(20,53,115,0.85)]"
            >
              Agendar demo de 20min
              <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[#1e4ea8]/50 hover:bg-[var(--muted)]"
            >
              <Play size={12} fill="currentColor" /> Ver ambiente demo
            </Link>
          </div>

          <p className="mt-5 text-[11px] text-[var(--muted-foreground)]">
            Sem cartão · Teste grátis em minutos · Funciona com o seu banco
          </p>
        </div>

        {/* Desktop mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-10 -top-4 h-12 rounded-full bg-gradient-to-r from-[#143573]/40 to-[#1e4ea8]/40 blur-2xl" />
          <ProductMockup />
        </div>

        {/* 2 phones flutuando — product photography style */}
        <div className="relative mx-auto mt-14 flex justify-center px-4">
          <div className="relative h-[440px] w-full max-w-[560px] sm:h-[520px] md:h-[580px]">
            {/* Sombras difusas no chão */}
            <div className="absolute bottom-[2%] left-[22%] h-[40px] w-[120px] rounded-[50%] bg-black/10 blur-xl sm:h-[50px] sm:w-[140px]" style={{ transform: "rotate(-5deg)" }} />
            <div className="absolute bottom-[0%] right-[18%] h-[40px] w-[120px] rounded-[50%] bg-black/10 blur-xl sm:h-[50px] sm:w-[140px]" style={{ transform: "rotate(5deg)" }} />

            {/* Phone esquerdo — foreground */}
            <Parallax speed={0.04}>
              <div
                className="absolute left-[5%] top-[4%] z-20 sm:left-[10%]"
                style={{ transform: "rotate(-5deg)", transformOrigin: "center bottom" }}
              >
                <ScrollReveal direction="left" delay={300} duration={900}>
                  <PhoneMockup variant="list" size="lg" />
                </ScrollReveal>
              </div>
            </Parallax>

            {/* Phone direito — background */}
            <Parallax speed={-0.03}>
              <div
                className="absolute right-[2%] top-[0%] z-10 sm:right-[8%]"
                style={{ transform: "rotate(5deg) translateY(-10px)", transformOrigin: "center bottom" }}
              >
                <ScrollReveal direction="right" delay={500} duration={900}>
                  <PhoneMockup variant="approve" size="lg" />
                </ScrollReveal>
              </div>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductMockup() {
  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl shadow-[#143573]/10">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 truncate text-[10px] text-[var(--muted-foreground)]">
          paymentshub.app/batch
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
          {/* fake sidebar */}
          <div className="hidden border-r border-[var(--border)] bg-[var(--card)] p-3 sm:block">
            <div className="mb-3 h-2.5 w-20 rounded bg-[var(--muted)]" />
            {[
              ["Dashboard", false],
              ["Lote do Dia", true],
              ["Pagamentos", false],
              ["Beneficiários", false],
              ["Relatórios", false],
            ].map(([l, active], i) => (
              <div
                key={i}
                className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${active
                  ? "bg-gradient-to-r from-[#143573] to-[#1e4ea8] font-semibold text-white"
                  : "text-[var(--muted-foreground)]"
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-[var(--muted-foreground)]"}`} />
                {l}
              </div>
            ))}
          </div>
          {/* fake content */}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--foreground)]">Lote do Dia · 15/abr</div>
                <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">42 pagamentos pendentes</div>
              </div>
              <div className="flex gap-1.5">
                <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[9px] font-bold text-emerald-600">+ APROVAR LOTE</span>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                ["Volume", "R$ 287k", "from-[#143573] to-[#1e4ea8]"],
                ["PIX", "31", "from-emerald-400 to-teal-500"],
                ["TED", "11", "from-amber-400 to-orange-500"],
              ].map(([l, v, g], i) => (
                <div key={i} className={`rounded-lg bg-gradient-to-br ${g} p-2 text-white`}>
                  <div className="text-[8px] uppercase opacity-80">{l}</div>
                  <div className="text-sm font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {[
                ["INV-2841", "Tech Supply LTDA", "R$ 12.430,00", "PIX"],
                ["INV-2842", "Logística Norte SA", "R$ 8.900,00", "TED"],
                ["INV-2843", "Marketing Plus", "R$ 4.250,50", "PIX"],
                ["INV-2844", "Cloud Services BR", "R$ 19.870,00", "PIX"],
              ].map(([id, name, val, type], i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#1e4ea8]">{id}</span>
                    <span className="text-[10px] text-[var(--foreground)]">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[var(--foreground)]">{val}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${type === "PIX" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                      {type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Phone Mockup ---------- */
function PhoneMockup({ variant, size = "lg" }: { variant: "list" | "approve"; size?: "md" | "lg" }) {
  // Aspect ratio iPhone 15 Pro: 71.6 x 146.6 mm ≈ 1:2.05
  const w = size === "lg" ? "w-[220px] sm:w-[240px] md:w-[260px]" : "w-[190px] sm:w-[210px] md:w-[230px]";
  return (
    <div className={`${w} shrink-0`} style={{ aspectRatio: "1 / 2.05" }}>
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: "18% / 8.8%",
          background: "linear-gradient(165deg, #2e3f65 0%, #1C2B45 25%, #15203a 55%, #1a2a4a 100%)",
          boxShadow:
            "0 30px 60px -15px rgba(0,0,0,0.35), " +
            "0 15px 30px -10px rgba(20,53,115,0.25), " +
            "inset 0 0.5px 0 rgba(255,255,255,0.12), " +
            "inset 0 -0.5px 0 rgba(0,0,0,0.3)",
          padding: "2.8%",
        }}
      >
        {/* Side buttons — left (action + vol up + vol down) */}
        <div className="absolute -left-[2px] top-[16%] h-[5%] w-[2.5px] rounded-l-[2px]" style={{ background: "linear-gradient(180deg, #3a4d73, #253756)" }} />
        <div className="absolute -left-[2px] top-[24%] h-[8.5%] w-[2.5px] rounded-l-[2px]" style={{ background: "linear-gradient(180deg, #3a4d73, #253756)" }} />
        <div className="absolute -left-[2px] top-[35%] h-[8.5%] w-[2.5px] rounded-l-[2px]" style={{ background: "linear-gradient(180deg, #3a4d73, #253756)" }} />
        {/* Side button — right (power) */}
        <div className="absolute -right-[2px] top-[27%] h-[11%] w-[2.5px] rounded-r-[2px]" style={{ background: "linear-gradient(180deg, #3a4d73, #253756)" }} />

        {/* Screen — black bezel then display */}
        <div
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: "16% / 7.8%", padding: "1.5px" }}
        >
          <div
            className="relative h-full w-full overflow-hidden bg-[var(--background)]"
            style={{ borderRadius: "15.5% / 7.5%" }}
          >
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-[1.5%] z-10 -translate-x-1/2">
              <div className="h-[3.2%] rounded-full bg-black" style={{ width: "28%", minWidth: 56, minHeight: 12 }}>
                <div className="flex h-full items-center justify-end pr-[4px]">
                  <div className="h-[6px] w-[6px] rounded-full bg-[#1a1a2e]/60" />
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="relative flex items-center justify-between px-[10%] pt-[4%]">
              <span className="text-[8px] font-semibold tracking-tight text-[var(--foreground)]">9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal */}
                <div className="flex items-end gap-[1.5px]">
                  {[3, 5, 7, 9].map((h, i) => (
                    <div key={i} className="w-[2px] rounded-[0.5px] bg-[var(--foreground)]" style={{ height: h }} />
                  ))}
                </div>
                {/* WiFi dots */}
                <div className="flex items-end gap-[1px]">
                  <div className="h-[3px] w-[3px] rounded-full bg-[var(--foreground)]" />
                  <div className="h-[5px] w-[2px] rounded-t-full bg-[var(--foreground)]" />
                  <div className="h-[7px] w-[2px] rounded-t-full bg-[var(--foreground)]" />
                </div>
                {/* Battery */}
                <div className="flex items-center">
                  <div className="flex h-[7px] w-[16px] items-center rounded-[2px] border border-[var(--foreground)]/40 px-[1px]">
                    <div className="h-[4px] flex-1 rounded-[1px] bg-emerald-500" />
                  </div>
                  <div className="h-[3px] w-[1px] rounded-r-full bg-[var(--foreground)]/40" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-[6%] pb-[8%] pt-[3%]">
              {variant === "list" ? <PhoneListContent /> : <PhoneApproveContent />}
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-[1.5%] left-1/2 -translate-x-1/2">
              <div className="h-[4px] w-[44px] rounded-full bg-[var(--foreground)]/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneListContent() {
  return (
    <div className="flex h-full flex-col">
      {/* App header */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex h-[16px] w-[16px] items-center justify-center rounded-md bg-gradient-to-br from-[#143573] to-[#1e4ea8]">
          <Check size={8} className="text-white" />
        </div>
        <span className="text-[8px] font-bold tracking-tight text-[var(--foreground)]">PaymentsHub</span>
      </div>
      {/* Page title */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[var(--foreground)]">Lote do Dia</p>
          <p className="text-[6px] text-[var(--muted-foreground)]">16 abr · 14 pagamentos</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[5px] font-bold text-emerald-600">ABERTO</span>
        </div>
      </div>
      {/* Stats */}
      <div className="mb-2 grid grid-cols-3 gap-[3px]">
        {[
          ["R$ 65k", "Volume", "from-[#143573] to-[#1e4ea8]"],
          ["10", "PIX", "from-emerald-500 to-emerald-700"],
          ["4", "TED", "from-amber-500 to-amber-700"],
        ].map(([v, l, g], i) => (
          <div key={i} className={`overflow-hidden rounded-lg bg-gradient-to-br ${g} p-[5px] text-white`}>
            <div className="text-[4.5px] font-semibold uppercase tracking-wider opacity-75">{l}</div>
            <div className="text-[10px] font-extrabold leading-none">{v}</div>
          </div>
        ))}
      </div>
      {/* Payments list */}
      <div className="flex-1 space-y-[2px]">
        {[
          ["NF-005", "Tech Supply LTDA", "2.500,00", true, "approved"],
          ["NF-007", "Logística Norte", "1.250,00", true, "pending"],
          ["NF-006", "Infra Corp ME", "7.800,00", false, "approved"],
          ["NF-012", "Marketing Plus", "9.500,00", true, "review"],
          ["NF-020", "Metal BR Ind.", "5.600,00", false, "pending"],
          ["NF-009", "Cloud Services BR", "18.000,00", false, "pending"],
        ].map(([id, name, val, isPix, status], i) => (
          <div key={i} className="flex items-center gap-[5px] rounded-[6px] border border-[var(--border)] bg-[var(--card)] p-[4px]">
            {/* Checkbox */}
            <div className={`flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-[3px] border ${i < 3 ? "border-[#1e4ea8] bg-[#1e4ea8]" : "border-[var(--border)]"}`}>
              {i < 3 && <Check size={6} className="text-white" />}
            </div>
            {/* Type badge */}
            <div className={`flex h-[12px] w-[12px] shrink-0 items-center justify-center rounded-[3px] text-[4.5px] font-extrabold text-white ${isPix ? "bg-emerald-500" : "bg-amber-500"}`}>
              {isPix ? "₱" : "T"}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[6px] font-bold text-[#1e4ea8]">{id}</p>
              <p className="truncate text-[5px] text-[var(--muted-foreground)]">{name}</p>
            </div>
            {/* Amount + status */}
            <div className="text-right">
              <p className="text-[6.5px] font-bold tabular-nums text-[var(--foreground)]">R$ {val}</p>
              <div className={`mt-[1px] rounded-full px-1 py-[0.5px] text-center text-[3.5px] font-bold ${
                status === "approved" ? "bg-emerald-500/15 text-emerald-600" :
                status === "review" ? "bg-amber-500/15 text-amber-600" :
                "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}>
                {status === "approved" ? "Aprovado" : status === "review" ? "Revisão" : "Pendente"}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Total bar */}
      <div className="mt-1.5 overflow-hidden rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#143573]/8 to-[#1e4ea8]/8 px-2 py-[5px]">
          <span className="text-[5.5px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Total · 14 pgtos</span>
          <span className="text-[8.5px] font-extrabold tabular-nums text-[var(--foreground)]">R$ 65.000,50</span>
        </div>
      </div>
      {/* Bottom nav */}
      <div className="mt-2 flex items-center justify-around rounded-xl bg-[var(--muted)]/60 px-1 py-[5px]">
        {[
          ["Dashboard", false], ["Lote", true], ["Pgtos", false], ["Config", false],
        ].map(([label, active], i) => (
          <div key={i} className="flex flex-col items-center gap-[1px]">
            <div className={`h-[3px] w-[3px] rounded-full ${active ? "bg-[#1e4ea8]" : "bg-transparent"}`} />
            <span className={`text-[4.5px] font-semibold ${active ? "text-[#1e4ea8]" : "text-[var(--muted-foreground)]"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneApproveContent() {
  return (
    <div className="flex h-full flex-col">
      {/* Back nav */}
      <div className="mb-2 flex items-center gap-1">
        <ArrowRight size={7} className="rotate-180 text-[#1e4ea8]" />
        <span className="text-[6px] font-semibold text-[#1e4ea8]">Voltar</span>
      </div>
      {/* Hero icon */}
      <div className="mb-2 text-center">
        <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#143573] to-[#1e4ea8] shadow-[0_4px_12px_-3px_rgba(20,53,115,0.5)]">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <p className="text-[10px] font-bold text-[var(--foreground)]">Aprovar Lote</p>
        <p className="text-[6px] text-[var(--muted-foreground)]">16 de abril de 2026</p>
      </div>
      {/* Summary card */}
      <div className="mb-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {[
          ["Pagamentos", "14", null],
          ["PIX", "10", "R$ 48.320,50"],
          ["TED", "4", "R$ 16.680,00"],
        ].map(([l, count, val], i) => (
          <div key={i} className="flex items-center justify-between border-b border-[var(--border)] px-2 py-[4px] last:border-b-0">
            <div className="flex items-center gap-1.5">
              <div className={`h-[6px] w-[6px] rounded-full ${i === 0 ? "bg-[#1e4ea8]" : i === 1 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-[6px] text-[var(--muted-foreground)]">{l}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[6.5px] font-bold tabular-nums text-[var(--foreground)]">{count}</span>
              {val && <span className="text-[5.5px] tabular-nums text-[var(--muted-foreground)]">{val}</span>}
            </div>
          </div>
        ))}
        <div className="bg-gradient-to-r from-[#143573]/6 to-[#1e4ea8]/6 px-2 py-[5px]">
          <div className="flex items-center justify-between">
            <span className="text-[6px] font-extrabold uppercase tracking-wider text-[var(--foreground)]">Volume total</span>
            <span className="text-[9px] font-extrabold tabular-nums text-[var(--foreground)]">R$ 65.000,50</span>
          </div>
        </div>
      </div>
      {/* Warning */}
      <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-[6px] dark:border-amber-800 dark:bg-amber-950/40">
        <div className="mt-[1px] text-[7px] text-amber-600">⚠</div>
        <div>
          <p className="text-[5.5px] font-bold text-amber-700 dark:text-amber-400">Ação irreversível</p>
          <p className="text-[5px] leading-relaxed text-amber-600 dark:text-amber-400">Os pagamentos serão submetidos ao banco imediatamente.</p>
        </div>
      </div>
      {/* Actions */}
      <div className="space-y-[5px]">
        <button className="flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-[8px] text-[7.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5)]">
          <Check size={9} strokeWidth={3} /> Confirmar aprovação
        </button>
        <button className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-[6px] text-[6.5px] font-semibold text-[var(--muted-foreground)]">
          Cancelar
        </button>
      </div>
      {/* Approver */}
      <div className="mt-auto pt-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--muted)]/60 p-[6px]">
          <div className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-[#143573] to-[#1e4ea8] text-[5px] font-bold text-white">SM</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[6px] font-semibold text-[var(--foreground)]">Samuel Mauli</p>
            <p className="truncate text-[5px] text-[var(--muted-foreground)]">Administrador</p>
          </div>
          <div className="h-[5px] w-[5px] rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Logos bar ---------- */
function LogosBar() {
  const logos = ["Itaú", "Bradesco", "Santander", "BB", "Caixa", "Inter", "Sicoob", "BTG"];
  return (
    <section className="border-y border-[var(--border)] bg-[var(--card)] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Integra com os principais bancos brasileiros
        </p>
        <div className="flex items-center justify-center gap-x-10 gap-y-4 flex-wrap opacity-70">
          {logos.map((l) => (
            <span key={l} className="text-xl font-bold tracking-tight text-[var(--muted-foreground)] grayscale transition hover:opacity-100 hover:text-[var(--foreground)]">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Problem / Solution ---------- */
function ProblemSolution() {
  return (
    <section id="solutions" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <ScrollReveal direction="left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">O problema</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Você ainda aprova<br />pagamentos um a um.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
            {[
              "Planilhas entre financeiro e diretoria",
              "Aprovação por WhatsApp, sem trilha de auditoria",
              "Erro de digitação já te custou algo?",
              "Cada banco tem um portal",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">×</span>
                {p}
              </li>
            ))}
          </ul>
        </ScrollReveal>
        <ScrollReveal direction="right" delay={200}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">A virada</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Um lote. Um clique.<br />Um relatório auditável.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
            {[
              "Ingestão automática com seu ERP",
              "Workflow permissionado por níveis",
              "Validação de PIX/TED antes de tocar o banco",
              "Atualizações em tempo real",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <Check size={10} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */
function Features() {
  const features = [
    {
      icon: <Layers size={20} />,
      title: "Aprovação em lote",
      desc: "Junte todos os pagamentos do dia e aprove de uma vez. Sem ficar clicando um por um no portal do banco.",
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "Controle por perfil",
      desc: "Quem cria não aprova. Quem aprova não configura. Cada pessoa com sua permissão, tudo registrado.",
    },
    {
      icon: <Sparkles size={20} />,
      title: "PIX na hora",
      desc: "Envia PIX direto do sistema e recebe confirmação em segundos. Sem precisar entrar no banco.",
    },
    {
      icon: <Calendar size={20} />,
      title: "TED automático",
      desc: "O sistema gera o arquivo que o banco precisa e envia automaticamente. Zero trabalho manual.",
    },
    {
      icon: <Lock size={20} />,
      title: "Cada empresa isolada",
      desc: "Seus dados ficam separados dos outros clientes. Segurança bancária, criptografia em tudo.",
    },
    {
      icon: <Play size={20} />,
      title: "Teste antes de contratar",
      desc: "Ambiente de demonstração pronto em minutos para você ver como funciona na prática.",
    },
  ];
  return (
    <section id="features" className="border-t border-[var(--border)] bg-[var(--card)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Construído para times de finanças.<br />Vamos facilitar a vida de seus aprovadores?
            </h2>
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Chega de portal de banco. Seus pagamentos saem direto do sistema, com aprovação, rastreio e segurança.
            </p>
          </div>
        </ScrollReveal>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100} distance={20}>
              <div className="group bg-[var(--card)] p-6 transition hover:bg-[var(--background)]">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-[#1e4ea8] transition group-hover:from-[#143573] group-hover:to-[#1e4ea8] group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Dashboard preview ---------- */
function DashboardPreview() {
  return (
    <section id="security" className="relative overflow-hidden py-24">
      <div className="glow-orb right-[-10%] top-[20%] h-[400px] w-[400px] bg-[#1e4ea8] opacity-30" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Rastreio completo</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Saiba quem fez o quê e quando
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Cada pagamento tem um histórico completo: quem criou, quem aprovou,
            quando foi enviado ao banco e quando caiu na conta. Tudo registrado
            automaticamente — pronto para qualquer auditoria.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-[var(--foreground)]">
            {[
              "Histórico completo de cada pagamento",
              "Registro de quem aprovou e por quê",
              "Dados protegidos com criptografia bancária",
              "Relatórios prontos para auditoria e compliance",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-emerald-500" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Histórico</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Pago</span>
          </div>
          <ol className="space-y-3">
            {[
              ["09:14", "Sistema", "Recebido", "pagamento chegou no sistema"],
              ["09:14", "Sistema", "Validado", "dados conferidos automaticamente"],
              ["09:32", "Carla Mendes", "Em revisão", "valor acima de R$ 10 mil"],
              ["10:01", "Diretor financeiro", "Aprovado", "incluído no lote do dia"],
              ["10:02", "Sistema", "Enviado ao banco", "PIX processado"],
              ["10:02", "Banco", "Pago", "dinheiro na conta do fornecedor"],
            ].map(([t, who, ev, note], i) => (
              <li key={i} className="relative border-l-2 border-[#1e4ea8]/30 pl-4">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8]" />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]">{ev}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{t}</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">por {who} · {note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
/* ---------- Pricing ---------- */
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      cadence: "para sempre",
      desc: "Veja como funciona na prática antes de contratar. Sem compromisso.",
      features: [
        "1 usuário por empresa",
        "Até 100 pagamentos/mês",
        "1 banco conectado",
        "PIX e TED automáticos",
        "Aprovação pelo celular",
        "Implantação: R$ 990",
      ],
      cta: "Começar grátis",
      ctaLink: "#demo",
      featured: false,
    },
    {
      name: "Business",
      price: "R$ 97",
      cadence: "/usuário/mês",
      desc: "Para quem paga fornecedor todo dia. Vários bancos, sua marca, equipe inteira.",
      features: [
        "Até 20 usuários com permissões",
        "Até 5.000 pagamentos/mês",
        "Vários bancos (Itaú, Inter, Bradesco, Caixa)",
        "Sua marca, suas cores, seu endereço",
        "Recebe NF-e, pedidos, planilhas",
        "Notificações em tempo real · Suporte 12h",
        "Implantação: R$ 4.900",
      ],
      cta: "Agendar demo",
      ctaLink: "#demo",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      cadence: "contrato anual",
      desc: "Para grandes operações. Infraestrutura dedicada, suporte direto e integração sob medida.",
      features: [
        "Usuários ilimitados",
        "Pagamentos ilimitados",
        "Todos os bancos + integrações com seu sistema",
        "Servidor exclusivo para sua empresa",
        "Garantia de disponibilidade 99,95%",
        "Gerente de conta dedicado",
        "Implantação e migração sob consulta",
      ],
      cta: "Falar com vendas",
      ctaLink: "#demo",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Preços</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Comece grátis. Pague quando crescer.
          </h2>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Sem letra miúda, sem taxa por transação. O preço escala com volume, não com susto.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-5 sm:p-7 ${
                p.featured
                  ? "border-[#1e4ea8] bg-gradient-to-b from-[#143573]/5 to-[#1e4ea8]/5 shadow-2xl shadow-[#1e4ea8]/10"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-lg font-bold text-[var(--foreground)]">{p.name}</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{p.price}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{p.cadence}</span>
              </div>
              <Link
                href={p.ctaLink}
                className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                  p.featured
                    ? "bg-gradient-to-r from-[#143573] to-[#1e4ea8] text-white shadow-[0_8px_20px_-8px_rgba(20,53,115,0.55)] hover:shadow-[0_8px_28px_-8px_rgba(20,53,115,0.75)]"
                    : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[#1e4ea8]/50"
                }`}
              >
                {p.cta} <ArrowRight size={12} />
              </Link>
              <ul className="mt-6 space-y-2.5 border-t border-[var(--border)] pt-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                    <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const items = [
    {
      q: "Como conecta com o meu banco?",
      a: "Você coloca as credenciais do seu banco no sistema (certificado digital e chaves de acesso). Nós fazemos a verificação automática. Se algo der errado, nosso suporte te ajuda a configurar.",
    },
    {
      q: "O dinheiro passa por vocês?",
      a: "Não. O dinheiro sai direto da sua conta bancária para o fornecedor. O PaymentsHub só organiza e envia a instrução pro banco — nunca toca no dinheiro.",
    },
    {
      q: "Quanto tempo leva para começar a usar?",
      a: "O ambiente de teste fica pronto no mesmo dia. Para começar a pagar fornecedores de verdade, a média é 2 semanas — depende do prazo do seu banco para liberar o acesso.",
    },
    {
      q: "Funciona no celular?",
      a: "Sim. O aprovador pode ver os pagamentos do dia e aprovar o lote direto pelo celular, de qualquer lugar. O sistema é 100% web, não precisa instalar nada.",
    },
    {
      q: "Como funciona a aprovação?",
      a: "Cada pessoa tem um nível de acesso. Quem registra pagamentos não pode aprovar. Quem aprova não configura o sistema. Tudo fica registrado — quem fez o quê e quando.",
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim. No Starter e Business não tem contrato de fidelidade. Você cancela quando quiser. Só o Enterprise tem contrato anual.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-[var(--border)] bg-[var(--card)] py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Perguntas que sempre fazem
          </h2>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--muted)]"
              >
                <span className="text-sm font-semibold text-[var(--foreground)]">{it.q}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-[var(--muted-foreground)] transition ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="border-t border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {it.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA / Demo form ---------- */
function CTA() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          volume: fd.get("volume"),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Falha ao enviar");
      }
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Erro desconhecido");
    } finally { setBusy(false); }
  }

  return (
    <section id="demo" className="relative overflow-hidden py-24">
      <div className="glow-orb left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[#1e4ea8]" />
      <div className="relative mx-auto max-w-3xl px-6">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-2xl shadow-[#1e4ea8]/10 backdrop-blur sm:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Veja em <span className="gradient-text">20 minutos</span> se serve para você
            </h2>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Sem apresentação de vendas. A gente te mostra o sistema funcionando
              ao vivo com seus dados — você decide se faz sentido.
            </p>
          </div>

          {sent ? (
            <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <Check size={24} className="mx-auto text-emerald-500" />
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">Recebido!</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Vamos te chamar em até 4 horas úteis no e-mail informado.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Nome completo" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8]" />
              <input name="email" required type="email" placeholder="E-mail corporativo" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8]" />
              <input name="company" required placeholder="Empresa" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8]" />
              <select name="volume" defaultValue="Até 500/mês" className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8]">
                <option>Até 500/mês</option>
                <option>500 a 5.000/mês</option>
                <option>Mais de 5.000/mês</option>
              </select>
              {err && (
                <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                  {err}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="group sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(20,53,115,0.65)] transition hover:shadow-[0_16px_40px_-12px_rgba(20,53,115,0.85)] disabled:opacity-60"
              >
                {busy ? "Enviando..." : <>Quero agendar <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></>}
              </button>
              <p className="sm:col-span-2 mt-1 text-center text-[10.5px] text-[var(--muted-foreground)]">
                Ao enviar você concorda com nossa política de privacidade. Sem spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Orquestração de pagamentos para empresas brasileiras.
            </p>
            <address className="mt-4 not-italic text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              Curitiba, Paraná — Brasil<br />
              Seg–Sex · 09h às 16h30<br />
              <a href="mailto:contato@doublethree.com.br" className="hover:text-[var(--foreground)]">contato@doublethree.com.br</a><br />
              <a href="tel:+5547992770701" className="hover:text-[var(--foreground)]">(47) 99277-0701</a>
            </address>
          </div>
          <FooterCol title="Produto" links={[["Funcionalidades", "#features"], ["Preços", "#pricing"], ["Changelog", "/changelog"], ["Status", "/status"]]} />
          <FooterCol title="Empresa" links={[["Sobre", "/about"], ["Blog", "/blog"], ["Contato", "/contact"], ["Carreiras", "/careers"]]} />
          <FooterCol title="Recursos" links={[["Documentação API", "/docs"], ["FAQ", "#faq"], ["LGPD", "/about#lgpd"], ["Termos", "/about#termos"]]} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-[11px] text-[var(--muted-foreground)] md:flex-row">
          <p>© {new Date().getFullYear()} Double Three Tecnologia · CNPJ 33.720.345/0001-79</p>
          <p>Feito pela doublethree · Curitiba, PR</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)]">{title}</p>
      <ul className="space-y-2">
        {links.map(([l, h]) => (
          <li key={l}>
            <a href={h} className="text-xs text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
