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
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      api.setToken(token);
      await api.get("/healthz");
      router.push("/dashboard");
    } catch {
      setError("Token invalido ou servidor indisponivel");
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo size="large" /></div>
          <p className="text-sm text-zinc-500">Acesse a plataforma com sua API Key</p>
        </div>
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">API Key</Label>
                <Input
                  type="password"
                  placeholder="phk_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="h-10 text-[13px]"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 h-10 text-[13px]">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</> : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
