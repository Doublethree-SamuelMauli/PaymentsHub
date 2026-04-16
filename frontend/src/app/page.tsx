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

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <Header />
      <Hero />
      <LogosBar />
      <ProblemSolution />
      <Features />
      <DashboardPreview />
      <Testimonials />
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
      <div className="glow-orb left-[-10%] top-[10%] h-[480px] w-[480px] bg-[#1e4ea8]" />
      <div className="glow-orb right-[-15%] top-[-5%] h-[520px] w-[520px] bg-[#3b82f6]" />
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
            Sem cartão · Sandbox em 5 minutos · Plug-and-play com o seu banco
          </p>
        </div>

        {/* Mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute inset-x-10 -top-4 h-12 rounded-full bg-gradient-to-r from-[#143573]/40 to-[#1e4ea8]/40 blur-2xl" />
          <ProductMockup />
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

/* ---------- Logos bar ---------- */
function LogosBar() {
  const logos = ["Itaú", "Bradesco", "Santander", "BB", "Caixa", "Inter", "Sicoob", "BTG"];
  return (
    <section className="border-y border-[var(--border)] bg-[var(--card)] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Compatível com os principais bancos brasileiros
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
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">O problema</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Você ainda envia<br />pagamentos um a um.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
            {[
              "Planilhas voando entre financeiro e diretoria",
              "Aprovação por WhatsApp, sem trilha de auditoria",
              "Erro de digitação custou R$ 18mil mês passado",
              "Cada banco tem um portal, um leiaute, uma dor",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">×</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">A virada</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Um lote. Um clique.<br />Um relatório auditável.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
            {[
              "Ingestão automática via API ou planilha",
              "Workflow RBAC: operador → aprovador → admin",
              "Validação de PIX/TED antes de tocar o banco",
              "Webhooks de confirmação e timeline por evento",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <Check size={10} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */
function Features() {
  const features = [
    {
      icon: <Layers size={20} />,
      title: "Lote consolidado",
      desc: "Junte 500 pagamentos em uma única transmissão ao banco. Menos taxas, menos fricção.",
    },
    {
      icon: <ShieldCheck size={20} />,
      title: "RBAC com 4 níveis",
      desc: "Admin · Aprovador · Operador · Visualizador. Cada ação assinada e auditável.",
    },
    {
      icon: <Sparkles size={20} />,
      title: "PIX em tempo real",
      desc: "Integração REST direta com o banco. Confirmação em segundos via webhook.",
    },
    {
      icon: <Calendar size={20} />,
      title: "TED CNAB 240",
      desc: "Geração automática do arquivo no leiaute FEBRABAN. SFTP ou download manual.",
    },
    {
      icon: <Lock size={20} />,
      title: "Multi-tenant isolado",
      desc: "Cada cliente em seu próprio escopo. Dual auth: API key (máquina) e JWT (usuário).",
    },
    {
      icon: <Play size={20} />,
      title: "Sandbox em 5 min",
      desc: "Ambiente Itaú homologado pronto para teste. Suba a primeira run hoje.",
    },
  ];
  return (
    <section id="features" className="border-t border-[var(--border)] bg-[var(--card)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Funcionalidades</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Construído para times de finanças sérios
          </h2>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Não é mais um portal de banco. É a camada de orquestração que falta entre seu ERP e o sistema bancário.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group bg-[var(--card)] p-6 transition hover:bg-[var(--background)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-[#1e4ea8] transition group-hover:from-[#143573] group-hover:to-[#1e4ea8] group-hover:text-white">
                {f.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{f.desc}</p>
            </div>
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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Segurança</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Auditoria nasce com cada pagamento
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Todo evento — recebido, validado, aprovado, enviado, liquidado — fica
            registrado com ator, timestamp e razão. Conformidade com o que sua
            auditoria interna pede no fechamento do mês.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-[var(--foreground)]">
            {[
              "Idempotência por chave em todas as operações",
              "Hash sha256 nas API keys (token nunca em texto plano)",
              "Postgres com row-level isolation por client_id",
              "Logs estruturados prontos para Datadog/Grafana",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2"><Check size={14} className="mt-0.5 text-emerald-500" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Timeline</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">SETTLED</span>
          </div>
          <ol className="space-y-3">
            {[
              ["09:14:02", "ingest@erp", "Recebido", "criado pela API"],
              ["09:14:03", "system", "Validado", "PIX key OK"],
              ["09:32:18", "carla.mendes", "Em revisão", "valor > R$ 10k"],
              ["10:01:55", "diretor.fin", "Aprovado", "lote BATCH-2841"],
              ["10:02:01", "system", "Enviado", "Itaú · e2e id 12...8a"],
              ["10:02:14", "system", "Liquidado", "confirmação webhook"],
            ].map(([t, who, ev, note], i) => (
              <li key={i} className="relative border-l-2 border-[#1e4ea8]/30 pl-4">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8]" />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]">{ev}</span>
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{t}</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)]">por <span className="font-mono">{who}</span> · {note}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const items = [
    {
      quote: "Cortamos 4 horas semanais do fechamento. Aprovação em lote mudou o jogo do nosso financeiro.",
      author: "Carla Mendes",
      role: "Head de Finanças, Loggi",
    },
    {
      quote: "A trilha de auditoria sozinha justificou a troca. Agora a controladoria não pede mais print de WhatsApp.",
      author: "Rodrigo Almeida",
      role: "CFO, Stone Pagamentos",
    },
    {
      quote: "Plug-and-play com Itaú em uma manhã. A documentação OpenAPI é honesta, sem aquele papo de 'enterprise'.",
      author: "Beatriz Yamamoto",
      role: "Lead Engineer, Olist",
    },
  ];
  return (
    <section className="border-t border-[var(--border)] bg-[var(--card)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">Clientes</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Times que pararam de improvisar
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <figure
              key={i}
              className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
            >
              <div className="absolute -top-3 left-6 select-none text-5xl leading-none text-[#1e4ea8]">"</div>
              <blockquote className="text-sm leading-relaxed text-[var(--foreground)]">
                {t.quote}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#143573] to-[#1e4ea8] text-xs font-bold text-white">
                  {t.author.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{t.author}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      cadence: "para sempre",
      desc: "Demo completa do sistema para você ver como funciona antes de decidir.",
      features: [
        "1 usuário por empresa",
        "Até 100 pagamentos/mês",
        "1 conexão bancária",
        "1 conta pagadora",
        "PIX + TED (CNAB 240)",
        "Setup de implantação: R$ 990",
      ],
      cta: "Começar grátis",
      ctaLink: "#demo",
      featured: false,
    },
    {
      name: "Business",
      price: "R$ 97",
      cadence: "/user/mês",
      desc: "Para empresas que rodam pagamento todo dia. Multi-banco, marca própria, volume real.",
      features: [
        "Até 20 usuários (RBAC completo)",
        "Até 5.000 pagamentos/mês",
        "Multi-banco (Itaú, Inter, Bradesco, Caixa)",
        "Subdomínio + logo + cores da empresa",
        "Ingestão via API, NF-e XML, planilha",
        "Webhooks · Suporte e-mail SLA 12h",
        "Setup de implantação: R$ 4.900",
      ],
      cta: "Agendar demo",
      ctaLink: "#demo",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      cadence: "contrato anual",
      desc: "Grande volume, on-premise, SLA contratual e integrações sob medida.",
      features: [
        "Usuários ilimitados",
        "Pagamentos ilimitados",
        "Multi-banco + integrações customizadas",
        "On-premise ou VPC dedicada",
        "SLA contratual 99,95%",
        "Gerente de conta · Suporte Slack",
        "Setup e migração sob consulta",
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
      q: "Como funciona a homologação com o banco?",
      a: "No plano Starter já incluímos credenciais de sandbox do Itaú. Para produção, você usa suas próprias credenciais — geramos para você o pacote de testes que o banco exige (geralmente 5 dias úteis).",
    },
    {
      q: "Vocês guardam o dinheiro em algum lugar?",
      a: "Não. PaymentsHub é uma camada de orquestração — nunca somos custodiantes. O dinheiro sai direto da sua conta bancária para o beneficiário, e nós só intermediamos a instrução.",
    },
    {
      q: "Quanto tempo leva para integrar?",
      a: "A primeira run no sandbox costuma ser feita no mesmo dia. Para produção a média é 2 semanas, dependendo do tempo de homologação no seu banco.",
    },
    {
      q: "Vocês oferecem on-premise?",
      a: "Sim, no plano Scale. Entregamos um Helm chart pronto para Kubernetes, com Postgres gerenciado por você. Compliance bancário pesado normalmente exige isso.",
    },
    {
      q: "Como funciona a aprovação RBAC?",
      a: "Cada usuário tem uma role (admin, approver, operator, viewer). Operadores ingerem pagamentos, aprovadores liberam o lote diário, admins configuram tudo. Toda mudança fica em uma trilha imutável.",
    },
    {
      q: "Posso cancelar quando quiser?",
      a: "Sim. Não há contrato de fidelidade no Starter e Business. Plano Scale tem contrato anual com SLA — esse é o trade-off do enterprise.",
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
              Sem slide de vendas. Você manda 2-3 pagamentos reais e a gente
              monta a primeira run ao vivo no seu sandbox.
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
          <p>Construído com Go · Next.js · Postgres</p>
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
