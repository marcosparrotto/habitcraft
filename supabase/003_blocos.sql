-- HabitCraft — migração 003: blocos fixos (compromissos que não são hábitos).
-- Rode no SQL Editor. Seguro rodar mais de uma vez.
--
-- Um bloco fixo (ex: trabalho, 09h–18h de seg a sex) ocupa a grade de horários
-- e dá contexto ao dia, mas NÃO se marca: não tem check-in, não fecha o dia,
-- não entra em sequência, aderência, XP nem medalhas. É só tempo ocupado.

alter table habits add column if not exists kind text not null default 'habit';
alter table habits add column if not exists end_time time;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'habits_kind_valid') then
    alter table habits add constraint habits_kind_valid
      check (kind in ('habit', 'block'));
  end if;

  -- bloco precisa de começo e fim, e o fim tem que vir depois do começo
  if not exists (select 1 from pg_constraint where conname = 'block_needs_range') then
    alter table habits add constraint block_needs_range check (
      kind <> 'block' or (
        scheduled_time is not null
        and end_time is not null
        and end_time > scheduled_time
      )
    );
  end if;
end $$;

create index if not exists habits_kind_idx on habits (user_id, kind);
