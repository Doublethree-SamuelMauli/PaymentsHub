"use client";

import { ArrowRight, Building2, FileCheck, ClipboardList, Send, Landmark, ShieldCheck } from "lucide-react";

export function FlowDiagram() {
  const steps = [
    { icon: Building2,    title: "ERP Cliente",   desc: "Envia pagamentos via API", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    { icon: FileCheck,    title: "Pre-validacao", desc: "DICT, limites, duplicidade", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { icon: ClipboardList,title: "Lote do Dia",  desc: "Admin aprova/reprova/reagenda", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { icon: Send,         title: "Envio ao banco",desc: "PIX REST + TED CNAB 240", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { icon: Landmark,     title: "Banco",         desc: "Autorizacao manual", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { icon: ShieldCheck,  title: "Liquidado",     desc: "Webhook + timeline", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];

  return (
    <div className="relative">
      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-11 gap-0 items-center">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <>
              <div key={s.title} className="col-span-1 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl border-2 ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-xs font-semibold text-zinc-900">{s.title}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[100px]">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="col-span-1 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-zinc-300" />
                </div>
              )}
            </>
          );
        })}
      </div>

      {/* Mobile layout - vertical */}
      <div className="lg:hidden space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="relative">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200">
                <div className={`w-12 h-12 rounded-xl border-2 ${s.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{s.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                </div>
                <span className="ml-auto text-[10px] font-mono text-zinc-300 font-bold">{String(i + 1).padStart(2, "0")}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-px h-3 bg-zinc-200 mx-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
