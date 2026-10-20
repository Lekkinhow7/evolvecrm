# Agenda completa da Alice — Plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O CRM da Alice passa a refletir as reuniões e os documentos que vêm do banco do agente (via n8n), deixa a equipe marcar reunião só em horário livre do banco, e o funil fica configurável por "papel da etapa".

**Architecture:** Modelo da SucçãoZero. Duas portas públicas de entrada (`/api/public/v1/reunioes`, `/api/public/v1/documentos`), um canal de saída para o n8n (`lib/agenda/n8n.ts`, copiado de `origin/main:lib/calls/n8n.ts`) e telas que usam os dois. A etapa de destino é achada pelo papel (`board_stages.role`), nunca por nome.

**Tech Stack:** Next.js 16 (App Router), Supabase (service role nas portas), Zod v4, TanStack Query, Vitest, design system `@/design-system`.

**Spec:** `docs/superpowers/specs/2026-10-19-alice-agenda-design.md`

## Global Constraints

- Branch `alice-design-system`; publicar só com aprovação do Alex (push em `alice-teixeira` + Implantar no EasyPanel).
- Toda query filtra por `organization_id` (service role ignora RLS). `.maybeSingle()` para busca que pode não achar.
- Migrations idempotentes (`IF NOT EXISTS`), nome `YYYYMMDDHHMMSS_*.sql`, depois de `20260417160000`.
- Tabela `board_stages`, coluna `"order"`.
- Portas: autenticação `authPublicApi(request)` de `lib/public-api/auth.ts`; erro de validação `422 { error: 'Dados inválidos', code: 'VALIDATION_ERROR', details }`.
- Datas exibidas em `America/Sao_Paulo`. Duração padrão da reunião: 60 min.
- Telas novas ou tocadas: só `@/design-system` e tokens (sem `slate-*`/`primary-*` novos), textos em português, sem emoji.
- O CRM nunca guarda nem calcula slots; nunca fala com o Google.
- Prazo da tarefa de análise: 2 dias úteis. Arquivos: PDF, JPG, PNG, HEIC, DOC, DOCX, até 25 MB.
- Variáveis novas: `N8N_AGENDA_URL`, `N8N_RETORNO_SECRET` (segredo no cabeçalho `x-retorno-secret`). Funil de negócio novo: `SITE_LEAD_BOARD_KEY` (a Alice usa `alice`).

## Review Focus

1. **Mesma chamada repetida** (o n8n roda a cada minuto): reunião/arquivo com o mesmo `external_ref` atualiza, não duplica. Teste na Task 3 e na Task 5.
2. **Telefone sem o nono dígito** (`557193042122`) tem que achar o contato `+5571993042122`. Teste na Task 3.
3. **Hora sem fuso** (`2026-10-20T14:00:00`) é hora de São Paulo, não UTC. Teste na Task 3.
4. **n8n fora do ar ou sem configuração**: a tela avisa e nada é gravado no CRM. Teste na Task 6.
5. **Negócio ganho/perdido ou já adiantado** recebendo reunião/documento: registra, não move, devolve aviso. Teste na Task 2.

---

### Task 1: Banco e tipos

**Files:**
- Create: `supabase/migrations/20261019120000_agenda_reunioes_documentos.sql`
- Modify: `types/types.ts` (Activity, BoardStage, DealView), `lib/supabase/activities.ts` (transform), `lib/supabase/boards.ts` (stage map nas linhas 85, 149, 166, 198, 299, 555, 818), `lib/query/hooks/useDealsQuery.ts` (select + map)
- Test: `lib/supabase/activities.transform.test.ts`, `lib/supabase/boards.stageRole.test.ts`

**Interfaces:**
- Produces: colunas `activities.ends_at timestamptz, external_ref text, meeting_status text check in ('agendada','realizada','cancelada','nao_compareceu'), meeting_format text check in ('online','presencial'), meeting_url text, address text, source text check in ('ia','equipe')`; índice único `(organization_id, external_ref) where external_ref is not null and deleted_at is null`; `board_stages.role text check in ('reuniao_agendada','analise_documentos')` com índice único parcial `(board_id, role) where role is not null`; `deals.awaiting_documents boolean not null default false`; `deal_files.external_ref text` + `deal_files.organization_id uuid` com índice único parcial `(deal_id, external_ref)`; bucket `deal-files` com `file_size_limit = 26214400`.
- Produces (TS): `Activity` ganha `endsAt?: string; externalRef?: string; meetingStatus?: 'agendada'|'realizada'|'cancelada'|'nao_compareceu'; meetingFormat?: 'online'|'presencial'; meetingUrl?: string; address?: string; source?: 'ia'|'equipe'`. `BoardStage.role?: 'reuniao_agendada'|'analise_documentos'`. `DealView.awaitingDocuments: boolean; documentsCount: number`.

- [ ] **Step 1:** Testes que falham: `transformActivity` mapeia `ends_at, external_ref, meeting_status, meeting_format, meeting_url, address, source` para os campos camelCase acima; o map de stage em `boards.ts` lê/grava `role` (ida e volta: `{ role: 'reuniao_agendada' }` ↔ `role: 'reuniao_agendada'`; `undefined` ↔ `null`).
- [ ] **Step 2:** `npx vitest run lib/supabase/activities.transform.test.ts lib/supabase/boards.stageRole.test.ts` → FAIL.
- [ ] **Step 3:** Escrever a migration e os mapeamentos. Em `useDealsQuery`, acrescentar `deal_files(count)` ao select e mapear `documentsCount` (0 quando ausente) e `awaitingDocuments`.
- [ ] **Step 4:** Rodar os testes → PASS; `npx tsc --noEmit` sem erro.
- [ ] **Step 5:** Commit `feat: colunas de reunião, papel da etapa e documentos`.

### Task 2: Achar etapa pelo papel e só avançar

**Files:**
- Create: `lib/agenda/stageRole.ts`
- Test: `lib/agenda/stageRole.test.ts`

**Interfaces:**
- Produces:
  - `type StageRole = 'reuniao_agendada' | 'analise_documentos'`
  - `decideAdvance(input: { isWon: boolean; isLost: boolean; currentOrder: number | null; targetOrder: number | null }): { move: boolean; warning?: 'negocio_fechado' | 'etapa_sem_papel' | 'ja_adiantado' }`
  - `advanceDealToRole(sb: SupabaseClient, opts: { organizationId: string; dealId: string; role: StageRole }): Promise<{ moved: boolean; warning?: string }>` — lê o negócio (`board_id, stage_id, is_won, is_lost`), as etapas do funil (`id, "order", role`) e move com `moveStageByDealId` de `lib/public-api/dealsMoveStage.ts` quando `decideAdvance` permite.

- [ ] **Step 1:** Testes de `decideAdvance`: ganho → `{ move: false, warning: 'negocio_fechado' }`; perdido idem; `targetOrder: null` → `etapa_sem_papel`; `currentOrder 4, targetOrder 3` → `ja_adiantado`; `currentOrder 4, targetOrder 4` → `ja_adiantado`; `currentOrder 2, targetOrder 4` → `{ move: true }`; `currentOrder: null` → `{ move: true }`.
- [ ] **Step 2:** `npx vitest run lib/agenda/stageRole.test.ts` → FAIL.
- [ ] **Step 3:** Implementar as duas funções.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: etapa achada pelo papel e só avança`.

### Task 3: Porta de reuniões

**Files:**
- Create: `lib/agenda/phone.ts` (copiar `normalizarTelefone` e `paraE164` de `origin/main:lib/visits/agendar.ts`), `lib/agenda/reunioes.ts`, `app/api/public/v1/reunioes/route.ts`
- Test: `lib/agenda/phone.test.ts`, `lib/agenda/reunioes.test.ts`, `test/publicApi.reunioes.test.ts`

**Interfaces:**
- Consumes: `advanceDealToRole` (Task 2), colunas da Task 1.
- Produces:
  - `toSaoPauloIso(raw: string): string` em `lib/agenda/reunioes.ts` (sem fuso → `-03:00`; com fuso → mantém).
  - `registrarReuniao(sb, input: { organizationId: string; phone?: string; dealId?: string; name?: string; startsAt: string; endsAt?: string; durationMinutes?: number; externalRef: string; format?: 'online'|'presencial'; meetingUrl?: string; address?: string; description?: string; origem?: 'ia'|'equipe'; status?: 'realizada'|'nao_compareceu' }): Promise<{ activityId: string; dealId: string | null; contactId: string | null; reused: boolean; warnings: string[] }>`
  - `cancelarReuniao(sb, { organizationId: string; externalRef: string }): Promise<string | null>` (marca `meeting_status = 'cancelada'`, não apaga, não move).
  - Rota `POST /api/public/v1/reunioes` com o corpo do spec ("Porta de agendamento"), `external_ref` obrigatório; resposta `{ ok: true, reuniao_id, deal_id, contact_id, reaproveitada, avisos }`.

- [ ] **Step 1:** Testes: `normalizarTelefone('557193042122') === '5571993042122'`; `toSaoPauloIso('2026-10-20T14:00:00') === '2026-10-20T14:00:00-03:00'`; `toSaoPauloIso('2026-10-20T17:00:00Z')` mantém; `registrarReuniao` com mesmo `externalRef` duas vezes → segunda chamada `reused: true` e um único `upsert` de atividade (Supabase mockado no padrão de `test/publicApi.contacts.test.ts`); sem negócio aberto → cria contato e negócio no funil de `SITE_LEAD_BOARD_KEY`, primeira etapa (`resolveFirstStageId`); `endsAt` ausente → início + 60 min; atividade gravada com `type: 'MEETING'`, `meeting_status: 'agendada'`, `source: 'ia'` por padrão; `status: 'realizada'` com `externalRef` existente só troca `meeting_status` e não move o negócio. Rota: sem `external_ref` → 422; `cancelada: true` sem `external_ref` → 422; chave inválida → 401.
- [ ] **Step 2:** Rodar os três arquivos de teste → FAIL.
- [ ] **Step 3:** Implementar. Busca do negócio: aberto em qualquer funil da organização, o mais recente (`is_won=false, is_lost=false, deleted_at is null`, `order by created_at desc limit 1`). Depois de gravar, `advanceDealToRole(..., 'reuniao_agendada')` e somar o aviso em `warnings`. Título: `Reunião - {nome do contato}`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: porta de reuniões para o n8n`.

### Task 4: Dia útil e regras de arquivo

**Files:**
- Create: `lib/agenda/documentRules.ts`
- Test: `lib/agenda/documentRules.test.ts`

**Interfaces:**
- Produces: `addBusinessDays(from: Date, days: number): Date` (pula sábado e domingo; feriados fora); `ACCEPTED_MIME: string[]` (`application/pdf`, `image/jpeg`, `image/png`, `image/heic`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`); `MAX_FILE_BYTES = 26214400`; `checkFile(f: { mimeType: string; size: number }): { ok: true } | { ok: false; reason: 'tipo_nao_aceito' | 'arquivo_grande' }`.

- [ ] **Step 1:** Testes: sexta + 2 dias úteis = terça; sábado + 2 = terça; `checkFile({ mimeType: 'video/mp4', size: 10 })` → `tipo_nao_aceito`; PDF de 26 MB → `arquivo_grande`; PDF de 1 MB → ok.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: regras de prazo e de arquivo dos documentos`.

### Task 5: Porta de documentos

**Files:**
- Create: `lib/agenda/documentos.ts`, `app/api/public/v1/documentos/route.ts`
- Test: `lib/agenda/documentos.test.ts`, `test/publicApi.documentos.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 4; `normalizarTelefone` (Task 3).
- Produces: `registrarDocumentos(sb, input: { organizationId: string; phone?: string; dealId?: string; note?: string; files: { url: string; fileName: string; mimeType: string; externalRef?: string }[] }, fetchFile?: (url: string) => Promise<{ bytes: ArrayBuffer; size: number }>): Promise<{ dealId: string; saved: number; skipped: { fileName: string; reason: string }[]; taskId: string | null; warnings: string[] }>`. Rota `POST /api/public/v1/documentos` (corpo JSON com links, decisão do builder registrada no spec).

- [ ] **Step 1:** Testes: arquivo com `externalRef` já gravado é pulado (`reason: 'ja_recebido'`) sem novo upload; arquivo de vídeo é pulado com `tipo_nao_aceito` e os outros são gravados; caminho no bucket `deal-files/{organizationId}/{dealId}/{timestamp}-{fileName}`; cria tarefa `type: 'TASK'`, título `Analisar documentos de {nome}`, `date` = `addBusinessDays(hoje, 2)`, dona = dono do negócio; zera `awaiting_documents`; `note` vira uma atividade `NOTE` no negócio ("O cliente disse: …"); chama `advanceDealToRole(..., 'analise_documentos')`; sem nenhum arquivo salvo → não cria tarefa. Rota: sem `phone` e sem `deal_id` → 422; sem negócio aberto para o telefone → 404 `DEAL_NOT_FOUND`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar (download pelo `fetch` padrão com limite de 30 s). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: porta de documentos para o n8n`.

### Task 6: Canal de saída para o n8n e rotas internas da agenda

**Files:**
- Create: `lib/agenda/n8n.ts` (copiar `origin/main:lib/calls/n8n.ts`, trocar ações e variáveis), `app/api/agenda/horarios-livres/route.ts`, `app/api/agenda/reunioes/route.ts`, `app/api/agenda/reunioes/[id]/route.ts`, `app/api/agenda/pedir-documentos/route.ts`, `docs/agenda-n8n-contrato.md`
- Test: `lib/agenda/n8n.test.ts`, `test/agendaRoutes.test.ts`

**Interfaces:**
- Produces:
  - `type AcaoAgenda = 'horarios_livres' | 'agendar_reuniao' | 'remarcar_reuniao' | 'cancelar_reuniao' | 'pedir_documentos'`
  - `chamarAgendaNoN8n<T>(acao: AcaoAgenda, dados: Record<string, unknown>): Promise<T>`; `class AgendaN8nError extends Error`.
  - `GET /api/agenda/horarios-livres?dias=14` → `{ horarios: { inicio: string; fim: string; formato?: 'online'|'presencial' }[] }`
  - `POST /api/agenda/reunioes` `{ deal_id, inicio, fim, formato }` → chama `agendar_reuniao`; com a resposta `{ agendamento_id, link? }` grava pela `registrarReuniao` (Task 3) com `externalRef = agendamento_id`, `origem: 'equipe'`; resposta `{ ok, reuniao_id }`; n8n devolvendo `{ ocupado: true }` → 409 `HORARIO_OCUPADO`.
  - `PATCH /api/agenda/reunioes/[id]` `{ acao: 'remarcar', inicio, fim } | { acao: 'cancelar' } | { acao: 'status', status: 'realizada'|'nao_compareceu' }`. Remarcar/cancelar passam pelo n8n antes de gravar; `status` grava direto no CRM.
  - `POST /api/agenda/pedir-documentos` `{ deal_id }` → chama `pedir_documentos` e marca `awaiting_documents = true`.
  - Todas as rotas internas exigem usuário logado (cliente Supabase do servidor) e filtram por `organization_id` do perfil.

- [ ] **Step 1:** Testes: sem `N8N_AGENDA_URL` → `AgendaN8nError('Ligação da agenda com o n8n não configurada')`; n8n 500 → erro, e `POST /api/agenda/reunioes` responde 502 **sem** chamar `registrarReuniao`; timeout de 15 s aborta; corpo enviado é `{ acao, ...dados }` com cabeçalho `x-retorno-secret`; `pedir-documentos` com n8n fora → 502 e `awaiting_documents` não muda.
- [ ] **Step 2:** FAIL. **Step 3:** implementar; escrever `docs/agenda-n8n-contrato.md` com as 5 ações (entrada e resposta) e as 2 portas (corpo e resposta), para quem montar o n8n. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: agenda conversa com o n8n`.

### Task 7: Agenda — marcar reunião em horário livre e ver a reunião

**Files:**
- Create: `features/activities/components/NovaReuniaoModal.tsx`, `features/activities/components/ReuniaoDetalhe.tsx`, `lib/query/hooks/useAgendaQuery.ts`
- Modify: `features/activities/ActivitiesPage.tsx` (`?novo=reuniao` abre `NovaReuniaoModal` em vez do formulário de atividade), `features/activities/components/ActivitiesCalendar.tsx` (reunião mostra formato, cancelada riscada, clique abre `ReuniaoDetalhe`), `components/navigation/NewMenu.tsx` (item "Nova reunião" já aponta para `/agenda?novo=reuniao`)
- Test: `features/activities/components/NovaReuniaoModal.test.tsx`, `features/activities/components/ReuniaoDetalhe.test.tsx`

**Interfaces:**
- Consumes: rotas da Task 6; `Activity` da Task 1.
- Produces: `useFreeSlots(enabled: boolean)` (GET horários livres, `staleTime` 0), `useScheduleMeeting()`, `useUpdateMeeting()`; `NovaReuniaoModal({ open, onClose, dealId? })`; `ReuniaoDetalhe({ activity, onClose })`.

- [ ] **Step 1:** Testes: o modal lista os horários vindos de `useFreeSlots` agrupados por dia (rótulo "Seg, 20/10"); sem horários → texto "Nenhum horário livre nos próximos 14 dias."; erro do n8n → "Não foi possível falar com a agenda. Tente de novo." e botão desabilitado; 409 → "Esse horário acabou de ser ocupado. Escolha outro." e recarrega a lista; confirmar chama `useScheduleMeeting` com `deal_id`, `inicio`, `fim`, `formato`. Detalhe: mostra link (online) ou endereço (presencial), resumo (`description`), botões "Marcar como realizada", "Não compareceu", "Remarcar", "Cancelar reunião"; reunião cancelada mostra selo "Cancelada" e só o histórico.
- [ ] **Step 2:** FAIL. **Step 3:** implementar com `Modal`, `Button`, `Badge`, `ChipGroup` do design system; escolher o negócio por busca de contato quando não vier `dealId`. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: reunião marcada em horário livre do banco`.

### Task 8: Negócio — documentos e decisão da análise

**Files:**
- Create: `features/boards/components/Modals/DealDocumentsTab.tsx`, `features/boards/components/Modals/AnalysisActions.tsx`
- Modify: `features/boards/components/Modals/DealDetailModal.tsx` (aba "Documentos" ao lado de timeline/products/info; ações quando a etapa atual tem `role === 'analise_documentos'`), `features/boards/components/Kanban/DealCard.tsx` (selos)
- Test: `features/boards/components/Modals/DealDocumentsTab.test.tsx`, `features/boards/components/Modals/AnalysisActions.test.tsx`, `features/boards/components/Kanban/DealCard.test.tsx`

**Interfaces:**
- Consumes: `useDealFiles` (`features/inbox/hooks/useDealFiles.ts`), `DealView.documentsCount/awaitingDocuments` (Task 1), `POST /api/agenda/pedir-documentos` (Task 6), mutação de mover negócio que o Kanban já usa, fluxo de perda que já existe.
- Produces: `DealDocumentsTab({ dealId })`; `AnalysisActions({ deal, board })` com três botões: "Seguir para reunião" (move para a etapa `role === 'reuniao_agendada'`; sem essa etapa, botão desabilitado com dica "Defina a etapa de reunião em Configurar funil"), "Pedir mais documentos", "Não seguir" (abre o fluxo de perda).

- [ ] **Step 1:** Testes: aba lista arquivos com nome, tamanho e botões ver/baixar; vazia → "Nenhum documento recebido ainda."; `DealCard` com `documentsCount: 3` mostra selo "3 documentos" e com `awaitingDocuments` mostra "Aguardando documentos"; `AnalysisActions` só aparece em etapa de papel `analise_documentos`; "Pedir mais documentos" com sucesso mostra o selo e com erro mostra "Não foi possível pedir agora. Tente de novo."; no topo da janela do negócio, o valor aparece como "Honorários: R$ 4.500" e, sem valor, como o botão "Definir honorários" que abre a edição do valor (é o número que alimenta Visão geral e Relatórios).
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: documentos e decisão da análise no negócio`.

### Task 9: Funil fácil de mudar

**Files:**
- Modify: `features/boards/components/Modals/CreateBoardModal.tsx` (título "Configurar funil"/"Novo funil", campo "Papel da etapa" por etapa, textos em português, design system), `features/boards/components/Kanban/KanbanBoard.tsx` (coluna final "+ Nova etapa"), `features/boards/components/BoardSelector.tsx` ("Novo funil" sempre visível no fim da lista), `features/boards/components/PipelineView.tsx` (abrir o modal na criação de etapa)
- Test: `features/boards/components/Modals/CreateBoardModal.role.test.tsx`, `features/boards/components/Kanban/KanbanBoard.newStage.test.tsx`

**Interfaces:**
- Consumes: `BoardStage.role` (Task 1).
- Produces: `KanbanBoard` ganha prop `onAddStage?: () => void` (sem ela, a coluna não aparece); o modal aceita `focusNewStage?: boolean` (abre já com uma etapa nova no fim e o foco no nome).

- [ ] **Step 1:** Testes: o seletor "Papel da etapa" tem "Nenhum", "Reunião agendada", "Análise de documentos"; escolher um papel que outra etapa já tem tira o papel da outra (um papel por funil); salvar grava `role`; `KanbanBoard` com `onAddStage` mostra a coluna "+ Nova etapa" e chama a função no clique.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: funil com papel da etapa e nova etapa no quadro`.

### Task 10: Verificação final e ajuste do funil da Alice

- [ ] **Step 1:** `npm run precheck` → lint, tipos, testes e build verdes. Desfazer a mudança de final de linha em `lib/query/__tests__/__snapshots__/cache-integrity.test.ts.snap` com `git checkout`.
- [ ] **Step 2:** No CRM local (build de produção, `npx next start`): Configurar funil do "Atendimento" → renomear "Consulta agendada" para "Reunião agendada", arrastar "Análise de documentos" para antes dela, marcar os papéis. **Só com aprovação do Alex, porque grava no banco da Alice.**
- [ ] **Step 3:** Chamar as portas com `curl` usando uma chave de API de teste e um telefone de teste: reunião nova, a mesma de novo (sem duplicar), cancelamento, documentos com um PDF. Conferir na Agenda e no Kanban; apagar os registros de teste depois.
- [ ] **Step 4:** Prints nos temas claro e escuro para o Alex aprovar antes de publicar.
