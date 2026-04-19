import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Acordo de tratamento de dados (DPA)",
  description:
    "Data Processing Agreement do PaymentsHub: termos técnicos e contratuais para tratamento de dados pessoais em conformidade com a LGPD.",
};

export default function DPAPage() {
  return (
    <>
      <PageHero
        eyebrow="DPA"
        title="Acordo de tratamento de dados"
        subtitle="Condições que regem o tratamento de dados pessoais entre a Double Three Tecnologia (operadora) e o cliente (controlador)."
      />
      <Prose>
        <h2>1. Definições</h2>
        <ul>
          <li><strong>Controlador</strong>: o cliente contratante do PaymentsHub, responsável pelas decisões sobre o tratamento de dados pessoais.</li>
          <li><strong>Operador</strong>: a Double Three Tecnologia Ltda., que trata dados pessoais em nome do Controlador.</li>
          <li><strong>Titular</strong>: pessoa natural a quem se referem os dados tratados.</li>
          <li><strong>Subprocessador</strong>: terceiro contratado pelo Operador para auxiliar na prestação do Serviço.</li>
          <li><strong>LGPD</strong>: Lei nº 13.709/2018.</li>
        </ul>

        <h2>2. Objeto</h2>
        <p>
          Este DPA rege o tratamento de dados pessoais realizado pelo Operador em nome do Controlador ao prestar
          o Serviço PaymentsHub, conforme o contrato principal. Em caso de conflito entre documentos, prevalece este DPA
          para questões de proteção de dados.
        </p>

        <h2>3. Natureza e finalidade</h2>
        <p>
          <strong>Natureza</strong>: orquestração de ordens de pagamento (PIX, TED, CNAB 240) entre o ERP do Controlador e
          as instituições financeiras integradas. <strong>Finalidade</strong>: execução do contrato. <strong>Duração</strong>:
          enquanto vigente o contrato principal, com retenção posterior apenas para cumprimento de obrigações legais.
        </p>

        <h2>4. Tipos de dados e titulares</h2>
        <ul>
          <li>Dados cadastrais de beneficiários (CNPJ/CPF, nome, dados bancários, chaves PIX).</li>
          <li>Dados transacionais (valores, status, end-to-end IDs, retornos bancários).</li>
          <li>Dados dos usuários operadores do Controlador (nome, e-mail, cargo, logs de acesso).</li>
        </ul>

        <h2>5. Obrigações do Operador</h2>
        <ul>
          <li>Tratar dados apenas conforme instruções documentadas do Controlador.</li>
          <li>Garantir confidencialidade por todos que tiverem acesso (incluindo colaboradores e subprocessadores).</li>
          <li>Implementar medidas técnicas e administrativas adequadas (criptografia, controle de acesso, MFA, auditoria append-only).</li>
          <li>Auxiliar o Controlador nos direitos dos titulares (art. 18 LGPD) em até 15 dias.</li>
          <li>Notificar o Controlador sobre incidentes de segurança em até <strong>48 horas</strong> após a ciência.</li>
          <li>Manter registro das operações de tratamento (art. 37 LGPD).</li>
        </ul>

        <h2>6. Subprocessadores autorizados</h2>
        <p>Lista vigente em 19/04/2026:</p>
        <ul>
          <li><strong>Amazon Web Services (AWS)</strong> — infraestrutura de cômputo, armazenamento e rede — us-east-2.</li>
          <li><strong>Cloudflare Inc.</strong> — CDN, DNS autoritativo e proteção WAF.</li>
          <li><strong>Google (Workspace)</strong> — e-mail transacional e calendário corporativo.</li>
          <li><strong>Stripe (opcional)</strong> — processamento de cobrança dos planos do Serviço.</li>
        </ul>
        <p>
          O Operador comunicará com 30 dias de antecedência qualquer mudança na lista de subprocessadores. O Controlador
          pode objetar por escrito; caso a objeção inviabilize a prestação, ambas as partes podem rescindir o contrato
          sem penalidade.
        </p>

        <h2>7. Transferência internacional</h2>
        <p>
          O Operador pode realizar transferência internacional para os Estados Unidos, com base no art. 33 da LGPD,
          mediante cláusulas contratuais padrão e garantias equivalentes.
        </p>

        <h2>8. Auditoria</h2>
        <p>
          Mediante aviso prévio de 30 dias, uma vez por ano civil, o Controlador (ou auditor independente de sua
          escolha sob NDA) pode auditar as medidas de segurança do Operador. A doublethree disponibiliza relatórios
          SOC 2 Type II quando disponíveis.
        </p>

        <h2>9. Devolução e eliminação</h2>
        <p>
          Ao término do contrato, o Controlador poderá solicitar a exportação de seus dados em formato estruturado (CSV/Parquet)
          em até 30 dias. Após esse prazo, os dados serão eliminados, exceto aqueles necessários para o cumprimento de
          obrigação legal ou regulatória.
        </p>

        <h2>10. Contato</h2>
        <p>
          Questões sobre este DPA: <code>privacy@doublethree.com.br</code>. DPO: <strong>Samuel Mauli</strong>.
        </p>
      </Prose>
    </>
  );
}
