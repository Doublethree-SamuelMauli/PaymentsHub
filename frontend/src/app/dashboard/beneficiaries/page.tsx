"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BeneficiariesPage() {
  const [form, setForm] = useState({
    kind: "SUPPLIER",
    legal_name: "",
    document_type: "CNPJ",
    document_number: "",
    email: "",
    phone: "",
  });
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    try {
      const result = await api.post<{ id: string }>("/v1/admin/beneficiaries", {
        ...form,
        tags: [],
      });
      setSuccess(`Beneficiário criado: ${result.id}`);
      setForm({ ...form, legal_name: "", document_number: "", email: "", phone: "" });
    } catch (err) {
      alert("Erro: " + (err as Error).message);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Beneficiários</h2>
        <p className="text-sm text-zinc-500 mt-1">Cadastre fornecedores, clientes, funcionários</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Beneficiário</CardTitle>
          <CardDescription>
            Cadastre um novo destinatário de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  <option value="SUPPLIER">Fornecedor</option>
                  <option value="CLIENT">Cliente</option>
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="GOVERNMENT">Governo</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <select
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700"
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Razão Social / Nome</Label>
              <Input
                value={form.legal_name}
                onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                placeholder="ACME Fornecedores LTDA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Número do Documento</Label>
              <Input
                value={form.document_number}
                onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                placeholder="12.345.678/0001-90"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <Button type="submit">Cadastrar</Button>
          </form>
          {success && (
            <p className="mt-4 text-sm text-emerald-600">{success}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
