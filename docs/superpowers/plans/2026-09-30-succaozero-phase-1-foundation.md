# Sucção Zero Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma base comercial confiável para a Sucção Zero, com modelo canônico `succaozero_*`, entrada idempotente de leads, rodízio escalável, próxima ação obrigatória, histórico auditável e sincronização recuperável, sem alterar o CRM da Alice.

**Architecture:** O Supabase do CRM da Sucção Zero será a fonte oficial dos dados comerciais. Tabelas `succaozero_*` guardarão o modelo canônico; as tabelas genéricas atuais (`contacts`, `deals`, `activities`) continuarão como projeção compatível para as telas existentes, atualizadas na mesma transação por funções SQL. Todo caminho de escrita passará por serviços/RPCs idempotentes. A ativação será exclusiva do deploy Sucção Zero por projeto Supabase e feature flag; Alice permanecerá com a flag desligada e sem execução das migrations específicas.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Supabase/PostgreSQL com RLS, TanStack Query 5, Zod 4, Vitest 4 e scripts Node.js com `pg`.

**Spec:** `C:/Users/Alex/Documents/ChatGPT/EvolveOS - Codex/docs/superpowers/specs/2026-09-30-succaozero-prd.md`

## Global Constraints

- Aproveitar o CRM existente; não reconstruir o produto.
- Dados de negócio Sucção Zero usam tabelas `succaozero_*`; tabelas técnicas de autenticação e configuração compartilhada não serão renomeadas.
- O banco, o deploy, os contatos e as sessões da Alice não podem ser modificados por esta entrega.
- A distribuição começa com dois vendedores, mas usa lista configurável sem limite fixo.
- Alterações na lista de vendedores afetam somente novas oportunidades; responsáveis existentes são preservados.
- Repetir um evento não cria contato, oportunidade, atividade ou avanço de rodízio adicional.
- Toda oportunidade aberta tem próxima ação com executor e prazo ou exceção explícita.
- Escritas administrativas validam `organization_id`, board, etapa, contato e responsável antes de usar cliente privilegiado.
- IA e n8n usam as mesmas APIs e regras do CRM; não escrevem diretamente nas tabelas genéricas.
- Horários são armazenados como `TIMESTAMPTZ` e apresentados em `America/Sao_Paulo`.
- Nenhuma migração, teste ou script usa clientes reais para gerar mensagens, negócios ou contatos artificiais.
- Dashboard e nova interface da agenda técnica não fazem parte deste plano; a correção das FKs inseguras da agenda atual é pré-requisito desta fase.

## Architectural Decision Gate

Este plano adota o Supabase do CRM Sucção Zero como fonte oficial comercial. Antes da Task 2, o proprietário deve aprovar essa decisão e a equipe deve registrar os project refs verificados, sem guardar URLs ou chaves no Git. Se a decisão for rejeitada, interromper a execução e revisar este plano; não iniciar uma arquitetura de dupla fonte oficial.

Precedência por campo nesta fase:

| Campo | Autoridade | Comportamento |
|---|---|---|
| Identidade comercial | Serviço de entrada canônico | Site, agente e n8n enviam eventos; o serviço resolve contato/oportunidade |
| Etapa e responsável | Serviço comercial do CRM | IA pode solicitar mudança; alteração aceita gera evento auditável |
| Próxima ação | CRM/vendedor, ou automação autorizada | Sempre registra executor, prazo ou exceção |
| Agenda, laudo, instalação | Banco atual do agente até a Fase 2 | Apenas referências são preservadas; não migrar nem reinterpretar nesta fase |
| Proposta e recebimento | Permanecem como dados de origem até a Fase 3 | Não inferir pagamento a partir de aprovação |

## File Map

Arquivos específicos Sucção Zero ficam isolados; arquivos genéricos recebem apenas adaptadores protegidos pela feature flag.

| Responsabilidade | Arquivos |
|---|---|
| Decisão, configuração e trava de ambiente | `docs/architecture/succaozero-source-of-truth.md`, `.env.example`, `lib/succaozero/config.ts`, `test/succaozeroConfig.test.ts` |
| Integridade da agenda legada | `supabase/succaozero/agent-migrations/20260930080000_fix_schedule_foreign_keys.sql`, respectivo rollback e `scripts/succaozero/verify-agent-foreign-keys.mjs` |
| Schema, RLS e RPCs canônicas | `supabase/succaozero/migrations/20260930090000_phase1_foundation.sql`, `supabase/succaozero/migrations/20260930100000_phase1_routing_and_intake.sql`, `scripts/succaozero/apply-migration.mjs`, `scripts/succaozero/verify-schema.mjs` |
| Tipos e acesso ao domínio | `lib/succaozero/types.ts`, `lib/succaozero/repository.ts`, `lib/succaozero/intake.ts`, testes correspondentes |
| Formulário do site | `app/api/site-lead/route.ts`, `test/siteLead.test.ts` |
| API das integrações | `app/api/public/v1/succaozero/events/route.ts`, `test/succaozeroEventsApi.test.ts`, `docs/integrations/succaozero-events.md` |
| Movimentação e auditoria do funil | `lib/public-api/dealsMoveStage.ts`, `app/api/public/v1/deals/route.ts`, `test/publicApi.deals.test.ts`, `test/publicApiStageHistory.test.ts` |
| Configuração do rodízio | `app/api/admin/succaozero/sales-routing/route.ts`, `features/settings/components/SalesRoutingSection.tsx`, `features/settings/UsersPage.tsx`, testes da rota e do componente |
| Próximas ações | `app/api/succaozero/next-actions/route.ts`, `lib/query/hooks/useSuccaozeroNextActionsQuery.ts`, `features/inbox/components/SuccaozeroNextActionsPanel.tsx`, `features/inbox/InboxPage.tsx`, testes correspondentes |
| Migração e conciliação | `scripts/succaozero/mapping.ts`, `scripts/succaozero/migrate-agent-data.mjs`, `scripts/succaozero/reconcile-data.mjs`, `test/succaozeroMigration.test.ts` |
| Liberação e regressão | `scripts/succaozero/release-gate.mjs`, `test/succaozeroIsolation.test.ts`, `docs/runbooks/succaozero-phase1-rollout.md` |

## Review Focus

1. Eventos iguais chegando ao mesmo tempo: uma única oportunidade, um único avanço do cursor e a mesma resposta idempotente — coberto na Task 3.
2. IDs de board, etapa, contato ou vendedor de outra organização: rejeição antes de qualquer escrita privilegiada — coberto nas Tasks 3, 5 e 6.
3. Pausa, exclusão ou reordenação enquanto leads chegam: cursor bloqueado atomicamente, carteira existente preservada — coberto nas Tasks 3 e 7.
4. Interrupção do n8n por mais de 10 minutos ou evento `@lid`: evento permanece reprocessável/pendente e não some — coberto nas Tasks 6 e 10.
5. Deploy compartilhado com Alice: feature flag desligada, project ref divergente e fingerprint do schema impedem aplicação no banco errado — coberto nas Tasks 1 e 11.

---

### Task 1: Fixar fonte oficial e trava de ambiente

**Files:**
- Create: `docs/architecture/succaozero-source-of-truth.md`
- Create: `lib/succaozero/config.ts`
- Create: `test/succaozeroConfig.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getSuccaozeroConfig(): SuccaozeroConfig` e `assertSuccaozeroProject(expectedRef: string, actualUrl: string): void`.
- Consumes em runtime: `SUCCAOZERO_CANONICAL_ENABLED`, `SUCCAOZERO_ORGANIZATION_ID`, `SUCCAOZERO_BOARD_KEY`, `SUCCAOZERO_SUPABASE_PROJECT_REF` e `SITE_LEAD_ALLOWED_ORIGINS`. Scripts de migração consomem separadamente os refs e URLs de CRM, agente e restauração documentados em `.env.example`.

- [ ] **Step 1: Escrever a decisão arquitetural**

Registrar no documento:

```markdown
# Fonte oficial comercial — Sucção Zero

- Fonte oficial: Supabase conectado ao deploy do CRM Sucção Zero.
- Modelo canônico: tabelas public.succaozero_*.
- Projeção temporária de UI: contacts, deals e activities no mesmo banco.
- Banco do agente: origem de migração e de eventos durante a transição; não é segunda fonte oficial.
- Alice: projeto e deploy independentes; não recebe migrations succaozero nem ativa a feature flag.
- Corte: somente após dry-run, conciliação, backup restaurável e aceite do piloto.
```

- [ ] **Step 2: Escrever testes que falham para a configuração**

```ts
it('rejeita feature ativa sem organization id e project ref', () => {
  expect(() => getSuccaozeroConfig({ SUCCAOZERO_CANONICAL_ENABLED: 'true' })).toThrow(
    'Configuração canônica Sucção Zero incompleta',
  )
})

it('rejeita URL de projeto diferente do ref autorizado', () => {
  expect(() => assertSuccaozeroProject('crm-sz-ref', 'https://alice-ref.supabase.co')).toThrow(
    'Projeto Supabase não autorizado para Sucção Zero',
  )
})
```

- [ ] **Step 3: Executar o teste e confirmar falha**

Run: `npx vitest run test/succaozeroConfig.test.ts`

Expected: FAIL porque `@/lib/succaozero/config` ainda não existe.

- [ ] **Step 4: Implementar configuração estrita**

```ts
export interface SuccaozeroConfig {
  enabled: boolean
  organizationId: string
  boardKey: string
  projectRef: string
}

export function getSuccaozeroConfig(env = process.env): SuccaozeroConfig {
  const enabled = env.SUCCAOZERO_CANONICAL_ENABLED === 'true'
  const organizationId = env.SUCCAOZERO_ORGANIZATION_ID?.trim() ?? ''
  const boardKey = env.SUCCAOZERO_BOARD_KEY?.trim() || 'succaozero'
  const projectRef = env.SUCCAOZERO_SUPABASE_PROJECT_REF?.trim() ?? ''
  if (enabled && (!organizationId || !projectRef)) {
    throw new Error('Configuração canônica Sucção Zero incompleta')
  }
  return { enabled, organizationId, boardKey, projectRef }
}

export function assertSuccaozeroProject(expectedRef: string, actualUrl: string): void {
  const actualRef = new URL(actualUrl).hostname.split('.')[0]
  if (!expectedRef || actualRef !== expectedRef) {
    throw new Error('Projeto Supabase não autorizado para Sucção Zero')
  }
}
```

- [ ] **Step 5: Documentar as variáveis sem valores secretos**

Adicionar a `.env.example`:

```dotenv
SUCCAOZERO_CANONICAL_ENABLED=false
SUCCAOZERO_ORGANIZATION_ID=
SUCCAOZERO_BOARD_KEY=succaozero
SUCCAOZERO_SUPABASE_PROJECT_REF=
SUCCAOZERO_AGENT_SUPABASE_PROJECT_REF=
SUCCAOZERO_CRM_DATABASE_URL=
SUCCAOZERO_AGENT_DATABASE_URL=
SUCCAOZERO_RESTORE_DATABASE_URL=
SITE_LEAD_ALLOWED_ORIGINS=https://succaozero.com.br,https://www.succaozero.com.br
```

- [ ] **Step 6: Executar teste, lint e typecheck**

Run: `npx vitest run test/succaozeroConfig.test.ts && npm run lint && npm run typecheck`

Expected: todos passam sem warnings.

- [ ] **Step 7: Commit**

```bash
git add docs/architecture/succaozero-source-of-truth.md .env.example lib/succaozero/config.ts test/succaozeroConfig.test.ts
git commit -m "docs: fix succao zero commercial source of truth"
```

### Task 2: Criar modelo canônico, integridade e RLS

**Files:**
- Create: `supabase/succaozero/agent-migrations/20260930080000_fix_schedule_foreign_keys.sql`
- Create: `supabase/succaozero/agent-migrations/20260930080000_fix_schedule_foreign_keys.rollback.sql`
- Create: `supabase/succaozero/migrations/20260930090000_phase1_foundation.sql`
- Create: `scripts/succaozero/apply-migration.mjs`
- Create: `scripts/succaozero/verify-agent-foreign-keys.mjs`
- Create: `scripts/succaozero/verify-schema.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: FKs seguras no banco atual do agente e tabelas `succaozero_contacts`, `succaozero_customers`, `succaozero_customer_contacts`, `succaozero_locations`, `succaozero_pools`, `succaozero_opportunities`, `succaozero_opportunity_pools`, `succaozero_next_actions`, `succaozero_commercial_events`, `succaozero_inbound_events`, `succaozero_seller_roster`, `succaozero_routing_state` e `succaozero_commercial_settings` no CRM.
- Consumes: `succaozero_profissionais`, `succaozero_disponibilidade_semanal` e `succaozero_slots_horarios` do agente; `organizations`, `profiles`, `boards`, `board_stages`, `contacts`, `deals` e `activities` do CRM Sucção Zero.

- [ ] **Step 1: Escrever o verificador que falha sem o schema**

O script deve conectar somente após `assertSuccaozeroProject`, consultar `pg_catalog` e exigir as treze tabelas, RLS ativo, nenhuma FK para `evolve_*` e políticas sem acesso `anon`.

```js
const required = [
  'succaozero_contacts', 'succaozero_customers', 'succaozero_customer_contacts',
  'succaozero_locations', 'succaozero_pools', 'succaozero_opportunities',
  'succaozero_opportunity_pools', 'succaozero_next_actions',
  'succaozero_commercial_events', 'succaozero_inbound_events',
  'succaozero_seller_roster', 'succaozero_routing_state',
  'succaozero_commercial_settings',
]
```

- [ ] **Step 2: Executar o verificador em homologação e confirmar falha**

Run: `node scripts/succaozero/verify-schema.mjs --environment=staging`

Expected: FAIL listando as tabelas ausentes, sem executar DDL.

- [ ] **Step 3: Corrigir as duas FKs cruzadas no banco do agente**

Antes de alterar constraints, o SQL deve abortar caso um filho não tenha pai na tabela Sucção Zero. Depois, localizar e remover somente as constraints que apontam para `evolve_profissionais` e `evolve_disponibilidade_semanal`, preservando todas as demais.

```sql
do $$
begin
  if exists (
    select 1
    from public.succaozero_disponibilidade_semanal d
    left join public.succaozero_profissionais p on p.id = d.profissional_id
    where p.id is null
  ) then
    raise exception 'Disponibilidade Sucção Zero possui profissional sem pai Sucção Zero';
  end if;

  if exists (
    select 1
    from public.succaozero_slots_horarios s
    left join public.succaozero_disponibilidade_semanal d on d.id = s.disponibilidade_id
    where d.id is null
  ) then
    raise exception 'Slot Sucção Zero possui disponibilidade sem pai Sucção Zero';
  end if;
end $$;

alter table public.succaozero_disponibilidade_semanal
  add constraint succaozero_disponibilidade_profissional_fk
  foreign key (profissional_id)
  references public.succaozero_profissionais(id)
  on delete cascade;

alter table public.succaozero_slots_horarios
  add constraint succaozero_slots_disponibilidade_fk
  foreign key (disponibilidade_id)
  references public.succaozero_disponibilidade_semanal(id)
  on delete cascade;
```

O rollback deve validar a existência dos pais Evolve antes de restaurar as FKs antigas; se algum pai não existir, aborta em vez de criar vínculos inválidos.

- [ ] **Step 4: Verificar a correção das FKs sem modificar registros**

Run: `node scripts/succaozero/verify-agent-foreign-keys.mjs --environment=staging`

Expected: `cross_schema_foreign_keys=0`, `orphan_disponibilidades=0`, `orphan_slots=0` e contagens idênticas às capturadas antes da migration.

- [ ] **Step 5: Criar as entidades e restrições principais**

A migration específica deve começar com uma trava por setting de sessão e criar, no mínimo, estas estruturas:

```sql
create table public.succaozero_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  crm_contact_id uuid references public.contacts(id) on delete set null,
  source_identifier text,
  name text not null,
  phone_e164 text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, crm_contact_id),
  unique (organization_id, source_identifier)
);

create unique index succaozero_contacts_phone_unique
  on public.succaozero_contacts (organization_id, phone_e164)
  where phone_e164 is not null;

create table public.succaozero_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('person','company','condominium')),
  display_name text not null,
  legal_name text,
  tax_id text,
  billing_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.succaozero_customer_contacts (
  customer_id uuid not null references public.succaozero_customers(id) on delete cascade,
  contact_id uuid not null references public.succaozero_contacts(id) on delete cascade,
  role text,
  is_primary boolean not null default false,
  primary key (customer_id, contact_id)
);

create table public.succaozero_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.succaozero_customers(id) on delete cascade,
  label text not null,
  address jsonb not null,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.succaozero_pools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.succaozero_locations(id) on delete cascade,
  label text not null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.succaozero_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  crm_deal_id uuid references public.deals(id) on delete set null,
  primary_contact_id uuid not null references public.succaozero_contacts(id),
  customer_id uuid references public.succaozero_customers(id),
  board_id uuid not null references public.boards(id),
  stage_id uuid not null references public.board_stages(id),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open','won','lost')),
  title text not null,
  value numeric(14,2) not null default 0,
  source text not null,
  source_event_id text not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, crm_deal_id),
  unique (organization_id, source, source_event_id)
);

create unique index succaozero_one_open_opportunity
  on public.succaozero_opportunities (organization_id, board_id, primary_contact_id)
  where status = 'open';

create table public.succaozero_opportunity_pools (
  opportunity_id uuid not null references public.succaozero_opportunities(id) on delete cascade,
  pool_id uuid not null references public.succaozero_pools(id) on delete restrict,
  primary key (opportunity_id, pool_id)
);

create table public.succaozero_next_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null references public.succaozero_opportunities(id) on delete cascade,
  executor_profile_id uuid references public.profiles(id) on delete restrict,
  kind text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','completed','cancelled','exception')),
  exception_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status = 'open' and executor_profile_id is not null and due_at is not null and exception_reason is null)
    or (status = 'exception' and exception_reason is not null)
    or status in ('completed','cancelled')
  )
);

create unique index succaozero_one_open_next_action
  on public.succaozero_next_actions (opportunity_id)
  where status = 'open';

create table public.succaozero_inbound_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null,
  external_event_id text not null,
  payload_hash text not null,
  status text not null check (status in ('received','processed','pending_identity','queued_without_owner','failed')),
  contact_id uuid references public.succaozero_contacts(id) on delete set null,
  opportunity_id uuid references public.succaozero_opportunities(id) on delete set null,
  attempt_count integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (organization_id, source, external_event_id)
);

create table public.succaozero_commercial_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  first_contact_sla_minutes integer check (first_contact_sla_minutes > 0),
  timezone text not null default 'America/Sao_Paulo',
  updated_at timestamptz not null default now()
);
```

Todos os vínculos de cliente, contato, local, piscina e oportunidade usam chaves `succaozero_*`, sem referência a `evolve_*`. Campos técnicos variáveis de piscina ficam em `attributes` até a Fase 2.

- [ ] **Step 6: Criar histórico, entrada e configuração do rodízio**

```sql
create table public.succaozero_commercial_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.succaozero_opportunities(id) on delete set null,
  event_key text not null,
  event_type text not null,
  actor_type text not null check (actor_type in ('user','ai','integration','system')),
  actor_id text,
  previous_value jsonb,
  new_value jsonb,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (organization_id, event_key)
);

create table public.succaozero_seller_roster (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  position integer not null check (position >= 0),
  eligible boolean not null default true,
  paused_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (organization_id, profile_id),
  unique (organization_id, position)
);

create table public.succaozero_routing_state (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  next_position integer not null default 0,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 7: Aplicar RLS consistente em todas as tabelas**

Para cada tabela, habilitar e forçar RLS. Membros da organização podem ler; somente admin e funções servidoras autorizadas alteram roster/configuração; vendedores alteram oportunidades e próximas ações apenas conforme a matriz aprovada. Nenhuma política usa `USING (true)`.

```sql
alter table public.succaozero_opportunities enable row level security;
alter table public.succaozero_opportunities force row level security;
create policy succaozero_opportunities_select on public.succaozero_opportunities
for select to authenticated
using (organization_id = public.get_user_org_id());
revoke all on public.succaozero_opportunities from anon;
```

- [ ] **Step 8: Implementar o aplicador com trava de projeto**

`apply-migration.mjs` deve exigir `--environment=staging|production`; com `--database=crm`, compara `SUCCAOZERO_CRM_DATABASE_URL` a `SUCCAOZERO_SUPABASE_PROJECT_REF`; com `--database=agent`, compara `SUCCAOZERO_AGENT_DATABASE_URL` a `SUCCAOZERO_AGENT_SUPABASE_PROJECT_REF`. Também calcula SHA-256 do SQL, recusa arquivo fora de `supabase/succaozero/` e cria/usa o ledger técnico `succaozero_schema_migrations` para registrar versão/hash. Em produção, exige `--confirm-project=<ref>`; qualquer ref diferente do correspondente ao tipo de banco é rejeitado.

- [ ] **Step 9: Adicionar comandos de verificação**

Adicionar ao `package.json`:

```json
"verify:succaozero-schema": "node scripts/succaozero/verify-schema.mjs --environment=staging"
```

- [ ] **Step 10: Aplicar somente nas homologações corretas e verificar**

Primeiro, no banco do agente Sucção Zero:

Run: `node scripts/succaozero/apply-migration.mjs supabase/succaozero/agent-migrations/20260930080000_fix_schedule_foreign_keys.sql --environment=staging --database=agent`

Expected: somente duas FKs são substituídas e nenhuma linha é alterada.

Depois, no CRM Sucção Zero:

Run: `node scripts/succaozero/apply-migration.mjs supabase/succaozero/migrations/20260930090000_phase1_foundation.sql --environment=staging`

Expected: o script imprime o project ref autorizado, solicita a confirmação textual desse ref, aplica uma vez e rejeita qualquer URL divergente.

Run: `npm run verify:succaozero-schema`

Expected: PASS, `foreign_keys_to_evolve=0`, `anon_business_grants=0`, `rls_missing=0`.

- [ ] **Step 11: Commit**

```bash
git add supabase/succaozero/agent-migrations supabase/succaozero/migrations/20260930090000_phase1_foundation.sql scripts/succaozero/apply-migration.mjs scripts/succaozero/verify-agent-foreign-keys.mjs scripts/succaozero/verify-schema.mjs package.json
git commit -m "feat: add succao zero canonical commercial schema"
```

### Task 3: Implementar rodízio e entrada atômica no banco

**Files:**
- Create: `supabase/succaozero/migrations/20260930100000_phase1_routing_and_intake.sql`
- Create: `supabase/succaozero/tests/phase1_routing.sql`
- Create: `scripts/succaozero/test-routing-concurrency.mjs`

**Interfaces:**
- Produces: RPC `succaozero_ingest_lead(jsonb) -> jsonb`, RPC `succaozero_set_seller_roster(jsonb) -> jsonb` e RPC `succaozero_transfer_opportunity(uuid, uuid, text) -> jsonb`.
- Consumes: schema da Task 2, board/etapa válidos e lista de vendedores da organização.

- [ ] **Step 1: Escrever teste SQL de rodízio antes da função**

`supabase/succaozero/tests/phase1_routing.sql` abre uma transação, cria organização/board/etapa/perfis sintéticos e verifica:

```sql
select public.succaozero_set_seller_roster(
  jsonb_build_object('organization_id', :'org_id', 'sellers', jsonb_build_array(
    jsonb_build_object('profile_id', :'seller_a', 'position', 0, 'eligible', true),
    jsonb_build_object('profile_id', :'seller_b', 'position', 1, 'eligible', true)
  ))
);
-- Quatro external_event_id distintos devem produzir A/B/A/B.
-- Repetir o primeiro external_event_id deve devolver o mesmo opportunity_id.
rollback;
```

- [ ] **Step 2: Implementar seleção com bloqueio de linha**

A função interna deve executar `SELECT ... FOR UPDATE` em `succaozero_routing_state`, escolher a primeira posição ativa a partir de `next_position`, avançar o cursor somente após criar uma oportunidade nova e ignorar `eligible=false` ou `paused_until > now()`.

```sql
select r.profile_id, r.position
into v_owner_id, v_position
from public.succaozero_seller_roster r
where r.organization_id = v_org_id
  and r.eligible
  and (r.paused_until is null or r.paused_until <= now())
order by
  case when r.position >= v_next_position then 0 else 1 end,
  r.position
limit 1;
```

- [ ] **Step 3: Implementar idempotência e validação de pertencimento**

`succaozero_ingest_lead` deve:

1. Exigir `organization_id`, `source`, `external_event_id`, `board_id`, `stage_id`, nome e ao menos telefone/e-mail/identificador alternativo.
2. Validar board na organização e etapa no board.
3. Inserir `succaozero_inbound_events` com `UNIQUE (organization_id, source, external_event_id)`.
4. Em conflito, retornar IDs e resultado persistidos sem alterar cursor.
5. Resolver contato por `source_identifier`, depois telefone e e-mail; conflito entre identidades retorna `409 identity_conflict`.
6. Criar oportunidade canônica e projeções `contacts`/`deals` na mesma transação.
7. Criar próxima ação com SLA configurado; sem SLA, criar exceção `SLA_NOT_CONFIGURED` visível ao gestor.
8. Registrar `lead.received`, `owner.assigned` e `next_action.created` em `succaozero_commercial_events`.

- [ ] **Step 4: Implementar transferência separada do rodízio**

```sql
-- A função valida oportunidade e novo vendedor na mesma organização,
-- mantém o cursor intacto e exige motivo não vazio.
perform public.succaozero_record_event(
  v_org_id,
  p_opportunity_id,
  concat('transfer:', gen_random_uuid()),
  'owner.transferred',
  'user',
  auth.uid()::text,
  jsonb_build_object('owner_profile_id', v_old_owner),
  jsonb_build_object('owner_profile_id', p_new_owner_id),
  jsonb_build_object('reason', btrim(p_reason))
);
```

- [ ] **Step 5: Testar concorrência real**

`test-routing-concurrency.mjs` dispara vinte chamadas paralelas com IDs distintos e duas chamadas simultâneas com o mesmo ID.

Run: `node scripts/succaozero/test-routing-concurrency.mjs --environment=staging`

Expected: `assigned_A=10`, `assigned_B=10`, `duplicate_opportunities=0`, `duplicate_events=0`; a repetição retorna o mesmo `opportunity_id` e não altera `routing_state.version`.

- [ ] **Step 6: Testar crescimento e pausa**

Adicionar C na posição 2, pausar B e executar cinco entradas. A sequência esperada, partindo do cursor registrado pelo teste, deve percorrer somente A/C de forma determinística. Reativar B deve incluí-lo na próxima passagem por sua posição, sem trocar o `owner_profile_id` das oportunidades anteriores.

- [ ] **Step 7: Commit**

```bash
git add supabase/succaozero/migrations/20260930100000_phase1_routing_and_intake.sql supabase/succaozero/tests/phase1_routing.sql scripts/succaozero/test-routing-concurrency.mjs
git commit -m "feat: add atomic scalable lead routing"
```

### Task 4: Criar a camada de domínio TypeScript

**Files:**
- Create: `lib/succaozero/types.ts`
- Create: `lib/succaozero/repository.ts`
- Create: `lib/succaozero/intake.ts`
- Create: `test/succaozeroIntake.test.ts`

**Interfaces:**
- Produces: `SuccaozeroLeadInputSchema`, `ingestSuccaozeroLead(input, context)` e tipos de resultado estáveis.
- Consumes: RPC `succaozero_ingest_lead` da Task 3 e configuração da Task 1.

- [ ] **Step 1: Escrever os tipos e o contrato validado**

```ts
export const SuccaozeroLeadInputSchema = z.object({
  source: z.enum(['site', 'whatsapp', 'agent', 'n8n', 'manual']),
  externalEventId: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  alternateIdentifier: z.string().max(200).nullable().optional(),
  boardId: z.string().uuid(),
  stageId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).refine(v => v.phone || v.email || v.alternateIdentifier, {
  message: 'Uma identidade é obrigatória',
})

export interface SuccaozeroIntakeResult {
  eventId: string
  contactId: string
  opportunityId: string | null
  crmContactId: string | null
  crmDealId: string | null
  ownerProfileId: string | null
  duplicate: boolean
  status: 'processed' | 'pending_identity' | 'queued_without_owner'
}

export const SuccaozeroIntakeResultSchema = z.object({
  eventId: z.string().uuid(),
  contactId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  crmContactId: z.string().uuid().nullable(),
  crmDealId: z.string().uuid().nullable(),
  ownerProfileId: z.string().uuid().nullable(),
  duplicate: z.boolean(),
  status: z.enum(['processed', 'pending_identity', 'queued_without_owner']),
})
```

- [ ] **Step 2: Escrever testes de validação e mapeamento**

Cobrir telefone inválido, somente `@lid`, metadados UTM, retorno duplicado e erro estruturado do RPC.

- [ ] **Step 3: Executar os testes e confirmar falha**

Run: `npx vitest run test/succaozeroIntake.test.ts`

Expected: FAIL porque o serviço ainda não existe.

- [ ] **Step 4: Implementar o repositório sem lógica duplicada**

```ts
export async function ingestSuccaozeroLead(
  raw: unknown,
  ctx: { organizationId: string; supabase: SupabaseClient },
): Promise<SuccaozeroIntakeResult> {
  const input = SuccaozeroLeadInputSchema.parse(raw)
  const { data, error } = await ctx.supabase.rpc('succaozero_ingest_lead', {
    p_payload: { ...input, organization_id: ctx.organizationId },
  })
  if (error) throw new SuccaozeroIntakeError(error.message)
  return SuccaozeroIntakeResultSchema.parse(data)
}
```

- [ ] **Step 5: Executar testes e checagens**

Run: `npx vitest run test/succaozeroIntake.test.ts && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/succaozero test/succaozeroIntake.test.ts
git commit -m "feat: add succao zero intake domain service"
```

### Task 5: Tornar a entrada do site fixa, idempotente e recuperável

**Files:**
- Modify: `app/api/site-lead/route.ts`
- Create: `test/siteLead.test.ts`

**Interfaces:**
- Consumes: `getSuccaozeroConfig` e `ingestSuccaozeroLead`.
- Produces: `POST /api/site-lead` com resposta `{ ok, event_id, contact_id, opportunity_id, deal_id, duplicate, status }`.

- [ ] **Step 1: Escrever testes da rota antes da mudança**

Cobrir:

```ts
it('resolve board somente dentro da organização configurada', async () => {
  await POST(siteRequest({ phone: '+5511999999999' }, { 'Idempotency-Key': 'site-001' }))
  expect(boardQuery.eq).toHaveBeenCalledWith('organization_id', ORG_ID)
})

it('retorna a mesma oportunidade ao repetir Idempotency-Key', async () => {
  const first = await POST(siteRequest(validLead, { 'Idempotency-Key': 'site-002' }))
  const second = await POST(siteRequest(validLead, { 'Idempotency-Key': 'site-002' }))
  const firstBody = await first.json()
  const secondBody = await second.json()
  expect(secondBody.duplicate).toBe(true)
  expect(firstBody.opportunity_id).toBe(secondBody.opportunity_id)
})
```

Também cobrir origem não autorizada, honeypot, JSON inválido, telefone inválido, ausência da feature flag e falha parcial do serviço.

- [ ] **Step 2: Executar teste e confirmar falhas relevantes**

Run: `npx vitest run test/siteLead.test.ts`

Expected: FAIL no filtro de organização e na idempotência.

- [ ] **Step 3: Substituir escritas separadas pelo serviço canônico**

A rota deve resolver board e primeira etapa com `organization_id`, derivar `externalEventId` do header `Idempotency-Key` ou de hash estável de payload+janela curta, e chamar uma única vez `ingestSuccaozeroLead`. Remover inserções independentes em `contacts`, `deals` e `activities` deste handler.

```ts
const config = getSuccaozeroConfig()
if (!config.enabled) return reply(request, 503, { ok: false, error: 'Entrada temporariamente indisponível' })

const eventId = request.headers.get('idempotency-key')?.trim() || createSiteEventId(d, request)
const result = await ingestSuccaozeroLead({
  source: 'site',
  externalEventId: eventId,
  name,
  phone,
  boardId,
  stageId,
  metadata: { origem, pagina: d.pagina, utm_source: d.utm_source, utm_medium: d.utm_medium, utm_campaign: d.utm_campaign },
}, { organizationId: config.organizationId, supabase: sb })
```

- [ ] **Step 4: Preservar compatibilidade de resposta e erro**

Manter `contact_id` e `deal_id` enquanto clientes antigos migram, adicionar IDs canônicos e retornar `202` quando `pending_identity` ou `queued_without_owner` exigir atenção.

- [ ] **Step 5: Executar testes**

Run: `npx vitest run test/siteLead.test.ts test/publicApi.deals.test.ts`

Expected: PASS; nenhum mock observa sequência de três escritas independentes.

- [ ] **Step 6: Commit**

```bash
git add app/api/site-lead/route.ts test/siteLead.test.ts
git commit -m "fix: make site lead intake tenant-safe and idempotent"
```

### Task 6: Criar API única para agente/n8n e auditar transições

**Files:**
- Create: `app/api/public/v1/succaozero/events/route.ts`
- Create: `test/succaozeroEventsApi.test.ts`
- Create: `docs/integrations/succaozero-events.md`
- Modify: `lib/public-api/dealsMoveStage.ts`
- Modify: `app/api/public/v1/deals/route.ts`
- Modify: `test/publicApi.deals.test.ts`
- Create: `test/publicApiStageHistory.test.ts`

**Interfaces:**
- Produces: `POST /api/public/v1/succaozero/events` autenticado por API key da organização.
- Consumes: envelope `{ event_id, event_type, occurred_at, subject, payload }` e serviços canônicos.

- [ ] **Step 1: Fixar o envelope de eventos**

```ts
const EventSchema = z.object({
  event_id: z.string().min(1).max(200),
  event_type: z.enum(['lead.received', 'lead.qualified', 'stage.change_requested', 'next_action.requested']),
  occurred_at: z.string().datetime({ offset: true }),
  subject: z.object({
    source_identifier: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    opportunity_id: z.string().uuid().optional(),
  }),
  payload: z.record(z.string(), z.unknown()).default({}),
}).strict()
```

- [ ] **Step 2: Escrever testes da API**

Cobrir API key ausente/inválida, organização diferente da configurada, evento repetido, evento fora de ordem, `@lid` sem telefone, etapa ambígua e indisponibilidade temporária. `@lid` deve retornar `202 pending_identity`, nunca `200` silencioso nem descarte.

- [ ] **Step 3: Implementar a rota e documentação de n8n**

O workflow `J. Sincroniza CRM — SucçãoZero` deve deixar de buscar “últimos 10 minutos”. Para cada mudança, enviar `event_id` persistente e marcar checkpoint apenas após resposta `2xx`. Respostas `409`, `422` e `5xx` permanecem em fila de reprocessamento com erro e número de tentativas. A documentação deve incluir payloads completos para os quatro tipos e tabela de respostas.

- [ ] **Step 4: Fazer movimentação de etapa idempotente**

Adicionar `event_id` obrigatório aos caminhos Sucção Zero. Se a etapa pedida for igual à atual, devolver `action: 'unchanged'`, não alterar `last_stage_change_date` e registrar no máximo um evento pelo `event_id`.

```ts
if (deal.stage_id === stageId) {
  return { ok: true as const, status: 200, body: { data: deal, action: 'unchanged' } }
}
```

- [ ] **Step 5: Validar todos os pais da criação pública**

Antes de inserir deal, confirmar que board, etapa, contato, empresa e responsável pertencem à `auth.organizationId`, e que a etapa pertence ao board. Testar IDs válidos de outra organização e esperar `422 RELATIONSHIP_SCOPE_ERROR`.

- [ ] **Step 6: Executar testes**

Run: `npx vitest run test/succaozeroEventsApi.test.ts test/publicApi.deals.test.ts test/publicApiStageHistory.test.ts`

Expected: PASS, incluindo repetição após oportunidade ganha sem criação de novo negócio.

- [ ] **Step 7: Commit**

```bash
git add app/api/public/v1/succaozero/events/route.ts lib/public-api/dealsMoveStage.ts app/api/public/v1/deals/route.ts test/succaozeroEventsApi.test.ts test/publicApi.deals.test.ts test/publicApiStageHistory.test.ts docs/integrations/succaozero-events.md
git commit -m "feat: add durable succao zero integration events"
```

### Task 7: Expor configuração administrativa do rodízio

**Files:**
- Create: `app/api/admin/succaozero/sales-routing/route.ts`
- Create: `test/succaozeroSalesRoutingApi.test.ts`
- Create: `features/settings/components/SalesRoutingSection.tsx`
- Create: `features/settings/components/SalesRoutingSection.test.tsx`
- Modify: `features/settings/UsersPage.tsx`

**Interfaces:**
- Produces: `GET/PUT /api/admin/succaozero/sales-routing`.
- Consumes: RPC `succaozero_set_seller_roster`; retorna `{ sellers, nextProfileId, version }`.

- [ ] **Step 1: Escrever testes de autorização e consistência**

Testar `401` sem sessão, `403` para vendedor, rejeição de perfil de outra organização, posições duplicadas e lista vazia aceita com alerta. O PUT exige mesma origem.

- [ ] **Step 2: Implementar a rota administrativa**

```ts
const SellerSchema = z.object({
  profileId: z.string().uuid(),
  position: z.number().int().min(0),
  eligible: z.boolean(),
  pausedUntil: z.string().datetime({ offset: true }).nullable(),
})
const BodySchema = z.object({ sellers: z.array(SellerSchema).max(200) }).strict()
```

A rota deve consultar `profiles` pela organização do admin antes de chamar a RPC. Nenhum `organization_id` vindo do navegador é aceito.

- [ ] **Step 3: Criar o componente de configuração**

O componente dentro de “Sua Equipe” mostra ordem, ativo/pausado, última atribuição e próximo vendedor. Permite mover para cima/baixo, pausar/reativar e salvar. Remover do rodízio exibe: “As oportunidades atuais continuarão com este responsável”.

- [ ] **Step 4: Testar comportamento da interface**

```tsx
it('preserva a mensagem de carteira ao pausar vendedor', async () => {
  render(<SalesRoutingSection />)
  await user.click(screen.getByRole('button', { name: /pausar maria/i }))
  expect(screen.getByText(/oportunidades atuais continuarão/i)).toBeInTheDocument()
})
```

- [ ] **Step 5: Executar testes e checagens**

Run: `npx vitest run test/succaozeroSalesRoutingApi.test.ts features/settings/components/SalesRoutingSection.test.tsx && npm run typecheck && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/succaozero/sales-routing/route.ts test/succaozeroSalesRoutingApi.test.ts features/settings/components/SalesRoutingSection.tsx features/settings/components/SalesRoutingSection.test.tsx features/settings/UsersPage.tsx
git commit -m "feat: add scalable sales routing settings"
```

### Task 8: Implementar próxima ação e visão operacional

**Files:**
- Create: `app/api/succaozero/next-actions/route.ts`
- Create: `test/succaozeroNextActionsApi.test.ts`
- Create: `lib/query/hooks/useSuccaozeroNextActionsQuery.ts`
- Create: `features/inbox/components/SuccaozeroNextActionsPanel.tsx`
- Create: `features/inbox/components/SuccaozeroNextActionsPanel.test.tsx`
- Modify: `features/inbox/InboxPage.tsx`

**Interfaces:**
- Produces: filtros `today`, `overdue` e `missing`; ações de criar, concluir e justificar exceção.
- Consumes: `succaozero_next_actions` e `succaozero_opportunities`, sempre pela organização da sessão.

- [ ] **Step 1: Escrever testes de regras de próxima ação**

Cobrir: oportunidade aberta sem ação; ação vencida no fuso de São Paulo; conclusão criando histórico; nova ação substituindo a anterior de modo transacional; vendedor não atribuído tentando editar carteira alheia; gestor vendo o consolidado.

- [ ] **Step 2: Implementar API com datas tipadas**

```ts
const UpsertNextActionSchema = z.object({
  opportunityId: z.string().uuid(),
  executorProfileId: z.string().uuid(),
  kind: z.enum(['FIRST_CONTACT','FOLLOW_UP','PROPOSAL','REVIEW','OTHER']),
  dueAt: z.string().datetime({ offset: true }),
}).strict()
```

O servidor valida oportunidade e executor na organização. Concluir uma ação registra `next_action.completed`; criar outra registra `next_action.created`. Não usar texto local como data no banco.

- [ ] **Step 3: Criar hook com chaves de cache próprias**

```ts
export const succaozeroNextActionKeys = {
  all: ['succaozero', 'next-actions'] as const,
  list: (filter: 'today' | 'overdue' | 'missing') => ['succaozero', 'next-actions', filter] as const,
}
```

- [ ] **Step 4: Criar painel operacional no Inbox**

Exibir três cartões: “Hoje”, “Atrasadas” e “Sem próxima ação”. Cada item abre a oportunidade existente; estado vazio informa que não há pendências. Não duplicar a agenda técnica nesta tela.

- [ ] **Step 5: Executar testes**

Run: `npx vitest run test/succaozeroNextActionsApi.test.ts features/inbox/components/SuccaozeroNextActionsPanel.test.tsx`

Expected: PASS, inclusive virada de dia no fuso `America/Sao_Paulo`.

- [ ] **Step 6: Commit**

```bash
git add app/api/succaozero/next-actions/route.ts test/succaozeroNextActionsApi.test.ts lib/query/hooks/useSuccaozeroNextActionsQuery.ts features/inbox/components/SuccaozeroNextActionsPanel.tsx features/inbox/components/SuccaozeroNextActionsPanel.test.tsx features/inbox/InboxPage.tsx
git commit -m "feat: add commercial next action workflow"
```

### Task 9: Migrar dados do agente com dry-run e conciliação

**Files:**
- Create: `scripts/succaozero/mapping.ts`
- Create: `scripts/succaozero/migrate-agent-data.mjs`
- Create: `scripts/succaozero/reconcile-data.mjs`
- Create: `test/succaozeroMigration.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `SUCCAOZERO_AGENT_DATABASE_URL`, `SUCCAOZERO_CRM_DATABASE_URL`, `SUCCAOZERO_SUPABASE_PROJECT_REF` somente no ambiente de execução.
- Produces: inserções idempotentes por `source_identifier`/`source_event_id` e relatório agregado sem PII.

- [ ] **Step 1: Escrever funções puras de mapeamento e testes**

```ts
export interface AgentLeadRow {
  identificador: string
  nome: string | null
  timestamp: string | null
  [key: string]: unknown
}

export function mapAgentLead(row: AgentLeadRow): CanonicalLeadImport {
  return {
    source: 'agent',
    externalEventId: `agent-lead:${row.identificador}`,
    sourceIdentifier: row.identificador,
    name: row.nome?.trim() || 'Contato sem nome informado',
    occurredAt: parseAgentTimestamp(row.timestamp),
  }
}
```

Testar timestamp inválido, identificador `@lid`, registro sem nome, duplicação e telefone não normalizável. Identificador sem telefone vira `pending_identity`; não é descartado nem fundido.

- [ ] **Step 2: Implementar dry-run como comportamento padrão**

Sem `--apply`, o script só lê metadados/contagens, valida colunas esperadas e imprime:

```text
leads_read=<n>
contacts_to_create=<n>
opportunities_to_create=<n>
pending_identity=<n>
duplicates_by_event=<n>
writes=0
```

Nenhum nome, telefone, mensagem ou payload completo aparece no log.

- [ ] **Step 3: Implementar aplicação em lotes idempotentes**

Com `--apply --confirm-project=<ref>`, usar transações de até 100 leads, chamar o contrato canônico e salvar checkpoint pelo identificador estável. Falha no lote faz rollback somente daquele lote e permite retomada.

- [ ] **Step 4: Implementar conciliação**

O script de conciliação compara contagens por identificador/evento/status, lista somente IDs técnicos divergentes e retorna exit code 1 quando houver oportunidade sem projeção, projeção sem canônico, responsável fora do roster ou oportunidade aberta sem ação/exceção.

- [ ] **Step 5: Adicionar comandos**

```json
"migrate:succaozero:dry-run": "node scripts/succaozero/migrate-agent-data.mjs",
"reconcile:succaozero": "node scripts/succaozero/reconcile-data.mjs"
```

- [ ] **Step 6: Executar em homologação**

Run: `npm run migrate:succaozero:dry-run`

Expected: `writes=0` e nenhuma PII no terminal.

Depois de backup restaurável e confirmação do project ref:

Run: `node scripts/succaozero/migrate-agent-data.mjs --apply --confirm-project=$env:SUCCAOZERO_SUPABASE_PROJECT_REF`

Run: `npm run reconcile:succaozero`

Expected: `missing_canonical=0`, `missing_projection=0`, `duplicate_events=0`, `open_without_next_action_or_exception=0`.

- [ ] **Step 7: Commit**

```bash
git add scripts/succaozero/mapping.ts scripts/succaozero/migrate-agent-data.mjs scripts/succaozero/reconcile-data.mjs test/succaozeroMigration.test.ts package.json
git commit -m "feat: add resumable succao zero data migration"
```

### Task 10: Trocar o workflow n8n sem janela de perda

**Files:**
- Create: `docs/runbooks/succaozero-n8n-cutover.md`
- Create: `scripts/succaozero/verify-sync-health.mjs`
- Create: `test/succaozeroSyncContract.test.ts`

**Interfaces:**
- Consumes: endpoint da Task 6.
- Produces: checkpoint persistente no n8n, fila de erro e verificação de atraso/pendências.

- [ ] **Step 1: Escrever testes de contrato com fixtures anonimizadas**

Testar entrega fora de ordem, repetição após timeout, interrupção de 30 minutos, `@lid`, mudança manual posterior no CRM e evento de instalação que não pode regredir negócio ganho.

- [ ] **Step 2: Documentar a alteração exata do workflow**

O runbook deve orientar:

1. Duplicar o workflow publicado e mantê-lo inativo.
2. Substituir o filtro móvel de 10 minutos por checkpoint persistente `(updated_at, primary_key)`.
3. Gerar `event_id` determinístico `<table>:<primary_key>:<updated_at>`.
4. Enviar para `/api/public/v1/succaozero/events`.
5. Avançar checkpoint somente após `2xx`.
6. Enviar `409`, `422` e `5xx` para fila com payload, erro, tentativas e `next_retry_at`.
7. Fazer backfill desde o último checkpoint conhecido antes de ativar.
8. Rodar antigo e novo em modo sombra; apenas o novo grava após conciliação.
9. Desativar o antigo sem excluí-lo e registrar horário de corte.

- [ ] **Step 3: Implementar verificador de saúde**

O script consulta eventos recebidos e retorna falha se `last_success_at` estiver há mais de 10 minutos, se houver evento `processing` há mais de 5 minutos ou `failed` sem próxima tentativa. Logs mostram IDs técnicos, não conteúdo de conversa.

- [ ] **Step 4: Executar simulação de interrupção**

Pausar o workflow novo em homologação por 30 minutos, inserir eventos sintéticos isolados, retomar e verificar que todos aparecem uma vez.

Expected: `lost=0`, `duplicates=0`, `max_lag_minutes>=30` durante pausa e `pending=0` após recuperação.

- [ ] **Step 5: Commit**

```bash
git add docs/runbooks/succaozero-n8n-cutover.md scripts/succaozero/verify-sync-health.mjs test/succaozeroSyncContract.test.ts
git commit -m "docs: add recoverable succao zero sync cutover"
```

### Task 11: Executar gates de isolamento, regressão e rollout

**Files:**
- Create: `scripts/succaozero/release-gate.mjs`
- Create: `scripts/succaozero/verify-backup-restore.mjs`
- Create: `test/succaozeroIsolation.test.ts`
- Create: `docs/runbooks/succaozero-phase1-rollout.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: todos os artefatos anteriores e fingerprints de schema somente-leitura dos dois CRMs.
- Produces: relatório final `PASS/FAIL` sem dados pessoais e procedimento de rollback.

- [ ] **Step 1: Escrever teste automatizado de isolamento**

O teste prova que:

- feature flag desligada mantém rotas e UI Sucção Zero inativas;
- project ref da Alice é rejeitado pelos scripts;
- IDs de outra organização retornam `403/422`;
- nenhuma query Sucção Zero omite `organization_id` ou RPC equivalente;
- mudanças genéricas continuam passando em `test/tools.multiTenant.test.ts` e `test/supabaseMiddleware.test.ts`.

- [ ] **Step 2: Criar release gate**

```js
const gates = [
  'config', 'schema', 'rls', 'routing', 'idempotency', 'reconciliation',
  'sync-health', 'multi-tenant', 'alice-schema-unchanged', 'backup-restore',
]
```

O script encerra com código diferente de zero se qualquer gate falhar. `alice-schema-unchanged` compara apenas catálogo, políticas e contagens agregadas previamente aprovadas; não lê conteúdo de contatos.

`verify-backup-restore.mjs` recebe `SUCCAOZERO_RESTORE_DATABASE_URL`, exige que o project ref seja diferente de produção, e compara schema, contagens por tabela e IDs técnicos amostrados entre o backup e a restauração. O gate `backup-restore` só passa com `schema_mismatch=0`, `count_mismatch=0` e `sample_id_mismatch=0`.

- [ ] **Step 3: Documentar rollout e rollback**

Ordem obrigatória:

1. Capturar backup e fingerprint somente do CRM Sucção Zero; capturar fingerprint somente-leitura da Alice.
2. Aplicar migrations específicas em homologação Sucção Zero.
3. Executar testes e migração dry-run.
4. Rodar piloto sintético A/B e inclusão simulada de C.
5. Aplicar migrations no CRM Sucção Zero com feature flag ainda desligada.
6. Migrar/conferir dados, ativar API e workflow em modo sombra.
7. Ativar `SUCCAOZERO_CANONICAL_ENABLED=true` apenas no deploy Sucção Zero.
8. Monitorar erros, duplicações, fila sem responsável e próximos contatos durante o piloto.
9. Comparar fingerprint da Alice; qualquer alteração inesperada bloqueia o rollout.

Rollback: desligar a flag, reativar o workflow anterior no checkpoint registrado, preservar eventos recebidos depois do corte e executar reconciliação antes de restaurar dados. Não apagar tabelas nem eventos para “voltar ao estado anterior”.

- [ ] **Step 4: Adicionar comando e executar suíte completa**

Adicionar:

```json
"release-gate:succaozero": "node scripts/succaozero/release-gate.mjs"
```

Run: `npm run lint && npm run typecheck && npm run test:run && npm run build`

Expected: todos passam.

Run: `npm run release-gate:succaozero`

Expected: todos os dez gates retornam `PASS`.

- [ ] **Step 5: Revisão manual do piloto**

Validar com dados sintéticos:

- A/B/A/B com dois vendedores;
- inclusão de C e sequência pela nova ordem;
- pausa/reativação sem redistribuir carteira;
- duas entradas simultâneas em posições sucessivas;
- repetição do evento sem duplicação;
- lead preservado quando ninguém está elegível;
- oportunidade aberta com ação ou exceção;
- vendedor assumindo conversa sem resposta posterior da IA;
- nenhuma mudança no login, contatos, funil e atividades da Alice.

- [ ] **Step 6: Commit**

```bash
git add scripts/succaozero/release-gate.mjs scripts/succaozero/verify-backup-restore.mjs test/succaozeroIsolation.test.ts docs/runbooks/succaozero-phase1-rollout.md package.json
git commit -m "test: add succao zero phase one release gates"
```

## Definition of Done

- Fonte oficial aprovada e registrada.
- Schema canônico aplicado somente ao projeto Sucção Zero.
- As FKs de disponibilidade e slots apontam para tabelas Sucção Zero; nenhuma FK criada nesta fase aponta para `evolve_*`.
- Entradas do site, agente e n8n usam evento idempotente e serviço único.
- Rodízio aceita dois ou mais vendedores, funciona sob concorrência e preserva carteiras.
- Próxima ação ou exceção existe para toda oportunidade aberta.
- Histórico registra origem, ator, evidência e valores anterior/novo.
- Interrupção de 30 minutos é recuperada sem perda nem duplicação.
- Migração é retomável e conciliada por IDs técnicos.
- Suíte, build e release gates passam.
- Fingerprint e regressão funcional da Alice permanecem inalterados.
- Dashboard e agenda continuam fora do escopo até esta base ser aceita.

