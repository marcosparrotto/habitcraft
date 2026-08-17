-- HabitCraft — reset de dados (DESTRUTIVO, sem volta).
--
-- Apaga TODOS os hábitos, check-ins e medalhas para começar do zero antes de
-- rodar 002_rotina.sql e seed_rotina.sql.
--
-- NÃO apaga: o seu usuário em auth.users, nem as tabelas em si. Só o conteúdo.
-- NÃO há backup. Se quiser um, rode antes:
--   create table habits_backup    as select * from habits;
--   create table check_ins_backup as select * from check_ins;
--   create table badges_backup    as select * from badges;
--
-- Ordem de execução no SQL Editor:
--   1) este arquivo        (limpa)
--   2) 002_rotina.sql      (colunas novas — pule se o banco já é novo, feito com o schema.sql atual)
--   3) seed_rotina.sql     (insere os 9 hábitos da rotina)

begin;

-- badges e check_ins cairiam pelo cascade de habits, mas apagar na ordem
-- explícita deixa claro o que está saindo.
delete from badges;
delete from check_ins;
delete from habits;

commit;

-- deve retornar 0, 0, 0
select
  (select count(*) from habits)    as habitos,
  (select count(*) from check_ins) as check_ins,
  (select count(*) from badges)    as medalhas;
