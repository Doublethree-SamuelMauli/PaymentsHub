"use client";

import { useEffect, useState } from "react";
import { api, type PayerAccount, type Beneficiary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Check, Building2, User, FileText } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export function NewPaymentModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [payers, setPayers] = useState<PayerAccount[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "PIX",
    payer_account_id: "",
    beneficiary_id: "",
    amount: "",
    description: "",
    external_id: "",
    // payee override (if no beneficiary selected)
    pix_key_type: "CNPJ",
    pix_key_value: "",
    bank_code: "",
    agency: "",
    account: "",
    account_digit: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([api.getPayerAccounts(), api.getBeneficiaries()])
      .then(([p, b]) => {
        setPayers(p);
        setBeneficiaries(b);
        if (p[0]) setForm(f => ({ ...f, payer_account_id: p[0].id }));
      })
      .catch(() => setError("Erro ao carregar dados"));
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedBen = beneficiaries.find(b => b.id === form.beneficiary_id);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const amountCents = Math.round(parseFloat(form.amount.replace(",", ".")) * 100);
      if (!amountCents || amountCents <= 0) throw new Error("Valor invalido");

      let payee: Record<string, string> = {};
      let payeeMethod = "PIX_KEY";

      if (selectedBen) {
        if (form.type === "PIX" && selectedBen.pix_keys[0]) {
          payeeMethod = "PIX_KEY";
          payee = { key_type: selectedBen.pix_keys[0].key_type, key_value: selectedBen.pix_keys[0].key_value };
        } else if (selectedBen.bank_accounts[0]) {
          payeeMethod = "BANK_ACCOUNT";
          const a = selectedBen.bank_accounts[0];
          payee = { bank_code: a.bank_code, agency: a.agency, account_number: a.account_number, account_digit: a.account_digit, account_type: a.account_type };
        }
      } else if (form.type === "PIX") {
        payeeMethod = "PIX_KEY";
        payee = { key_type: form.pix_key_type, key_value: form.pix_key_value };
      } else {
        payeeMethod = "BANK_ACCOUNT";
        payee = { bank_code: form.bank_code, agency: form.agency, account_number: form.account, account_digit: form.account_digit, account_type: "CC" };
      }

      await api.createPayment({
        type: form.type,
        amount_cents: amountCents,
        payer_account_id: form.payer_account_id,
        beneficiary_id: form.beneficiary_id || undefined,
        payee_method: payeeMethod,
        payee,
        description: form.description,
        external_id: form.external_id,
      });

      setStep(2);
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setStep(1);
    setForm({ ...form, amount: "", description: "", external_id: "", beneficiary_id: "", pix_key_value: "", bank_code: "", agency: "", account: "", account_digit: "" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm" onClick={close}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {step === 1 ? "Novo pagamento" : "Pagamento criado"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === 1 ? "Preencha os dados para enviar" : "Aguardando validacao"}
            </p>
          </div>
          <button onClick={close} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        {step === 2 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Pagamento enviado!</h3>
            <p className="mt-2 text-sm text-zinc-500">
              O pagamento foi recebido e esta sendo pre-validado automaticamente.
              Acompanhe o status na listagem.
            </p>
            <Button onClick={close} className="mt-6 bg-zinc-900 hover:bg-zinc-800 rounded-lg">Fechar</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Tipo */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-700 mb-2 block">Tipo de pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({ ...form, type: "PIX" })}
                    className={`p-3 rounded-lg border-2 transition-all ${form.type === "PIX" ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300"}`}
                  >
                    <div className="font-semibold text-sm text-zinc-900">PIX</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Liquidacao em segundos</div>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: "TED" })}
                    className={`p-3 rounded-lg border-2 transition-all ${form.type === "TED" ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300"}`}
                  >
                    <div className="font-semibold text-sm text-zinc-900">TED</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Lote em CNAB 240</div>
                  </button>
                </div>
              </div>

              {/* Conta pagadora */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">
                  <Building2 className="inline h-3 w-3 mr-1" /> Conta pagadora
                </Label>
                <select
                  value={form.payer_account_id}
                  onChange={(e) => setForm({ ...form, payer_account_id: e.target.value })}
                  className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {payers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label} - Ag. {p.agency} CC {p.account_number}-{p.account_digit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Beneficiario */}
              <div>
                <Label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">
                  <User className="inline h-3 w-3 mr-1" /> Beneficiario
                </Label>
                <select
                  value={form.beneficiary_id}
                  onChange={(e) => setForm({ ...form, beneficiary_id: e.target.value })}
                  className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Sem cadastro (informar dados abaixo)</option>
                  {beneficiaries.map(b => (
                    <option key={b.id} value={b.id}>{b.legal_name} - {b.document_number}</option>
                  ))}
                </select>
                {selectedBen && (
                  <div className="mt-2 p-2.5 bg-zinc-50 rounded-lg text-[12px] text-zinc-600">
                    <div className="font-medium text-zinc-800">{selectedBen.legal_name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {selectedBen.document_type}: {selectedBen.document_number}
                      {form.type === "PIX" && selectedBen.pix_keys[0] && (
                        <> • PIX: {selectedBen.pix_keys[0].key_type} {selectedBen.pix_keys[0].key_value}</>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Destinatario manual */}
              {!selectedBen && form.type === "PIX" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Tipo chave</Label>
                    <select
                      value={form.pix_key_type}
                      onChange={(e) => setForm({ ...form, pix_key_type: e.target.value })}
                      className="w-full h-10 rounded-lg border border-zinc-200 px-2 text-[13px]"
                    >
                      <option>CPF</option><option>CNPJ</option><option>EMAIL</option><option>PHONE</option><option>EVP</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Chave PIX</Label>
                    <Input value={form.pix_key_value} onChange={(e) => setForm({ ...form, pix_key_value: e.target.value })} placeholder="12345678000190" className="h-10 text-[13px]" />
                  </div>
                </div>
              )}

              {!selectedBen && form.type === "TED" && (
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Banco</Label>
                    <Input value={form.bank_code} onChange={(e) => setForm({ ...form, bank_code: e.target.value })} placeholder="033" className="h-10 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Agencia</Label>
                    <Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} placeholder="0001" className="h-10 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Conta</Label>
                    <Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="123456" className="h-10 text-[13px]" />
                  </div>
                  <div>
                    <Label className="text-[12px] text-zinc-600 mb-1 block">Digito</Label>
                    <Input value={form.account_digit} onChange={(e) => setForm({ ...form, account_digit: e.target.value })} placeholder="7" className="h-10 text-[13px]" />
                  </div>
                </div>
              )}

              {/* Valor + Descricao */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">Valor *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500">R$</span>
                    <Input
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0,00"
                      className="h-10 text-[13px] pl-9 font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">
                    <FileText className="inline h-3 w-3 mr-1" /> Ref. interna
                  </Label>
                  <Input value={form.external_id} onChange={(e) => setForm({ ...form, external_id: e.target.value })} placeholder="NF-2026-123" className="h-10 text-[13px]" />
                </div>
              </div>

              <div>
                <Label className="text-[13px] font-medium text-zinc-700 mb-1.5 block">Descricao</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Pagamento fornecedor X" className="h-10 text-[13px]" />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">{error}</div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-100 flex items-center justify-end gap-2 bg-zinc-50/50">
              <Button variant="outline" onClick={close} className="rounded-lg">Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !form.amount || !form.payer_account_id}
                className="bg-zinc-900 hover:bg-zinc-800 rounded-lg min-w-[120px]"
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : "Enviar pagamento"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
