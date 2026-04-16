"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/"><Logo size="md" /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/#features">Funcionalidades</NavLink>
          <NavLink href="/#pricing">Preços</NavLink>
          <NavLink href="/blog">Blog</NavLink>
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
            href="/contact"
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
          <Link href="/#features" className="block py-1.5 text-sm">Funcionalidades</Link>
          <Link href="/#pricing" className="block py-1.5 text-sm">Preços</Link>
          <Link href="/blog" className="block py-1.5 text-sm">Blog</Link>
          <Link href="/docs" className="block py-1.5 text-sm">API</Link>
          <Link href="/about" className="block py-1.5 text-sm">Sobre</Link>
          <Link href="/login" className="block py-1.5 text-sm">Entrar</Link>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
    >
      {children}
    </Link>
  );
}

export function MarketingFooter() {
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
          <FooterCol title="Produto" links={[
            ["Como funciona", "/#features"],
            ["Preços", "/#pricing"],
            ["Perguntas frequentes", "/#faq"],
          ]} />
          <FooterCol title="Empresa" links={[
            ["Sobre a doublethree", "/about"],
            ["Blog", "/blog"],
            ["Contato", "/contact"],
          ]} />
          <FooterCol title="Legal" links={[
            ["Política de privacidade", "/about#lgpd"],
            ["Termos de uso", "/about#termos"],
          ]} />
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
            <Link href={h} className="text-xs text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="glow-orb left-[-10%] top-[-20%] h-[400px] w-[400px] bg-[#143573] opacity-25" />
      <div className="glow-orb right-[-10%] top-[10%] h-[420px] w-[420px] bg-[#1e4ea8] opacity-25" />
      <div className="noise" />
      <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e4ea8]">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
    </section>
  );
}
