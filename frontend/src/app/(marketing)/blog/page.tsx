import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Blog — Pagamentos, bancos e gestão financeira", description: "Artigos sobre pagamentos em lote, PIX vs TED, aprovação financeira e integração bancária para empresas." };

const POSTS = [
  {
    slug: "por-que-pagamento-em-lote",
    title: "Por que pagamento em lote economiza R$ 80 por TED",
    excerpt: "Cada TED individual no portal do banco custa entre R$ 8 e R$ 25. Quando você junta 10 em uma única operação...",
    author: "Samuel Mauli",
    date: "10 abr 2026",
    read: "5 min",
    tag: "Operação",
  },
  {
    slug: "pix-vs-ted",
    title: "PIX ou TED: quando cada um faz sentido em B2B",
    excerpt: "PIX virou o padrão, mas há cenários onde TED ainda é a escolha certa. Limites, horários e custos comparados.",
    author: "Carla Mendes",
    date: "03 abr 2026",
    read: "7 min",
    tag: "Conceitos",
  },
  {
    slug: "rbac-aprovacao",
    title: "RBAC para financeiro: quando aprovador deixa de ser admin",
    excerpt: "Times pequenos confundem aprovador com admin. Mostramos o modelo de 4 níveis que recomendamos.",
    author: "Samuel Mauli",
    date: "27 mar 2026",
    read: "6 min",
    tag: "Governança",
  },
  {
    slug: "cnab-240-explicado",
    title: "CNAB 240 sem mistério: o leiaute FEBRABAN traduzido",
    excerpt: "Header de arquivo, header de lote, segmentos A, B, J... O que cada bloco significa e por que existe.",
    author: "Beatriz Yamamoto",
    date: "20 mar 2026",
    read: "12 min",
    tag: "Técnico",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notas sobre pagamento, banco e o que cerca"
        subtitle="Escrevemos para times de financeiro e engenharia que querem entender o que está acontecendo por baixo."
      />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="space-y-4">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[#1e4ea8]/50 hover:shadow-md"
            >
              <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                <span className="rounded-full bg-[#143573]/10 px-2 py-0.5 font-semibold text-[#1e4ea8]">{p.tag}</span>
                <span className="inline-flex items-center gap-1"><Calendar size={11} />{p.date}</span>
                <span className="inline-flex items-center gap-1"><Clock size={11} />{p.read}</span>
              </div>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-[var(--foreground)] group-hover:text-[#1e4ea8]">
                {p.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{p.excerpt}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-[var(--muted-foreground)]">por {p.author}</span>
                <ArrowRight size={14} className="text-[#1e4ea8] transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
