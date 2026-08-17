-- HabitCraft — migração 002: recorrência por dia da semana, ícone pixel-art e slug.
-- Rode no SQL Editor do Supabase SE o seu banco já foi criado com a versão anterior
-- do schema.sql. Em banco novo, o schema.sql atualizado já traz tudo isso.
-- Seguro rodar mais de uma vez.

alter table habits add column if not exists slug text;
alter table habits add column if not exists days_of_week smallint[];
alter table habits add column if not exists pixel_icon text;

-- nulls são distintos no Postgres: hábitos sem slug não colidem entre si.
create unique index if not exists habits_user_slug_idx on habits (user_id, slug);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'days_of_week_valid'
  ) then
    alter table habits add constraint days_of_week_valid check (
      days_of_week is null or (
        array_length(days_of_week, 1) between 1 and 7
        and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]
      )
    );
  end if;
end $$;
