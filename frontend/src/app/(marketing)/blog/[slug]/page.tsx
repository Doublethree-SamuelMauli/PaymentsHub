import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { use } from "react";

const POSTS: Record<string, { title: string; date: string; author: string; body: string[] }> = {
  "por-que-pagamento-em-lote": {
    title: "Por que pagamento em lote economiza R$ 80 por TED",
    date: "10 abr 2026",
    author: "Samuel Mauli",
    body: [
      "Cada TED individual no portal do banco custa entre R$ 8 e R$ 25 dependendo da instituição e do plano contratado. Para uma empresa que faz 30 TEDs por mês, isso pode chegar facilmente a R$ 750 só de tarifa.",
      "Quando você junta esses 30 TEDs em um único arquivo CNAB 240 e envia ao banco em uma única operação, a maioria das instituições cobra uma única tarifa fixa — geralmente R$ 5 a R$ 15 pelo arquivo inteiro. A economia é direta: R$ 80 a R$ 200 por mês, dependendo do volume.",
      "Mas a economia real não está só na tarifa. Está no tempo. Cada TED individual exige login no portal do banco, validação de token, preenchimento manual da conta destino, conferência do valor. São 3 a 5 minutos por operação — multiplique por 30 e você tem 2,5 horas por mês só nisso.",
      "Com PaymentsHub, esses 30 pagamentos chegam pré-validados via API ou planilha, são consolidados automaticamente em um lote, aprovados em 2 cliques pelo aprovador e enviados ao banco como um único arquivo. O tempo cai para minutos.",
    ],
  },
  "pix-vs-ted": {
    title: "PIX ou TED: quando cada um faz sentido em B2B",
    date: "03 abr 2026",
    author: "Carla Mendes",
    body: [
      "PIX virou o padrão de fato no Brasil. É instantâneo, gratuito para pessoas físicas, e operacionalmente simples. Mas em B2B há cenários onde TED ainda faz sentido.",
      "PIX tem limite de R$ 1 milhão por transação para pessoa jurídica em horário comercial (R$ 200 mil em horário noturno) na maioria dos bancos. Para pagamentos acima disso, TED continua sendo a opção.",
      "Outro fator é tarifa. Para PJ, alguns bancos cobram tarifa por PIX enviado, enquanto TED tem custo fixo. Acima de certo volume diário, o cálculo pode favorecer TED.",
      "A boa notícia: você não precisa escolher um. PaymentsHub roteia automaticamente — PIX para valores pequenos e médios, TED para valores acima de R$ 1MM, tudo no mesmo lote.",
    ],
  },
  "rbac-aprovacao": {
    title: "RBAC para financeiro: quando aprovador deixa de ser admin",
    date: "27 mar 2026",
    author: "Samuel Mauli",
    body: [
      "Times pequenos costumam ter um único usuário admin que faz tudo. Funciona até a primeira auditoria.",
      "O modelo de 4 níveis que recomendamos: Visualizador (lê), Operador (cria pagamentos), Aprovador (libera lotes), Admin (configura sistema). Cada papel tem responsabilidade clara e separada.",
      "O ponto crítico é a separação entre Operador e Aprovador. Quem cria não pode aprovar — princípio de segregação de funções, exigido por boas práticas de governança e por algumas normas regulatórias.",
      "Admin não deveria operar no dia a dia. Admin existe para configurar contas pagadoras, gerar API keys e gerenciar usuários. Quem está rodando pagamento todo dia deveria ser Operador ou Aprovador.",
    ],
  },
  "cnab-240-explicado": {
    title: "CNAB 240 sem mistério: o leiaute FEBRABAN traduzido",
    date: "20 mar 2026",
    author: "Beatriz Yamamoto",
    body: [
      "CNAB (Centro Nacional de Automação Bancária) 240 é o leiaute padrão da FEBRABAN para arquivos de remessa e retorno bancário. 240 caracteres por linha, posições fixas, sem separadores.",
      "A estrutura básica: Header de Arquivo (1 linha), 1+ Lotes (cada lote tem header, 1+ detalhes, trailer), Trailer de Arquivo (1 linha). Cada Lote agrupa pagamentos do mesmo tipo (PIX, TED, boleto).",
      "Os Detalhes são divididos em Segmentos. Para TED você usa Segmento A (dados do crédito) + Segmento B (dados complementares). Para PIX, Segmento J ou específicos por banco.",
      "O grande pulo do gato: cada banco tem suas particularidades dentro do leiaute padrão. Itaú usa um campo X de uma forma, Bradesco usa de outra. PaymentsHub abstrai isso — você só envia o pagamento estruturado e nós geramos o CNAB no dialeto certo do seu banco.",
    ],
  },
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = POSTS[slug];
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft size={12} /> Voltar para o blog
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">por {post.author} · {post.date}</p>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-[var(--foreground)]">
        {post.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  );
}
