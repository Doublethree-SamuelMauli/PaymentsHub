"use client";

import { useEffect, useState } from "react";
import { api, type UserListItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserCog, RefreshCw, Loader2, X, Shield } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Acesso total ao sistema", color: "emerald" },
  { value: "approver", label: "Aprovador", desc: "Pode aprovar lotes e enviar ao banco", color: "blue" },
  { value: "operator", label: "Operador", desc: "Cria e gerencia pagamentos", color: "amber" },
  { value: "viewer", label: "Viewer", desc: "Somente leitura", color: "zinc" },
];

function roleBadge(role: string) {
  const config = ROLES.find(r => r.value === role);
  const color = config?.color || "zinc";
  const classes: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return classes[color];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  function refresh() {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleChangeRole(id: string, newRole: string) {
    await api.updateUserRole(id, newRole);
    refresh();
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Desativar este usuario?")) return;
    await api.deactivateUser(id);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#1a2744]" /> Usuarios
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie quem tem acesso a plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-[#1a2744] hover:bg-[#0f1a2e] gap-1.5 text-xs h-9 rounded-lg">
            <Plus className="h-3.5 w-3.5" /> Novo usuario
          </Button>
        </div>
      </div>

      {/* RBAC legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <Card key={r.value} className="border-zinc-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`h-3.5 w-3.5 text-${r.color}-600`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider text-${r.color}-700`}>{r.label}</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-zinc-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase tracking-wider">
                <TableHead className="pl-4">Usuario</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultimo login</TableHead>
                <TableHead className="pr-4">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="text-[13px]">
                  <TableCell className="pl-4">
                    <div>
                      <p className="font-medium text-zinc-900">{u.name}</p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${roleBadge(u.role)} cursor-pointer`}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-zinc-100 text-zinc-500 text-[10px]"}>
                      {u.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {u.last_login_at && u.last_login_at !== "0001-01-01T00:00:00Z" ? new Date(u.last_login_at).toLocaleString("pt-BR") : "Nunca"}
                  </TableCell>
                  <TableCell className="pr-4">
                    {u.active && (
                      <Button variant="outline" size="sm" onClick={() => handleDeactivate(u.id)}
                        className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50">
                        Desativar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && users.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-400">Nenhum usuario</div>
          )}
        </CardContent>
      </Card>

      <NewUserModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={refresh} />
    </div>
  );
}

function NewUserModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: "", name: "", role: "viewer", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.createUser(form);
      onSuccess();
      onClose();
      setForm({ email: "", name: "", role: "viewer", password: "" });
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h3 className="text-lg font-bold text-zinc-900">Novo usuario</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded"><X className="h-4 w-4 text-zinc-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Nome *</Label>
            <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Email *</Label>
            <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Senha * (min 8 chars)</Label>
            <Input type="password" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Role *</Label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-[13px]">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} - {r.desc}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-600 p-2.5 bg-red-50 rounded-lg">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#1a2744]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
