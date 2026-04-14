package handlers

import (
	"net/http"
)

// OpenAPIHandler serves the OpenAPI 3.0 spec + embedded Swagger UI.
type OpenAPIHandler struct{}

func NewOpenAPIHandler() *OpenAPIHandler { return &OpenAPIHandler{} }

func (h *OpenAPIHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("/openapi.json", h.Spec)
	mux.HandleFunc("/docs", h.SwaggerUI)
}

const openAPISpec = `{
  "openapi": "3.0.3",
  "info": {
    "title": "PaymentsHub API",
    "version": "1.0.0",
    "description": "Orquestrador SaaS de pagamentos bancarios. Recebe pagamentos do ERP, pre-valida, agrupa em lote diario, aprova e envia ao banco.",
    "contact": {"name": "Double Three", "email": "contato@doublethree.com.br"}
  },
  "servers": [{"url": "http://localhost:8080", "description": "Desenvolvimento"}],
  "security": [{"bearerAuth": []}],
  "components": {
    "securitySchemes": {
      "bearerAuth": {"type": "http", "scheme": "bearer", "description": "API Key no formato: Bearer <sua-chave>"}
    },
    "schemas": {
      "Payment": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "external_id": {"type": "string", "description": "Referencia interna do ERP"},
          "type": {"type": "string", "enum": ["PIX", "TED"]},
          "status": {"type": "string", "enum": ["RECEIVED","VALIDATED_LOCAL","PREVALIDATED","UNDER_REVIEW","APPROVED","ON_HOLD","SUBMITTING","SENT","SETTLED","FAILED","REJECTED","CANCELED"]},
          "amount_cents": {"type": "integer", "format": "int64", "description": "Valor em centavos"},
          "currency": {"type": "string", "default": "BRL"},
          "payer_account_id": {"type": "string", "format": "uuid"},
          "payee_method": {"type": "string", "enum": ["PIX_KEY", "BANK_ACCOUNT"]},
          "payee": {"type": "object"},
          "description": {"type": "string"},
          "created_at": {"type": "string", "format": "date-time"}
        }
      },
      "CreatePaymentRequest": {
        "type": "object",
        "required": ["type", "amount_cents", "payer_account_id", "payee_method", "payee"],
        "properties": {
          "external_id": {"type": "string", "example": "NF-2026-001"},
          "type": {"type": "string", "enum": ["PIX", "TED"]},
          "amount_cents": {"type": "integer", "example": 15000, "description": "Valor em centavos"},
          "payer_account_id": {"type": "string", "format": "uuid"},
          "beneficiary_id": {"type": "string", "format": "uuid", "description": "Opcional se payee fornecido manualmente"},
          "payee_method": {"type": "string", "enum": ["PIX_KEY", "BANK_ACCOUNT"]},
          "payee": {
            "type": "object",
            "example": {"key_type": "CNPJ", "key_value": "12345678000190"}
          },
          "description": {"type": "string", "example": "Pagamento NF 001"},
          "scheduled_for": {"type": "string", "format": "date", "example": "2026-04-15"}
        }
      },
      "Run": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "run_date": {"type": "string", "format": "date"},
          "status": {"type": "string", "enum": ["OPEN","APPROVED","EXECUTING","PARTIALLY_SETTLED","CLOSED","FAILED"]},
          "total_items": {"type": "integer"},
          "total_amount_cents": {"type": "integer", "format": "int64"},
          "pix_count": {"type": "integer"},
          "ted_count": {"type": "integer"}
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "error": {"type": "string"},
          "details": {"type": "object"}
        }
      }
    }
  },
  "paths": {
    "/healthz": {
      "get": {
        "summary": "Liveness probe",
        "security": [],
        "tags": ["Health"],
        "responses": {"200": {"description": "OK"}}
      }
    },
    "/readyz": {
      "get": {
        "summary": "Readiness probe (verifica Postgres)",
        "security": [],
        "tags": ["Health"],
        "responses": {"200": {"description": "Ready"}, "503": {"description": "Not ready"}}
      }
    },
    "/v1/payments": {
      "get": {
        "summary": "Listar pagamentos",
        "tags": ["Pagamentos"],
        "parameters": [
          {"name": "status", "in": "query", "schema": {"type": "string"}, "description": "Filtrar por status (ou ALL)"},
          {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 100}},
          {"name": "offset", "in": "query", "schema": {"type": "integer", "default": 0}}
        ],
        "responses": {
          "200": {"description": "Lista", "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/Payment"}}}}}
        }
      },
      "post": {
        "summary": "Criar pagamento",
        "tags": ["Pagamentos"],
        "parameters": [
          {"name": "Idempotency-Key", "in": "header", "required": true, "schema": {"type": "string"}, "description": "UUID unico para evitar duplicatas"}
        ],
        "requestBody": {
          "required": true,
          "content": {"application/json": {"schema": {"$ref": "#/components/schemas/CreatePaymentRequest"}}}
        },
        "responses": {
          "201": {"description": "Criado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Payment"}}}},
          "200": {"description": "Replay idempotente"},
          "409": {"description": "Conflito de idempotencia", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}},
          "400": {"description": "Validacao falhou", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}}
        }
      }
    },
    "/v1/payments/{id}": {
      "get": {
        "summary": "Detalhes do pagamento + timeline",
        "tags": ["Pagamentos"],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string", "format": "uuid"}}],
        "responses": {"200": {"description": "Detalhes"}}
      }
    },
    "/v1/payments/{id}/hold": {
      "post": {
        "summary": "Pausar pagamento aprovado",
        "tags": ["Pagamentos - Acoes"],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}],
        "requestBody": {"content": {"application/json": {"schema": {"type": "object", "properties": {"reason": {"type": "string"}}}}}},
        "responses": {"204": {"description": "Pausado"}, "409": {"description": "Transicao invalida"}}
      }
    },
    "/v1/payments/{id}/cancel": {
      "post": {
        "summary": "Cancelar pagamento",
        "tags": ["Pagamentos - Acoes"],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}],
        "requestBody": {"content": {"application/json": {"schema": {"type": "object", "properties": {"reason": {"type": "string"}}}}}},
        "responses": {"204": {"description": "Cancelado"}}
      }
    },
    "/v1/payments/{id}/reject": {
      "post": {
        "summary": "Rejeitar pagamento (com motivo)",
        "tags": ["Pagamentos - Acoes"],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}],
        "requestBody": {
          "required": true,
          "content": {"application/json": {"schema": {"type": "object", "required": ["reason"], "properties": {"reason": {"type": "string"}}}}}
        },
        "responses": {"204": {"description": "Rejeitado"}}
      }
    },
    "/v1/payments/{id}/reschedule": {
      "post": {
        "summary": "Reagendar pagamento para outra data",
        "tags": ["Pagamentos - Acoes"],
        "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}],
        "requestBody": {
          "required": true,
          "content": {"application/json": {"schema": {"type": "object", "required": ["new_date"], "properties": {"new_date": {"type": "string", "format": "date"}, "reason": {"type": "string"}}}}}
        },
        "responses": {"204": {"description": "Reagendado"}, "400": {"description": "Data invalida"}, "409": {"description": "Estado nao permite reagendamento"}}
      }
    },
    "/v1/runs": {
      "get": {"summary": "Listar lotes", "tags": ["Lotes"], "responses": {"200": {"description": "Lista"}}},
      "post": {
        "summary": "Criar lote do dia",
        "tags": ["Lotes"],
        "requestBody": {"content": {"application/json": {"schema": {"type": "object", "properties": {"run_date": {"type": "string", "format": "date"}}}}}},
        "responses": {"201": {"description": "Criado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Run"}}}}}
      }
    },
    "/v1/runs/{id}": {
      "get": {"summary": "Detalhes do lote", "tags": ["Lotes"], "parameters": [{"name":"id","in":"path","required":true,"schema":{"type":"string"}}], "responses": {"200": {"description": "Detalhes"}}}
    },
    "/v1/runs/{id}/payments": {
      "get": {"summary": "Listar pagamentos do lote", "tags": ["Lotes"], "parameters": [{"name":"id","in":"path","required":true,"schema":{"type":"string"}}], "responses": {"200": {"description": "Lista"}}}
    },
    "/v1/runs/{id}/attach": {
      "post": {
        "summary": "Anexar pagamentos ao lote",
        "tags": ["Lotes"],
        "parameters": [{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"type": "object", "properties": {"payment_ids": {"type": "array", "items": {"type":"string"}}}}}}},
        "responses": {"200": {"description": "Anexados"}}
      }
    },
    "/v1/runs/{id}/approve": {
      "post": {"summary": "Aprovar lote (transiciona OPEN -> APPROVED)", "tags": ["Lotes"], "parameters": [{"name":"id","in":"path","required":true,"schema":{"type":"string"}}], "responses": {"200": {"description": "Aprovado"}}}
    },
    "/v1/runs/{id}/submit-to-bank": {
      "post": {
        "summary": "Consolidar e enviar lote ao banco",
        "description": "PIX via API REST individual, TED agrupado em CNAB 240 via SFTP. Lote precisa estar APPROVED.",
        "tags": ["Lotes"],
        "parameters": [{"name":"id","in":"path","required":true,"schema":{"type":"string"}}],
        "responses": {"200": {"description": "Enviado ao banco"}, "409": {"description": "Lote nao esta APPROVED"}}
      }
    },
    "/v1/admin/payer-accounts": {
      "get": {"summary": "Listar contas pagadoras", "tags": ["Admin"], "responses": {"200": {"description": "Lista"}}},
      "post": {"summary": "Criar conta pagadora", "tags": ["Admin"], "responses": {"201": {"description": "Criada"}}}
    },
    "/v1/admin/beneficiaries": {
      "get": {"summary": "Listar beneficiarios", "tags": ["Admin"], "responses": {"200": {"description": "Lista"}}},
      "post": {"summary": "Cadastrar beneficiario", "tags": ["Admin"], "responses": {"201": {"description": "Criado"}}}
    },
    "/v1/admin/api-keys": {
      "post": {
        "summary": "Emitir nova API Key (mostra token apenas uma vez)",
        "tags": ["Admin"],
        "requestBody": {"required": true, "content": {"application/json": {"schema": {"type": "object", "required": ["label","scopes"], "properties": {"label": {"type":"string"}, "scopes": {"type": "array", "items": {"type":"string"}}}}}}},
        "responses": {"201": {"description": "Criada. Guardar o token retornado."}}
      }
    }
  }
}`

func (h *OpenAPIHandler) Spec(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(openAPISpec))
}

const swaggerHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>PaymentsHub - Documentacao da API</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body { margin: 0; background: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
    .topbar { background: #1a2744; color: white; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
    .topbar h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .topbar .tag { font-size: 11px; background: rgba(34,134,58,0.2); color: #4ade80; padding: 2px 8px; border-radius: 4px; }
    .topbar .shield { width: 28px; height: 28px; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #1a2744; }
    .swagger-ui .btn.authorize { background: #22863a; border-color: #22863a; }
    .swagger-ui .btn.authorize:hover { background: #1a6d2e; }
  </style>
</head>
<body>
  <div class="topbar">
    <svg class="shield" viewBox="0 0 64 64"><path d="M32 4L8 16v16c0 16 24 28 24 28s24-12 24-28V16L32 4z" fill="#2563eb"/><path d="M32 4v44s24-12 24-28V16L32 4z" fill="#22863a"/><path d="M22 32l8 8 14-16" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
    <h1>PaymentsHub API</h1>
    <span class="tag">v1.0.0</span>
    <div style="margin-left: auto; font-size: 12px; opacity: 0.7;"><a href="http://localhost:3100" style="color:white;text-decoration:none">Portal</a></div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`

func (h *OpenAPIHandler) SwaggerUI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(swaggerHTML))
}
