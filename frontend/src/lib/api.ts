const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "approver" | "operator" | "viewer";
  client_id?: string;
}

class ApiClient {
  private token: string | null = null;
  private user: User | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") localStorage.setItem("ph_token", token);
  }
  setUser(user: User) {
    this.user = user;
    if (typeof window !== "undefined") localStorage.setItem("ph_user", JSON.stringify(user));
  }
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") this.token = localStorage.getItem("ph_token");
    return this.token;
  }
  getUser(): User | null {
    if (this.user) return this.user;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("ph_user");
      if (raw) { try { this.user = JSON.parse(raw); } catch {} }
    }
    return this.user;
  }
  clearToken() {
    this.token = null;
    this.user = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("ph_token");
      localStorage.removeItem("ph_user");
    }
  }
  hasRole(...roles: string[]): boolean {
    const u = this.getUser();
    if (!u) return false;
    return roles.includes(u.role);
  }
  roleCovers(required: "viewer"|"operator"|"approver"|"admin"): boolean {
    const levels = { viewer: 1, operator: 2, approver: 3, admin: 4 };
    const u = this.getUser();
    if (!u) return false;
    return levels[u.role] >= levels[required];
  }

  private async request<T>(method: string, path: string, body?: unknown, extra?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined" && !path.includes("/auth/login")) window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    if (res.status === 204) return {} as T;
    return res.json();
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown, headers?: Record<string, string>) { return this.request<T>("POST", path, body, headers); }
  patch<T>(path: string, body?: unknown) { return this.request<T>("PATCH", path, body); }

  async login(email: string, password: string) {
    const res = await this.request<{ token: string; user: User }>("POST", "/v1/auth/login", { email, password });
    this.setToken(res.token);
    this.setUser(res.user);
    return res;
  }

  async logout() {
    try { await this.post("/v1/auth/logout"); } catch {}
    this.clearToken();
  }

  async getPayments(status?: string) {
    const q = status && status !== "ALL" ? `?status=${status}&limit=200` : "?limit=200";
    return this.get<PaymentListItem[]>(`/v1/payments${q}`);
  }
  getPayment(id: string) { return this.get<PaymentDetail>(`/v1/payments/${id}`); }
  getRuns() { return this.get<Run[]>("/v1/runs"); }
  createRun(runDate: string) { return this.post<Run>("/v1/runs", { run_date: runDate }); }
  approveRun(id: string) { return this.post<Run>(`/v1/runs/${id}/approve`); }
  attachPayments(runId: string, paymentIds: string[]) {
    return this.post<{ attached: string[]; rejected: unknown[] }>(`/v1/runs/${runId}/attach`, { payment_ids: paymentIds });
  }

  getPayerAccounts() { return this.get<PayerAccount[]>("/v1/admin/payer-accounts"); }
  getBeneficiaries() { return this.get<Beneficiary[]>("/v1/admin/beneficiaries"); }

  async createPayment(data: CreatePaymentInput) {
    const idemKey = crypto.randomUUID();
    return this.post<PaymentListItem>("/v1/payments", data, { "Idempotency-Key": idemKey });
  }

  holdPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/hold`, { reason }); }
  unholdPayment(id: string) { return this.post(`/v1/payments/${id}/unhold`, {}); }
  cancelPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/cancel`, { reason }); }
  rejectPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/reject`, { reason }); }

  getUsers() { return this.get<UserListItem[]>("/v1/users"); }
  createUser(data: { email: string; name: string; role: string; password: string }) {
    return this.post<{ id: string }>("/v1/users", data);
  }
  updateUserRole(id: string, role: string) { return this.patch(`/v1/users/${id}/role`, { role }); }
  deactivateUser(id: string) { return this.post(`/v1/users/${id}/deactivate`, {}); }
}

export const api = new ApiClient();

export interface UserListItem {
  id: string; email: string; name: string; role: string;
  active: boolean; last_login_at: string; created_at: string;
}
export interface CreatePaymentInput {
  external_id?: string; type: string; amount_cents: number;
  payer_account_id: string; beneficiary_id?: string;
  payee_method: string; payee: Record<string, string>; description?: string;
}
export interface PayerAccount {
  id: string; bank_code: string; agency: string;
  account_number: string; account_digit: string; label: string; active: boolean;
}
export interface Beneficiary {
  id: string; kind: string; legal_name: string;
  document_type: string; document_number: string; active: boolean;
  pix_keys: { key_type: string; key_value: string }[];
  bank_accounts: { bank_code: string; agency: string; account_number: string; account_digit: string; account_type: string }[];
}
export interface PaymentListItem {
  id: string; external_id: string; type: string; status: string;
  amount_cents: number; currency: string;
  payee_method: string; payee: Record<string, string>;
  description: string; created_at: string; updated_at: string;
  idempotency_key: string; bank_reference: string; payer_account_id: string;
}
export interface PaymentEvent { at: string; from_status: string; to_status: string; actor: string; reason: string; }
export interface PaymentDetail { payment: PaymentListItem; timeline: PaymentEvent[]; }
export interface Run {
  id: string; run_date: string; status: string;
  total_items: number; total_amount_cents: number;
  pix_count: number; ted_count: number;
  approved_by?: string; approved_at?: string;
}
