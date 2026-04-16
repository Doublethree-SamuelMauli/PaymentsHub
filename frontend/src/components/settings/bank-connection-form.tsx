"use client";

import { useState } from "react";
import { X, Upload, ShieldCheck, AlertCircle, Building2 } from "lucide-react";
import { api, SUPPORTED_BANKS, type CreateBankConnectionInput } from "@/lib/api";
import { cn } from "@/lib/utils";

export function BankConnectionForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<"select" | "credentials">("select");
  const [bank, setBank] = useState<typeof SUPPORTED_BANKS[number] | null>(null);

  // Credential fields
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [sftpHost, setSftpHost] = useState("");
  const [sftpUser, setSftpUser] = useState("");
  const [sftpKeyPem, setSftpKeyPem] = useState("");
  const [sftpRemessa, setSftpRemessa] = useState("/remessa");
  const [sftpRetorno, setSftpRetorno] = useState("/retorno");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function readFile(setter: (v: string) => void) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pem,.crt,.key,.pfx,.p12";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  }

  async function submit() {
    if (!bank) return;
    setBusy(true); setErr(null);

    const data: CreateBankConnectionInput = {
      bank_code: bank.code,
      bank_name: bank.name,
      auth_method: bank.auth,
    };

    if ((bank.auth as string) === "API_KEY") {
      data.credentials = { api_key: apiKey };
    } else {
      data.credentials = { client_id: clientId, client_secret: clientSecret };
    }

    if (certPem) data.cert_pem = certPem;
    if (keyPem) data.key_pem = keyPem;

    if (bank.hasSFTP && sftpHost) {
      data.sftp_host = sftpHost;
      data.sftp_user = sftpUser;
      if (sftpKeyPem) data.sftp_key_pem = sftpKeyPem;
      data.sftp_remessa_dir = sftpRemessa;
      data.sftp_retorno_dir = sftpRetorno;
    }

    try {
      await api.createBankConnection(data);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao criar");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-in">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              {step === "select" ? "Escolha o banco" : `Configurar ${bank?.name}`}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {step === "select" ? "Selecione o banco para configurar a conexão." : "Preencha as credenciais de integração."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {step === "select" ? (
            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_BANKS.map((b) => (
                <button
                  key={b.code}
                  onClick={() => { setBank(b); setStep("credentials"); }}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-left transition hover:border-[#1e4ea8] hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#143573]/10 to-[#1e4ea8]/10 text-lg font-bold text-[#1e4ea8] transition group-hover:from-[#143573] group-hover:to-[#1e4ea8] group-hover:text-white">
                    {b.code}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{b.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                    {b.auth.replace(/_/g, " ")} {b.hasSFTP && " · SFTP"}
                  </p>
                </button>
              ))}
            </div>
          ) : bank && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-[var(--muted)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#143573] to-[#1e4ea8] text-sm font-bold text-white">
                  {bank.code}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{bank.name}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">{bank.auth.replace(/_/g, " ")}</p>
                </div>
                <button onClick={() => setStep("select")} className="ml-auto text-xs text-[#1e4ea8] hover:underline">Trocar</button>
              </div>

              {/* OAuth2 credentials */}
              {(bank.auth as string) !== "API_KEY" && (
                <Section title="Credenciais OAuth2" icon={<ShieldCheck size={14} />}>
                  <Field label="Client ID">
                    <input value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls} placeholder="Ex: a1b2c3d4-e5f6-..." />
                  </Field>
                  <Field label="Client Secret">
                    <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className={inputCls} placeholder="••••••••" />
                  </Field>
                </Section>
              )}

              {/* API Key */}
              {(bank.auth as string) === "API_KEY" && (
                <Section title="API Key" icon={<ShieldCheck size={14} />}>
                  <Field label="Chave de API">
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputCls} placeholder="••••••••" />
                  </Field>
                </Section>
              )}

              {/* Certificate */}
              <Section title="Certificado digital" icon={<Upload size={14} />}>
                <Field label="Certificado (.pem / .crt)">
                  <div className="flex gap-2">
                    <input value={certPem ? `${certPem.slice(0, 40)}...` : ""} readOnly className={inputCls + " flex-1 cursor-default"} placeholder="Nenhum arquivo selecionado" />
                    <button type="button" onClick={() => readFile(setCertPem)} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
                      <Upload size={12} />
                    </button>
                  </div>
                </Field>
                <Field label="Chave privada (.key / .pem)">
                  <div className="flex gap-2">
                    <input value={keyPem ? `${keyPem.slice(0, 40)}...` : ""} readOnly className={inputCls + " flex-1 cursor-default"} placeholder="Nenhum arquivo selecionado" />
                    <button type="button" onClick={() => readFile(setKeyPem)} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
                      <Upload size={12} />
                    </button>
                  </div>
                </Field>
              </Section>

              {/* SFTP (if bank supports) */}
              {bank.hasSFTP && (
                <Section title="SFTP (CNAB / TED)" icon={<Building2 size={14} />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Host SFTP"><input value={sftpHost} onChange={(e) => setSftpHost(e.target.value)} className={inputCls} placeholder="sftp.banco.com.br" /></Field>
                    <Field label="Usuário SFTP"><input value={sftpUser} onChange={(e) => setSftpUser(e.target.value)} className={inputCls} placeholder="user_cnab" /></Field>
                  </div>
                  <Field label="Chave SSH (opcional)">
                    <div className="flex gap-2">
                      <input value={sftpKeyPem ? "Chave carregada" : ""} readOnly className={inputCls + " flex-1 cursor-default"} placeholder="Nenhuma chave" />
                      <button type="button" onClick={() => readFile(setSftpKeyPem)} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
                        <Upload size={12} />
                      </button>
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Diretório remessa"><input value={sftpRemessa} onChange={(e) => setSftpRemessa(e.target.value)} className={inputCls} /></Field>
                    <Field label="Diretório retorno"><input value={sftpRetorno} onChange={(e) => setSftpRetorno(e.target.value)} className={inputCls} /></Field>
                  </div>
                </Section>
              )}

              {err && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {err}
                </div>
              )}
            </div>
          )}
        </div>

        {step === "credentials" && (
          <footer className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Credenciais são criptografadas com AES-256 antes de armazenar.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep("select")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">Voltar</button>
              <button onClick={submit} disabled={busy} className="rounded-lg bg-gradient-to-r from-[#143573] to-[#1e4ea8] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                {busy ? "Salvando..." : "Salvar conexão"}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[#1e4ea8] focus:ring-2 focus:ring-[#1e4ea8]/20";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</h4>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] font-semibold text-[var(--muted-foreground)]">{label}</label>{children}</div>;
}
