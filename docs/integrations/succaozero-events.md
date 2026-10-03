# Integração de eventos da Sucção Zero

## Endpoint

`POST /api/public/v1/succaozero/events`

Headers obrigatórios:

- `Content-Type: application/json`
- `X-Api-Key: <chave da organização Sucção Zero>`

A chave deve pertencer à mesma organização definida por
`SUCCAOZERO_ORGANIZATION_ID`. Uma chave válida de outra empresa recebe `403`.

## Envelope

Todo evento usa o mesmo envelope estrito:

```json
{
  "event_id": "wa:message:01J8K7B7K2",
  "event_type": "lead.received",
  "occurred_at": "2026-09-30T12:00:00-03:00",
  "subject": {
    "source_identifier": "5511999990000@lid",
    "phone": "+5511999990000",
    "email": "cliente@example.com",
    "opportunity_id": "00000000-0000-4000-8000-000000000000"
  },
  "payload": {}
}
```

`event_id` é a chave permanente de idempotência. O n8n deve persistir e
reutilizar exatamente o mesmo valor em todas as tentativas do mesmo evento.

## Tipos de evento

### `lead.received`

```json
{
  "event_id": "wa:message:01J8K7B7K2",
  "event_type": "lead.received",
  "occurred_at": "2026-09-30T12:00:00-03:00",
  "subject": {
    "source_identifier": "5511999990000@lid",
    "phone": "+5511999990000"
  },
  "payload": {
    "name": "Maria da Silva",
    "board_id": "00000000-0000-4000-8000-000000000001",
    "stage_id": "00000000-0000-4000-8000-000000000002",
    "utm_source": "google"
  }
}
```

Se houver apenas um identificador `@lid`, sem telefone nem e-mail, a resposta é
`202` com `status: "pending_identity"`. O evento não é descartado.

### `lead.qualified`

```json
{
  "event_id": "wa:qualified:01J8K7B7K2",
  "event_type": "lead.qualified",
  "occurred_at": "2026-09-30T12:05:00-03:00",
  "subject": {
    "source_identifier": "5511999990000@lid",
    "opportunity_id": "00000000-0000-4000-8000-000000000003"
  },
  "payload": { "to_stage_label": "Qualificado" }
}
```

### `stage.change_requested`

```json
{
  "event_id": "wa:stage:01J8K7B7K2",
  "event_type": "stage.change_requested",
  "occurred_at": "2026-09-30T12:10:00-03:00",
  "subject": {
    "source_identifier": "5511999990000@lid",
    "opportunity_id": "00000000-0000-4000-8000-000000000003"
  },
  "payload": {
    "to_stage_id": "00000000-0000-4000-8000-000000000004",
    "mark": "won"
  }
}
```

Envio repetido devolve `action: "duplicate"`. Pedido para a etapa atual devolve
`action: "unchanged"` sem alterar `last_stage_change_date`. Evento mais antigo
que o estado já registrado recebe `409 OUT_OF_ORDER`.

### `next_action.requested`

```json
{
  "event_id": "wa:next-action:01J8K7B7K2",
  "event_type": "next_action.requested",
  "occurred_at": "2026-09-30T12:15:00-03:00",
  "subject": {
    "source_identifier": "5511999990000@lid",
    "opportunity_id": "00000000-0000-4000-8000-000000000003"
  },
  "payload": {
    "kind": "FOLLOW_UP",
    "due_at": "2026-10-01T09:00:00-03:00",
    "executor_profile_id": "00000000-0000-4000-8000-000000000005"
  }
}
```

Sem `executor_profile_id`, o sistema usa o responsável atual da oportunidade.

## Respostas e reprocessamento

| HTTP | Significado | Ação do n8n |
| --- | --- | --- |
| `200` | Evento repetido ou mudança já aplicada | Marcar checkpoint |
| `201` | Evento criado e processado | Marcar checkpoint |
| `202` | Aceito, mas exige identidade ou responsável | Marcar checkpoint e abrir alerta operacional |
| `401` / `403` | Chave inválida ou organização incorreta | Bloquear fluxo e alertar administrador |
| `409` | Fora de ordem ou conflito operacional | Manter na fila para análise/reprocessamento |
| `422` | Payload ou relacionamento inválido | Manter na fila com o erro retornado |
| `5xx` | Falha temporária | Repetir com backoff e o mesmo `event_id` |

O workflow `J. Sincroniza CRM — SucçãoZero` não deve consultar “últimos 10
minutos”. Cada mudança precisa gerar um item durável em fila. O checkpoint só é
gravado após `2xx`; respostas `409`, `422` e `5xx` mantêm payload, erro, número de
tentativas e próximo horário de execução.
