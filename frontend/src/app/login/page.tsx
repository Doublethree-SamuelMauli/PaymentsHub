"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Credenciais invalidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5"><Logo size="large" /></div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Acesse sua conta</h1>
          <p className="text-sm text-zinc-500 mt-1">Entre com suas credenciais corporativas</p>
        </div>
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-zinc-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input type="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required className="h-11 pl-9 text-[14px]" autoFocus autoComplete="email" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-zinc-700">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input type="password" placeholder="Sua senha"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="h-11 pl-9 text-[14px]" autoComplete="current-password" />
                </div>
              </div>
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
              <Button type="submit" disabled={loading}
                className="w-full bg-[#1a2744] hover:bg-[#0f1a2e] h-11 text-[14px] font-medium rounded-lg">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-100">
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-700 font-medium">Usuarios de demonstracao</summary>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <div><span className="text-emerald-600 font-semibold">admin</span>: admin@doublethree.com.br / admin123</div>
                  <div><span className="text-blue-600 font-semibold">approver</span>: approver@doublethree.com.br / approver123</div>
                  <div><span className="text-amber-600 font-semibold">operator</span>: operator@doublethree.com.br / operator123</div>
                  <div><span className="text-zinc-500 font-semibold">viewer</span>: viewer@doublethree.com.br / viewer123</div>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-5">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
