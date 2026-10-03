# Corte do n8n — Sucção Zero

1. Duplique `J. Sincroniza CRM — SucçãoZero` e mantenha a cópia inativa.
2. Troque o filtro móvel de dez minutos por um checkpoint persistente composto por `(updated_at, primary_key)`.
3. Gere `event_id` determinístico no formato `<table>:<primary_key>:<updated_at>`.
4. Envie o envelope documentado para `POST /api/public/v1/succaozero/events` com a API key exclusiva da organização.
5. Avance o checkpoint somente depois de resposta `2xx`.
6. Encaminhe `409`, `422` e `5xx` para uma fila durável contendo apenas o payload necessário, código do erro, tentativas e `next_retry_at`.
7. Antes de ativar, faça backfill a partir do último checkpoint conhecido; nunca use “agora menos dez minutos”.
8. Rode o fluxo antigo e o novo em modo sombra. Durante a sombra, somente o novo escreve no modelo canônico e o antigo permanece disponível para reversão.
9. Compare contagens e IDs técnicos com `reconcile:succaozero` e verifique a saúde com `verify-sync-health.mjs`.
10. Desative o workflow antigo sem excluí-lo e registre horário, checkpoint e responsável pelo corte.

## Simulação obrigatória em homologação

- Pausar o fluxo novo por 30 minutos.
- Criar eventos sintéticos isolados, incluindo repetição, entrega fora de ordem e um identificador `@lid`.
- Retomar o fluxo com o mesmo checkpoint.
- Confirmar `lost=0`, `duplicates=0`, `pending=0` após a recuperação e atraso máximo de pelo menos 30 minutos durante a pausa.
- Confirmar que uma alteração manual posterior prevalece sobre evento antigo e que instalação nunca regride oportunidade ganha.

## Reversão

Desligar `SUCCAOZERO_CANONICAL_ENABLED`, reativar o fluxo antigo no checkpoint registrado, preservar todos os eventos recebidos depois do corte e executar conciliação. Não apagar eventos nem tabelas.
