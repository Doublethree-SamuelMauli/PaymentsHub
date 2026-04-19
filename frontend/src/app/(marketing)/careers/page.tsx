import type { Metadata } from "next";
import { Heart, Coffee, Sparkles, Mail, Send } from "lucide-react";
import { PageHero, GlassCard } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Carreiras",
  description:
    "Trabalhe na Double Three. Time enxuto, produto real, operação financeira de verdade.",
};

const values = [
  {
    icon: <Heart size={20} />,
    t: "Por que aqui",
    d: "Time enxuto. Cada pessoa toca sistema em produção movimentando dinheiro real. Pouco teatro, muito código.",
  },
  {
    icon: <Coffee size={20} />,
    t: "Como trabalhamos",
    d: "Async first. Reuniões só quando necessário. Resultado acima de presença. Ciclos de duas semanas, retro no fim.",
  },
  {
    icon: <Sparkles size={20} />,
    t: "Benefícios",
    d: "Plano de saúde, VR, equipamento, home office, plano de evolução e stock options em track sênior.",
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Carreiras"
        title="Sem vagas abertas — mas gente boa a gente sempre quer conhecer"
        subtitle="Estamos em fase de consolidação do time. Escreva pra gente e entramos em contato quando abrir vaga que faça sentido com o seu perfil."
      />

      <section className="mx-auto max-w-6xl px-7 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <GlassCard key={v.t}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                {v.icon}
              </div>
              <h3 className="font-display text-[18px] font-semibold">{v.t}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-[var(--muted-foreground)]">{v.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-7 pb-20">
        <GlassCard className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-glow)] to-[var(--brand-cyan)] text-[#05070d]">
            <Mail size={22} />
          </div>
          <h3 className="mt-5 font-display text-[22px] font-semibold">Deixe seu currículo no nosso banco</h3>
          <p className="mx-auto mt-2 max-w-lg text-[14px] leading-[1.6] text-[var(--muted-foreground)]">
            Mande um e-mail curto com um resumo do que você faz, o que procura e dois links (GitHub, portfolio, LinkedIn).
            A gente guarda e chama quando abrir posição.
          </p>
          <a
            href="mailto:careers@doublethree.com.br?subject=Currículo%20para%20banco%20de%20talentos"
            className="btn-glow mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px]"
          >
            careers@doublethree.com.br <Send size={13} />
          </a>
        </GlassCard>
      </section>
    </>
  );
}
