import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso do PaymentsHub — orquestração de pagamentos PIX, TED e CNAB 240 para empresas brasileiras.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Termos de uso"
        subtitle="Última revisão: 19 de abril de 2026. Estes termos regem o uso do PaymentsHub pela sua empresa."
      />
      <Prose>
        <h2>1. Aceitação</h2>
        <p>
          Ao criar uma conta, acessar ou usar o <strong>PaymentsHub</strong> (o &quot;Serviço&quot;), você declara ter lido,
          compreendido e concordado com estes Termos de uso e com a nossa <a href="/legal/privacy">Política de privacidade</a>.
          O Serviço é operado por <strong>Double Three Tecnologia Ltda.</strong> (&quot;doublethree&quot;), CNPJ 33.720.345/0001-79,
          com sede em Curitiba, Paraná, Brasil.
        </p>
        <p>
          Se você está aceitando em nome de uma pessoa jurídica, declara ter poderes para vincular essa pessoa jurídica
          aos presentes Termos. Caso contrário, não acesse nem use o Serviço.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O PaymentsHub é uma plataforma SaaS para orquestração de pagamentos bancários: recebe ordens de pagamento do
          sistema do cliente (ERP), pré-valida junto aos bancos integrados, aguarda aprovação humana e dispara o envio
          via PIX (REST) ou CNAB 240 (SFTP). A doublethree atua como <strong>processador</strong>; a custódia do dinheiro
          e a execução final do pagamento são sempre responsabilidade da instituição financeira do cliente.
        </p>

        <h2>3. Conta e credenciais</h2>
        <ul>
          <li>Você é responsável por proteger suas credenciais (senha, TOTP, WebAuthn, certificados mTLS).</li>
          <li>Toda atividade em sua conta é presumida como autorizada por você.</li>
          <li>Notifique imediatamente <code>security@doublethree.com.br</code> em caso de suspeita de acesso indevido.</li>
          <li>A doublethree pode suspender acessos que apresentem risco à integridade do Serviço ou a terceiros.</li>
        </ul>

        <h2>4. Planos, preços e cobrança</h2>
        <p>
          Os planos vigentes e seus valores estão publicados em <a href="/#preco">paymentshub.doublethree.com.br</a>.
          Planos pagos são cobrados mensalmente em Reais (BRL), sendo que a doublethree pode reajustar preços uma vez
          por ano civil com notificação prévia de 30 dias. O cliente pode cancelar a qualquer momento com efeito no
          encerramento do ciclo vigente, sem reembolso proporcional.
        </p>

        <h2>5. Uso aceitável</h2>
        <p>Você se compromete a não utilizar o Serviço para:</p>
        <ul>
          <li>Lavagem de dinheiro, financiamento ao terrorismo ou quaisquer atividades ilícitas.</li>
          <li>Ofender, assediar ou violar direitos de terceiros.</li>
          <li>Interferir na estabilidade do Serviço (DDoS, engenharia reversa, abuso de rate limit etc.).</li>
          <li>Burlar os mecanismos de aprovação humana ou contornar as regras de compliance bancário.</li>
        </ul>

        <h2>6. SLA e disponibilidade</h2>
        <p>
          O SLA padrão do plano Business é de <strong>99,9% de disponibilidade mensal</strong> medido no endpoint
          público. Cortes programados com aviso prévio de 72h, manutenções emergenciais e eventos de força maior
          estão excluídos do cálculo. Os créditos por descumprimento de SLA constam no contrato comercial específico.
        </p>

        <h2>7. Propriedade intelectual</h2>
        <p>
          A doublethree retém todos os direitos de propriedade intelectual sobre o software, marcas, logotipos e
          documentação do PaymentsHub. O cliente retém os direitos sobre seus próprios dados, inclusive as ordens
          de pagamento, beneficiários e auditoria geradas durante o uso do Serviço.
        </p>

        <h2>8. Limitação de responsabilidade</h2>
        <p>
          A doublethree não é parte contratual das transações bancárias e não responde por eventos fora de seu
          controle direto, incluindo: indisponibilidade dos bancos, mudanças regulatórias do BCB, erro na ordem de
          pagamento inserida pelo cliente ou atrasos na liquidação pelo SPI/STR. A responsabilidade máxima da doublethree
          em qualquer hipótese está limitada ao total pago pelo cliente nos 12 meses anteriores ao evento.
        </p>

        <h2>9. Alterações nos Termos</h2>
        <p>
          A doublethree pode atualizar estes Termos. Mudanças materiais serão comunicadas por e-mail com 30 dias de
          antecedência. O uso continuado após a vigência da nova versão implica aceitação.
        </p>

        <h2>10. Foro</h2>
        <p>
          Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de <strong>Curitiba/PR</strong>
          para dirimir qualquer controvérsia, com renúncia a qualquer outro, por mais privilegiado que seja.
        </p>
      </Prose>
    </>
  );
}
