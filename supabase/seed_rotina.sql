-- HabitCraft — seed da rotina semanal.
-- Fonte de verdade: DAY_TEMPLATES do painel rotina-semanal.html.
-- Rode no SQL Editor do Supabase DEPOIS de schema.sql (+ 002_rotina.sql, se banco antigo).
-- Idempotente: rodar de novo atualiza as linhas existentes em vez de duplicar.
--
-- Os 3 perfis de dia (ing / academia / weekend) compartilham ids, então viram hábitos
-- únicos com days_of_week = união dos dias em que aparecem:
--   ing      = segunda (1) e quarta (3)
--   academia = terça (2), quinta (4) e sexta (5)
--   weekend  = sábado (6) e domingo (7)
--
-- Ajustes posteriores ao painel original:
--   academia = todo dia útil (1-5) às 12:00, não só ter/qui/sex às 12:30
--   agua     = hábito sem horário, meta de 8 copos (novo)

with alvo as (
  -- conta única: pega o primeiro usuário do projeto.
  -- Se você tiver mais de um, troque por:  select id from auth.users where email = 'seu@email'
  select id as user_id from auth.users order by created_at asc limit 1
),
rotina(
  slug, name, icon, pixel_icon, color, scheduled_time, days_of_week, category,
  frequency_type, target_quantity, target_unit
) as (
  values
    ('devocional',     'Devocional (2-3 capítulos)',      '🙏', 'book_gold',   'gold',      time '06:35', array[1,2,3,4,5,6,7]::smallint[], 'Espiritual', 'daily',          null::integer, null::text),
    ('passeio_manha',  'Passeio manhã + podcast técnico', '🐾', 'bone',        'grass',     time '06:50', array[1,2,3,4,5,6,7]::smallint[], 'Movimento',  'daily',          null,          null),
    ('estudo_cert',    'Estudo de certificação',          '📚', 'book_purple', 'diamond',   time '07:45', array[1,2,3,4,5]::smallint[],     'Carreira',   'daily',          null,          null),
    ('ingles_revisao', 'Revisão leve de inglês',          '✍️', 'note',        'copper',    time '08:10', array[1,3]::smallint[],           'Idiomas',    'daily',          null,          null),
    ('academia',       'Academia (no almoço)',            '🏋️', 'dumbbell',    'redstone',  time '12:00', array[1,2,3,4,5]::smallint[],     'Movimento',  'daily',          null,          null),
    ('ingles_aula',    'Aula de inglês',                  '🧠', 'note',        'copper',    time '18:15', array[1,3]::smallint[],           'Idiomas',    'daily',          null,          null),
    ('passeio_noite',  'Passeio noturno',                 '🐾', 'bone',        'emerald',   time '19:30', array[1,2,3,4,5,6,7]::smallint[], 'Movimento',  'daily',          null,          null),
    ('leitura',        'Leitura de ficção',               '📖', 'book_red',    'wood',      time '22:30', array[1,2,3,4,5,6,7]::smallint[], 'Lazer',      'daily',          null,          null),
    ('dormir',         'Dormir até 23h',                  '😴', 'bed',         'netherite', time '23:00', array[1,2,3,4,5,6,7]::smallint[], 'Sono',       'daily',          null,          null),
    -- sem horário: aparece na seção "a qualquer hora" da aba Hoje. Só fecha o
    -- dia com a meta cheia, mas o check-in é de um copo por vez.
    ('agua',           'Beber água',                      '💧', null,          'diamond',   null,         array[1,2,3,4,5,6,7]::smallint[], 'Saúde',      'multiple_daily', 8,             'copos')
)
insert into habits (
  user_id, slug, name, icon, pixel_icon, color,
  frequency_type, scheduled_time, days_of_week, category, archived,
  target_quantity, target_unit
)
select
  alvo.user_id, r.slug, r.name, r.icon, r.pixel_icon, r.color,
  r.frequency_type, r.scheduled_time, r.days_of_week, r.category, false,
  r.target_quantity, r.target_unit
from alvo cross join rotina r
on conflict (user_id, slug) do update set
  name            = excluded.name,
  icon            = excluded.icon,
  pixel_icon      = excluded.pixel_icon,
  color           = excluded.color,
  frequency_type  = excluded.frequency_type,
  scheduled_time  = excluded.scheduled_time,
  days_of_week    = excluded.days_of_week,
  category        = excluded.category,
  target_quantity = excluded.target_quantity,
  target_unit     = excluded.target_unit,
  archived        = false;

-- confira o resultado:
select slug, name, scheduled_time, days_of_week, target_quantity
from habits
order by scheduled_time nulls last;
