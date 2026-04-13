const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") localStorage.setItem("ph_token", token);
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") this.token = localStorage.getItem("ph_token");
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") localStorage.removeItem("ph_token");
  }

  private async request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") window.location.href = "/login";
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

  async getPayments(status?: string) {
    const q = status && status !== "ALL" ? `?status=${status}&limit=200` : "?limit=200";
    return this.get<PaymentListItem[]>(`/v1/payments${q}`);
  }

  async getPayment(id: string) { return this.get<PaymentDetail>(`/v1/payments/${id}`); }
  async getRuns() { return this.get<Run[]>("/v1/runs"); }
  async createRun(runDate: string) { return this.post<Run>("/v1/runs", { run_date: runDate }); }
  async approveRun(id: string) { return this.post<Run>(`/v1/runs/${id}/approve`); }

  async attachPayments(runId: string, paymentIds: string[]) {
    return this.post<{ attached: string[]; rejected: unknown[] }>(`/v1/runs/${runId}/attach`, { payment_ids: paymentIds });
  }

  async createPayment(data: CreatePaymentInput) {
    const idemKey = crypto.randomUUID();
    return this.post<PaymentListItem>("/v1/payments", data, { "Idempotency-Key": idemKey });
  }

  async holdPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/hold`, { reason }); }
  async unholdPayment(id: string) { return this.post(`/v1/payments/${id}/unhold`, {}); }
  async cancelPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/cancel`, { reason }); }
  async rejectPayment(id: string, reason?: string) { return this.post(`/v1/payments/${id}/reject`, { reason }); }
}

export const api = new ApiClient();

export interface CreatePaymentInput {
  external_id?: string;
  type: string;
  amount_cents: number;
  payer_account_id: string;
  payee_method: string;
  payee: Record<string, string>;
  description?: string;
}

export interface PaymentListItem {
  id: string;
  external_id: string;
  type: string;
  status: string;
  amount_cents: number;
  currency: string;
  payee_method: string;
  payee: Record<string, string>;
  description: string;
  created_at: string;
  updated_at: string;
  idempotency_key: string;
  bank_reference: string;
  payer_account_id: string;
}

export interface PaymentEvent {
  at: string;
  from_status: string;
  to_status: string;
  actor: string;
  reason: string;
}

export interface PaymentDetail {
  payment: PaymentListItem;
  timeline: PaymentEvent[];
}

export interface Run {
  id: string;
  run_date: string;
  status: string;
  total_items: number;
  total_amount_cents: number;
  pix_count: number;
  ted_count: number;
  approved_by?: string;
  approved_at?: string;
}
