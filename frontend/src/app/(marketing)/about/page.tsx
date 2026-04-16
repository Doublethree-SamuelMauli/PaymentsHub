import Link from "next/link";
import { Building2, Users, Target, Award } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Sobre a doublethree", description: "Empresa de Curitiba especializada em soluções digitais corporativas. Conheça quem está por trás do PaymentsHub." };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre"
        title="Construímos a camada que faltava entre seu ERP e o banco"
        subtitle="A Double Three nasceu para resolver um problema que toda empresa brasileira conhece: pagar fornecedor é caro, lento e arriscado."
      />

      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Nossa história</h2>
          <p className="text-[var(--muted-foreground)]">
            A doublethree é uma empresa de Curitiba especializada em desenvolvimento de
            soluções digitais corporativas, com foco em qualidade, escalabilidade e
            resultados mensuráveis. Já são <strong>5+ anos de experiência</strong>,
            <strong> 50+ projetos entregues</strong>, <strong>20+ tecnologias dominadas</strong>
            e <strong>10+ setores atendidos</strong> — da indústria ao agronegócio,
            do varejo à saúde.
          </p>
          <p className="text-[var(--muted-foreground)]">
            PaymentsHub é uma plataforma proprietária da doublethree para orquestração
            de pagamentos B2B no Brasil. Nasceu de um padrão que se repetia em vários
            clientes: planilhas voando, aprovação por WhatsApp e digitação manual em
            portais de banco. A promessa é simples — trazer a mesma engenharia rigorosa
            que aplicamos em ERPs, fintechs e blockchain para a operação financeira do
            seu time.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { icon: <Target size={18} />, t: "Missão", d: "Transformar desafios empresariais em soluções tecnológicas eficientes que geram valor real e impulsionam o crescimento dos clientes." },
            { icon: <Award size={18} />, t: "Excelência Técnica", d: "Melhores práticas de engenharia de software, arquiteturas modernas e tecnologias comprovadas pelo mercado." },
            { icon: <Users size={18} />, t: "Foco em Resultados", d: "Cada projeto desenvolvido com objetivos claros e métricas definidas para garantir o ROI." },
            { icon: <Building2 size={18} />, t: "Sede", d: "Curitiba, Paraná - Brasil · Seg a Sex 09h às 16h30 · Atendimento nacional." },
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

        <div id="lgpd" className="mt-16 scroll-mt-24">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Privacidade e LGPD</h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            A Double Three é encarregada (controladora) dos dados de cadastro de
            usuários da plataforma. Os dados de pagamentos processados pertencem
            ao cliente — somos operadores apenas para fins de execução do serviço.
            Para exercer direitos do titular: <a className="text-[#1e4ea8] underline" href="mailto:contato@doublethree.com.br">contato@doublethree.com.br</a>.
          </p>
        </div>

        <div id="termos" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Termos de uso</h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            O serviço é fornecido sob contrato comercial específico. PaymentsHub
            não custodia recursos — toda movimentação financeira ocorre entre
            sua instituição bancária e o beneficiário. SLA contratual disponível
            no plano Scale.
          </p>
        </div>

        <div className="mt-16 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#143573]/5 to-[#1e4ea8]/5 p-8 text-center">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Quer conversar?</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Adoramos email longo e demo curta.</p>
          <Link href="/contact" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(20,53,115,0.55)]">
            Falar com a gente
          </Link>
        </div>
      </section>
    </>
  );
}
