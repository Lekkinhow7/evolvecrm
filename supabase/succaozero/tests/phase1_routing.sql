begin;

select set_config('app.succaozero_project_ref', 'synthetic-routing-test', true);

do $$
declare
  v_org uuid := gen_random_uuid();
  v_board uuid := gen_random_uuid();
  v_stage uuid := gen_random_uuid();
  v_seller_a uuid := gen_random_uuid();
  v_seller_b uuid := gen_random_uuid();
  v_seller_c uuid := gen_random_uuid();
  v_result jsonb;
  v_first_opportunity uuid;
  v_duplicate_opportunity uuid;
  v_owner_sequence uuid[];
  v_growth_sequence uuid[];
  v_version bigint;
begin
  insert into public.organizations (id, name)
  values (v_org, 'Sucção Zero — teste sintético');

  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (v_seller_a, 'authenticated', 'authenticated', concat(v_seller_a, '@example.invalid'), '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_seller_b, 'authenticated', 'authenticated', concat(v_seller_b, '@example.invalid'), '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_seller_c, 'authenticated', 'authenticated', concat(v_seller_c, '@example.invalid'), '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.profiles (id, email, name, role, organization_id)
  values
    (v_seller_a, concat(v_seller_a, '@example.invalid'), 'Vendedor A', 'user', v_org),
    (v_seller_b, concat(v_seller_b, '@example.invalid'), 'Vendedor B', 'user', v_org),
    (v_seller_c, concat(v_seller_c, '@example.invalid'), 'Vendedor C', 'user', v_org)
  on conflict (id) do update
    set organization_id = excluded.organization_id, name = excluded.name, role = excluded.role;

  insert into public.boards (id, key, name, organization_id)
  values (v_board, concat('succaozero-test-', v_org), 'Funil sintético', v_org);
  insert into public.board_stages (id, board_id, name, "order", organization_id)
  values (v_stage, v_board, 'Entrada', 0, v_org);
  insert into public.succaozero_commercial_settings (organization_id, first_contact_sla_minutes)
  values (v_org, 30);

  perform public.succaozero_set_seller_roster(jsonb_build_object(
    'organization_id', v_org,
    'sellers', jsonb_build_array(
      jsonb_build_object('profile_id', v_seller_a, 'position', 0, 'eligible', true),
      jsonb_build_object('profile_id', v_seller_b, 'position', 1, 'eligible', true)
    )
  ));

  for i in 1..4 loop
    v_result := public.succaozero_ingest_lead(jsonb_build_object(
      'organization_id', v_org,
      'source', 'site',
      'externalEventId', concat('routing-', i),
      'name', concat('Contato sintético ', i),
      'phone', concat('+55000000000', i),
      'boardId', v_board,
      'stageId', v_stage,
      'metadata', jsonb_build_object('synthetic', true)
    ));
    if i = 1 then v_first_opportunity := (v_result ->> 'opportunityId')::uuid; end if;
  end loop;

  select array_agg(o.owner_profile_id order by o.created_at)
    into v_owner_sequence
  from public.succaozero_opportunities o
  where o.organization_id = v_org;
  if v_owner_sequence is distinct from array[v_seller_a, v_seller_b, v_seller_a, v_seller_b] then
    raise exception 'Sequência A/B inválida: %', v_owner_sequence;
  end if;

  v_result := public.succaozero_ingest_lead(jsonb_build_object(
    'organization_id', v_org, 'source', 'site', 'externalEventId', 'routing-1',
    'name', 'Contato sintético 1', 'phone', '+550000000001',
    'boardId', v_board, 'stageId', v_stage, 'metadata', '{}'::jsonb
  ));
  v_duplicate_opportunity := (v_result ->> 'opportunityId')::uuid;
  if not (v_result ->> 'duplicate')::boolean or v_duplicate_opportunity <> v_first_opportunity then
    raise exception 'Evento repetido não foi idempotente';
  end if;
  select version into v_version from public.succaozero_routing_state where organization_id = v_org;
  if v_version <> 4 then raise exception 'Evento repetido avançou o cursor'; end if;

  perform public.succaozero_set_seller_roster(jsonb_build_object(
    'organization_id', v_org,
    'sellers', jsonb_build_array(
      jsonb_build_object('profile_id', v_seller_a, 'position', 0, 'eligible', true),
      jsonb_build_object('profile_id', v_seller_b, 'position', 1, 'eligible', false),
      jsonb_build_object('profile_id', v_seller_c, 'position', 2, 'eligible', true)
    )
  ));

  for i in 5..9 loop
    perform public.succaozero_ingest_lead(jsonb_build_object(
      'organization_id', v_org, 'source', 'site',
      'externalEventId', concat('routing-', i),
      'name', concat('Contato sintético ', i),
      'phone', concat('+55000000000', i),
      'boardId', v_board, 'stageId', v_stage,
      'metadata', jsonb_build_object('synthetic', true)
    ));
  end loop;

  select array_agg(owner_profile_id order by created_at)
    into v_growth_sequence
  from (
    select o.owner_profile_id, o.created_at
    from public.succaozero_opportunities o
    where o.organization_id = v_org
    order by o.created_at
    offset 4
  ) routed;
  if v_growth_sequence is distinct from array[v_seller_c, v_seller_a, v_seller_c, v_seller_a, v_seller_c] then
    raise exception 'Sequência com crescimento/pausa inválida: %', v_growth_sequence;
  end if;
  if (select owner_profile_id from public.succaozero_opportunities where id = v_first_opportunity) <> v_seller_a then
    raise exception 'Alterar roster redistribuiu carteira existente';
  end if;
end;
$$;

rollback;
