import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Target, Award, Users, ArrowRight } from "lucide-react";
import { PageHero, GlassCard } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "A Double Three é uma empresa de tecnologia de Curitiba. Construímos o PaymentsHub para resolver o problema real de pagar fornecedor no Brasil.",
};

const stats = [
  { k: "5+", l: "Anos construindo software" },
  { k: "50+", l: "Projetos entregues" },
  { k: "20+", l: "Tecnologias dominadas" },
  { k: "10+", l: "Setores atendidos" },
];

const pillars = [
  {
    icon: <Target size={20} />,
    t: "Missão",
    d: "Transformar desafios empresariais em tecnologia que gera valor mensurável e retorno real.",
  },
  {
    icon: <Award size={20} />,
    t: "Engenharia",
    d: "Arquitetura hexagonal, testes automatizados, CI/CD e observabilidade desde o dia um.",
  },
  {
    icon: <Users size={20} />,
    t: "Foco no cliente",
    d: "Cada release com objetivos claros e métricas definidas. Retrospectiva a cada sprint.",
  },
  {
    icon: <Building2 size={20} />,
    t: "Sede",
    d: "Curitiba/PR · time distribuído · atendimento nacional Seg–Sex 09h–16h30.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre"
        title="A camada que faltava entre seu ERP e o banco"
        subtitle="A Double Three nasceu pra resolver um problema que toda empresa brasileira conhece: pagar fornecedor é caro, lento e arriscado. O PaymentsHub é a nossa resposta."
      />

      <section className="mx-auto max-w-6xl px-7 py-16">
        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_50%,transparent)] backdrop-blur-md md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.l}
              className={`px-6 py-7 ${i !== stats.length - 1 ? "border-b md:border-b-0 md:border-r" : ""} ${
                i < 2 ? "border-b md:border-b-0" : ""
              } border-[var(--border)]`}
            >
              <div className="font-display text-[38px] font-semibold leading-none tracking-[-0.03em]">{s.k}</div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-7 pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          {pillars.map((p) => (
            <GlassCard key={p.t}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                {p.icon}
              </div>
              <h3 className="font-display text-[18px] font-semibold">{p.t}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-[var(--muted-foreground)]">{p.d}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-7">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-deep)] to-[var(--background)] p-14 text-center md:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--brand-cyan)] opacity-30 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-24 h-72 w-72 rounded-full bg-[var(--brand-glow)] opacity-25 blur-[120px]" />
            <div className="relative">
              <h3 className="mx-auto max-w-2xl font-display text-[clamp(24px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
                Quer conversar com a gente?
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-[14px] leading-[1.6] text-white/70">
                Responda a gente que marca uma call curta pra entender o seu cenário.
              </p>
              <Link href="/contact" className="btn-glow mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px]">
                Falar com a gente
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
