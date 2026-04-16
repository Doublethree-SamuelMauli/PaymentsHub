"use client";

import { useState } from "react";
import { Mail, MessageSquare, MapPin, Phone, Check, ArrowRight, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          topic: fd.get("topic"),
          message: fd.get("message"),
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
    <>
      <PageHero
        eyebrow="Contato"
        title="A gente responde rápido"
        subtitle="Demo, dúvidas técnicas, parcerias — escolha o canal e a gente te encontra."
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Channels */}
          <div className="space-y-4">
            {[
              { icon: <MessageSquare size={18} />, t: "Demo comercial", d: "20 minutos, sem slide. Você manda 2-3 pagamentos reais e a gente monta a primeira run ao vivo.", a: "contato@doublethree.com.br" },
              { icon: <Mail size={18} />, t: "Suporte técnico", d: "Bug, dúvida de integração, ajuda com OpenAPI ou CNAB.", a: "contato@doublethree.com.br" },
              { icon: <MapPin size={18} />, t: "Endereço", d: "Curitiba, Paraná - Brasil · Atendemos clientes em todo o Brasil." },
              { icon: <Phone size={18} />, t: "Telefone / WhatsApp", d: "(47) 99277-0701 — Seg a Sex, 09h às 16h30" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-[#1e4ea8]">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">{c.t}</h3>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{c.d}</p>
                    {c.a && <a href={`mailto:${c.a}`} className="mt-2 inline-block text-xs font-medium text-[#1e4ea8] hover:underline">{c.a}</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Envie uma mensagem</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Resposta em até 4 horas úteis.</p>

            {sent ? (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <Check size={24} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">Mensagem enviada!</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Vamos te responder em breve.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Nome"><input name="name" required className={inputCls} /></Field>
                  <Field label="Empresa"><input name="company" required className={inputCls} /></Field>
                </div>
                <Field label="E-mail corporativo"><input name="email" required type="email" className={inputCls} /></Field>
                <Field label="Telefone (opcional)"><input name="phone" className={inputCls} /></Field>
                <Field label="Como podemos ajudar?">
                  <select name="topic" className={inputCls} defaultValue="Quero agendar uma demo">
                    <option>Quero agendar uma demo</option>
                    <option>Tenho dúvidas técnicas</option>
                    <option>Quero discutir parceria</option>
                    <option>Outro</option>
                  </select>
                </Field>
                <Field label="Mensagem">
                  <textarea name="message" required rows={4} className={inputCls} placeholder="Conta um pouco do contexto da sua empresa..." />
                </Field>
                {err && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(20,53,115,0.55)] transition hover:shadow-[0_12px_32px_-12px_rgba(20,53,115,0.75)] disabled:opacity-60"
                >
                  {busy ? "Enviando..." : <>Enviar mensagem <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[#1e4ea8] focus:ring-2 focus:ring-[#1e4ea8]/20";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>{children}</div>;
}
