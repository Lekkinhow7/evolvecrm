do $$
begin
  if nullif(current_setting('app.succaozero_project_ref', true), '') is null then
    raise exception 'app.succaozero_project_ref não configurado';
  end if;
end $$;

create function public.succaozero_record_event(
  p_organization_id uuid,
  p_opportunity_id uuid,
  p_event_key text,
  p_event_type text,
  p_actor_type text,
  p_actor_id text,
  p_previous_value jsonb,
  p_new_value jsonb,
  p_evidence jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if p_opportunity_id is not null and not exists (
    select 1 from public.succaozero_opportunities o
    where o.id = p_opportunity_id and o.organization_id = p_organization_id
  ) then
    raise exception 'Oportunidade fora da organização Sucção Zero';
  end if;

  insert into public.succaozero_commercial_events (
    organization_id, opportunity_id, event_key, event_type, actor_type,
    actor_id, previous_value, new_value, evidence
  ) values (
    p_organization_id, p_opportunity_id, p_event_key, p_event_type, p_actor_type,
    p_actor_id, p_previous_value, p_new_value, coalesce(p_evidence, '{}'::jsonb)
  )
  on conflict (organization_id, event_key) do update
    set event_key = excluded.event_key
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create function public.succaozero_set_seller_roster(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_next_position integer;
  v_version bigint;
  v_next_profile_id uuid;
  v_sellers jsonb;
begin
  v_organization_id := nullif(p_payload ->> 'organization_id', '')::uuid;
  if v_organization_id is null or not exists (
    select 1 from public.organizations o where o.id = v_organization_id
  ) then
    raise exception 'Organização Sucção Zero inválida';
  end if;
  if auth.uid() is not null and not public.succaozero_is_org_admin(v_organization_id) then
    raise exception 'Somente administradores podem configurar o rodízio';
  end if;
  if jsonb_typeof(coalesce(p_payload -> 'sellers', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_payload -> 'sellers', '[]'::jsonb)) > 200 then
    raise exception 'Lista de vendedores inválida';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_payload -> 'sellers', '[]'::jsonb))
      as x(profile_id uuid, position integer, eligible boolean, paused_until timestamptz)
    where x.profile_id is null or x.position is null or x.position < 0
  ) then
    raise exception 'Vendedor ou posição inválida';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_payload -> 'sellers', '[]'::jsonb))
      as x(profile_id uuid, position integer, eligible boolean, paused_until timestamptz)
    group by x.profile_id having count(*) > 1
  ) or exists (
    select 1
    from jsonb_to_recordset(coalesce(p_payload -> 'sellers', '[]'::jsonb))
      as x(profile_id uuid, position integer, eligible boolean, paused_until timestamptz)
    group by x.position having count(*) > 1
  ) then
    raise exception 'Perfis e posições do rodízio devem ser únicos';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_payload -> 'sellers', '[]'::jsonb))
      as x(profile_id uuid, position integer, eligible boolean, paused_until timestamptz)
    left join public.profiles p on p.id = x.profile_id and p.organization_id = v_organization_id
    where p.id is null
  ) then
    raise exception 'Vendedor fora da organização Sucção Zero';
  end if;

  insert into public.succaozero_routing_state (organization_id)
  values (v_organization_id)
  on conflict (organization_id) do nothing;

  select s.next_position, s.version
    into v_next_position, v_version
  from public.succaozero_routing_state s
  where s.organization_id = v_organization_id
  for update;

  -- A lista recebida é o estado completo. Recriar as linhas evita colisões da
  -- restrição de posição quando dois vendedores apenas trocam de lugar.
  delete from public.succaozero_seller_roster r
  where r.organization_id = v_organization_id;

  insert into public.succaozero_seller_roster (
    organization_id, profile_id, position, eligible, paused_until, updated_at
  )
  select v_organization_id, x.profile_id, x.position, coalesce(x.eligible, true), x.paused_until, now()
  from jsonb_to_recordset(coalesce(p_payload -> 'sellers', '[]'::jsonb))
    as x(profile_id uuid, position integer, eligible boolean, paused_until timestamptz)
  ;

  select r.profile_id into v_next_profile_id
  from public.succaozero_seller_roster r
  where r.organization_id = v_organization_id
    and r.eligible
    and (r.paused_until is null or r.paused_until <= now())
  order by case when r.position >= v_next_position then 0 else 1 end, r.position
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'profileId', r.profile_id,
    'position', r.position,
    'eligible', r.eligible,
    'pausedUntil', r.paused_until
  ) order by r.position), '[]'::jsonb)
  into v_sellers
  from public.succaozero_seller_roster r
  where r.organization_id = v_organization_id;

  return jsonb_build_object(
    'sellers', v_sellers,
    'nextProfileId', v_next_profile_id,
    'version', v_version
  );
end;
$$;

create function public.succaozero_ingest_lead(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_board_id uuid;
  v_stage_id uuid;
  v_source text;
  v_external_event_id text;
  v_name text;
  v_phone text;
  v_email text;
  v_alternate_identifier text;
  v_metadata jsonb;
  v_event_id uuid;
  v_existing_event record;
  v_contact_ids uuid[];
  v_contact_id uuid;
  v_crm_contact_id uuid;
  v_opportunity_id uuid;
  v_crm_deal_id uuid;
  v_owner_profile_id uuid;
  v_selected_position integer;
  v_next_position integer;
  v_sla_minutes integer;
  v_status text;
  v_next_action_id uuid;
begin
  v_organization_id := nullif(p_payload ->> 'organization_id', '')::uuid;
  v_board_id := nullif(coalesce(p_payload ->> 'boardId', p_payload ->> 'board_id'), '')::uuid;
  v_stage_id := nullif(coalesce(p_payload ->> 'stageId', p_payload ->> 'stage_id'), '')::uuid;
  v_source := lower(btrim(coalesce(p_payload ->> 'source', '')));
  v_external_event_id := btrim(coalesce(p_payload ->> 'externalEventId', p_payload ->> 'external_event_id', ''));
  v_name := btrim(coalesce(p_payload ->> 'name', ''));
  v_phone := nullif(btrim(coalesce(p_payload ->> 'phone', '')), '');
  v_email := nullif(lower(btrim(coalesce(p_payload ->> 'email', ''))), '');
  v_alternate_identifier := nullif(btrim(coalesce(p_payload ->> 'alternateIdentifier', p_payload ->> 'alternate_identifier', '')), '');
  v_metadata := coalesce(p_payload -> 'metadata', '{}'::jsonb);

  if v_organization_id is null or v_board_id is null or v_stage_id is null
     or v_source not in ('site', 'whatsapp', 'agent', 'n8n', 'manual')
     or v_external_event_id = '' or v_name = ''
     or (v_phone is null and v_email is null and v_alternate_identifier is null) then
    raise exception 'Payload de entrada Sucção Zero inválido';
  end if;
  if auth.uid() is not null and public.get_user_org_id() is distinct from v_organization_id then
    raise exception 'Organização da entrada não corresponde à sessão';
  end if;
  if not exists (
    select 1 from public.boards b
    where b.id = v_board_id and b.organization_id = v_organization_id and b.deleted_at is null
  ) then
    raise exception 'Funil fora da organização Sucção Zero';
  end if;
  if not exists (
    select 1 from public.board_stages s
    where s.id = v_stage_id and s.board_id = v_board_id and s.organization_id = v_organization_id
  ) then
    raise exception 'Etapa fora do funil Sucção Zero';
  end if;

  insert into public.succaozero_inbound_events (
    organization_id, source, external_event_id, payload_hash, status
  ) values (
    v_organization_id,
    v_source,
    v_external_event_id,
    encode(extensions.digest(p_payload::text, 'sha256'), 'hex'),
    'received'
  )
  on conflict (organization_id, source, external_event_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select e.* into v_existing_event
    from public.succaozero_inbound_events e
    where e.organization_id = v_organization_id
      and e.source = v_source
      and e.external_event_id = v_external_event_id;

    if v_existing_event.status = 'failed' then
      return jsonb_build_object(
        'eventId', v_existing_event.id,
        'errorCode', coalesce(v_existing_event.last_error, 'failed'),
        'duplicate', true,
        'status', 'failed'
      );
    end if;

    select o.crm_deal_id, o.owner_profile_id
      into v_crm_deal_id, v_owner_profile_id
    from public.succaozero_opportunities o
    where o.id = v_existing_event.opportunity_id;
    select c.crm_contact_id into v_crm_contact_id
    from public.succaozero_contacts c
    where c.id = v_existing_event.contact_id;

    return jsonb_build_object(
      'eventId', v_existing_event.id,
      'contactId', v_existing_event.contact_id,
      'opportunityId', v_existing_event.opportunity_id,
      'crmContactId', v_crm_contact_id,
      'crmDealId', v_crm_deal_id,
      'ownerProfileId', v_owner_profile_id,
      'duplicate', true,
      'status', v_existing_event.status
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(concat_ws(':',
    v_organization_id::text, v_alternate_identifier, v_phone, v_email
  ), 0));

  select array_agg(distinct c.id) into v_contact_ids
  from public.succaozero_contacts c
  where c.organization_id = v_organization_id
    and (
      (v_alternate_identifier is not null and c.source_identifier = v_alternate_identifier)
      or (v_phone is not null and c.phone_e164 = v_phone)
      or (v_email is not null and lower(c.email) = v_email)
    );

  if coalesce(cardinality(v_contact_ids), 0) > 1 then
    update public.succaozero_inbound_events
      set status = 'failed', last_error = 'identity_conflict', attempt_count = attempt_count + 1
    where id = v_event_id;
    return jsonb_build_object(
      'eventId', v_event_id,
      'errorCode', 'identity_conflict',
      'duplicate', false,
      'status', 'failed'
    );
  end if;
  v_contact_id := v_contact_ids[1];

  if v_contact_id is null and v_phone is null and v_email is null
     and v_alternate_identifier like '%@lid' then
    insert into public.succaozero_contacts (
      organization_id, source_identifier, name
    ) values (
      v_organization_id, v_alternate_identifier, v_name
    ) returning id into v_contact_id;

    update public.succaozero_inbound_events
      set status = 'pending_identity', contact_id = v_contact_id,
          attempt_count = attempt_count + 1, processed_at = now()
    where id = v_event_id;

    perform public.succaozero_record_event(
      v_organization_id, null,
      concat(v_source, ':', v_external_event_id, ':lead.received'),
      'lead.received', 'integration', v_source,
      null, jsonb_build_object('contact_id', v_contact_id), v_metadata
    );

    return jsonb_build_object(
      'eventId', v_event_id,
      'contactId', v_contact_id,
      'opportunityId', null,
      'crmContactId', null,
      'crmDealId', null,
      'ownerProfileId', null,
      'duplicate', false,
      'status', 'pending_identity'
    );
  end if;

  if v_contact_id is not null then
    select c.crm_contact_id into v_crm_contact_id
    from public.succaozero_contacts c where c.id = v_contact_id;
  end if;

  if v_crm_contact_id is null then
    select c.id into v_crm_contact_id
    from public.contacts c
    where c.organization_id = v_organization_id
      and c.deleted_at is null
      and ((v_phone is not null and c.phone = v_phone) or (v_email is not null and lower(c.email) = v_email))
    order by c.created_at
    limit 1;
  end if;

  if v_crm_contact_id is null then
    insert into public.contacts (name, phone, email, source, organization_id)
    values (v_name, v_phone, v_email, v_source, v_organization_id)
    returning id into v_crm_contact_id;
  end if;

  if v_contact_id is null then
    insert into public.succaozero_contacts (
      organization_id, crm_contact_id, source_identifier, name, phone_e164, email
    ) values (
      v_organization_id, v_crm_contact_id, v_alternate_identifier, v_name, v_phone, v_email
    ) returning id into v_contact_id;
  else
    update public.succaozero_contacts c
      set crm_contact_id = coalesce(c.crm_contact_id, v_crm_contact_id),
          source_identifier = coalesce(c.source_identifier, v_alternate_identifier),
          phone_e164 = coalesce(c.phone_e164, v_phone),
          email = coalesce(c.email, v_email),
          name = case when c.name = 'Contato sem nome informado' then v_name else c.name end,
          updated_at = now()
    where c.id = v_contact_id;
  end if;

  select o.id, o.crm_deal_id, o.owner_profile_id
    into v_opportunity_id, v_crm_deal_id, v_owner_profile_id
  from public.succaozero_opportunities o
  where o.organization_id = v_organization_id
    and o.board_id = v_board_id
    and o.primary_contact_id = v_contact_id
    and o.status = 'open';

  if v_opportunity_id is not null then
    v_status := case when v_owner_profile_id is null then 'queued_without_owner' else 'processed' end;
    update public.succaozero_inbound_events
      set status = v_status, contact_id = v_contact_id,
          opportunity_id = v_opportunity_id, attempt_count = attempt_count + 1,
          processed_at = now()
    where id = v_event_id;
    perform public.succaozero_record_event(
      v_organization_id, v_opportunity_id,
      concat(v_source, ':', v_external_event_id, ':lead.received'),
      'lead.received', 'integration', v_source,
      null, jsonb_build_object('contact_id', v_contact_id), v_metadata
    );
    return jsonb_build_object(
      'eventId', v_event_id, 'contactId', v_contact_id,
      'opportunityId', v_opportunity_id, 'crmContactId', v_crm_contact_id,
      'crmDealId', v_crm_deal_id, 'ownerProfileId', v_owner_profile_id,
      'duplicate', false, 'status', v_status
    );
  end if;

  insert into public.succaozero_routing_state (organization_id)
  values (v_organization_id)
  on conflict (organization_id) do nothing;
  select s.next_position into v_next_position
  from public.succaozero_routing_state s
  where s.organization_id = v_organization_id
  for update;

  select r.profile_id, r.position
    into v_owner_profile_id, v_selected_position
  from public.succaozero_seller_roster r
  where r.organization_id = v_organization_id
    and r.eligible
    and (r.paused_until is null or r.paused_until <= now())
  order by case when r.position >= v_next_position then 0 else 1 end, r.position
  limit 1;

  insert into public.deals (
    title, value, status, board_id, stage_id, contact_id,
    last_stage_change_date, custom_fields, owner_id, organization_id
  ) values (
    coalesce(nullif(btrim(p_payload ->> 'title'), ''), v_name),
    coalesce(nullif(p_payload ->> 'value', '')::numeric, 0),
    'OPEN', v_board_id, v_stage_id, v_crm_contact_id,
    now(), jsonb_build_object('succaozero_source', v_source, 'external_event_id', v_external_event_id),
    v_owner_profile_id, v_organization_id
  ) returning id into v_crm_deal_id;

  insert into public.succaozero_opportunities (
    organization_id, crm_deal_id, primary_contact_id, board_id, stage_id,
    owner_profile_id, title, value, source, source_event_id
  ) values (
    v_organization_id, v_crm_deal_id, v_contact_id, v_board_id, v_stage_id,
    v_owner_profile_id, coalesce(nullif(btrim(p_payload ->> 'title'), ''), v_name),
    coalesce(nullif(p_payload ->> 'value', '')::numeric, 0), v_source, v_external_event_id
  ) returning id into v_opportunity_id;

  if v_owner_profile_id is not null then
    update public.succaozero_routing_state
      set next_position = v_selected_position + 1,
          version = version + 1,
          updated_at = now()
    where organization_id = v_organization_id;
  end if;

  select s.first_contact_sla_minutes into v_sla_minutes
  from public.succaozero_commercial_settings s
  where s.organization_id = v_organization_id;

  if v_owner_profile_id is not null and v_sla_minutes is not null then
    insert into public.succaozero_next_actions (
      organization_id, opportunity_id, executor_profile_id, kind, due_at, status
    ) values (
      v_organization_id, v_opportunity_id, v_owner_profile_id,
      'FIRST_CONTACT', now() + make_interval(mins => v_sla_minutes), 'open'
    ) returning id into v_next_action_id;
    v_status := 'processed';
  else
    insert into public.succaozero_next_actions (
      organization_id, opportunity_id, executor_profile_id, kind, status, exception_reason
    ) values (
      v_organization_id, v_opportunity_id, v_owner_profile_id, 'FIRST_CONTACT', 'exception',
      case when v_owner_profile_id is null then 'NO_ELIGIBLE_SELLER' else 'SLA_NOT_CONFIGURED' end
    ) returning id into v_next_action_id;
    v_status := case when v_owner_profile_id is null then 'queued_without_owner' else 'processed' end;
  end if;

  update public.succaozero_inbound_events
    set status = v_status, contact_id = v_contact_id, opportunity_id = v_opportunity_id,
        attempt_count = attempt_count + 1, processed_at = now()
  where id = v_event_id;

  perform public.succaozero_record_event(
    v_organization_id, v_opportunity_id,
    concat(v_source, ':', v_external_event_id, ':lead.received'),
    'lead.received', 'integration', v_source,
    null, jsonb_build_object('contact_id', v_contact_id), v_metadata
  );
  if v_owner_profile_id is not null then
    perform public.succaozero_record_event(
      v_organization_id, v_opportunity_id,
      concat(v_source, ':', v_external_event_id, ':owner.assigned'),
      'owner.assigned', 'system', null,
      null, jsonb_build_object('owner_profile_id', v_owner_profile_id), '{}'::jsonb
    );
  end if;
  perform public.succaozero_record_event(
    v_organization_id, v_opportunity_id,
    concat(v_source, ':', v_external_event_id, ':next_action.created'),
    'next_action.created', 'system', null,
    null, jsonb_build_object('next_action_id', v_next_action_id), '{}'::jsonb
  );

  return jsonb_build_object(
    'eventId', v_event_id,
    'contactId', v_contact_id,
    'opportunityId', v_opportunity_id,
    'crmContactId', v_crm_contact_id,
    'crmDealId', v_crm_deal_id,
    'ownerProfileId', v_owner_profile_id,
    'duplicate', false,
    'status', v_status
  );
end;
$$;

create function public.succaozero_transfer_opportunity(
  p_opportunity_id uuid,
  p_new_owner_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_old_owner_id uuid;
  v_crm_deal_id uuid;
begin
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Motivo da transferência é obrigatório';
  end if;

  select o.organization_id, o.owner_profile_id, o.crm_deal_id
    into v_organization_id, v_old_owner_id, v_crm_deal_id
  from public.succaozero_opportunities o
  where o.id = p_opportunity_id and o.status = 'open'
  for update;
  if v_organization_id is null then
    raise exception 'Oportunidade Sucção Zero não encontrada';
  end if;
  if auth.uid() is not null and public.get_user_org_id() is distinct from v_organization_id then
    raise exception 'Oportunidade fora da organização da sessão';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_new_owner_id and p.organization_id = v_organization_id
  ) then
    raise exception 'Novo responsável fora da organização Sucção Zero';
  end if;

  update public.succaozero_opportunities
    set owner_profile_id = p_new_owner_id, updated_at = now()
  where id = p_opportunity_id;
  update public.deals
    set owner_id = p_new_owner_id, updated_at = now()
  where id = v_crm_deal_id and organization_id = v_organization_id;
  update public.succaozero_next_actions
    set executor_profile_id = p_new_owner_id
  where opportunity_id = p_opportunity_id and status = 'open';

  perform public.succaozero_record_event(
    v_organization_id, p_opportunity_id,
    concat('transfer:', gen_random_uuid()),
    'owner.transferred', 'user', auth.uid()::text,
    jsonb_build_object('owner_profile_id', v_old_owner_id),
    jsonb_build_object('owner_profile_id', p_new_owner_id),
    jsonb_build_object('reason', btrim(p_reason))
  );

  return jsonb_build_object(
    'opportunityId', p_opportunity_id,
    'previousOwnerProfileId', v_old_owner_id,
    'ownerProfileId', p_new_owner_id
  );
end;
$$;

revoke all on function public.succaozero_record_event(uuid, uuid, text, text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.succaozero_ingest_lead(jsonb) from public, anon;
revoke all on function public.succaozero_set_seller_roster(jsonb) from public, anon;
revoke all on function public.succaozero_transfer_opportunity(uuid, uuid, text) from public, anon;

grant execute on function public.succaozero_ingest_lead(jsonb) to authenticated, service_role;
grant execute on function public.succaozero_set_seller_roster(jsonb) to authenticated, service_role;
grant execute on function public.succaozero_transfer_opportunity(uuid, uuid, text) to authenticated, service_role;
