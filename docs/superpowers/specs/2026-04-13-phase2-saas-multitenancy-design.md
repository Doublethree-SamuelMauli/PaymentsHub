# PaymentsHub — Fase 2: Camada SaaS Multi-Tenant + Webhooks de Saída

**Status:** Em execução
**Data:** 2026-04-13

## Objetivo

Transformar o PaymentsHub single-tenant da Fase 1 em SaaS multi-tenant: cada empresa-cliente (`Client`) tem seus próprios pagamentos, beneficiários, runs, e API keys isolados. Quando o status de um pagamento muda, o sistema dispara webhook HMAC-signed para a URL configurada pelo cliente.

## Escopo

### Entregue
- Entidade `Client` (empresa que usa o SaaS)
- `client_id` FK em: `payments`, `beneficiaries`, `payment_runs`, `api_keys`, `payer_accounts`
- Middleware de tenant isolation: toda query filtra por `client_id` do token autenticado
- Webhook de saída: `client_webhook_configs` + worker que dispara POST HMAC-SHA256 a cada mudança de status
- Endpoints admin: CRUD de clients, configuração de webhook URL
- Retry de webhook com backoff (via River job)
- Testes de isolamento (client A não vê dados de client B)

### Não entregue (fases futuras)
- Portal web (Fase 4)
- Rate limit por cliente (Fase 3)
- Billing/planos (futuro)

## Modelo

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('CPF','CNPJ')),
    document_number TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url TEXT,
    webhook_secret TEXT,  -- HMAC-SHA256 key, gerado pelo sistema
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar client_id nas tabelas existentes
ALTER TABLE api_keys ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payments ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE beneficiaries ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payment_runs ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE payer_accounts ADD COLUMN client_id UUID REFERENCES clients(id);

CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id),
    payment_id UUID NOT NULL REFERENCES payments(id),
    event_type TEXT NOT NULL,  -- payment.status_changed
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING','DELIVERED','FAILED')),
    response_status INT,
    response_body TEXT,
    attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
