-- HabitCraft — schema inicial
-- Rode este script inteiro no SQL Editor do seu projeto Supabase (dashboard > SQL Editor > New query).
-- Uso pessoal / conta única: RLS restringe cada linha ao seu próprio user_id (auth.uid()).

create extension if not exists "pgcrypto";

-- ============ habits ============
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null check (color in (
    'grass','dirt','stone','wood','copper','silver','gold','diamond','emerald','netherite','redstone'
  )),
  frequency_type text not null check (frequency_type in ('daily','one_time','multiple_daily','weekly_x')),
  target_quantity integer,
  target_unit text,
  weekly_target_count integer,
  scheduled_time time,
  category text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  -- identificador estável do hábito, usado por scripts de seed (idempotência).
  slug text,
  -- dias da semana em que o hábito acontece, ISO: 1=segunda ... 7=domingo.
  -- null = todos os dias (comportamento padrão de quem cria pela interface).
  days_of_week smallint[],
  -- chave do ícone pixel-art (ver src/theme/pixelIcons.ts); `icon` segue como fallback emoji.
  pixel_icon text,
  -- 'habit' = hábito com check-in; 'block' = tempo ocupado (ex: trabalho), que
  -- aparece na grade mas não se marca nem entra em nenhuma métrica.
  kind text not null default 'habit' check (kind in ('habit', 'block')),
  -- fim do bloco fixo; hábito não usa.
  end_time time,
  constraint multiple_daily_needs_target check (
    frequency_type <> 'multiple_daily' or (target_quantity is not null and target_quantity > 0)
  ),
  constraint weekly_x_needs_target check (
    frequency_type <> 'weekly_x' or (weekly_target_count is not null and weekly_target_count > 0)
  ),
  constraint days_of_week_valid check (
    days_of_week is null or (
      array_length(days_of_week, 1) between 1 and 7
      and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]
    )
  ),
  constraint block_needs_range check (
    kind <> 'block' or (
      scheduled_time is not null and end_time is not null and end_time > scheduled_time
    )
  )
);

create index if not exists habits_kind_idx on habits (user_id, kind);

-- nulls são distintos no Postgres: hábitos sem slug (criados pela interface) não colidem.
create unique index if not exists habits_user_slug_idx on habits (user_id, slug);

alter table habits enable row level security;

create policy "habits_select_own" on habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on habits for delete using (auth.uid() = user_id);

-- ============ check_ins ============
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null,
  quantity numeric not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists check_ins_habit_date_idx on check_ins (habit_id, check_date);

alter table check_ins enable row level security;

create policy "check_ins_select_own" on check_ins for select using (auth.uid() = user_id);
create policy "check_ins_insert_own" on check_ins for insert with check (auth.uid() = user_id);
create policy "check_ins_update_own" on check_ins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "check_ins_delete_own" on check_ins for delete using (auth.uid() = user_id);

-- ============ badges ============
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null check (metric_type in ('streak','total')),
  milestone integer not null check (milestone in (7,30,50,100,200,365)),
  achieved_at timestamptz not null default now(),
  unique (habit_id, metric_type, milestone)
);

alter table badges enable row level security;

create policy "badges_select_own" on badges for select using (auth.uid() = user_id);
create policy "badges_insert_own" on badges for insert with check (auth.uid() = user_id);
create policy "badges_delete_own" on badges for delete using (auth.uid() = user_id);

-- ============ setup do usuário único ============
-- Depois de rodar este script, crie sua conta em:
-- Authentication > Users > Add user (email + senha) no painel do Supabase.
-- Não há tela de cadastro no app — login direto com essas credenciais.
