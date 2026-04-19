import type { Metadata } from "next";
import {
  ShieldCheck,
  Lock,
  Key,
  Eye,
  Server,
  FileCheck,
  AlertTriangle,
  Users,
} from "lucide-react";
import { PageHero, GlassCard } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Segurança",
  description:
    "Como o PaymentsHub protege dados, credenciais e ordens de pagamento: criptografia, mTLS, 2FA, auditoria imutável e conformidade FEBRABAN/LGPD.",
};

const pillars = [
  {
    icon: <Lock size={20} />,
    title: "Criptografia em repouso e trânsito",
    body: "AES-256 em todos os volumes e buckets. TLS 1.2+ em todas as conexões externas. mTLS nas integrações bancárias.",
  },
  {
    icon: <Key size={20} />,
    title: "Gestão de segredos",
    body: "Chaves por tenant em AWS KMS. Certificados mTLS em HSM. Rotação automática de credenciais OAuth2 a cada 30 dias.",
  },
  {
    icon: <Users size={20} />,
    title: "Separação de privilégios",
    body: "Papéis distintos: viewer, operator, approver, admin. Aprovação humana obrigatória antes de qualquer envio ao banco.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "2FA obrigatório",
    body: "TOTP e WebAuthn (Face ID, YubiKey) para operadores. Aprovação de pagamento exige 2FA a cada sessão crítica.",
  },
  {
    icon: <Eye size={20} />,
    title: "Auditoria imutável",
    body: "Cada transição de estado vira evento append-only com timestamp, IP, user-agent e assinatura criptográfica. Retenção mínima de 5 anos.",
  },
  {
    icon: <Server size={20} />,
    title: "Infra com isolamento",
    body: "VPC privada na AWS us-east-2, subnets isoladas por camada, WAF na borda (Cloudflare), rate-limit por API key e por IP.",
  },
  {
    icon: <AlertTriangle size={20} />,
    title: "Resposta a incidentes",
    body: "Runbook escrito, detecção em tempo real, alertas via PagerDuty. Notificação ao cliente em até 48h após confirmação.",
  },
  {
    icon: <FileCheck size={20} />,
    title: "Conformidade",
    body: "LGPD, melhores práticas FEBRABAN, convergindo para SOC 2 Type II e ISO 27001. Testes de intrusão anuais.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Segurança"
        title="Pagamentos não podem ser violados. Nem interceptados."
        subtitle="A arquitetura do PaymentsHub parte do princípio de zero-trust, auditoria imutável e aprovação humana obrigatória. Essa página documenta os controles que aplicamos."
      />

      <section className="mx-auto max-w-7xl px-7 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <GlassCard key={p.title} className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--brand-glow)_25%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-glow)_18%,transparent)] to-[color-mix(in_srgb,var(--brand-cyan)_12%,transparent)] text-[var(--brand-cyan)]">
                {p.icon}
              </div>
              <h3 className="mb-2 font-display text-[17px] font-semibold">{p.title}</h3>
              <p className="text-[13px] leading-[1.6] text-[var(--muted-foreground)]">{p.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-7">
          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--brand-cyan)]">SLA</p>
              <p className="mt-2 font-display text-[32px] font-semibold">99,98%</p>
              <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Disponibilidade média nos últimos 90 dias.</p>
            </GlassCard>
            <GlassCard>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--brand-cyan)]">RTO / RPO</p>
              <p className="mt-2 font-display text-[32px] font-semibold">≤ 15min</p>
              <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Restauração em caso de falha regional (AZ failover).</p>
            </GlassCard>
            <GlassCard>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--brand-cyan)]">Backups</p>
              <p className="mt-2 font-display text-[32px] font-semibold">24×7</p>
              <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">Snapshot diário criptografado + PITR por 30 dias.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-4xl px-7">
          <h2 className="font-display text-[28px] font-semibold tracking-[-0.02em]">Reporte de vulnerabilidade</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-[var(--muted-foreground)]">
            Encontrou um problema de segurança? Agradecemos o reporte responsável. Escreva para
            {" "}
            <a className="text-[var(--brand-cyan)] underline" href="mailto:security@doublethree.com.br">
              security@doublethree.com.br
            </a>
            {" "}
            com reprodução mínima e impacto. Respondemos em até 1 dia útil e mantemos o pesquisador informado durante
            toda a triagem. Programa oficial de recompensas em preparação.
          </p>
        </div>
      </section>
    </>
  );
}
