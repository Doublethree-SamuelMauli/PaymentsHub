import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Novidades do PaymentsHub", description: "Tudo que mudou no PaymentsHub. Novas funcionalidades, correções e melhorias." };

const RELEASES = [
  {
    version: "v0.4.0",
    date: "12 abr 2026",
    tag: "Feature",
    title: "RBAC com hierarquia de roles",
    items: [
      "Mapeamento automático de scopes de API key para roles JWT.",
      "Aprovação de lote agora aceita tanto API key (runs:approve) quanto usuário JWT com role approver.",
      "Novo endpoint /v1/users com CRUD completo (admin only).",
    ],
  },
  {
    version: "v0.3.2",
    date: "05 abr 2026",
    tag: "Fix",
    title: "Correção no envio CNAB para Bradesco",
    items: [
      "Segmento B do Bradesco agora preenche corretamente o campo de complemento.",
      "Melhoria no parser de retorno de TED para BB (códigos 201-205).",
    ],
  },
  {
    version: "v0.3.0",
    date: "28 mar 2026",
    tag: "Feature",
    title: "Reagendamento de pagamentos",
    items: [
      "POST /v1/payments/{id}/reschedule permite mover pagamento para outra data.",
      "Tela de Lote do Dia ganhou atalho de reagendar pagamento individual.",
      "Trilha de auditoria registra reagendamentos com motivo obrigatório.",
    ],
  },
  {
    version: "v0.2.1",
    date: "20 mar 2026",
    tag: "Improvement",
    title: "Performance de listagem de pagamentos",
    items: [
      "Índice composto em (client_id, status, created_at) reduziu p95 de 800ms para 90ms.",
      "Limite default de listagem aumentado para 200 (era 50).",
    ],
  },
  {
    version: "v0.2.0",
    date: "10 mar 2026",
    tag: "Feature",
    title: "Submissão consolidada ao banco",
    items: [
      "POST /v1/runs/{id}/submit-to-bank agora envia todo o lote em uma única operação.",
      "PIX via REST + TED via CNAB no mesmo lote, roteado automaticamente.",
      "Webhook de confirmação por pagamento com bank_reference.",
    ],
  },
];

const TAG_STYLE: Record<string, string> = {
  Feature: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Fix: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  Improvement: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
};

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="O que mudou no PaymentsHub"
        subtitle="Releases públicos. Sem hype, só o que entrou em produção."
      />

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-10">
          {RELEASES.map((r) => (
            <article key={r.version} className="relative border-l-2 border-[var(--border)] pl-6">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-gradient-to-br from-[#143573] to-[#1e4ea8]" />
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="font-mono text-sm font-bold text-[var(--foreground)]">{r.version}</h2>
                <span className="text-xs text-[var(--muted-foreground)]">{r.date}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TAG_STYLE[r.tag]}`}>
                  {r.tag}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)]">{r.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted-foreground)]">
                {r.items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#1e4ea8]" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
