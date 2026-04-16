import { CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { PageHero } from "@/components/marketing/shell";

export const metadata = { title: "Status · PaymentsHub" };

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

      <section className="mx-auto max-w-4xl px-6 py-16">
        {/* Banner */}
        <div className="mb-10 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Todos os sistemas operacionais</p>
            <p className="text-xs text-[var(--muted-foreground)]">Última verificação: agora · Nenhum incidente nas últimas 72h</p>
          </div>
        </div>

        {/* Serviços */}
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Serviços</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkbar />
                <span className="text-xs font-mono text-[var(--muted-foreground)]">{s.uptime.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Métricas globais */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Uptime · 90 dias", "99.96%"],
            ["Latência p95 · API", "84ms"],
            ["Pagamentos hoje", "12.847"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{l}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">{v}</p>
            </div>
          ))}
        </div>

        {/* Incidentes */}
        <h2 className="mt-12 mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Histórico recente</h2>
        <div className="space-y-2">
          {INCIDENTS.map((i) => (
            <div key={i.date} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{i.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{i.date} · Duração {i.duration} · Impacto {i.impact}</p>
                  </div>
                </div>
                {i.solved && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">RESOLVIDO</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <Activity size={18} className="mx-auto text-[var(--muted-foreground)]" />
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Quer receber alertas? Inscreva-se em <a href="mailto:status@doublethree.com.br" className="text-[#1e4ea8] underline">status@doublethree.com.br</a>
          </p>
        </div>
      </section>
    </>
  );
}

function Sparkbar() {
  // 30 days, mostly green, occasional warn
  const days = Array.from({ length: 30 }, (_, i) => (i === 8 || i === 22 ? "amber" : "ok"));
  return (
    <div className="hidden items-center gap-[2px] sm:flex">
      {days.map((d, i) => (
        <span
          key={i}
          className={`h-5 w-1 rounded-sm ${
            d === "ok" ? "bg-emerald-500/80" : "bg-amber-500/80"
          }`}
        />
      ))}
    </div>
  );
}
