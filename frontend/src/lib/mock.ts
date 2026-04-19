// Mock layer: when NEXT_PUBLIC_API_URL=mock (default for SaaS preview), the
// API client returns synthetic data instead of hitting the Go backend. This
// lets every tenant-facing screen render with believable content.

import type {
  Beneficiary,
  Branding,
  BankConnection,
  Payment,
  PaymentDetail,
  PayerAccount,
  Run,
  UserItem,
} from "./api";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 7), (n * 7) % 60, 0, 0);
  return d.toISOString();
}

function uuid(seed: string) {
  return `00000000-0000-0000-0000-${seed.padStart(12, "0")}`;
}

const BENEFICIARIES = [
  { name: "ACME Distribuidora S.A.", doc: "12345678000199", bank: "341" },
  { name: "Cooperativa Agrária do Sul", doc: "98765432000188", bank: "104" },
  { name: "Logística Atlas Ltda", doc: "45678900000133", bank: "237" },
  { name: "Gráfica Orion Editorial", doc: "66777888000122", bank: "077" },
  { name: "Metalúrgica Volcano", doc: "33444555000177", bank: "033" },
  { name: "Papelaria Central", doc: "22111000000166", bank: "001" },
  { name: "TI Horizon Tecnologia", doc: "88990000000144", bank: "208" },
  { name: "Sistemas Arco LTDA", doc: "77665544000111", bank: "756" },
];

const STATUSES: Payment["status"][] = [
  "SETTLED", "SETTLED", "SETTLED", "SETTLED",
  "SENT", "SENT",
  "APPROVED", "APPROVED",
  "PREVALIDATED", "PREVALIDATED",
  "UNDER_REVIEW",
  "ON_HOLD",
  "FAILED",
];

const TYPES: Payment["type"][] = ["PIX", "PIX", "PIX", "PIX", "TED"];

export function mockPayments(): Payment[] {
  const out: Payment[] = [];
  for (let i = 0; i < 42; i++) {
    const ben = BENEFICIARIES[i % BENEFICIARIES.length];
    const type = TYPES[i % TYPES.length];
    const status = STATUSES[i % STATUSES.length];
    const cents = Math.round((800 + ((i * 317) % 48000)) * 100);
    const daysBack = Math.floor(i / 3);
    out.push({
      id: uuid(`p${i}`),
      external_id: `NF-2026${String(2840 + i).padStart(5, "0")}`,
      type,
      status,
      amount_cents: cents,
      currency: "BRL",
      payee_method: type === "PIX" ? "PIX_KEY" : "BANK_ACCOUNT",
      payee: type === "PIX"
        ? { key_type: "CNPJ", key_value: ben.doc }
        : { bank_code: ben.bank, agency: "1234", account: "567890", document_number: ben.doc },
      description: `Pagamento ${ben.name}`,
      created_at: daysAgo(daysBack),
      updated_at: daysAgo(daysBack),
      idempotency_key: `idem-${i}`,
      bank_reference: status === "SETTLED" ? `E34117595${Date.now()}${i}`.slice(0, 32) : "",
      payer_account_id: uuid("payer1"),
    });
  }
  return out;
}

export function mockPaymentDetail(id: string): PaymentDetail {
  const payments = mockPayments();
  const p = payments.find((x) => x.id === id) || payments[0];
  return {
    payment: p,
    timeline: [
      { at: p.created_at, from_status: "", to_status: "RECEIVED", actor: "apikey:erp-default", reason: "ingress" },
      { at: p.created_at, from_status: "RECEIVED", to_status: "VALIDATED_LOCAL", actor: "system", reason: "local rules" },
      { at: p.created_at, from_status: "VALIDATED_LOCAL", to_status: "PREVALIDATED", actor: "bank:341", reason: "DICT ok" },
      ...(["APPROVED", "SENT", "SETTLED"].includes(p.status)
        ? [{ at: p.updated_at, from_status: "PREVALIDATED", to_status: "APPROVED", actor: "user:samuel", reason: "run approved" }]
        : []),
      ...(["SENT", "SETTLED"].includes(p.status)
        ? [{ at: p.updated_at, from_status: "APPROVED", to_status: "SENT", actor: "system", reason: "bank ack" }]
        : []),
      ...(p.status === "SETTLED"
        ? [{ at: p.updated_at, from_status: "SENT", to_status: "SETTLED", actor: "bank:341", reason: "liquidado" }]
        : []),
    ],
  };
}

export function mockRuns(): Run[] {
  return [
    {
      id: uuid("run1"),
      run_date: new Date().toISOString().slice(0, 10),
      status: "OPEN",
      total_items: 18,
      total_amount_cents: 2849124_0,
      pix_count: 12,
      ted_count: 6,
    },
    {
      id: uuid("run2"),
      run_date: daysAgo(1).slice(0, 10),
      status: "APPROVED",
      total_items: 24,
      total_amount_cents: 3720518_0,
      pix_count: 18,
      ted_count: 6,
      approved_by: "samuel@doublethree.com.br",
      approved_at: daysAgo(1),
    },
    {
      id: uuid("run3"),
      run_date: daysAgo(2).slice(0, 10),
      status: "EXECUTING",
      total_items: 31,
      total_amount_cents: 4192680_0,
      pix_count: 22,
      ted_count: 9,
      approved_by: "samuel@doublethree.com.br",
      approved_at: daysAgo(2),
    },
    {
      id: uuid("run4"),
      run_date: daysAgo(3).slice(0, 10),
      status: "CLOSED",
      total_items: 16,
      total_amount_cents: 1860900_0,
      pix_count: 11,
      ted_count: 5,
      approved_by: "samuel@doublethree.com.br",
      approved_at: daysAgo(3),
    },
  ];
}

export function mockBeneficiaries(): Beneficiary[] {
  return BENEFICIARIES.map((b, i) => ({
    id: uuid(`b${i}`),
    kind: "SUPPLIER",
    legal_name: b.name,
    document_type: "CNPJ",
    document_number: b.doc,
    active: true,
    pix_keys: [{ key_type: "CNPJ", key_value: b.doc }],
    bank_accounts: [
      { bank_code: b.bank, agency: "1234", account_number: "567890", account_digit: "0", account_type: "CC" },
    ],
  }));
}

export function mockUsers(): UserItem[] {
  return [
    { id: uuid("u1"), email: "samuel@doublethree.com.br", name: "Samuel Mauli", role: "admin", active: true, last_login_at: daysAgo(0), created_at: daysAgo(180) },
    { id: uuid("u2"), email: "carla.mendes@acme.com.br", name: "Carla Mendes", role: "approver", active: true, last_login_at: daysAgo(1), created_at: daysAgo(95) },
    { id: uuid("u3"), email: "joao.ribeiro@acme.com.br", name: "João Ribeiro", role: "operator", active: true, last_login_at: daysAgo(0), created_at: daysAgo(60) },
    { id: uuid("u4"), email: "bia.yamamoto@acme.com.br", name: "Beatriz Yamamoto", role: "operator", active: true, last_login_at: daysAgo(2), created_at: daysAgo(30) },
    { id: uuid("u5"), email: "auditoria@acme.com.br", name: "Auditoria Externa", role: "viewer", active: true, last_login_at: daysAgo(14), created_at: daysAgo(200) },
    { id: uuid("u6"), email: "estagio@acme.com.br", name: "Estágio Financeiro", role: "viewer", active: false, last_login_at: daysAgo(60), created_at: daysAgo(210) },
  ];
}

export function mockPayerAccounts(): PayerAccount[] {
  return [
    { id: uuid("payer1"), bank_code: "341", agency: "1234", account_number: "567890", account_digit: "0", label: "Itaú — conta principal", active: true },
    { id: uuid("payer2"), bank_code: "237", agency: "4455", account_number: "998877", account_digit: "1", label: "Bradesco — conta operacional", active: true },
    { id: uuid("payer3"), bank_code: "077", agency: "0001", account_number: "123456", account_digit: "7", label: "Inter — folha fornecedor", active: true },
  ];
}

export function mockBranding(): Branding {
  return {
    slug: "acme",
    logo_url: "",
    primary_color: "#143573",
    accent_color: "#1e4ea8",
    onboarding_completed: true,
  };
}

export function mockBankConnections(): BankConnection[] {
  const connected = new Set(["341", "237", "077"]);
  const all = [
    { code: "341", name: "Itaú Unibanco", auth: "OAUTH2_MTLS", sftp: true },
    { code: "237", name: "Bradesco", auth: "OAUTH2_CERT", sftp: true },
    { code: "077", name: "Banco Inter", auth: "OAUTH2_CERT", sftp: false },
    { code: "104", name: "Caixa Econômica", auth: "CERTIFICATE_A1", sftp: true },
    { code: "033", name: "Santander", auth: "OAUTH2_CERT", sftp: true },
    { code: "001", name: "Banco do Brasil", auth: "OAUTH2_CERT", sftp: true },
    { code: "756", name: "Sicoob", auth: "OAUTH2_CERT", sftp: true },
    { code: "208", name: "BTG Pactual", auth: "OAUTH2_CERT", sftp: false },
  ];
  return all.map((b, i) => ({
    id: uuid(`bc${i}`),
    bank_code: b.code,
    bank_name: b.name,
    auth_method: b.auth,
    has_credentials: connected.has(b.code),
    has_certificate: connected.has(b.code),
    has_sftp: connected.has(b.code) && b.sftp,
    status: connected.has(b.code) ? "active" : "draft",
    validation_attempts: connected.has(b.code) ? 1 : 0,
    last_validation_error: undefined,
    created_at: daysAgo(15 + i),
  }));
}

export const MOCK_MODE =
  typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_API_URL === "mock" || !process.env.NEXT_PUBLIC_API_URL);
