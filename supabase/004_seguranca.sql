-- HabitCraft — migração 004: endurecimento das políticas de acesso.
-- Rode no SQL Editor. Seguro rodar mais de uma vez.
--
-- As políticas originais garantem que cada linha pertence a quem a lê e escreve
-- (auth.uid() = user_id). Falta um degrau: nada impede que um check-in ou uma
-- medalha aponte para o habit_id de OUTRA pessoa, desde que o user_id seja o seu.
-- Em app de usuário único isso é inofensivo, mas se o cadastro público ficar
-- aberto, ou se um dia o app virar multiusuário, vira brecha de integridade.
--
-- Isto NÃO substitui desligar o cadastro público em
-- Authentication > Providers > Email > "Allow new users to sign up".

-- ============ check_ins ============
drop policy if exists "check_ins_insert_own" on check_ins;
create policy "check_ins_insert_own" on check_ins
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from habits h
      where h.id = check_ins.habit_id and h.user_id = auth.uid()
    )
  );

drop policy if exists "check_ins_update_own" on check_ins;
create policy "check_ins_update_own" on check_ins
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from habits h
      where h.id = check_ins.habit_id and h.user_id = auth.uid()
    )
  );

-- ============ badges ============
drop policy if exists "badges_insert_own" on badges;
create policy "badges_insert_own" on badges
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from habits h
      where h.id = badges.habit_id and h.user_id = auth.uid()
    )
  );

-- confira as políticas ativas:
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
