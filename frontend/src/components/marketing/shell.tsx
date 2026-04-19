"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="backdrop-hero" aria-hidden />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}

export function MarketingHeader() {
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
          <NavLink href="/#produto">Produto</NavLink>
          <NavLink href="/#bancos">Bancos</NavLink>
          <NavLink href="/#preco">Preços</NavLink>
          <NavLink href="/docs">API</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-[13px] font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link href="/contact" className="btn-glow inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]">
            Agendar demo
            <ArrowRight size={14} />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
          >
            <ChevronDown size={18} className={open ? "rotate-180 transition" : "transition"} />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[var(--border)] md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-7 py-4">
            <Link href="/#produto" className="rounded-md px-3 py-2.5 text-sm">Produto</Link>
            <Link href="/#bancos" className="rounded-md px-3 py-2.5 text-sm">Bancos</Link>
            <Link href="/#preco" className="rounded-md px-3 py-2.5 text-sm">Preços</Link>
            <Link href="/docs" className="rounded-md px-3 py-2.5 text-sm">API</Link>
            <Link href="/blog" className="rounded-md px-3 py-2.5 text-sm">Blog</Link>
            <Link href="/login" className="rounded-md px-3 py-2.5 text-sm">Entrar</Link>
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

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_60%,transparent)] py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-7 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display font-semibold">
            <BrandMark />
            <span>Payments<span className="text-[var(--brand-cyan)]">Hub</span></span>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-[1.65] text-[var(--muted-foreground)]">
            Orquestração bancária para empresas brasileiras. PIX, TED e CNAB 240 em um só hub, com aprovação humana auditada.
          </p>
          <address className="mt-5 not-italic font-mono text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            Curitiba, Paraná — Brasil<br />
            Seg–Sex · 09h às 16h30<br />
            <a href="mailto:contato@doublethree.com.br" className="hover:text-[var(--brand-cyan)]">contato@doublethree.com.br</a><br />
            <a href="tel:+5547992770701" className="hover:text-[var(--brand-cyan)]">(47) 99277-0701</a>
          </address>
          <p className="mt-5 font-mono text-[11px] text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Double Three Tecnologia · CNPJ 33.720.345/0001-79
          </p>
        </div>
        <FooterCol title="Produto" links={[
          ["Como funciona", "/#produto"],
          ["Bancos", "/#bancos"],
          ["Preços", "/#preco"],
          ["API", "/docs"],
          ["Status", "/status"],
        ]} />
        <FooterCol title="Empresa" links={[
          ["Sobre", "/about"],
          ["Carreiras", "/careers"],
          ["Contato", "/contact"],
          ["Blog", "/blog"],
          ["Changelog", "/changelog"],
        ]} />
        <FooterCol title="Legal" links={[
          ["Termos", "/legal/terms"],
          ["Privacidade", "/legal/privacy"],
          ["DPA", "/legal/dpa"],
          ["Segurança", "/legal/security"],
        ]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {title}
      </p>
      <ul className="flex flex-col gap-2.5 text-[13.5px]">
        {links.map(([l, h]) => (
          <li key={l}>
            <Link href={h} className="text-[var(--foreground)]/80 transition hover:text-[var(--brand-cyan)]">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-glow)] opacity-20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-[var(--brand-cyan)] opacity-15 blur-[120px]" />
      <div className="relative mx-auto max-w-4xl px-7 py-24 text-center">
        <p className="eyebrow justify-center">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[clamp(34px,5vw,60px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-[16.5px] leading-[1.6] text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

/* ────────── Shared building blocks for marketing pages ────────── */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose prose-invert mx-auto max-w-3xl px-7 py-16 text-[15.5px] leading-[1.75] text-[var(--muted-foreground)] [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--foreground)] [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1.5 [&_a]:text-[var(--brand-cyan)] [&_a]:underline [&_strong]:text-[var(--foreground)] [&_code]:rounded [&_code]:bg-[var(--secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-[var(--brand-cyan)]">
      {children}
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--card)_60%,transparent)] to-[color-mix(in_srgb,var(--background)_40%,transparent)] p-7 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
