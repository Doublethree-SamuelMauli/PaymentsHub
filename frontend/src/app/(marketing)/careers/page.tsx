import Link from "next/link";
import { MapPin, Briefcase, ArrowRight, Coffee, Heart, Sparkles } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Carreiras · PaymentsHub" };

const VAGAS = [
  { titulo: "Engenheiro(a) Backend Senior · Go", local: "Remoto BR", tipo: "CLT", area: "Engenharia" },
  { titulo: "Engenheiro(a) Frontend Pleno · React/Next", local: "Remoto BR", tipo: "CLT", area: "Engenharia" },
  { titulo: "SRE / Platform Engineer", local: "Remoto BR", tipo: "PJ ou CLT", area: "Infraestrutura" },
  { titulo: "Product Designer Sênior", local: "Curitiba/PR · Híbrido", tipo: "CLT", area: "Produto" },
  { titulo: "Customer Success Manager", local: "São Paulo/SP · Híbrido", tipo: "CLT", area: "Sucesso do Cliente" },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Carreiras"
        title="Construa a infraestrutura de pagamentos do Brasil"
        subtitle="Time pequeno, decisões rápidas e clientes reais desde o dia 1."
      />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: <Heart size={18} />, t: "Por que aqui", d: "Time enxuto. Cada engenharia toca sistema em produção movimentando dinheiro real." },
            { icon: <Coffee size={18} />, t: "Como trabalhamos", d: "Async first. Reuniões só quando necessário. Resultados acima de presença." },
            { icon: <Sparkles size={18} />, t: "Benefícios", d: "Plano de saúde · Vale refeição · Stock options · 30 dias de férias · Auxílio home office." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-[#1e4ea8]">
                {b.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">{b.t}</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{b.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Vagas abertas</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{VAGAS.length} posições · Atualizado hoje</p>

          <div className="mt-6 space-y-2">
            {VAGAS.map((v) => (
              <Link
                key={v.titulo}
                href={`mailto:contato@doublethree.com.br?subject=Vaga: ${encodeURIComponent(v.titulo)}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[#1e4ea8]/50 hover:bg-[var(--muted)]"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[#1e4ea8]">{v.titulo}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{v.local}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={11} />{v.tipo}</span>
                    <span className="rounded-full bg-[#143573]/10 px-2 py-0.5 font-semibold text-[#1e4ea8]">{v.area}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-[var(--muted-foreground)] transition group-hover:translate-x-1 group-hover:text-[#1e4ea8]" />
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <p className="text-sm text-[var(--foreground)]">Não viu sua vaga?</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">A gente sempre quer conhecer gente boa. Manda um oi.</p>
            <a
              href="mailto:contato@doublethree.com.br"
              className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[#1e4ea8]/50"
            >
              contato@doublethree.com.br
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
