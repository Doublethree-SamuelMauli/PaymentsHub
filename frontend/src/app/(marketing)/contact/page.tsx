"use client";

import { useState } from "react";
import { Mail, MessageSquare, MapPin, Phone, Check, ArrowRight, AlertCircle } from "lucide-react";
import { PageHero, GlassCard } from "@/components/marketing/shell";

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

      <section className="mx-auto max-w-6xl px-7 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { icon: <MessageSquare size={18} />, t: "Demo comercial", d: "20 minutos, sem slide. Você manda 2–3 pagamentos reais e a gente monta a primeira run ao vivo.", a: "contato@doublethree.com.br" },
              { icon: <Mail size={18} />, t: "Suporte técnico", d: "Bug, dúvida de integração, ajuda com OpenAPI ou CNAB.", a: "contato@doublethree.com.br" },
              { icon: <MapPin size={18} />, t: "Endereço", d: "Curitiba, Paraná — Brasil. Atendemos clientes em todo o país." },
              { icon: <Phone size={18} />, t: "Telefone / WhatsApp", d: "(47) 99277-0701 — Seg a Sex, 09h às 16h30" },
            ].map((c) => (
              <GlassCard key={c.t} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-[16px] font-semibold text-[var(--foreground)]">{c.t}</h3>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted-foreground)]">{c.d}</p>
                    {c.a && <a href={`mailto:${c.a}`} className="mt-2 inline-block font-mono text-[12px] text-[var(--brand-cyan)] hover:underline">{c.a}</a>}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-8">
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em]">Envie uma mensagem</h2>
            <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">Resposta em até 4 horas úteis.</p>

            {sent ? (
              <div className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-emerald)_10%,transparent)] p-6 text-center">
                <Check size={24} className="mx-auto text-[var(--brand-emerald)]" />
                <p className="mt-2 font-display text-sm font-semibold">Mensagem enviada!</p>
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
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-glow mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] disabled:opacity-60"
                >
                  {busy ? "Enviando..." : <>Enviar mensagem <ArrowRight size={14} /></>}
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </section>
    </>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-cyan)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-cyan)_30%,transparent)]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}
