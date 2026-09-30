do $$
begin
  if nullif(current_setting('app.succaozero_project_ref', true), '') is null then
    raise exception 'app.succaozero_project_ref não configurado';
  end if;

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

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select c.conname, child.relname as child_table
    from pg_constraint c
    join pg_class child on child.oid = c.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = c.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    where c.contype = 'f'
      and child_ns.nspname = 'public'
      and parent_ns.nspname = 'public'
      and (
        (child.relname = 'succaozero_disponibilidade_semanal' and parent.relname = 'evolve_profissionais')
        or (child.relname = 'succaozero_slots_horarios' and parent.relname = 'evolve_disponibilidade_semanal')
      )
  loop
    execute format('alter table public.%I drop constraint %I', constraint_row.child_table, constraint_row.conname);
  end loop;
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
