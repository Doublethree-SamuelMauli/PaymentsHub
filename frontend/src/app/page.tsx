"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Zap, Eye, FileText, ArrowRight, Check, Send, Loader2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <ContactForm />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <a href="#features" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Como funciona</a>
          <a href="#contato" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">Contato</a>
          <Link href="/login">
            <Button variant="outline" size="sm" className="text-xs h-8">Acessar plataforma</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-medium mb-6">
          <Zap className="h-3 w-3" /> Orquestrador de pagamentos bancarios
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
          Pagamentos bancarios<br /><span className="text-emerald-600">centralizados e seguros</span>
        </h1>
        <p className="mt-5 text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
          Receba pagamentos do seu ERP, valide automaticamente, aprove em lote
          e envie ao banco via PIX e TED. Rastreabilidade completa de cada centavo.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="#contato">
            <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-sm h-11 px-6">
              Fale com um consultor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-sm h-11 px-6">Acessar plataforma</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Zap, title: "PIX em tempo real", desc: "Pagamentos PIX executados via API REST do banco com feedback em segundos. TED via CNAB 240 em lote aprovado." },
    { icon: Shield, title: "Seguranca bancaria", desc: "mTLS, certificados ICP-Brasil, OAuth2, idempotencia obrigatoria, circuit breaker, retry automatico." },
    { icon: Eye, title: "Rastreabilidade total", desc: "Cada pagamento tem timeline completa: quem criou, quando validou, quem aprovou, quando liquidou." },
    { icon: FileText, title: "CNAB 240 nativo", desc: "Gerador e parser CNAB 240 FEBRABAN integrado. Reconciliacao automatica com arquivo de retorno." },
  ];
  return (
    <section id="features" className="py-20 px-6 bg-zinc-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Tudo que voce precisa para pagamentos corporativos</h2>
          <p className="mt-2 text-zinc-500 text-[15px]">Infraestrutura completa de pagamentos bancarios como servico</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-300 transition-colors">
              <div className="w-9 h-9 rounded-md bg-zinc-900 flex items-center justify-center mb-4">
                <f.icon className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Integre sua API", desc: "Envie pagamentos via REST API com uma unica chamada. Receba confirmacao em milissegundos." },
    { num: "02", title: "Aprove em lote", desc: "Pagamentos sao pre-validados automaticamente. Aprove o lote do dia pelo portal ou API." },
    { num: "03", title: "Acompanhe em tempo real", desc: "PIX liquida em segundos. TED reconcilia automaticamente. Webhooks notificam cada mudanca." },
  ];
  return (
    <section id="como-funciona" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">Como funciona</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">{s.num}</div>
              <h3 className="text-[15px] font-semibold text-zinc-900">{s.title}</h3>
              <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
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
    <section id="contato" className="py-20 px-6 bg-zinc-50">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900">Fale com um consultor</h2>
          <p className="mt-2 text-zinc-500 text-[15px]">Preencha o formulario e nossa equipe entrara em contato em ate 24h</p>
        </div>
        {status === "sent" ? (
          <div className="bg-white border border-emerald-200 rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="h-6 w-6 text-emerald-600" /></div>
            <h3 className="text-lg font-semibold text-zinc-900">Solicitacao enviada</h3>
            <p className="mt-2 text-sm text-zinc-500">Enviamos uma confirmacao para {form.email}. Um consultor entrara em contato em breve.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Nome *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nome da empresa" className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Email *</Label>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Mensagem</Label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Conte um pouco sobre sua operacao de pagamentos..." className="w-full rounded-md border border-zinc-200 px-3 py-2 text-[13px] min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
            </div>
            {status === "error" && <p className="text-xs text-red-500">Erro ao enviar. Tente novamente.</p>}
            <Button type="submit" disabled={status === "sending"} className="w-full bg-zinc-900 hover:bg-zinc-800 h-10 text-[13px]">
              {status === "sending" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4 mr-2" /> Enviar solicitacao</>}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="small" />
          <span className="text-[11px] text-zinc-400 ml-4">Double Three Tecnologia LTDA</span>
        </div>
        <div className="flex items-center gap-6 text-[12px] text-zinc-400">
          <a href="mailto:contato@doublethree.com.br" className="hover:text-zinc-600 transition-colors">contato@doublethree.com.br</a>
          <Link href="/login" className="hover:text-zinc-600 transition-colors">Acessar plataforma</Link>
        </div>
      </div>
    </footer>
  );
}
