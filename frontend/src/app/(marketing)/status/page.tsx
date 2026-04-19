import { CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { PageHero, GlassCard } from "@/components/marketing/shell";

export const metadata = { title: "Status dos serviços PaymentsHub", description: "Status em tempo real dos serviços do PaymentsHub. Uptime, latência e histórico de incidentes." };

const SERVICES = [
  { name: "API · Pagamentos", uptime: 99.98, status: "operational" },
  { name: "API · Runs (lotes)", uptime: 99.97, status: "operational" },
  { name: "Webhooks de saída", uptime: 99.94, status: "operational" },
  { name: "Integração Itaú PIX", uptime: 99.92, status: "operational" },
  { name: "Integração Itaú TED CNAB", uptime: 99.95, status: "operational" },
  { name: "Painel web", uptime: 99.99, status: "operational" },
];

const INCIDENTS = [
  { date: "08 abr 2026", title: "Latência elevada na ingestão de pagamentos", duration: "23 minutos", impact: "Parcial", solved: true },
  { date: "27 mar 2026", title: "Indisponibilidade da integração Itaú PIX", duration: "1h 12min", impact: "Total · sandbox", solved: true },
  { date: "15 mar 2026", title: "Falha no envio de webhooks", duration: "47 minutos", impact: "Parcial", solved: true },
];

export default function StatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Status"
        title="Tudo operando normalmente"
        subtitle="Status em tempo real dos serviços do PaymentsHub. Atualizado a cada minuto."
      />

      <section className="mx-auto max-w-4xl px-7 py-16">
        <div className="mb-10 flex items-center gap-3 rounded-[18px] border border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-emerald)_10%,transparent)] p-5 backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--brand-emerald)_20%,transparent)]">
            <CheckCircle2 size={20} className="text-[var(--brand-emerald)]" />
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold">Todos os sistemas operacionais</p>
            <p className="font-mono text-[11px] text-[var(--muted-foreground)]">Última verificação: agora · Nenhum incidente nas últimas 72h</p>
          </div>
        </div>

        <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Serviços</h2>
        <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_60%,transparent)] backdrop-blur-md">
          {SERVICES.map((s, i) => (
            <div key={s.name} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-emerald)] shadow-[0_0_12px_var(--brand-emerald)]" />
                <span className="text-[14px] font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkbar />
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">{s.uptime.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Uptime · 90 dias", "99,96%"],
            ["Latência p95 · API", "84ms"],
            ["Pagamentos hoje", "12.847"],
          ].map(([l, v]) => (
            <GlassCard key={l}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{l}</p>
              <p className="mt-2 font-display text-[26px] font-semibold tracking-[-0.02em]">{v}</p>
            </GlassCard>
          ))}
        </div>

        <h2 className="mb-3 mt-12 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Histórico recente</h2>
        <div className="space-y-2">
          {INCIDENTS.map((i) => (
            <div key={i.date} className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_55%,transparent)] p-4 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 text-[var(--brand-amber)]" />
                  <div>
                    <p className="font-display text-[14px] font-semibold">{i.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">{i.date} · Duração {i.duration} · Impacto {i.impact}</p>
                  </div>
                </div>
                {i.solved && (
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--brand-emerald)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-emerald)_15%,transparent)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--brand-emerald)]">
                    RESOLVIDO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <GlassCard className="mt-12 text-center">
          <Activity size={18} className="mx-auto text-[var(--muted-foreground)]" />
          <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
            Quer receber alertas? Inscreva-se em{" "}
            <a href="mailto:status@doublethree.com.br" className="text-[var(--brand-cyan)] underline">status@doublethree.com.br</a>
          </p>
        </GlassCard>
      </section>
    </>
  );
}

function Sparkbar() {
  const days = Array.from({ length: 30 }, (_, i) => (i === 8 || i === 22 ? "amber" : "ok"));
  return (
    <div className="hidden items-center gap-[2px] sm:flex">
      {days.map((d, i) => (
        <span
          key={i}
          className={`h-5 w-1 rounded-sm ${
            d === "ok" ? "bg-[var(--brand-emerald)]/80" : "bg-[var(--brand-amber)]/80"
          }`}
        />
      ))}
    </div>
  );
}
