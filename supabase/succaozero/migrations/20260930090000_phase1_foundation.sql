do $$
begin
  if nullif(current_setting('app.succaozero_project_ref', true), '') is null then
    raise exception 'app.succaozero_project_ref não configurado';
  end if;
end $$;

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

create unique index succaozero_contacts_email_unique
  on public.succaozero_contacts (organization_id, lower(email))
  where email is not null;

create table public.succaozero_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('person', 'company', 'condominium')),
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

create unique index succaozero_customer_one_primary_contact
  on public.succaozero_customer_contacts (customer_id)
  where is_primary;

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
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  title text not null,
  value numeric(14, 2) not null default 0,
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

create index succaozero_opportunities_owner_idx
  on public.succaozero_opportunities (organization_id, owner_profile_id, status);

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
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled', 'exception')),
  exception_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status = 'open' and executor_profile_id is not null and due_at is not null and exception_reason is null)
    or (status = 'exception' and exception_reason is not null)
    or status in ('completed', 'cancelled')
  )
);

create unique index succaozero_one_open_next_action
  on public.succaozero_next_actions (opportunity_id)
  where status = 'open';

create index succaozero_next_actions_due_idx
  on public.succaozero_next_actions (organization_id, status, due_at);

create table public.succaozero_commercial_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.succaozero_opportunities(id) on delete set null,
  event_key text not null,
  event_type text not null,
  actor_type text not null check (actor_type in ('user', 'ai', 'integration', 'system')),
  actor_id text,
  previous_value jsonb,
  new_value jsonb,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (organization_id, event_key)
);

create index succaozero_commercial_events_timeline_idx
  on public.succaozero_commercial_events (organization_id, opportunity_id, occurred_at desc);

create table public.succaozero_inbound_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null,
  external_event_id text not null,
  payload_hash text not null,
  status text not null check (status in ('received', 'processed', 'pending_identity', 'queued_without_owner', 'failed')),
  contact_id uuid references public.succaozero_contacts(id) on delete set null,
  opportunity_id uuid references public.succaozero_opportunities(id) on delete set null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (organization_id, source, external_event_id)
);

create index succaozero_inbound_events_status_idx
  on public.succaozero_inbound_events (organization_id, status, received_at);

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
  next_position integer not null default 0 check (next_position >= 0),
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);

create table public.succaozero_commercial_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  first_contact_sla_minutes integer check (first_contact_sla_minutes > 0),
  timezone text not null default 'America/Sao_Paulo',
  updated_at timestamptz not null default now()
);

create function public.succaozero_validate_relationship_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_organization_id uuid;
  related_organization_id uuid;
begin
  if tg_table_name = 'succaozero_contacts' and new.crm_contact_id is not null then
    select organization_id into parent_organization_id from public.contacts where id = new.crm_contact_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Contato CRM fora da organização Sucção Zero';
    end if;

  elsif tg_table_name = 'succaozero_customer_contacts' then
    select organization_id into parent_organization_id from public.succaozero_customers where id = new.customer_id;
    select organization_id into related_organization_id from public.succaozero_contacts where id = new.contact_id;
    if parent_organization_id is null or related_organization_id is distinct from parent_organization_id then
      raise exception 'Cliente e contato pertencem a organizações diferentes';
    end if;

  elsif tg_table_name = 'succaozero_locations' then
    select organization_id into parent_organization_id from public.succaozero_customers where id = new.customer_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Local e cliente pertencem a organizações diferentes';
    end if;

  elsif tg_table_name = 'succaozero_pools' then
    select organization_id into parent_organization_id from public.succaozero_locations where id = new.location_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Piscina e local pertencem a organizações diferentes';
    end if;

  elsif tg_table_name = 'succaozero_opportunities' then
    select organization_id into parent_organization_id from public.succaozero_contacts where id = new.primary_contact_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Oportunidade e contato pertencem a organizações diferentes';
    end if;

    if new.customer_id is not null then
      select organization_id into parent_organization_id from public.succaozero_customers where id = new.customer_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Oportunidade e cliente pertencem a organizações diferentes';
      end if;
    end if;

    select organization_id into parent_organization_id from public.boards where id = new.board_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Oportunidade e funil pertencem a organizações diferentes';
    end if;

    select organization_id into parent_organization_id
      from public.board_stages
     where id = new.stage_id and board_id = new.board_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Etapa não pertence ao funil e à organização informados';
    end if;

    if new.owner_profile_id is not null then
      select organization_id into parent_organization_id from public.profiles where id = new.owner_profile_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Responsável fora da organização Sucção Zero';
      end if;
    end if;

    if new.crm_deal_id is not null then
      select organization_id into parent_organization_id from public.deals where id = new.crm_deal_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Negócio projetado fora da organização Sucção Zero';
      end if;
    end if;

  elsif tg_table_name = 'succaozero_opportunity_pools' then
    select organization_id into parent_organization_id from public.succaozero_opportunities where id = new.opportunity_id;
    select organization_id into related_organization_id from public.succaozero_pools where id = new.pool_id;
    if parent_organization_id is null or related_organization_id is distinct from parent_organization_id then
      raise exception 'Oportunidade e piscina pertencem a organizações diferentes';
    end if;

  elsif tg_table_name = 'succaozero_next_actions' then
    select organization_id into parent_organization_id from public.succaozero_opportunities where id = new.opportunity_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Próxima ação e oportunidade pertencem a organizações diferentes';
    end if;
    if new.executor_profile_id is not null then
      select organization_id into parent_organization_id from public.profiles where id = new.executor_profile_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Executor fora da organização Sucção Zero';
      end if;
    end if;

  elsif tg_table_name = 'succaozero_commercial_events' and new.opportunity_id is not null then
    select organization_id into parent_organization_id from public.succaozero_opportunities where id = new.opportunity_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Evento e oportunidade pertencem a organizações diferentes';
    end if;

  elsif tg_table_name = 'succaozero_inbound_events' then
    if new.contact_id is not null then
      select organization_id into parent_organization_id from public.succaozero_contacts where id = new.contact_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Evento de entrada e contato pertencem a organizações diferentes';
      end if;
    end if;
    if new.opportunity_id is not null then
      select organization_id into parent_organization_id from public.succaozero_opportunities where id = new.opportunity_id;
      if parent_organization_id is distinct from new.organization_id then
        raise exception 'Evento de entrada e oportunidade pertencem a organizações diferentes';
      end if;
    end if;

  elsif tg_table_name = 'succaozero_seller_roster' then
    select organization_id into parent_organization_id from public.profiles where id = new.profile_id;
    if parent_organization_id is distinct from new.organization_id then
      raise exception 'Vendedor fora da organização Sucção Zero';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.succaozero_validate_relationship_scope() from public, anon, authenticated;

create trigger succaozero_contacts_relationship_scope
before insert or update on public.succaozero_contacts
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_customer_contacts_relationship_scope
before insert or update on public.succaozero_customer_contacts
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_locations_relationship_scope
before insert or update on public.succaozero_locations
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_pools_relationship_scope
before insert or update on public.succaozero_pools
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_opportunities_relationship_scope
before insert or update on public.succaozero_opportunities
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_opportunity_pools_relationship_scope
before insert or update on public.succaozero_opportunity_pools
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_next_actions_relationship_scope
before insert or update on public.succaozero_next_actions
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_commercial_events_relationship_scope
before insert or update on public.succaozero_commercial_events
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_inbound_events_relationship_scope
before insert or update on public.succaozero_inbound_events
for each row execute function public.succaozero_validate_relationship_scope();
create trigger succaozero_seller_roster_relationship_scope
before insert or update on public.succaozero_seller_roster
for each row execute function public.succaozero_validate_relationship_scope();

create or replace function public.succaozero_is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = target_organization_id
      and p.role = 'admin'
  );
$$;

revoke all on function public.succaozero_is_org_admin(uuid) from public;
grant execute on function public.succaozero_is_org_admin(uuid) to authenticated;

alter table public.succaozero_contacts enable row level security;
alter table public.succaozero_contacts force row level security;
alter table public.succaozero_customers enable row level security;
alter table public.succaozero_customers force row level security;
alter table public.succaozero_customer_contacts enable row level security;
alter table public.succaozero_customer_contacts force row level security;
alter table public.succaozero_locations enable row level security;
alter table public.succaozero_locations force row level security;
alter table public.succaozero_pools enable row level security;
alter table public.succaozero_pools force row level security;
alter table public.succaozero_opportunities enable row level security;
alter table public.succaozero_opportunities force row level security;
alter table public.succaozero_opportunity_pools enable row level security;
alter table public.succaozero_opportunity_pools force row level security;
alter table public.succaozero_next_actions enable row level security;
alter table public.succaozero_next_actions force row level security;
alter table public.succaozero_commercial_events enable row level security;
alter table public.succaozero_commercial_events force row level security;
alter table public.succaozero_inbound_events enable row level security;
alter table public.succaozero_inbound_events force row level security;
alter table public.succaozero_seller_roster enable row level security;
alter table public.succaozero_seller_roster force row level security;
alter table public.succaozero_routing_state enable row level security;
alter table public.succaozero_routing_state force row level security;
alter table public.succaozero_commercial_settings enable row level security;
alter table public.succaozero_commercial_settings force row level security;

revoke all on public.succaozero_contacts from anon;
revoke all on public.succaozero_customers from anon;
revoke all on public.succaozero_customer_contacts from anon;
revoke all on public.succaozero_locations from anon;
revoke all on public.succaozero_pools from anon;
revoke all on public.succaozero_opportunities from anon;
revoke all on public.succaozero_opportunity_pools from anon;
revoke all on public.succaozero_next_actions from anon;
revoke all on public.succaozero_commercial_events from anon;
revoke all on public.succaozero_inbound_events from anon;
revoke all on public.succaozero_seller_roster from anon;
revoke all on public.succaozero_routing_state from anon;
revoke all on public.succaozero_commercial_settings from anon;

grant select, insert, update, delete on public.succaozero_contacts to authenticated;
grant select, insert, update, delete on public.succaozero_customers to authenticated;
grant select, insert, update, delete on public.succaozero_customer_contacts to authenticated;
grant select, insert, update, delete on public.succaozero_locations to authenticated;
grant select, insert, update, delete on public.succaozero_pools to authenticated;
grant select, insert, update, delete on public.succaozero_opportunities to authenticated;
grant select, insert, update, delete on public.succaozero_opportunity_pools to authenticated;
grant select, insert, update, delete on public.succaozero_next_actions to authenticated;
grant select, insert, update, delete on public.succaozero_commercial_events to authenticated;
grant select, insert, update, delete on public.succaozero_inbound_events to authenticated;
grant select, insert, update, delete on public.succaozero_seller_roster to authenticated;
grant select, insert, update, delete on public.succaozero_routing_state to authenticated;
grant select, insert, update, delete on public.succaozero_commercial_settings to authenticated;

create policy succaozero_contacts_select on public.succaozero_contacts
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and (
    public.succaozero_is_org_admin(organization_id)
    or exists (
      select 1 from public.succaozero_opportunities o
      where o.primary_contact_id = succaozero_contacts.id
        and o.owner_profile_id = auth.uid()
    )
  )
);

create policy succaozero_customers_select on public.succaozero_customers
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and (
    public.succaozero_is_org_admin(organization_id)
    or exists (
      select 1 from public.succaozero_opportunities o
      where o.customer_id = succaozero_customers.id
        and o.owner_profile_id = auth.uid()
    )
  )
);

create policy succaozero_customer_contacts_select on public.succaozero_customer_contacts
for select to authenticated
using (
  exists (
    select 1 from public.succaozero_customers c
    where c.id = succaozero_customer_contacts.customer_id
      and c.organization_id = public.get_user_org_id()
      and public.succaozero_is_org_admin(c.organization_id)
  )
);

create policy succaozero_locations_select on public.succaozero_locations
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and public.succaozero_is_org_admin(organization_id)
);

create policy succaozero_pools_select on public.succaozero_pools
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and public.succaozero_is_org_admin(organization_id)
);

create policy succaozero_opportunities_select on public.succaozero_opportunities
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and (owner_profile_id = auth.uid() or public.succaozero_is_org_admin(organization_id))
);

create policy succaozero_opportunity_pools_select on public.succaozero_opportunity_pools
for select to authenticated
using (
  exists (
    select 1 from public.succaozero_opportunities o
    where o.id = succaozero_opportunity_pools.opportunity_id
      and o.organization_id = public.get_user_org_id()
      and (o.owner_profile_id = auth.uid() or public.succaozero_is_org_admin(o.organization_id))
  )
);

create policy succaozero_next_actions_select on public.succaozero_next_actions
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and (
    executor_profile_id = auth.uid()
    or public.succaozero_is_org_admin(organization_id)
    or exists (
      select 1 from public.succaozero_opportunities o
      where o.id = succaozero_next_actions.opportunity_id
        and o.owner_profile_id = auth.uid()
    )
  )
);

create policy succaozero_commercial_events_select on public.succaozero_commercial_events
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and (
    public.succaozero_is_org_admin(organization_id)
    or exists (
      select 1 from public.succaozero_opportunities o
      where o.id = succaozero_commercial_events.opportunity_id
        and o.owner_profile_id = auth.uid()
    )
  )
);

create policy succaozero_inbound_events_select on public.succaozero_inbound_events
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and public.succaozero_is_org_admin(organization_id)
);

create policy succaozero_seller_roster_select on public.succaozero_seller_roster
for select to authenticated
using (organization_id = public.get_user_org_id());

create policy succaozero_routing_state_select on public.succaozero_routing_state
for select to authenticated
using (
  organization_id = public.get_user_org_id()
  and public.succaozero_is_org_admin(organization_id)
);

create policy succaozero_commercial_settings_select on public.succaozero_commercial_settings
for select to authenticated
using (organization_id = public.get_user_org_id());

create policy succaozero_contacts_admin_all on public.succaozero_contacts
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_customers_admin_all on public.succaozero_customers
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_locations_admin_all on public.succaozero_locations
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_pools_admin_all on public.succaozero_pools
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_opportunities_admin_all on public.succaozero_opportunities
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_next_actions_admin_all on public.succaozero_next_actions
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_commercial_events_admin_all on public.succaozero_commercial_events
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_inbound_events_admin_all on public.succaozero_inbound_events
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_seller_roster_admin_all on public.succaozero_seller_roster
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_routing_state_admin_all on public.succaozero_routing_state
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_commercial_settings_admin_all on public.succaozero_commercial_settings
for all to authenticated
using (public.succaozero_is_org_admin(organization_id))
with check (public.succaozero_is_org_admin(organization_id));

create policy succaozero_customer_contacts_admin_all on public.succaozero_customer_contacts
for all to authenticated
using (
  exists (
    select 1 from public.succaozero_customers c
    where c.id = succaozero_customer_contacts.customer_id
      and public.succaozero_is_org_admin(c.organization_id)
  )
)
with check (
  exists (
    select 1 from public.succaozero_customers c
    where c.id = succaozero_customer_contacts.customer_id
      and public.succaozero_is_org_admin(c.organization_id)
  )
);

create policy succaozero_opportunity_pools_admin_all on public.succaozero_opportunity_pools
for all to authenticated
using (
  exists (
    select 1 from public.succaozero_opportunities o
    where o.id = succaozero_opportunity_pools.opportunity_id
      and public.succaozero_is_org_admin(o.organization_id)
  )
)
with check (
  exists (
    select 1 from public.succaozero_opportunities o
    where o.id = succaozero_opportunity_pools.opportunity_id
      and public.succaozero_is_org_admin(o.organization_id)
  )
);
