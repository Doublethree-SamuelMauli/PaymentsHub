const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("ph_token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("ph_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("ph_token");
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    if (res.status === 204) return {} as T;
    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
  del<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  // Domain methods
  async getPayments(status?: string) {
    const params = status ? `?status=${status}&limit=100&offset=0` : "?limit=100&offset=0";
    return this.get<PaymentListItem[]>(`/v1/payments${params}`);
  }

  async getPayment(id: string) {
    return this.get<PaymentDetail>(`/v1/payments/${id}`);
  }

  async getRuns() {
    return this.get<Run[]>("/v1/runs");
  }

  async createRun(runDate: string) {
    return this.post<Run>("/v1/runs", { run_date: runDate });
  }

  async approveRun(id: string) {
    return this.post<Run>(`/v1/runs/${id}/approve`);
  }

  async attachPayments(runId: string, paymentIds: string[]) {
    return this.post<{ attached: string[]; rejected: unknown[] }>(`/v1/runs/${runId}/attach`, {
      payment_ids: paymentIds,
    });
  }

  async holdPayment(id: string, reason?: string) {
    return this.post(`/v1/payments/${id}/hold`, { reason });
  }

  async cancelPayment(id: string, reason?: string) {
    return this.post(`/v1/payments/${id}/cancel`, { reason });
  }
}

export const api = new ApiClient();

export interface PaymentListItem {
  id: string;
  external_id: string;
  type: string;
  status: string;
  amount_cents: number;
  currency: string;
  payee_method: string;
  description: string;
  created_at: string;
  idempotency_key: string;
}

export interface PaymentEvent {
  at: string;
  from_status: string;
  to_status: string;
  actor: string;
  reason: string;
}

export interface PaymentDetail {
  payment: PaymentListItem & {
    payer_account_id: string;
    payee: Record<string, string>;
    bank_reference: string;
  };
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
