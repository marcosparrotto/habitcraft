-- HabitCraft — seed da rotina semanal.
-- Dados fictícios para demonstração; não representam a rotina do autor.
-- Opcional, para banco novo: execute após schema.sql e a criação do usuário.
-- Idempotente: atualiza os exemplos existentes pelo slug.
--

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
    ('planejar_dia',     'Planejar o dia',      '🙏', 'book_gold',   'gold',      time '07:00', array[1,2,3,4,5,6,7]::smallint[], 'Organização', 'daily',          null::integer, null::text),
    ('alongamento',  'Alongamento', '🐾', 'bone',        'grass',     time '07:15', array[1,2,3,4,5,6,7]::smallint[], 'Movimento',  'daily',          null,          null),
    ('estudo',    'Estudar um tema novo',          '📚', 'book_purple', 'diamond',   time '08:00', array[1,2,3,4,5]::smallint[],     'Carreira',   'daily',          null,          null),
    ('revisao', 'Revisar anotações',          '✍️', 'note',        'copper',    time '08:30', array[1,3]::smallint[],           'Idiomas',    'daily',          null,          null),
    ('exercicio',       'Exercício físico',            '🏋️', 'dumbbell',    'redstone',  time '12:30', array[1,2,3,4,5]::smallint[],     'Movimento',  'daily',          null,          null),
    ('curso',    'Curso online',                  '🧠', 'note',        'copper',    time '18:30', array[1,3]::smallint[],           'Idiomas',    'daily',          null,          null),
    ('caminhada',  'Caminhada',                 '🐾', 'bone',        'emerald',   time '20:00', array[1,2,3,4,5,6,7]::smallint[], 'Movimento',  'daily',          null,          null),
    ('leitura',        'Leitura de ficção',               '📖', 'book_red',    'wood',      time '21:30', array[1,2,3,4,5,6,7]::smallint[], 'Lazer',      'daily',          null,          null),
    ('dormir',         'Preparar para dormir',                  '😴', 'bed',         'netherite', time '22:00', array[1,2,3,4,5,6,7]::smallint[], 'Sono',       'daily',          null,          null),
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
  kind            = 'habit',
  frequency_type  = excluded.frequency_type,
  scheduled_time  = excluded.scheduled_time,
  days_of_week    = excluded.days_of_week,
  category        = excluded.category,
  target_quantity = excluded.target_quantity,
  target_unit     = excluded.target_unit,
  archived        = false;

-- ============ blocos fixos ============
-- Tempo ocupado, não hábito: ocupa a grade e dá contexto ao dia, mas não tem
-- check-in e não entra em sequência, aderência, XP ou medalhas.
insert into habits (
  user_id, slug, name, icon, pixel_icon, color, kind,
  frequency_type, scheduled_time, end_time, days_of_week, category, archived
)
select
  u.id, 'trabalho', 'Trabalho', '💼', 'briefcase', 'stone', 'block',
  'daily', time '10:00', time '17:00', array[1,2,3,4,5]::smallint[], 'Trabalho', false
from (select id from auth.users order by created_at asc limit 1) u
on conflict (user_id, slug) do update set
  name           = excluded.name,
  icon           = excluded.icon,
  pixel_icon     = excluded.pixel_icon,
  color          = excluded.color,
  kind           = excluded.kind,
  scheduled_time = excluded.scheduled_time,
  end_time       = excluded.end_time,
  days_of_week   = excluded.days_of_week,
  category       = excluded.category,
  archived       = false;

-- confira o resultado:
select slug, name, kind, scheduled_time, end_time, days_of_week, target_quantity
from habits
order by kind, scheduled_time nulls last;
