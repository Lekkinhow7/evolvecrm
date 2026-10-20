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
Entrada: `{ "acao": "agendar_reuniao", "deal_id": "<uuid do negócio no CRM>", "contact_id": "<uuid do contato>", "phone": "+55...", "name": "...", "inicio": "...", "fim": "...", "formato": "online" | "presencial", "pedido_id": "<uuid>" }`.
- `contact_id`, `phone` e `name` são do contato do negócio (vêm `null` se o negócio não tem contato).
- `pedido_id`: UUID gerado pela tela, um por abertura do modal. Se o CRM repetir o pedido (a tela tentou de novo depois de uma falha ou de um tempo esgotado), vem o **mesmo** `pedido_id`: o n8n deve devolver o agendamento já feito para esse `pedido_id` em vez de reservar outro horário. Uma resposta `ocupado` não prende o `pedido_id` (a pessoa escolhe outro horário com o mesmo `pedido_id`).
O n8n confere de novo se o horário está livre, grava no banco, cria o evento no Google (com Meet se online).
Resposta:
- Sucesso: `{ "agendamento_id": "<id da reserva no banco do agente>", "link": "<link do Meet, se online>" }`. O `agendamento_id` vira o `external_ref` da reunião no CRM e tem de ser estável.
- Horário tomado: `{ "ocupado": true }` (o CRM responde 409 à tela).

Depois de gravar, o n8n **também** manda a reunião para a porta de agendamento (`POST /api/public/v1/reunioes`) com `external_ref` = `agendamento_id` e o `deal_id` recebido. É idempotente. Se o CRM não conseguir registrar a reunião logo depois da resposta do n8n, a tela avisa "Reunião marcada. Ela aparece na agenda em instantes." e **não** pede para tentar de novo: é essa chamada da porta que faz a reunião aparecer.

### `remarcar_reuniao`
Entrada: `{ "acao": "remarcar_reuniao", "agendamento_id": "...", "inicio": "...", "fim": "...", "formato": "online" | "presencial", "pedido_id": "<uuid>" }`.
- `formato`: o da reunião (a tela só oferece horários desse formato).
- `pedido_id`: um por remarcação, com a mesma regra do `agendar_reuniao` (repetição não remarca duas vezes).
Resposta: `{ "ok": true }` (pode incluir `"link"` novo) ou `{ "ocupado": true }`.

### `cancelar_reuniao`
Entrada: `{ "acao": "cancelar_reuniao", "agendamento_id": "..." }`.
Resposta: `{ "ok": true }`.

### `pedir_documentos`
Entrada: `{ "acao": "pedir_documentos", "deal_id": "<uuid do negócio>", "contact_id": "<uuid>", "phone": "+55...", "name": "..." }` (contato do negócio; `null` se não houver). O n8n pede os documentos ao cliente pelo WhatsApp.
Resposta: `{ "ok": true }`. Só então o CRM marca o negócio como "aguardando documentos".

## 2. n8n -> CRM (portas, API pública)

Autenticação: a chave da API pública da organização (mesma das demais rotas `/api/public/v1`), enviada como as outras rotas públicas.

### `POST /api/public/v1/reunioes` (porta de agendamento)
Corpo:
- `phone` **ou** `deal_id` (exceto ao cancelar ou só mudar situação). Para reuniões marcadas pelo CRM (`agendar_reuniao`), o n8n **deve devolver o `deal_id`** que recebeu: sem ele a porta procura pelo telefone e pode achar outro negócio. Uma reunião que já existe num negócio continua nele quando o pedido não traz `deal_id`.
- `name` (opcional)
- `starts_at` (obrigatório, exceto cancelar/situação); `ends_at` (depois de `starts_at`, senão 422) ou `duration_minutes` (padrão 60). Texto sem fuso vale como horário de São Paulo.
- `external_ref` (**obrigatório**): o mesmo `agendamento_id`. Repetir a chamada atualiza a mesma reunião, não duplica. Remarcar = mesmo `external_ref` com outra data; data nova numa reunião não cancelada volta a situação para "agendada".
- `format`: `online` | `presencial`; `meeting_url` (online); `address` (presencial)
- `description`: resumo da conversa
- `origem`: `ia` (padrão) | `equipe`
- `status`: `realizada` | `nao_compareceu` (só troca a situação e marca a atividade como concluída)
- `cancelada: true` (com `external_ref`): marca como cancelada (e concluída), não apaga nem move o negócio

Resposta: `{ ok, reuniao_id, deal_id, contact_id, reaproveitada, avisos[] }` (201 se criou, 200 se reaproveitou; cancelamento devolve `{ ok, cancelada, reuniao_id }`). Erros: 422 dados inválidos, 404 reunião não encontrada (ao mudar situação), 500 falha.

Se o CRM já mostrou a reunião com a resposta do `agendar_reuniao`, a chamada desta porta com o mesmo `external_ref` só atualiza.

### `POST /api/public/v1/documentos` (porta de documentos)
Corpo:
- `phone` **ou** `deal_id` (obrigatório um)
- `files`: de 1 a 10 itens `{ url, file_name, mime_type, external_ref? }` (o n8n baixa do WhatsApp e manda o link; `external_ref` evita anexar o mesmo arquivo duas vezes)
- `external_ref` por arquivo é opcional no formato, mas **obrigatório na prática**: o CRM tem 45 segundos para baixar todos os arquivos do pedido. O que não couber volta em `ignorados` com `motivo: "tempo_esgotado"` (os já salvos seguem o fluxo normal) e o n8n deve reenviar o mesmo pedido. Sem `external_ref`, o reenvio anexa de novo os arquivos que já tinham sido salvos.
- `note` (opcional): o que o cliente disse

Comportamento: guarda os arquivos, move o negócio para a etapa de papel `analise_documentos`, cria a tarefa de análise para a Alice (do dono do negócio; sem dono, do primeiro admin da organização) e tira a marca "aguardando documentos".
Resposta: `{ ok, deal_id, salvos, ignorados: [{ file_name, motivo }], tarefa_id, avisos[] }`. Erros: 422 dados inválidos, 404 `DEAL_NOT_FOUND`, 500 falha.

## 3. Rotas internas do CRM (a tela chama; não são para o n8n)

Exigem usuário logado e filtram pela organização do perfil. Falha do n8n responde 502 `N8N_INDISPONIVEL` sem gravar.
- `GET /api/agenda/horarios-livres?dias=14`
- `POST /api/agenda/reunioes` `{ deal_id, inicio, fim, formato, pedido_id? }` (409 `HORARIO_OCUPADO`; 202 `{ ok: true, pendente: true, code: "MARCADA_SEM_REGISTRO" }` quando o n8n marcou mas o CRM não registrou)
- `PATCH /api/agenda/reunioes/[id]` `{ acao: "remarcar", inicio, fim, formato?, pedido_id? } | { acao: "cancelar" } | { acao: "status", status }` (remarcar também pode responder 202 `MARCADA_SEM_REGISTRO`)
- `POST /api/agenda/pedir-documentos` `{ deal_id }`
