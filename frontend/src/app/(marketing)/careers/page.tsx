import { Heart, Coffee, Sparkles, Mail } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Trabalhe na doublethree", description: "Vagas e oportunidades na doublethree. Time enxuto, produto real, operação financeira de verdade." };

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Carreiras"
        title="Sem vagas abertas no momento"
        subtitle="Estamos em fase de consolidação do time. Mas gente boa a gente sempre quer conhecer."
      />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: <Heart size={18} />, t: "Por que aqui", d: "Time enxuto. Cada pessoa toca sistema em produção movimentando dinheiro real de clientes." },
            { icon: <Coffee size={18} />, t: "Como trabalhamos", d: "Async first. Reuniões só quando necessário. Resultados acima de presença." },
            { icon: <Sparkles size={18} />, t: "Benefícios", d: "Plano de saúde · Vale refeição · Equipamento · Home office · Plano de evolução." },
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

        <div className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#143573] to-[#1e4ea8] text-white">
            <Mail size={20} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
            Quer deixar seu currículo para o futuro?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Mande um e-mail com um breve resumo do que você faz e o que está procurando.
            A gente guarda e chama quando abrir uma vaga que faça sentido.
          </p>
          <a
            href="mailto:contato@doublethree.com.br?subject=Curr%C3%ADculo%20para%20banco%20de%20talentos"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[#1e4ea8]/50 hover:bg-[var(--muted)]"
          >
            contato@doublethree.com.br
          </a>
        </div>
      </section>
    </>
  );
}
