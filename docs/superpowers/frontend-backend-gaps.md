# Gaps Backend descobertos durante reconstrução do frontend

Anotações de endpoints / campos / comportamentos que faltam no backend
e precisam ser implementados ao final da fase de UI.

## Status: aberto

- [ ] **Métricas do dashboard** — não há endpoint `/v1/metrics/summary` que
      retorne totais por status, volume processado nos últimos 7/30 dias e
      contagem de pagamentos por dia. O frontend está agregando no cliente
      a partir de `listPayments(?limit=200)`, mas isso não escala.
- [ ] **Métricas por dia (gráfico)** — falta `/v1/metrics/daily?days=14`
      retornando `[{date, count, amount_cents, success_rate}]`.
- [ ] **Beneficiário: edição** — só existe `POST /v1/admin/beneficiaries`
      e `POST /v1/admin/beneficiaries/{id}/pix-keys`. Falta `PATCH` para
      atualizar dados básicos e `DELETE` para inativar pix-key/conta.
- [ ] **Pagamento: anexar comprovante** — UI prevê upload de comprovante
      pós-liquidação. Backend precisa de `POST /v1/payments/{id}/attachments`.
- [ ] **Run: detach payment** — `attach` existe; falta `POST /v1/runs/{id}/detach`
      para remover pagamento de uma run sem aprovar.
- [ ] **Run: comentários/observações do aprovador** — campo `notes` em
      `Run` para o aprovador deixar registro do motivo de aprovação parcial.
- [ ] **Auditoria/timeline global** — endpoint `/v1/audit?entity=run|payment&id=...`
      retornando eventos consolidados (atualmente só `PaymentDetail.timeline`).
- [ ] **Notificações** — sino na topbar exige `/v1/notifications` (lista) e
      `POST /v1/notifications/{id}/read`. Hoje não existe.
- [ ] **Configurações da conta/empresa** — `/v1/settings` (GET/PATCH) com
      timezone, cutoff diário do batch, e-mails para alerta de falha.
- [ ] **API keys: revogar/listar** — só existe `POST /v1/admin/api-keys`. Falta
      `GET /v1/admin/api-keys` e `DELETE /v1/admin/api-keys/{id}`.
- [ ] **Reset de senha do próprio usuário** — `POST /v1/auth/change-password`
      (atual: só admin reseta de outros).
- [ ] **Arquivo CNAB gerado** — endpoint para download do CNAB 240
      gerado (`GET /v1/runs/{id}/cnab.txt`).
- [ ] **Webhooks de saída** — cadastro de URLs de callback do cliente
      em `/v1/admin/webhooks` para notificar status de pagamento.

## Status: resolvido

- [x] `RequireScope` middleware aceitando JWT + role hierarchy (commit 6d89825)
- [x] `GET /v1/payments` com filtro opcional `?status=`
- [x] `POST /v1/runs/{id}/submit-to-bank` para submissão consolidada
