"use client";

import { useEffect, useState } from "react";
import { Users as UsersIcon, Plus, X, Shield, KeyRound, UserX } from "lucide-react";
import { api, type UserItem } from "@/lib/api";
import { PageHeader } from "@/components/ui-custom/page-header";
import { LoadingBlock } from "@/components/ui-custom/loading";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { useToast } from "@/components/ui-custom/toast";
import { useConfirm } from "@/components/ui-custom/confirm-dialog";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  approver: "Aprovador",
  operator: "Operador",
  viewer: "Visualizador",
};

export default function UsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [list, setList] = useState<UserItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserItem | null>(null);

  function load() {
    api.listUsers().then((u) => setList(u || [])).catch((e) => setErr(e instanceof Error ? e.message : "Erro"));
  }
  useEffect(load, []);

  async function changeRole(id: string, role: string) {
    try {
      await api.updateUserRole(id, role);
      toast.success("Papel atualizado", `Agora este usuário é ${ROLE_LABEL[role] || role}.`);
      load();
    } catch (e) {
      toast.error("Falha ao alterar papel", e instanceof Error ? e.message : "Erro");
    }
  }
  async function deactivate(user: UserItem) {
    const ok = await confirm({
      title: "Desativar este usuário?",
      description: (
        <>
          <strong className="text-[var(--foreground)]">{user.name}</strong> perderá acesso imediato.
          Você pode reativar a conta depois.
        </>
      ),
      confirmLabel: "Desativar",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await api.deactivateUser(user.id);
      toast.success("Usuário desativado", `${user.email} não poderá mais entrar no sistema.`);
      load();
    } catch (e) {
      toast.error("Falha ao desativar", e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Pessoas que acessam o sistema e o que cada uma pode fazer."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <Plus size={14} /> Novo usuário
          </button>
        }
      />

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{err}</div>}

      {!list ? (
        <LoadingBlock label="Carregando..." />
      ) : list.length === 0 ? (
        <EmptyState icon={<UsersIcon size={20} />} title="Nenhum usuário" description="Crie o primeiro usuário." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nome</th>
                  <th className="px-4 py-2.5 font-medium">E-mail</th>
                  <th className="px-4 py-2.5 font-medium">Permissão</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Último acesso</th>
                  <th className="px-4 py-2.5 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((u) => (
                  <tr key={u.id} className="transition hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--foreground)]">{u.name}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[11px] text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]"
                      >
                        {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                        u.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {u.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{u.last_login_at ? formatRelative(u.last_login_at) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setResetTarget(u)}
                          className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Resetar senha"
                        >
                          <KeyRound size={13} />
                        </button>
                        {u.active && (
                          <button
                            onClick={() => deactivate(u)}
                            className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Desativar"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operator");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      await api.createUser({ name, email, role, password });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(false); }
  }

  return (
    <Modal title="Novo usuário" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
        <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
        <Field label="Função">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Senha inicial"><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></Field>
      </div>
      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
      <ModalFooter onClose={onClose} onSubmit={submit} busy={busy} disabled={!name || !email || !password} label="Criar" />
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: UserItem; onClose: () => void }) {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      await api.resetUserPassword(user.id, pw);
      toast.success("Senha alterada", `Avise ${user.name} para entrar com a nova senha.`);
      onClose();
    }
    catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
    finally { setBusy(false); }
  }
  return (
    <Modal title={`Resetar senha · ${user.name}`} onClose={onClose}>
      <Field label="Nova senha"><input type="text" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} /></Field>
      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}
      <ModalFooter onClose={onClose} onSubmit={submit} busy={busy} disabled={!pw} label="Resetar" />
    </Modal>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--brand-accent)]";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs font-medium text-[var(--foreground)]">{label}</label>{children}</div>;
}
function ModalFooter({ onClose, onSubmit, busy, disabled, label }: { onClose: () => void; onSubmit: () => void; busy: boolean; disabled: boolean; label: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]">Cancelar</button>
      <button onClick={onSubmit} disabled={busy || disabled} className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy ? "..." : label}</button>
    </div>
  );
}
