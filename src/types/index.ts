export type FrequencyType = "daily" | "one_time" | "multiple_daily" | "weekly_x";

export type BlockColor =
  | "grass"
  | "dirt"
  | "stone"
  | "wood"
  | "copper"
  | "silver"
  | "gold"
  | "diamond"
  | "emerald"
  | "netherite"
  | "redstone";

/** Dia da semana no padrão ISO: 1 = segunda ... 7 = domingo. */
export type WeekdayISO = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ALL_WEEKDAYS: WeekdayISO[] = [1, 2, 3, 4, 5, 6, 7];

export const WEEKDAY_ABBR: Record<WeekdayISO, string> = {
  1: "SEG",
  2: "TER",
  3: "QUA",
  4: "QUI",
  5: "SEX",
  6: "SAB",
  7: "DOM",
};

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: BlockColor;
  frequency_type: FrequencyType;
  target_quantity: number | null;
  target_unit: string | null;
  weekly_target_count: number | null;
  scheduled_time: string | null; // "HH:MM:SS"
  category: string | null;
  archived: boolean;
  created_at: string;
  /** Identificador estável usado pelo seed da rotina; null para hábitos criados na interface. */
  slug: string | null;
  /** Dias em que o hábito acontece; null = todos os dias. */
  days_of_week: WeekdayISO[] | null;
  /** Chave do ícone pixel-art (theme/pixelIcons.ts); null = usa o emoji de `icon`. */
  pixel_icon: string | null;
  /**
   * "habit" = hábito com check-in.
   * "block" = tempo ocupado (ex: trabalho): aparece na grade e nas listas como
   * contexto, mas não se marca e não entra em nenhuma métrica.
   */
  kind: HabitKind;
  /** Fim do bloco fixo ("HH:MM:SS"); hábito não usa. */
  end_time: string | null;
}

export type HabitKind = "habit" | "block";

/**
 * `slug` fica de fora: é gerenciado pelo seed, não pela tela de cadastro.
 * `kind`/`end_time` também: a tela de cadastro só cria hábitos — blocos fixos
 * vêm do seed.
 */
export type HabitInput = Omit<
  Habit,
  "id" | "user_id" | "archived" | "created_at" | "slug" | "kind" | "end_time"
>;

export interface CheckIn {
  id: string;
  habit_id: string;
  user_id: string;
  check_date: string; // "YYYY-MM-DD"
  quantity: number;
  created_at: string;
}

export type BadgeMetric = "streak" | "total";

export const MILESTONES = [7, 30, 50, 100, 200, 365] as const;
export type Milestone = (typeof MILESTONES)[number];

export interface Badge {
  id: string;
  habit_id: string;
  user_id: string;
  metric_type: BadgeMetric;
  milestone: Milestone;
  achieved_at: string;
}

export const MILESTONE_TIER: Record<Milestone, { label: string; color: BlockColor }> = {
  7: { label: "Madeira", color: "wood" },
  30: { label: "Cobre", color: "copper" },
  50: { label: "Prata", color: "silver" },
  100: { label: "Ouro", color: "gold" },
  200: { label: "Diamante", color: "diamond" },
  365: { label: "Netherite", color: "netherite" },
};
