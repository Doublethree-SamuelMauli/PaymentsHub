import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Política de privacidade do PaymentsHub — como coletamos, tratamos e protegemos dados pessoais em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="LGPD"
        title="Política de privacidade"
        subtitle="Última revisão: 19 de abril de 2026. Como coletamos, tratamos e protegemos dados pessoais no PaymentsHub."
      />
      <Prose>
        <h2>1. Quem somos</h2>
        <p>
          O PaymentsHub é operado por <strong>Double Three Tecnologia Ltda.</strong> (CNPJ 33.720.345/0001-79), com sede
          em Curitiba/PR. Atuamos como <strong>operadora</strong> de dados pessoais em nome dos nossos clientes
          (controladores), conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, &quot;LGPD&quot;).
        </p>

        <h2>2. Dados que tratamos</h2>
        <ul>
          <li><strong>Dados cadastrais do cliente</strong>: razão social, CNPJ, endereço, e-mails de contato, dados bancários.</li>
          <li><strong>Dados dos usuários do painel</strong>: nome, e-mail, cargo, histórico de login, IP e user-agent.</li>
          <li><strong>Dados dos beneficiários</strong>: razão social/nome, CNPJ/CPF, chaves PIX, agência/conta, histórico de pagamentos.</li>
          <li><strong>Dados transacionais</strong>: valores, status, retornos bancários (CNAB/REST), códigos de erro, end-to-end IDs.</li>
          <li><strong>Telemetria do Serviço</strong>: logs de API, métricas de uso, traces, eventos de auditoria.</li>
        </ul>

        <h2>3. Finalidades do tratamento</h2>
        <ul>
          <li>Prestar o serviço de orquestração de pagamentos contratado.</li>
          <li>Cumprir obrigações regulatórias (LGPD, FEBRABAN, BCB) e fiscais.</li>
          <li>Prevenir fraude e lavagem de dinheiro.</li>
          <li>Melhorar o Serviço mediante análise agregada e anonimizada.</li>
        </ul>

        <h2>4. Base legal</h2>
        <p>
          Tratamos os dados com base em: (i) execução do contrato firmado com o cliente;
          (ii) cumprimento de obrigação legal/regulatória; (iii) legítimo interesse, quando proporcionalmente
          balanceado com os direitos do titular; (iv) consentimento, nos casos previstos na LGPD.
        </p>

        <h2>5. Compartilhamento</h2>
        <p>
          Compartilhamos dados com: (i) <strong>instituições bancárias</strong> integradas (Itaú, Bradesco, Santander,
          BB, Caixa, Inter, Sicoob, BTG) exclusivamente para executar as ordens de pagamento; (ii) <strong>processadores
          de infraestrutura</strong> (AWS — armazenamento e cômputo, Cloudflare — DNS/CDN, Google Workspace — e-mail)
          sob acordos de confidencialidade; (iii) <strong>autoridades competentes</strong> mediante requisição legal válida.
        </p>
        <p>
          Não vendemos dados pessoais a terceiros. Não utilizamos dados pessoais dos seus beneficiários para marketing próprio.
        </p>

        <h2>6. Transferência internacional</h2>
        <p>
          Parte dos dados pode ser armazenada em servidores nos Estados Unidos (AWS us-east-2). A doublethree adota
          cláusulas contratuais e controles adequados nos termos do art. 33 da LGPD.
        </p>

        <h2>7. Retenção</h2>
        <p>
          Dados transacionais são retidos por <strong>10 anos</strong> (obrigação fiscal e bancária). Auditoria e logs
          por 5 anos. Dados de usuários ativos enquanto a conta estiver ativa; após o encerramento, mantemos o mínimo
          necessário para cumprir obrigações legais, com exclusão programada.
        </p>

        <h2>8. Segurança</h2>
        <ul>
          <li>Criptografia AES-256 em repouso (RDS, S3, EBS).</li>
          <li>TLS 1.2+ em trânsito; mTLS com os bancos.</li>
          <li>Segredos em AWS KMS/Secrets Manager; chaves por tenant.</li>
          <li>2FA obrigatório para operadores em planos Business/Enterprise.</li>
          <li>Auditoria append-only e separação de ambientes.</li>
        </ul>

        <h2>9. Direitos do titular</h2>
        <p>
          Titulares podem solicitar acesso, correção, portabilidade, anonimização, eliminação, revogação do consentimento
          e informações sobre uso dos dados pelo e-mail <code>privacy@doublethree.com.br</code>. Prazo de resposta: 15 dias.
        </p>

        <h2>10. Encarregado (DPO)</h2>
        <p>
          Encarregado pelo tratamento de dados pessoais: <strong>Samuel Mauli</strong> — <code>dpo@doublethree.com.br</code>.
        </p>
      </Prose>
    </>
  );
}
