# PaymentsHub — Fase 1: Core + Integração Itaú (PIX REST + TED CNAB)

**Status:** Aprovado para planejamento
**Data:** 2026-04-11
**Autor:** Samuel Mauli (brainstorming com Claude)
**Escopo:** Primeiro spec de uma série. Cobre apenas a Fase 1 do PaymentsHub.

---

## 1. Contexto e Objetivo

### 1.1 O produto

O **PaymentsHub** é um orquestrador SaaS de pagamentos bancários para empresas. Uma empresa-cliente envia ao PaymentsHub toda a sua lista de pagamentos a fazer (fornecedores, folha, aluguéis, tributos, etc.). O sistema valida, deixa pendente de aprovação humana, e envia ao banco tudo o que foi aprovado, mantendo cada pagamento individualmente rastreável.

O produto completo tem 4 fases:

| Fase | Escopo | Status |
|------|--------|--------|
| **1** | Core backend + integração Itaú (PIX via REST, TED via CNAB 240) | **este spec** |
| **2** | Camada SaaS: `Client`, `ApiKey` multi-tenant, webhooks de saída assinados | futura |
| **3** | Orquestração em lote avançada, pré-análise, regras de risco | futura |
| **4** | Portal SaaS (frontend) para cliente ver pagamentos, fluxo, gerar keys | futura |

Este spec descreve **apenas a Fase 1**. Cada fase subsequente ganha seu próprio spec → plano → implementação.

### 1.2 Objetivo da Fase 1

Entregar um backend Go que:

1. **Recebe pagamentos** de uma empresa via API REST (JSON individual, bulk JSON, upload CSV/Excel).
2. **Pré-valida em segundos** consultando APIs do Itaú (DICT para PIX, consulta de conta para TED).
3. **Aguarda aprovação humana** via endpoints REST (a UI da Fase 4 consome os mesmos endpoints).
4. **Executa PIX individualmente** pela API REST Cash Management do Itaú (real-time).
5. **Executa TED via CNAB 240** empacotando em arquivo único por lote aprovado, enviado via SFTP ao Itaú.
6. **Reconcilia status** com polling agressivo (60s SFTP, 2min REST) + webhook Itaú para PIX.
7. **Mantém audit trail imutável** de toda transição de estado, suficiente para compliance BACEN/LGPD.
8. **Tolerância a falhas desde o dia 1**: idempotência, outbox transacional, circuit breaker, retry com backoff, reconciliação defensiva.

**Alvo de homologação da Fase 1:** sandbox Itaú Developer. Produção (homologação BACEN/certificação Open Finance/emissão de certificado digital da empresa) é uma fase de hardening separada, não faz parte deste spec.

**Fora do escopo da Fase 1:**
- Multi-tenancy real (`Client` por empresa) — Fase 2
- Webhooks de saída (notificar cliente quando status muda) — Fase 2
- UI / Portal SaaS — Fase 4
- Boleto, tributos, folha — incrementos futuros sobre o mesmo parser CNAB
- Outros bancos (Bradesco, Santander, BB) — Fases 5+, reutilizando a mesma interface `PaymentGateway`
- Pré-análise avançada (regras de fraude, scoring) — Fase 3
- Workflow engine (Temporal) — só se a Fase 3 exigir

### 1.3 Referência de padrão existente

O repositório [Vanlink-Api-Inter](https://github.com/Vanlink-ltda/Vanlink-Api-Inter) (NestJS + TypeScript) implementa a integração com o Banco Inter usando:

- Interface `PaymentGateway` em [backend-nest/src/gateways/payment-gateway.interface.ts](https://github.com/Vanlink-ltda/Vanlink-Api-Inter/blob/main/backend-nest/src/gateways/payment-gateway.interface.ts)
- Factory `gateway.factory.ts`
- Módulo por banco (`inter/`, `qitech/`) com `{bank}-auth.service.ts`, `{bank}.gateway.ts`, `{bank}.module.ts`
- mTLS via `https.Agent` do Node, axios com `httpsAgent`
- OAuth2 client_credentials com cache de token
- Retry exponencial com backoff

O PaymentsHub **copia o padrão conceitual** (interface de gateway + módulo por banco + auth service dedicado + mTLS + OAuth cached + retry), mas reimplementa em Go com as decisões arquiteturais deste spec. Não há código compartilhado.

---

## 2. Decisões Arquiteturais

### 2.1 Linguagem: Go

Escolhida em vez de Node/NestJS (stack do Vanlink) pelos requisitos do usuário: sem risco de event loop single-threaded travando sob carga de criptografia, tipagem estática forte em compile-time, concorrência real via goroutines, latência previsível, binários estáticos fáceis de operar.

### 2.2 Arquitetura híbrida: REST + CNAB

Dois canais de integração com o Itaú, por tipo de pagamento:

- **PIX → API REST Cash Management do Itaú** (execução real-time)
  PIX é instantâneo por design do SPI. Forçar PIX por CNAB 240 adicionaria latência artificial sem ganho.

- **TED → CNAB 240 via SFTP** (execução em lote)
  TED aceita lote, aprovação do lote é feita no Bankline empresarial do Itaú (alinhado com o requisito "banco aprova o lote inteiro"), e CNAB é o formato que todos os bancos brasileiros aceitam — **modularidade real** para adicionar Bradesco/Santander/BB no futuro (reescrever adapter vs. reescrever sistema).

Independentemente do canal, **a API REST do Itaú também é usada como "oráculo de validação"** antes de qualquer execução: DICT para verificar existência de chave PIX, consulta de conta para validar agência/conta TED, consulta de saldo/limite. Isso fornece feedback em segundos mesmo para pagamentos que serão executados via CNAB — o cliente sabe que "o pagamento vai dar certo" bem antes da liquidação real.

### 2.3 Escopo de tipos de pagamento na Fase 1

Apenas **PIX** e **TED**. Escolhidos como MVP por exercitarem os dois canais (REST + CNAB) end-to-end sem over-scope.

**Boleto/Tributos/Folha** ficam como incrementos futuros — são novos segmentos CNAB (J, J52, N, O) sobre o mesmo parser já existente, mais validações REST específicas. A arquitetura não muda.

### 2.4 Multi-tenancy na Fase 1

**Não existe** cliente multi-tenant nesta fase. O sistema opera como se houvesse uma única empresa (embora a modelagem já suporte múltiplas contas pagadoras `PayerAccount` via endpoint admin). A Fase 2 adiciona `Client` + `ApiKey` vinculada a cliente + segregação de dados.

Para a Fase 1, autenticação é feita por **API key estática** (tabela `api_keys` sem `client_id`, apenas `key_hash + scopes[]`). É suficiente para proteger endpoints administrativos e de aprovação durante homologação sandbox, e já deixa o caminho técnico pronto para a Fase 2.

### 2.5 Stack técnica consolidada

| Camada | Escolha | Justificativa resumida |
|---|---|---|
| Linguagem | Go 1.22+ | Decisão 2.1; `slog` nativo |
| HTTP router | `chi` | stdlib-based, sem surpresas, lean |
| DB | PostgreSQL 16 | ACID, constraints fortes, `SELECT FOR UPDATE` |
| Driver DB | `pgx/v5` | nativo, suporta tipos Postgres |
| SQL tipado | `sqlc` | gera Go a partir de SQL puro, sem ORM magic, zero SQL injection |
| Migrations | `goose` | simples, versionado |
| Jobs/Queue | River (`riverqueue.com`) | **Postgres-backed: outbox transacional nativo** |
| TLS outbound | `crypto/tls` stdlib | mTLS direto |
| JWS | `go-jose/v4` | padrão Open Finance |
| Circuit breaker | `sony/gobreaker` | maduro |
| Rate limit | `golang.org/x/time/rate` | stdlib extension |
| Validação DTO | `go-playground/validator/v10` | padrão |
| CSV | `encoding/csv` stdlib | suficiente |
| Excel | `excelize` | maduro, .xlsx |
| Logging | `slog` stdlib (JSON) | canônico |
| Tracing/métricas | OpenTelemetry Go SDK + Prometheus | padrão cloud-native |
| Secrets | env vars + AWS Secrets Manager (prod) | simples, migra pra Vault depois |
| Criptografia certs em repouso | AES-GCM (chave via KMS em prod) | auditável |
| Testes | `testify` + `testcontainers-go` | Postgres real, sem mocks de DB |
| Lint | `golangci-lint` preset estrito | gosec, errcheck, govet, staticcheck |
| Container | Docker multi-stage → distroless estática | binário único |

### 2.6 Padrão interno: Hexagonal (Ports & Adapters)

- `internal/domain/` — entidades puras, value objects, state machine, regras de negócio. **Zero dependência externa.**
- `internal/app/` — use cases (application services). Dependem de `domain` e de **interfaces** (`ports.go`).
- `internal/adapters/` — implementações das portas: HTTP, DB, banks, storage, secrets, queue.
- `internal/platform/` — código infra transversal (logging, OTel, config, crypto).
- `cmd/api/` — binário HTTP.
- `cmd/worker/` — binário de workers River + cron jobs. Separado para isolar falhas e escalar independente.

---

## 3. Modelo de Domínio

### 3.1 Entidades (tabelas Postgres)

Schema resumido. Migrations completas em `db/migrations/*.sql` quando implementadas. Todos os valores monetários são `BIGINT` em centavos (`amount_cents`). Timestamps são `TIMESTAMPTZ`.

```sql
-- ============================================================
-- Configuração bancária
-- ============================================================

CREATE TABLE bank_certificates (
  id               UUID PRIMARY KEY,
  bank_code        CHAR(3) NOT NULL,            -- "341" = Itaú
  purpose          TEXT NOT NULL,               -- "mTLS" | "signing"
  cert_pem_enc     BYTEA NOT NULL,              -- AES-GCM
  key_pem_enc      BYTEA NOT NULL,
  nonce            BYTEA NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payer_accounts (
  id                UUID PRIMARY KEY,
  bank_code         CHAR(3) NOT NULL,
  agency            TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  account_digit     TEXT NOT NULL,
  certificate_id    UUID REFERENCES bank_certificates(id),
  oauth_client_id   TEXT NOT NULL,
  oauth_secret_ref  TEXT NOT NULL,              -- ponteiro pro secret, não o valor
  sftp_host         TEXT,
  sftp_user         TEXT,
  sftp_key_ref      TEXT,
  sftp_remessa_dir  TEXT,
  sftp_retorno_dir  TEXT,
  label             TEXT NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Beneficiários (fornecedores, funcionários, etc.)
-- ============================================================

CREATE TABLE beneficiaries (
  id                      UUID PRIMARY KEY,
  kind                    TEXT NOT NULL,         -- SUPPLIER|CLIENT|EMPLOYEE|GOVERNMENT|OTHER
  legal_name              TEXT NOT NULL,
  trade_name              TEXT,
  document_type           TEXT NOT NULL,         -- CPF|CNPJ
  document_number         TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  tags                    TEXT[] NOT NULL DEFAULT '{}',
  default_payment_method  TEXT,                  -- PIX|TED|null
  notes                   TEXT,
  active                  BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_number)
);

CREATE TABLE beneficiary_pix_keys (
  id                UUID PRIMARY KEY,
  beneficiary_id    UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  key_type          TEXT NOT NULL,               -- CPF|CNPJ|EMAIL|PHONE|EVP
  key_value         TEXT NOT NULL,
  label             TEXT,
  active            BOOLEAN NOT NULL DEFAULT true,
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE beneficiary_bank_accounts (
  id                UUID PRIMARY KEY,
  beneficiary_id    UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  bank_code         CHAR(3) NOT NULL,
  agency            TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  account_digit     TEXT NOT NULL,
  account_type      TEXT NOT NULL,               -- CC|CP|PG
  label             TEXT,
  active            BOOLEAN NOT NULL DEFAULT true,
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Pagamentos
-- ============================================================

CREATE TABLE payments (
  id                     UUID PRIMARY KEY,
  external_id            TEXT,                   -- referência do cliente (ex: "NF-1234")
  type                   TEXT NOT NULL,          -- PIX|TED
  status                 TEXT NOT NULL,          -- enum estado (ver 3.2)
  amount_cents           BIGINT NOT NULL CHECK (amount_cents > 0),
  currency               CHAR(3) NOT NULL DEFAULT 'BRL',
  payer_account_id       UUID NOT NULL REFERENCES payer_accounts(id),
  beneficiary_id         UUID REFERENCES beneficiaries(id),
  beneficiary_snapshot   JSONB NOT NULL,         -- dados congelados no momento
  payee_method           TEXT NOT NULL,          -- PIX_KEY|BANK_ACCOUNT
  payee                  JSONB NOT NULL,         -- dados efetivos usados
  description            TEXT,
  scheduled_for          DATE,
  idempotency_key        TEXT NOT NULL,
  bank_reference         TEXT,                   -- codigoSolicitacao/endToEndId/etc
  rejection_reason       TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type_status ON payments(type, status);
CREATE INDEX idx_payments_external_id ON payments(external_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Audit log imutável
CREATE TABLE payment_events (
  id                UUID PRIMARY KEY,
  payment_id        UUID NOT NULL REFERENCES payments(id),
  at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  from_status       TEXT,
  to_status         TEXT NOT NULL,
  actor             TEXT NOT NULL,               -- SYSTEM|USER:<id>|BANK
  reason            TEXT,
  payload           JSONB,
  correlation_id    TEXT
);

-- Trigger: bloqueia UPDATE e DELETE em payment_events (append-only real)
CREATE OR REPLACE FUNCTION payment_events_immutable() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'payment_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_events_no_update BEFORE UPDATE ON payment_events
  FOR EACH ROW EXECUTE FUNCTION payment_events_immutable();
CREATE TRIGGER payment_events_no_delete BEFORE DELETE ON payment_events
  FOR EACH ROW EXECUTE FUNCTION payment_events_immutable();

-- ============================================================
-- Runs (lote lógico do dia) e arquivos CNAB
-- ============================================================

CREATE TABLE payment_runs (
  id                 UUID PRIMARY KEY,
  run_date           DATE NOT NULL,
  status             TEXT NOT NULL,              -- OPEN|APPROVED|EXECUTING|PARTIALLY_SETTLED|CLOSED|FAILED
  approved_at        TIMESTAMPTZ,
  approved_by        TEXT,
  total_items        INT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL DEFAULT 0,
  pix_count          INT NOT NULL DEFAULT 0,
  ted_count          INT NOT NULL DEFAULT 0,
  summary            JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ
);

CREATE TABLE payment_run_items (
  run_id             UUID NOT NULL REFERENCES payment_runs(id),
  payment_id         UUID NOT NULL REFERENCES payments(id),
  channel            TEXT NOT NULL,              -- PIX_REST|CNAB_TED
  executed_at        TIMESTAMPTZ,
  settled_at         TIMESTAMPTZ,
  PRIMARY KEY (run_id, payment_id),
  UNIQUE (payment_id)                             -- um payment pertence a no máximo um run
);

CREATE TABLE cnab_files (
  id                  UUID PRIMARY KEY,
  run_id              UUID NOT NULL REFERENCES payment_runs(id),
  bank_code           CHAR(3) NOT NULL,
  layout_version      TEXT NOT NULL,              -- "CNAB240 FEBRABAN v10.7"
  sequence_number     INT NOT NULL,
  direction           TEXT NOT NULL,              -- REMESSA|RETORNO
  file_path           TEXT NOT NULL,              -- ObjectStore key
  file_hash           TEXT NOT NULL,              -- sha256 hex
  status              TEXT NOT NULL,              -- DRAFT|GENERATED|UPLOADED|AWAITING_RETURN|RETURNED|CLOSED|FAILED
  total_items         INT NOT NULL DEFAULT 0,
  generated_at        TIMESTAMPTZ,
  uploaded_at         TIMESTAMPTZ,
  upload_ack          TEXT,
  returned_at         TIMESTAMPTZ,
  processed_at        TIMESTAMPTZ,
  UNIQUE (file_hash)
);

-- ============================================================
-- Pré-validação (cache + histórico)
-- ============================================================

CREATE TABLE prevalidation_results (
  id              UUID PRIMARY KEY,
  payment_id      UUID NOT NULL REFERENCES payments(id),
  provider        TEXT NOT NULL,                  -- DICT|BANK_ACCOUNT|...
  request         JSONB NOT NULL,
  response        JSONB NOT NULL,
  verdict         TEXT NOT NULL,                  -- OK|REJECT|WARN
  reason          TEXT,
  validated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prevalidation_payment ON prevalidation_results(payment_id);

-- ============================================================
-- Idempotência e API keys
-- ============================================================

CREATE TABLE idempotency_keys (
  key               TEXT PRIMARY KEY,
  scope             TEXT NOT NULL,                -- "POST /v1/payments"
  request_hash      TEXT NOT NULL,
  response_snapshot JSONB NOT NULL,
  status_code       INT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idem_expires ON idempotency_keys(expires_at);

CREATE TABLE api_keys (
  id              UUID PRIMARY KEY,
  label           TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,            -- sha256(secret)
  scopes          TEXT[] NOT NULL,                 -- ex: ["payments:write","runs:approve","admin"]
  active          BOOLEAN NOT NULL DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ
);
```

### 3.2 Máquina de estados do `Payment`

```
RECEIVED
  └─ validação local OK ──────────────────────────→ VALIDATED_LOCAL
  └─ validação local falha ───────────────────────→ REJECTED (terminal)

VALIDATED_LOCAL
  └─ pré-validação REST OK ────────────────────────→ PREVALIDATED
  └─ pré-validação REST reject ────────────────────→ REJECTED (terminal)
  └─ marca suspeito por regra ─────────────────────→ UNDER_REVIEW

UNDER_REVIEW
  └─ humano libera ────────────────────────────────→ VALIDATED_LOCAL
  └─ humano rejeita ───────────────────────────────→ REJECTED

PREVALIDATED
  └─ anexado a run aprovado ───────────────────────→ APPROVED
  └─ deadline excedido ────────────────────────────→ EXPIRED (terminal)
  └─ cancelado pelo usuário ───────────────────────→ CANCELED (terminal)

APPROVED
  └─ humano pausa ─────────────────────────────────→ ON_HOLD
  └─ worker pegou para executar ───────────────────→ SUBMITTING
  └─ cancelado pelo usuário ───────────────────────→ CANCELED

ON_HOLD
  └─ humano libera ────────────────────────────────→ APPROVED
  └─ cancelado pelo usuário ───────────────────────→ CANCELED

SUBMITTING
  └─ envio aceito pelo banco ──────────────────────→ SENT
  └─ erro transitório ─────────────────────────────→ SUBMITTING (retry River)
  └─ retries esgotados ────────────────────────────→ FAILED (terminal, DLQ)

SENT
  └─ retorno CNAB/REST diz sucesso ────────────────→ SETTLED (terminal)
  └─ retorno diz falha ────────────────────────────→ FAILED (terminal)

Terminal: REJECTED, CANCELED, EXPIRED, SETTLED, FAILED
```

**Invariantes aplicadas por funções puras em `internal/domain/payment`:**
- Toda transição valida o estado origem. Transição inválida retorna erro de domínio e **não toca o DB**.
- Toda transição gera um `PaymentEvent` na mesma transação DB.
- Estados terminais não aceitam nova transição. Única exceção: `FAILED → SUBMITTING` via `POST /v1/payments/:id/retry` (documentado como reabertura manual).

### 3.3 Máquina de estados do `PaymentRun`

```
OPEN
  └─ humano aprova ──────→ APPROVED
  └─ humano descarta ────→ CLOSED (vazio)

APPROVED
  └─ workers começam ────→ EXECUTING

EXECUTING
  └─ parte dos itens terminais ─→ PARTIALLY_SETTLED
  └─ todos terminais ────────────→ CLOSED
  └─ erro catastrófico (ex: CNAB rejeitado inteiro) → FAILED

PARTIALLY_SETTLED
  └─ todos terminais ────→ CLOSED
```

### 3.4 Máquina de estados do `CnabFile`

```
DRAFT → GENERATED → UPLOADED → AWAITING_RETURN → RETURNED → CLOSED
                                                          ↘ FAILED
```

---

## 4. API HTTP (Ingress)

Todos os endpoints sob `/v1/`. Autenticação via `Authorization: Bearer <api_key>` (Fase 1).

### 4.1 Pagamentos — ingress

#### `POST /v1/payments`
Cria um pagamento individual.

**Headers obrigatórios:** `Idempotency-Key: <string>`

**Body (exemplo PIX):**
```json
{
  "external_id": "NF-1234",
  "type": "PIX",
  "amount_cents": 150000,
  "payer_account_id": "01234567-...",
  "beneficiary_id": "abcdef01-...",
  "payee_method": "PIX_KEY",
  "payee": { "key_type": "CNPJ", "key_value": "12345678000190" },
  "description": "Pagamento NF 1234",
  "scheduled_for": "2026-04-12"
}
```

**Body (exemplo TED):**
```json
{
  "external_id": "FOLHA-ABR-001",
  "type": "TED",
  "amount_cents": 450000,
  "payer_account_id": "01234567-...",
  "beneficiary_id": "abcdef01-...",
  "payee_method": "BANK_ACCOUNT",
  "payee": {
    "bank_code": "033",
    "agency": "1234",
    "account_number": "56789",
    "account_digit": "0",
    "account_type": "CC"
  },
  "description": "Folha abril"
}
```

**Respostas:**
- `201 Created` — payment criado, corpo com `{id, status, ...}`, status inicial `RECEIVED`
- `200 OK` (retorno cacheado via Idempotency-Key) — devolve a resposta original
- `400 Bad Request` — validação de schema falhou
- `409 Conflict` — `Idempotency-Key` reusado com request_hash diferente
- `401 Unauthorized` / `403 Forbidden` — auth

#### `POST /v1/payments/bulk`
Array JSON, até 10.000 itens. Cada item tem seu próprio `idempotency_key` no corpo (obrigatório por item).

**Resposta:**
```json
{
  "accepted": [ { "index": 0, "id": "...", "idempotency_key": "..." } ],
  "rejected": [ { "index": 3, "idempotency_key": "...", "errors": ["..."] } ]
}
```

#### `POST /v1/payments/import`
Upload `multipart/form-data` com `file` (`.csv` ou `.xlsx`).

**CSV canônico** (header obrigatório):
```
external_id,idempotency_key,type,amount_cents,payer_account_label,beneficiary_document,description,scheduled_for,pix_key_type,pix_key,bank_code,agency,account_number,account_digit,account_type
```

- Encoding UTF-8 com BOM opcional. Separador `,`. Decimal inteiro em centavos.
- Síncrono até **500 linhas**. Acima disso, retorna `202 Accepted` com `{job_id}`, processamento via worker, consulta em `GET /v1/imports/:job_id`.
- Resposta síncrona: `{accepted[], rejected[]}` com `line_number` em cada rejeição.

### 4.2 Consulta

- `GET /v1/payments/:id` — payment completo com timeline (`payment_events`)
- `GET /v1/payments` — listagem paginada com filtros: `status`, `type`, `run_id`, `from`, `to`, `beneficiary_id`, `cursor`, `limit` (default 50, max 500)
- `GET /v1/runs/:id` — run + resumo + itens
- `GET /v1/runs` — listagem paginada
- `GET /v1/runs/:id/cnab` — lista arquivos CNAB do run
- `GET /v1/cnab-files/:id/download` — baixa arquivo CNAB (remessa ou retorno)
- `GET /v1/imports/:job_id` — status de import assíncrono

### 4.3 Fluxo de aprovação (humano)

- `POST /v1/runs` — cria run vazio; body: `{ "run_date": "2026-04-11" }`
- `POST /v1/runs/:id/attach` — anexa pagamentos `PREVALIDATED` ao run; body: `{ "payment_ids": [...] }`. Transiciona os pagamentos para `APPROVED` só depois que o run é aprovado.
- `POST /v1/runs/:id/detach` — remove pagamentos do run (antes de aprovar)
- `POST /v1/runs/:id/approve` — aprova o run (`approved_by` do token), dispara `GenerateCnabJob` e `SubmitPixJob`(s)
- `POST /v1/runs/:id/cancel` — cancela run não-executado
- `POST /v1/payments/:id/hold` — pausa payment `APPROVED`
- `POST /v1/payments/:id/unhold` — despausa payment `ON_HOLD`
- `POST /v1/payments/:id/reject` — rejeita payment em estado não-terminal não-executado
- `POST /v1/payments/:id/cancel` — cancela payment em estado não-terminal não-executado
- `POST /v1/payments/:id/retry` — reabre payment `FAILED` (DLQ) para nova tentativa

### 4.4 Endpoints administrativos

- `POST /v1/admin/payer-accounts` — cadastra conta pagadora
- `GET /v1/admin/payer-accounts`
- `POST /v1/admin/beneficiaries` — cadastra beneficiário (com chaves PIX e contas bancárias aninhadas)
- `GET /v1/admin/beneficiaries`
- `POST /v1/admin/bank-certificates` — upload de certificado mTLS (criptografado no DB)
- `POST /v1/admin/api-keys` — emite nova API key; **resposta mostra o segredo uma única vez**
- `DELETE /v1/admin/api-keys/:id` — revoga

### 4.5 Webhook inbound do Itaú

- `POST /v1/webhooks/itau` — recebe notificações push de status PIX do Itaú
  - Valida assinatura (HMAC ou JWS conforme contrato Itaú)
  - Idempotência por event_id
  - Enfileira `ProcessItauWebhookJob`
  - Responde `200 OK` rapidamente (< 500ms)

### 4.6 Health

- `GET /healthz` — liveness, sem checks externos
- `GET /readyz` — readiness: checa Postgres (`SELECT 1`) e conectividade SFTP (com cache 30s para não martelar)

---

## 5. Fluxos End-to-End

### 5.1 Fluxo PIX (via API REST Itaú)

```
Passo  Ator               Ação                                         Estado do Payment
─────  ────────────────   ──────────────────────────────────────────   ─────────────────
1      Cliente            POST /v1/payments (type=PIX)                  (n/a)
2      Handler HTTP       valida DTO, verifica Idempotency-Key          (n/a)
3      Use case           ReceivePayment: insere payment, event,
                          idempotency_key, enfileira PrevalidatePix
                          job (tudo na mesma TX — outbox River)         RECEIVED
4      Handler            responde 201 (latência: ms)                   RECEIVED

─── async, worker River ───
5      PrevalidatePix     ReceivePayment passou VALIDATED_LOCAL;
                          chama Itaú REST DICT (chave → titular).
                          Timeout 10s, retry 3x com backoff             VALIDATED_LOCAL
6      PrevalidatePix     persiste prevalidation_result,
                          transiciona                                    PREVALIDATED

─── humano ───
7      Operador           POST /v1/runs (ou reusa run do dia)           PREVALIDATED
8      Operador           POST /v1/runs/:id/attach {payment_ids}        PREVALIDATED
9      Operador           POST /v1/runs/:id/approve                     APPROVED
                          → enfileira SubmitPix job por payment PIX
                          → enfileira GenerateCnab job para TEDs

─── async, worker River ───
10     SubmitPix          carrega OAuth token (cache 25min)
                          carrega cert mTLS (cache memória, reload
                          em mudança de bank_certificates)
                          POST Itaú /cash-management/v2/pix com
                          body + mTLS + Idempotency-Key
                          circuit breaker por payer_account               SUBMITTING
11     SubmitPix          sucesso HTTP: grava bank_reference,
                          transiciona                                     SENT
                          falha transitória: retry River (backoff
                          exponencial, até 5 tentativas)
                          falha permanente (4xx): FAILED + alerta         FAILED

─── reconciliação (duas fontes convergem) ───
12a    Webhook Itaú       POST /v1/webhooks/itau → enfileira
                          ProcessItauWebhookJob                           SENT
12b    ReconcilePix cron  a cada 2min, payment SENT há >30s:
                          GET Itaú /pix/:bank_reference                   SENT

13     Qualquer dos dois  transiciona por idempotência:
                          "SETTLED" do Itaú → SETTLED                     SETTLED
                          "REJEITADO" do Itaú → FAILED                    FAILED
```

### 5.2 Fluxo TED (via CNAB 240 SFTP)

```
Passo  Ator               Ação                                          Estado do Payment
─────  ────────────────   ──────────────────────────────────────────    ─────────────────
1-2    Cliente/Handler    POST /v1/payments (type=TED), valida           (n/a)
3      Use case           ReceivePayment: insere + event + idem +
                          enfileira PrevalidateTed (outbox)              RECEIVED
4      Handler            responde 201                                   RECEIVED

─── async, worker River ───
5      PrevalidateTed     valida schema, transiciona                     VALIDATED_LOCAL
6      PrevalidateTed     consulta conta bancária via Itaú REST
                          (endpoint de consulta de dados bancários
                          se disponível no escopo OF; senão faz
                          validação estrutural + dígito verificador)     PREVALIDATED

─── humano ───
7-9    Operador           attach + approve (idêntico PIX)                APPROVED

─── async, worker River ───
10     GenerateCnab       transação DB:
                          - SELECT FOR UPDATE dos payment_run_items
                            tipo=TED do run
                          - monta layout CNAB 240 em memória:
                            Header de arquivo (tipo 0)
                            Header de lote (tipo 1, serviço=20 pag
                              fornecedores, forma=03 DOC/TED)
                            Para cada payment:
                              Segmento A (tipo 3, código A)
                              Segmento B (tipo 3, código B)
                            Trailer de lote (tipo 5)
                            Trailer de arquivo (tipo 9)
                          - calcula sha256
                          - grava via ObjectStore (disk/s3)
                          - insere cnab_files(status=GENERATED)
                          - enfileira UploadCnab job                     APPROVED
11     UploadCnab         conecta SFTP Itaú (cliente com key),
                          PUT no diretório remessa.
                          Em caso de falha: retry [5s, 30s, 2min]        SUBMITTING
12     UploadCnab         sucesso: transiciona cnab_files → UPLOADED,
                          transiciona todos payments do arquivo          SENT
                          falha definitiva: cnab_files → FAILED,
                          payments voltam para APPROVED + alerta

─── empresa aprova o lote no Bankline Itaú (fora do sistema) ───

─── reconciliação ───
13     PollItauSftpCron   a cada 60s:
                          - conecta SFTP Itaú
                          - lista diretório retorno
                          - baixa arquivos não processados
                            (dedup por file_hash)
                          - grava cnab_files(direction=RETORNO,
                            status=RETURNED)
                          - enfileira ProcessCnabReturn por arquivo      SENT
14     ProcessCnabReturn  transação DB por linha de retorno:
                          - parseia segmento A/B do retorno
                          - código de ocorrência → verdict:
                            "00"/"BD" = liquidado
                            outros = falha com motivo
                          - encontra payment por identificador
                            (usamos external_id ou nosso id em
                            campo preservado)
                          - transiciona SENT → SETTLED/FAILED             SETTLED
                                                                           ou FAILED
                          - idempotente: reprocessar o arquivo não
                            muda nada
15     ReconcileTed cron  diário, para payment SENT há >2h:
                          consulta Itaú (se disponível) ou gera
                          alerta operacional                              ---
```

### 5.3 Estrutura do pacote CNAB (resumo)

Implementação minimalista própria em `internal/adapters/banks/itau/cnab/`. Não usar lib externa de baixa maturidade. Arquivos esperados:

- `layout.go` — struct por tipo de registro (header arquivo, header lote, segmento A, segmento B, trailer lote, trailer arquivo)
- `encoder.go` — gera arquivo CNAB 240 a partir de `[]Payment`
- `decoder.go` — parseia arquivo CNAB 240 de retorno em `[]ReturnLine`
- `fields.go` — helpers de formatação (padding numérico à esquerda com zeros, padding texto à direita com espaços, alinhamento, truncagem, validação de tamanho exato 240 caracteres por linha, CRLF correto)
- `codes.go` — mapa de códigos de ocorrência Itaú → verdict/motivo
- `layout_test.go`, `encoder_test.go`, `decoder_test.go` — com fixtures reais (`testdata/cnab240/itau/remessa-*.ret`, `retorno-*.ret`)

Layout de referência: **FEBRABAN CNAB 240 v10.7** com especializações Itaú (Manual Técnico SISPAG Itaú). Versões específicas de campos proprietários ficam isoladas em `itau.go` dentro do pacote.

---

## 6. Padrões de Confiabilidade (Transversais)

Aplicam-se a **toda** a Fase 1.

1. **Outbox transacional via River**: toda mudança de estado que dispara efeito externo enfileira o job na **mesma transação DB**. Zero dual-write.

2. **Idempotência obrigatória na ingress**: `POST /v1/payments`, `/bulk`, `/import` exigem `Idempotency-Key`. Tabela `idempotency_keys` guarda request_hash + response_snapshot por 24h. Mesma key + mesmo hash → devolve cacheado. Mesma key + hash diferente → `409 Conflict`.

3. **Retry exponencial com jitter** em todas chamadas externas:
   - REST Itaú: `[1s, 2s, 4s, 8s, 16s]`, 5 tentativas, timeout por request 30s
   - SFTP Itaú: `[5s, 30s, 2min]`, 3 tentativas, timeout por operação 120s
   - `429` e `5xx` retentam; `4xx` (exceto 429) não retentam

4. **Circuit breaker por `payer_account`** (`sony/gobreaker`): abre após 5 falhas consecutivas em janela de 60s, half-open após 30s, fecha após 2 sucessos. Quando aberto, jobs novos ficam em `SUBMITTING` retrying.

5. **Row-level locking em transições críticas**: `SELECT ... FOR UPDATE` ao transicionar payment de `APPROVED` para `SUBMITTING`, para evitar race entre workers.

6. **Dead letter via River**: após retries esgotados, job vai para `river_job` com state `discarded` e o payment transiciona para `FAILED`. Endpoint `POST /v1/payments/:id/retry` permite reabertura manual.

7. **Audit log imutável**: toda transição cria linha em `payment_events`. Trigger SQL bloqueia UPDATE/DELETE. Captura `from_status`, `to_status`, `actor`, `reason`, `payload`, `correlation_id`.

8. **Timeouts explícitos em tudo**: nenhum `http.Client` sem timeout; nenhuma query DB sem `context.Context` com deadline; nenhum worker sem cancelation.

9. **Valores monetários sempre em `int64` centavos**. Nunca `float64`. Limite prático `R$ 92.233.720.368.547.758,07` mais que suficiente.

10. **Processamento de retorno CNAB idempotente**: hash SHA256 do arquivo é chave única. Reprocessar não muda estado.

11. **Graceful shutdown**: SIGTERM → drena requests HTTP em andamento, espera jobs River in-flight, fecha conexões DB/SFTP/HTTP. Deadline configurável (default 30s), após isso força saída.

12. **Panic recovery middleware** no HTTP e em cada worker: panic é capturado, logado com stack, transforma em `500` (HTTP) ou falha de job (worker). Nunca derruba o processo.

---

## 7. Segurança

- **mTLS outbound** para todas chamadas Itaú. Cliente `*http.Client` com `TLSClientConfig` carregado dos certificados em memória (decriptografados de `bank_certificates`). Cache invalidável.
- **Certificados em repouso**: AES-GCM. Em dev, chave vem de env var; em prod, chave vem de AWS KMS via AWS Secrets Manager. Nunca cert_pem/key_pem em texto claro no DB ou logs.
- **JWS signing** onde o escopo Open Finance do Itaú exigir (cabeçalhos `x-jws-signature` etc.). Implementação via `go-jose/v4`.
- **TLS 1.2+ inbound** obrigatório em produção; configuração deixada ao deploy (reverse proxy ou listener direto).
- **Rate limit inbound**: `golang.org/x/time/rate` por IP (global 100 req/s) e por API key (20 req/s default; ajustável por key).
- **API key**: gerada pelo sistema como 32 bytes random base64url, hash SHA256 no DB. Resposta da criação mostra o valor bruto **uma única vez**. Comparação constant-time.
- **Validação estrita de input**: validator tags em todos os DTOs HTTP. CPF/CNPJ/agência/conta só dígitos. Valor inteiro positivo. Datas ISO-8601. Descrição limitada a 140 caracteres para PIX.
- **SQL injection impossível por design**: sqlc gera queries parametrizadas, zero SQL dinâmico em string.
- **LGPD em logs**: CPF/CNPJ logados apenas como últimos 4 dígitos + hash. Payloads sensíveis (chave PIX, número de conta) redacted em traces OTel via hook. `slog` handler custom que aplica redação.
- **Panic recovery**: já listado em 6.
- **Cert rotation**: reload de certificados via SIGHUP recarrega `bank_certificates` ativos sem restart.
- **Audit log cobre compliance** BACEN/LGPD para transições de estado e ações administrativas.

---

## 8. Observabilidade

### 8.1 Logging
- `slog` com handler JSON.
- Campos obrigatórios em toda linha: `ts`, `level`, `msg`, `service`, `env`, `correlation_id`.
- Campos adicionais quando disponíveis: `payment_id`, `run_id`, `cnab_file_id`, `bank_code`, `payer_account_id`, `actor`, `duration_ms`, `err`.
- `correlation_id` gerado no middleware HTTP (se não vier no header `X-Correlation-ID`), propagado via `context.Context`, incluído no payload de todo job River.
- Redação automática para campos sensíveis.

### 8.2 Tracing
- OpenTelemetry Go SDK. Exporter OTLP.
- Spans automáticos: request HTTP (middleware), chamada DB (instrumentação pgx), chamada HTTP saída (transport wrapper), job River (middleware).
- Atributos padrão: `payment.id`, `payment.type`, `run.id`, `bank.code`, `gateway.operation`.

### 8.3 Métricas (Prometheus)
- `paymentshub_payments_total{type, status, bank}` — counter
- `paymentshub_payment_transitions_total{from, to}` — counter
- `paymentshub_payment_state_duration_seconds{from, to}` — histogram
- `paymentshub_external_call_duration_seconds{bank, operation, outcome}` — histogram
- `paymentshub_external_call_errors_total{bank, operation, kind}` — counter
- `paymentshub_river_jobs{kind, state}` — gauge
- `paymentshub_circuit_breaker_state{bank, payer_account}` — gauge (0=closed, 1=half, 2=open)
- `paymentshub_cnab_files_total{direction, status}` — counter
- `paymentshub_cnab_return_lag_seconds` — histogram (tempo entre `SENT` e recebimento do retorno)
- `paymentshub_http_requests_total{path, method, status}` — counter
- `paymentshub_http_request_duration_seconds{path, method}` — histogram

### 8.4 Alertas (definidos, implementação fica com o deploy)
- Payment `SENT` há mais de 2h sem transição — **warning**
- Taxa de erro HTTP > 5% em janela de 5min — **critical**
- Fila River com > 100 jobs em state `retrying` por tipo — **warning**
- Circuit breaker aberto por mais de 5min — **critical**
- Certificado Itaú com validade < 30 dias — **warning**
- Job descartado (DLQ) — **critical**, páginação incluída

---

## 9. Testes

### 9.1 Unit
- `internal/domain/**`: máquina de estados, invariants, value objects. Pure Go, sem DB.
- `internal/adapters/banks/itau/cnab/**`: encoder e decoder contra fixtures em `testdata/cnab240/itau/*.{rem,ret}`. Garante que o arquivo gerado bate byte-a-byte com referência.

### 9.2 Integração
- `internal/app/**`: use cases contra Postgres real via `testcontainers-go`. Zero mocks de DB.
- River rodado em modo teste (lib oferece helper).
- Fake REST Itaú: `httptest.Server` que simula respostas OAuth, DICT, envio PIX, consulta PIX, webhook.
- Fake SFTP: servidor SFTP local via lib `pkg/sftp` embutido em teste.
- Fake ObjectStore: implementação em memória satisfazendo a interface.

### 9.3 Adapter
- Handlers HTTP testados com `httptest` + client HTTP real, validando status codes, headers, idempotência.

### 9.4 End-to-end
- `docker-compose.test.yml` sobe postgres + minio + stubs. Cenário completo: "cliente envia → sistema pré-valida → humano aprova → sistema executa → retorno processado → payment em SETTLED".

### 9.5 Cobertura
- `internal/domain/**` ≥ **90%**
- `internal/app/**` ≥ **85%**
- `internal/adapters/**` ≥ **70%**
- Overall ≥ **80%**

### 9.6 Lint e CI
- `golangci-lint` com preset estrito: `gosec`, `errcheck`, `govet`, `staticcheck`, `gocritic`, `revive`, `unused`, `ineffassign`, `bodyclose`, `contextcheck`.
- CI executa: `go mod tidy` check, `go build ./...`, `golangci-lint run`, `go test -race ./...` (unit + integration), build Docker image. Todos são gates obrigatórios.

---

## 10. Deploy

- **Docker multi-stage**: stage 1 golang:1.22-alpine compila binário estático com `CGO_ENABLED=0`; stage 2 `gcr.io/distroless/static` recebe apenas o binário. Dois Dockerfiles (ou um com targets): `api` e `worker`.
- **docker-compose** em desenvolvimento: `postgres:16`, `minio`, `otel-collector`, `api`, `worker`, reloadd via `air` opcional.
- **Config via env** (`envconfig`): `DATABASE_URL`, `RIVER_MAX_WORKERS`, `ITAU_REST_BASE_URL`, `ITAU_SFTP_HOST`, `OBJECT_STORE_BACKEND`, `S3_BUCKET`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `AES_KEK_REF` (prod), etc.
- **Migrations** via `goose up` executado como init container ou no startup do `api` binário (behind flag).
- **Graceful shutdown**: tratamento de SIGTERM/SIGINT em ambos os binários com deadline configurável.
- **Kubernetes/ECS/Nomad** — decisão de runtime fica fora deste spec; o que importa é que os 2 binários escalem independente e a imagem seja stateless.

---

## 11. Critérios de Aceitação da Fase 1

A Fase 1 está concluída quando:

1. **Ingress funcionando**: os 3 endpoints (`/payments`, `/bulk`, `/import`) aceitam dados, persistem payments, geram audit log, retornam respostas consistentes com idempotência.
2. **Pré-validação REST**: um payment PIX recebe verdict do DICT Itaú (sandbox) em < 5s na maioria dos casos; a tabela `prevalidation_results` guarda histórico.
3. **Aprovação via API**: operador consegue criar run, anexar pagamentos, aprovar, e ver os pagamentos transicionarem automaticamente.
4. **PIX end-to-end**: payment tipo PIX é enviado com sucesso ao sandbox do Itaú via REST, recebe `bank_reference`, e é reconciliado para `SETTLED` via polling ou webhook.
5. **TED end-to-end**: pagamentos TED aprovados geram arquivo CNAB 240 válido (valida com ferramenta de referência), são enviados ao SFTP sandbox do Itaú, o retorno é baixado e processado, payments transicionam para estados terminais corretos.
6. **Audit trail**: toda transição registrada em `payment_events`; tentativa de UPDATE/DELETE falha.
7. **Confiabilidade**: cenário de falha injetada (Itaú REST devolve 503, SFTP fora do ar, banco reinicia) não corrompe estado; sistema retoma operação após recuperação.
8. **Cobertura de testes** atinge os mínimos de 9.5.
9. **Observabilidade**: logs estruturados, métricas Prometheus expostas em `/metrics`, traces OTel exportados.
10. **Docker compose up** em máquina limpa sobe o ambiente completo e permite rodar os cenários end-to-end manualmente.

---

## 12. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Layout CNAB 240 específico do Itaú diverge do manual FEBRABAN genérico em campos proprietários | Alto — arquivo rejeitado | Escrever parser/encoder próprio minimalista, cobrir com fixtures reais capturadas do sandbox; validar byte-a-byte contra exemplos do Manual SISPAG Itaú |
| Escopo Open Finance para DICT exige certificação formal que atrasa homologação | Médio | Sandbox Itaú Developer aceita operação de teste sem certificação plena; produção fica para fase de hardening |
| Sandbox Itaú instável ou indisponível durante desenvolvimento | Médio | Fake REST Itaú local para desenvolvimento e testes; sandbox usado apenas para verificação integração periódica |
| Divergência entre resultado da pré-validação (REST) e retorno real (CNAB) | Médio | Tratar pré-validação como "best effort, não garantia"; retorno CNAB é source of truth; gerar alerta quando divergir |
| Perda de evento via webhook Itaú | Alto se só confiasse nele | Polling de reconciliação complementar sempre ativo |
| Certificado mTLS expirando sem aviso | Crítico | Métrica + alerta `certificado < 30 dias`; reload via SIGHUP sem restart |
| Race condition em transição de pagamento (dois workers pegando mesmo payment) | Crítico | `SELECT ... FOR UPDATE` + River job uniqueness |
| Credenciais vazando em logs | Crítico (LGPD, segurança) | Handler slog com redaction; OTel sampler redactando atributos; revisão de gosec no CI |
| Lib CNAB em Go de baixa maturidade | Médio | Escrever implementação própria, controlada, testada com fixtures reais |

---

## 13. Roadmap das Fases Subsequentes (referência)

Este spec é o primeiro de uma série. Os próximos specs cobrirão:

- **Fase 2 — Camada SaaS**: `Client`, `ApiKey` vinculada a cliente, segregação de dados, webhooks de saída assinados HMAC para notificar cliente sobre mudanças de status, endpoints de CRUD de API key por cliente.
- **Fase 3 — Orquestração avançada**: regras de pré-análise (limites, duplicidade, blacklist, scoring básico), agrupamento inteligente em runs, políticas de approval multi-nível, quotas.
- **Fase 4 — Portal SaaS (frontend)**: UI consumindo os endpoints REST da Fase 1+2+3, fluxo visual de aprovação, timeline do payment, dashboards.
- **Fase 5+ — Outros bancos**: Bradesco, Santander, Banco do Brasil reutilizando a interface `PaymentGateway` e o parser CNAB (+ adaptações por banco).
- **Fases de hardening**: homologação BACEN produção, certificação Open Finance, auditoria externa, BCP/DR.

Cada fase entra em novo ciclo brainstorming → spec → plan → implementação.
