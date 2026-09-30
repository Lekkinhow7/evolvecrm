do $$
begin
  if nullif(current_setting('app.succaozero_project_ref', true), '') is null then
    raise exception 'app.succaozero_project_ref não configurado';
  end if;

  if exists (
    select 1
    from public.succaozero_disponibilidade_semanal d
    left join public.evolve_profissionais p on p.id = d.profissional_id
    where p.id is null
  ) then
    raise exception 'Rollback bloqueado: profissional Evolve ausente';
  end if;

  if exists (
    select 1
    from public.succaozero_slots_horarios s
    left join public.evolve_disponibilidade_semanal d on d.id = s.disponibilidade_id
    where d.id is null
  ) then
    raise exception 'Rollback bloqueado: disponibilidade Evolve ausente';
  end if;
end $$;

alter table public.succaozero_slots_horarios
  drop constraint succaozero_slots_disponibilidade_fk;

alter table public.succaozero_disponibilidade_semanal
  drop constraint succaozero_disponibilidade_profissional_fk;

alter table public.succaozero_disponibilidade_semanal
  add constraint succaozero_disponibilidade_profissional_id_fkey
  foreign key (profissional_id)
  references public.evolve_profissionais(id)
  on delete cascade;

alter table public.succaozero_slots_horarios
  add constraint succaozero_slots_disponibilidade_id_fkey
  foreign key (disponibilidade_id)
  references public.evolve_disponibilidade_semanal(id)
  on delete cascade;
