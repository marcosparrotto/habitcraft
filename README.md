# HabitCraft

App pessoal de rastreamento de hábitos com tema visual blocky/pixel-art e gamificação
(streaks, XP, medalhas por marcos). React + Vite + Tailwind + Supabase.

## Setup

### 1. Supabase

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com) (plano free serve).
2. No painel do projeto, vá em **SQL Editor > New query**, cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e execute.
3. Vá em **Authentication > Users > Add user**, crie seu usuário único (email + senha).
   Não existe tela de cadastro no app — o login usa essas credenciais.
4. Em **Project Settings > API**, copie a `Project URL` e a chave `anon public`.

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local` com a URL e a anon key do passo anterior. O arquivo está no
`.gitignore` (padrão `*.local`) e não vai para o repositório.

### 3. Rodar

```bash
npm install
npm run dev
```

### 4. Rotina semanal (seed)

No SQL Editor, nesta ordem:

1. [`supabase/000_reset_dados.sql`](supabase/000_reset_dados.sql) — **opcional e
   destrutivo**: apaga todos os hábitos, check-ins e medalhas. Use só para começar do
   zero; hábitos criados pela interface têm `slug` nulo e não seriam sobrescritos pelo
   seed, virando duplicatas.
2. [`supabase/002_rotina.sql`](supabase/002_rotina.sql) — adiciona `slug`,
   `days_of_week` e `pixel_icon` em `habits`. Pule se o banco foi criado com a versão
   atual do `schema.sql`, que já traz essas colunas.
3. [`supabase/seed_rotina.sql`](supabase/seed_rotina.sql) — insere os 9 hábitos da
   rotina com horário, dias da semana e ícone pixel-art. Idempotente: rodar de novo
   atualiza em vez de duplicar. Pega o primeiro usuário de `auth.users`, então crie o
   usuário antes.

### Sandbox de UI (opcional)

`sandbox.html` roda o app com um Supabase falso em memória, sem login, pra mexer em
layout/tema sem tocar nos dados reais:

```bash
npm run dev
```

Depois abra `http://localhost:5173/sandbox.html` — `?hora=8` ou `?hora=21` congelam o
relógio pra testar o tema automático. Só existe em dev (`src/dev/`).

## Tipos de frequência

| Tipo             | Unidade de progresso | Completa quando                          |
| ---------------- | -------------------- | ---------------------------------------- |
| `daily`          | dia                  | 1 check-in no dia                        |
| `multiple_daily` | dia                  | soma dos check-ins ≥ meta (ex: 8 copos)  |
| `weekly_x`       | **semana**           | nº de check-ins na semana ≥ meta (ex: 3) |
| `one_time`       | —                    | 1 check-in (sem streak/medalhas)         |

Hábitos `weekly_x` usam a semana como unidade porque "3x por semana" não pode ser
julgado dia a dia — a streak deles conta semanas consecutivas, não dias.

## Medalhas

Marcos em 7 / 30 / 50 / 100 / 200 / 365, aplicados a duas métricas independentes por
hábito: **sequência** (🔥 consecutivos) e **total** (📦 acumulado, com falhas no meio).

| Marco | Medalha   |
| ----- | --------- |
| 7     | Madeira   |
| 30    | Cobre     |
| 50    | Prata     |
| 100   | Ouro      |
| 200   | Diamante  |
| 365   | Netherite |

## A rotina como sistema

Além de medir cada hábito, o app mede se a **rotina inteira** está de pé. Um dia só
"fecha" quando todos os hábitos agendados para aquele dia da semana foram concluídos.

| Métrica            | Definição                                                              |
| ------------------ | ---------------------------------------------------------------------- |
| Sequência          | dias consecutivos com o dia fechado — contínua, não zera na virada da semana |
| Aderência 30d      | % de dias fechados nos últimos 30 dias (dias sem hábito não contam)     |
| "Retome hoje"      | aviso gentil quando ontem ficou incompleto (nunca falhe duas vezes)     |

Tudo é derivado de `check_ins` + `habits` em [`src/lib/routine.ts`](src/lib/routine.ts) —
não existe tabela nem coluna de streak.

## Abas

- **Hoje** — fluxo guiado: mostra só a próxima atividade pendente (spotlight), toca a
  animação de conclusão e avisa qual é a próxima. A lista completa do dia fica
  colapsada. É onde ficam as métricas de sistema.
- **Semana** — painel panorâmico dos 7 dias, com edição retroativa e a grade de
  horários. Mesma tabela `check_ins` da aba Hoje: uma fonte de verdade só.
- **Hábitos** — CRUD, incluindo dias da semana e ícone pixel-art.
- **Histórico** — gráficos, heatmap e medalhas.

## Tema dia/noite

O app clareia e escurece junto com o dia real. Um único fator de luz (`--night-mix`,
0% = pleno dia, 100% = noite) interpola todos os tokens semânticos via `color-mix()`;
componente nenhum hardcoda cor de superfície ou texto. A troca é gradual nas janelas
de 05h30–07h e 17h30–19h, e o usuário pode fixar em Automático / Sempre claro /
Sempre escuro (persistido em `localStorage`).

- `src/theme/daylight.ts` — cálculo do fator de luz; `src/lib/ThemeContext.tsx` aplica.
- Tokens: `bg`, `panel`, `panel-light`, `edge`, `ink`, `ink-dim`, `accent`, `highlight`,
  `sky-*`. As cores de bloco (minério) não mudam com o tema — cada uma carrega a cor de
  texto que passa em AA sobre ela.

## Estrutura

- `src/lib/streaks.ts` — streak, total e taxa por hábito a partir dos check-ins (nada é
  armazenado pré-calculado, evitando divergência entre contador e dados). Dias fora do
  `days_of_week` são pulados, não contam como falha.
- `src/lib/routine.ts` — a rotina como sistema: dia fechado, streak contínuo, aderência.
- `src/queries/` — hooks React Query para hábitos, check-ins e medalhas.
- `src/routes/` — Hoje, Semana, Hábitos, Histórico.
- `src/theme/` — paleta de blocos, ícones pixel-art 8x8 e ciclo de luz.
