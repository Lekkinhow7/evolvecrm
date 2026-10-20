# Contrato da agenda com o n8n

Para quem monta os fluxos do n8n da Alice. Duas direções: o CRM chama o n8n (canal de saída) e o n8n chama o CRM (portas).

## 1. CRM -> n8n (canal de saída)

Uma única URL de webhook do n8n recebe todas as ações.

- Variáveis no CRM: `N8N_AGENDA_URL` (endereço do webhook) e `N8N_RETORNO_SECRET` (segredo).
- Método: `POST`, `Content-Type: application/json`.
- Cabeçalho `x-retorno-secret: <segredo>`: o n8n deve recusar chamadas sem ele.
- Corpo: `{ "acao": "<nome>", ...dados }`. O n8n escolhe o ramo pelo campo `acao`.
- Limite: o CRM desiste depois de 15 segundos. Qualquer resposta que não seja 2xx com JSON válido conta como falha; nesse caso o CRM **não grava nada** e a tela pede para tentar de novo.
- Datas: ISO 8601 com fuso (por exemplo `2026-11-03T14:00:00-03:00`).

### `horarios_livres`
Entrada: `{ "acao": "horarios_livres", "dias": 14 }` (janela em dias a partir de hoje, 1 a 60).
Resposta: `{ "horarios": [ { "inicio": "...", "fim": "...", "formato": "online" | "presencial" } ] }` (`formato` opcional).

### `agendar_reuniao`
Entrada: `{ "acao": "agendar_reuniao", "deal_id": "<uuid do negócio no CRM>", "inicio": "...", "fim": "...", "formato": "online" | "presencial" }`.
O n8n confere de novo se o horário está livre, grava no banco, cria o evento no Google (com Meet se online).
Resposta:
- Sucesso: `{ "agendamento_id": "<id da reserva no banco do agente>", "link": "<link do Meet, se online>" }`. O `agendamento_id` vira o `external_ref` da reunião no CRM e tem de ser estável.
- Horário tomado: `{ "ocupado": true }` (o CRM responde 409 à tela).

### `remarcar_reuniao`
Entrada: `{ "acao": "remarcar_reuniao", "agendamento_id": "...", "inicio": "...", "fim": "..." }`.
Resposta: `{ "ok": true }` (pode incluir `"link"` novo) ou `{ "ocupado": true }`.

### `cancelar_reuniao`
Entrada: `{ "acao": "cancelar_reuniao", "agendamento_id": "..." }`.
Resposta: `{ "ok": true }`.

### `pedir_documentos`
Entrada: `{ "acao": "pedir_documentos", "deal_id": "<uuid do negócio>" }`. O n8n pede os documentos ao cliente pelo WhatsApp.
Resposta: `{ "ok": true }`. Só então o CRM marca o negócio como "aguardando documentos".

## 2. n8n -> CRM (portas, API pública)

Autenticação: a chave da API pública da organização (mesma das demais rotas `/api/public/v1`), enviada como as outras rotas públicas.

### `POST /api/public/v1/reunioes` (porta de agendamento)
Corpo:
- `phone` **ou** `deal_id` (exceto ao cancelar ou só mudar situação)
- `name` (opcional)
- `starts_at` (obrigatório, exceto cancelar/situação); `ends_at` ou `duration_minutes` (padrão 60). Texto sem fuso vale como horário de São Paulo.
- `external_ref` (**obrigatório**): o mesmo `agendamento_id`. Repetir a chamada atualiza a mesma reunião, não duplica. Remarcar = mesmo `external_ref` com outra data.
- `format`: `online` | `presencial`; `meeting_url` (online); `address` (presencial)
- `description`: resumo da conversa
- `origem`: `ia` (padrão) | `equipe`
- `status`: `realizada` | `nao_compareceu` (só troca a situação)
- `cancelada: true` (com `external_ref`): marca como cancelada, não apaga nem move o negócio

Resposta: `{ ok, reuniao_id, deal_id, contact_id, reaproveitada, avisos[] }` (201 se criou, 200 se reaproveitou; cancelamento devolve `{ ok, cancelada, reuniao_id }`). Erros: 422 dados inválidos, 404 reunião não encontrada (ao mudar situação), 500 falha.

Se o CRM já mostrou a reunião com a resposta do `agendar_reuniao`, a chamada desta porta com o mesmo `external_ref` só atualiza.

### `POST /api/public/v1/documentos` (porta de documentos)
Corpo:
- `phone` **ou** `deal_id` (obrigatório um)
- `files`: de 1 a 10 itens `{ url, file_name, mime_type, external_ref? }` (o n8n baixa do WhatsApp e manda o link; `external_ref` evita anexar o mesmo arquivo duas vezes)
- `note` (opcional): o que o cliente disse

Comportamento: guarda os arquivos, move o negócio para a etapa de papel `analise_documentos`, cria a tarefa de análise para a Alice e tira a marca "aguardando documentos".
Resposta: `{ ok, deal_id, salvos, ignorados: [{ file_name, motivo }], tarefa_id, avisos[] }`. Erros: 422 dados inválidos, 404 `DEAL_NOT_FOUND`, 500 falha.

## 3. Rotas internas do CRM (a tela chama; não são para o n8n)

Exigem usuário logado e filtram pela organização do perfil. Falha do n8n responde 502 `N8N_INDISPONIVEL` sem gravar.
- `GET /api/agenda/horarios-livres?dias=14`
- `POST /api/agenda/reunioes` `{ deal_id, inicio, fim, formato }` (409 `HORARIO_OCUPADO`)
- `PATCH /api/agenda/reunioes/[id]` `{ acao: "remarcar", inicio, fim } | { acao: "cancelar" } | { acao: "status", status }`
- `POST /api/agenda/pedir-documentos` `{ deal_id }`
