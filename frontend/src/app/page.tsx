"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, Send, Loader2, ChevronRight, Lock, Layers, Activity, ArrowUpRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white antialiased scroll-smooth">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <ContactForm />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-zinc-100 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Produto</a>
          <a href="#como-funciona" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Como funciona</a>
          <a href="#contato" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Contato</a>
        </div>
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-sm text-zinc-600 hover:text-zinc-900">
            Entrar <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-40 pb-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/40 via-white to-white" />
      <div className="max-w-4xl mx-auto text-center relative">
        <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tighter leading-[0.95]">
          O futuro dos
          <br />
          pagamentos
          <br />
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            corporativos
          </span>
        </h1>
        <p className="mt-8 text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-light">
          Uma unica plataforma para receber, validar, aprovar e executar todos
          os pagamentos da sua empresa. PIX e TED integrados ao banco.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="#contato">
            <Button className="bg-zinc-900 hover:bg-zinc-800 h-12 px-8 text-sm font-medium rounded-full">
              Comece agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link href="/login">
            <Button variant="outline" className="h-12 px-8 text-sm font-medium rounded-full border-zinc-300">
              Acessar plataforma
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Logos() {
  return (
    <section className="py-12 px-6 border-y border-zinc-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-zinc-400 uppercase tracking-widest mb-6">Integracao nativa com</p>
        <div className="flex items-center justify-center gap-12 opacity-40">
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Itau</span>
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Bradesco</span>
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Santander</span>
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Banco do Brasil</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-16">
          <p className="text-sm font-medium text-emerald-600 mb-3">Produto</p>
          <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
            Infraestrutura completa de pagamentos
          </h2>
          <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
            Tudo que sua equipe financeira precisa em um unico lugar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Activity className="h-5 w-5" />}
            title="PIX instantaneo via API"
            desc="Envie PIX em tempo real pela API REST do banco. Feedback de liquidacao em segundos com webhooks automaticos."
            gradient="from-emerald-500 to-teal-600"
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Seguranca de nivel bancario"
            desc="mTLS com certificados ICP-Brasil, OAuth2, idempotencia em cada transacao, circuit breaker e retry automatico."
            gradient="from-blue-600 to-indigo-700"
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="CNAB 240 integrado"
            desc="Gerador e parser CNAB 240 FEBRABAN nativo. Envio de TED em lote via SFTP com reconciliacao automatica."
            gradient="from-zinc-700 to-zinc-900"
          />
          <FeatureCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            title="Rastreabilidade total"
            desc="Timeline completa de cada pagamento: criacao, validacao, aprovacao, envio, liquidacao. Audit trail imutavel."
            gradient="from-amber-500 to-orange-600"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string }) {
  return (
    <div className="group relative bg-zinc-50 border border-zinc-200/60 rounded-2xl p-8 hover:bg-white hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-200 transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-5`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-[15px] text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-32 px-6 bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-emerald-400 mb-3">Como funciona</p>
          <h2 className="text-4xl font-extrabold tracking-tight">Tres passos. Zero complexidade.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { num: "01", title: "Conecte seu ERP", desc: "Uma unica API REST para enviar pagamentos. Integracao em minutos com qualquer sistema." },
            { num: "02", title: "Aprove em lote", desc: "Pagamentos sao validados automaticamente. Sua equipe aprova pelo portal com um clique." },
            { num: "03", title: "Acompanhe tudo", desc: "PIX liquida em segundos. TED reconcilia automaticamente. Webhooks notificam cada etapa." },
          ].map((s) => (
            <div key={s.num}>
              <span className="text-5xl font-black text-zinc-800">{s.num}</span>
              <h3 className="text-xl font-semibold mt-4 mb-3">{s.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
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
    <section id="contato" className="py-32 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-emerald-600 mb-3">Contato</p>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Fale com a nossa equipe</h2>
          <p className="mt-3 text-zinc-500">Resposta em ate 24 horas uteis</p>
        </div>

        {status === "sent" ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900">Recebemos sua mensagem</h3>
            <p className="mt-2 text-zinc-500">Enviamos uma confirmacao para {form.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-700">Nome *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-700">Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nome da empresa" className="h-11 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-700">Email *</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-700">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="h-11 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-700">Mensagem</Label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Conte sobre sua operacao de pagamentos..." rows={4} className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
            </div>
            {status === "error" && <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>}
            <Button type="submit" disabled={status === "sending"} className="w-full bg-zinc-900 hover:bg-zinc-800 h-12 text-sm font-medium rounded-full">
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
    <footer className="border-t border-zinc-100 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Logo size="small" />
          <span className="text-xs text-zinc-400">Double Three Tecnologia LTDA</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-zinc-400">
          <a href="mailto:contato@doublethree.com.br" className="hover:text-zinc-600 transition-colors">contato@doublethree.com.br</a>
          <Link href="/login" className="hover:text-zinc-600 transition-colors">Plataforma</Link>
        </div>
      </div>
    </footer>
  );
}
