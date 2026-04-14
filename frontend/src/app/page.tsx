"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo, ShieldIcon } from "@/components/logo";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, Send, Loader2, ChevronRight, Lock, Layers, Activity, Zap, Eye, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      <Nav />
      <Hero />
      <Stats />
      <FlowSection />
      <Features />
      <HowItWorks />
      <CTA />
      <ContactForm />
      <Footer />
    </div>
  );
}

function FlowSection() {
  return (
    <section className="py-24 sm:py-28 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#22863a] mb-2">Fluxo completo</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a2744] tracking-tight">
            Do ERP ao banco em uma unica plataforma
          </h2>
          <p className="mt-3 text-[15px] text-zinc-500 max-w-2xl mx-auto">
            Seu ERP envia os pagamentos. A plataforma valida, agrupa, permite aprovacao manual e envia tudo ao banco como um lote unico.
          </p>
        </div>
        <FlowDiagram />
        <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Voce controla</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">Aprova, rejeita ou reagenda cada pagamento antes de enviar</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Sem debito automatico</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">Autorizacao final e sempre manual no internet banking</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">1 pagamento unico</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">Todos os pagamentos viram um lote consolidado no banco</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-zinc-100/80 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          <a href="#produto" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Produto</a>
          <a href="#como-funciona" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Como funciona</a>
          <a href="#contato" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Contato</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#contato" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-[13px] text-zinc-500">Falar com consultor</Button>
          </a>
          <Link href="/login">
            <Button size="sm" className="text-[13px] bg-[#1a2744] hover:bg-[#0f1a2e] h-9 px-4 rounded-lg">
              Acessar <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-50/60 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8">
            <ShieldIcon size={56} />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1a2744] tracking-[-0.03em] leading-[1.05]">
            Pagamentos corporativos
            <br className="hidden sm:block" />
            <span className="text-[#22863a]"> simplificados</span>
          </h1>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-zinc-500 max-w-2xl leading-relaxed">
            Centralize PIX e TED da sua empresa em uma unica plataforma.
            Validacao automatica, aprovacao em lote e rastreabilidade completa.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a href="#contato" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#1a2744] hover:bg-[#0f1a2e] h-12 px-8 text-sm font-medium rounded-xl shadow-lg shadow-zinc-900/10">
                Solicitar demonstracao <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-sm font-medium rounded-xl border-zinc-200">
                Acessar plataforma
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-12 px-4 sm:px-6 border-y border-zinc-100 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { value: "< 3s", label: "Liquidacao PIX" },
          { value: "99.9%", label: "Uptime garantido" },
          { value: "CNAB 240", label: "Suporte nativo" },
          { value: "Multi-banco", label: "Itau, Bradesco, BB" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1a2744] tracking-tight">{s.value}</div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "PIX instantaneo",
      desc: "Execute pagamentos PIX via API REST com feedback de liquidacao em segundos. Webhooks automaticos para cada mudanca de status.",
      color: "bg-emerald-500",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Seguranca bancaria",
      desc: "Certificados mTLS, OAuth2, idempotencia por transacao, circuit breaker. Compliance BACEN e LGPD nativos.",
      color: "bg-blue-600",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "CNAB 240 integrado",
      desc: "Gere e processe arquivos CNAB 240 FEBRABAN automaticamente. TED em lote via SFTP com reconciliacao.",
      color: "bg-zinc-800",
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Audit trail imutavel",
      desc: "Timeline completa de cada pagamento. Quem criou, validou, aprovou, enviou. Impossivel de alterar.",
      color: "bg-amber-500",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Pre-analise automatica",
      desc: "Motor de regras configuraveis: limites diarios, deteccao de duplicidade, blacklist de documentos.",
      color: "bg-purple-600",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "API REST completa",
      desc: "Ingress individual ou em lote. Import CSV/Excel. Documentacao OpenAPI. Idempotency-Key obrigatorio.",
      color: "bg-rose-500",
    },
  ];

  return (
    <section id="produto" className="py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-sm font-semibold text-[#22863a] mb-2">Produto</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a2744] tracking-tight leading-tight">
            Tudo que o financeiro da sua empresa precisa
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <div key={i} className="group p-6 sm:p-7 rounded-2xl border border-zinc-100 hover:border-zinc-200 bg-white hover:shadow-xl hover:shadow-zinc-100/80 transition-all duration-300 cursor-default">
              <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[#1a2744] mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#0f1a2e] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-sm font-semibold text-emerald-400 mb-2">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tres etapas para automatizar seus pagamentos</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
          {[
            { num: "01", title: "Conecte", desc: "Integre seu ERP via API REST. Uma chamada para enviar pagamentos. Suporte a JSON, CSV e Excel." },
            { num: "02", title: "Aprove", desc: "Pagamentos validados automaticamente. Sua equipe revisa e aprova lotes pelo portal ou via API." },
            { num: "03", title: "Acompanhe", desc: "PIX em segundos, TED reconciliado automaticamente. Webhooks e dashboard em tempo real." },
          ].map((s) => (
            <div key={s.num} className="relative">
              <span className="text-6xl sm:text-7xl font-black text-white/[0.04] absolute -top-4 -left-2">{s.num}</span>
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400/30 flex items-center justify-center text-emerald-400 text-sm font-bold mb-5">
                  {s.num}
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-[15px]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a2744] tracking-tight">
          Pronto para modernizar seus pagamentos?
        </h2>
        <p className="mt-4 text-lg text-zinc-500">
          Agende uma demonstracao com nossa equipe e veja o PaymentsHub em acao.
        </p>
        <div className="mt-8">
          <a href="#contato">
            <Button className="bg-[#22863a] hover:bg-[#1a6d2e] h-12 px-8 text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20">
              Agendar demonstracao <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch { setStatus("error"); }
  }

  return (
    <section id="contato" className="py-24 sm:py-32 px-4 sm:px-6 bg-zinc-50">
      <div className="max-w-md sm:max-w-lg mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-sm font-semibold text-[#22863a] mb-2">Contato</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a2744] tracking-tight">Fale com nossa equipe</h2>
          <p className="mt-2 text-sm text-zinc-500">Resposta em ate 24 horas uteis</p>
        </div>
        {status === "sent" ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-zinc-100">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <Check className="h-7 w-7 text-[#22863a]" />
            </div>
            <h3 className="text-lg font-bold text-[#1a2744]">Mensagem enviada</h3>
            <p className="mt-2 text-sm text-zinc-500">Confirmacao enviada para {form.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-zinc-700">Nome *</Label>
                <Input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Seu nome" className="h-11 rounded-xl border-zinc-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-zinc-700">Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} placeholder="Nome da empresa" className="h-11 rounded-xl border-zinc-200" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-zinc-700">Email *</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@empresa.com" className="h-11 rounded-xl border-zinc-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-zinc-700">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="(11) 99999-9999" className="h-11 rounded-xl border-zinc-200" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700">Mensagem</Label>
              <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Conte sobre sua operacao..." rows={3} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent" />
            </div>
            {status === "error" && <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>}
            <Button type="submit" disabled={status === "sending"} className="w-full bg-[#1a2744] hover:bg-[#0f1a2e] h-12 text-sm font-medium rounded-xl">
              {status === "sending" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4 mr-2" /> Enviar mensagem</>}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-100 py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo size="small" />
          <span className="text-xs text-zinc-400">Double Three Tecnologia</span>
        </div>
        <div className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm text-zinc-400">
          <a href="mailto:contato@doublethree.com.br" className="hover:text-zinc-600 transition-colors">contato@doublethree.com.br</a>
          <Link href="/login" className="hover:text-zinc-600 transition-colors">Plataforma</Link>
        </div>
      </div>
    </footer>
  );
}
