import { addDays, getISODay, subDays } from "date-fns";
import type { CheckIn, Habit, WeekdayISO } from "../types";
import { fromDateKey, toDateKey } from "./dateUtils";

/**
 * A rotina como sistema.
 *
 * Enquanto streaks.ts mede cada hábito isoladamente, aqui a unidade é o DIA
 * inteiro: um dia só "fecha" quando todos os hábitos agendados para aquele dia
 * da semana foram concluídos. Tudo é derivado de `check_ins` + `habits` — não
 * existe tabela de streak.
 */

export function weekdayOf(date: Date): WeekdayISO {
  return getISODay(date) as WeekdayISO;
}

/** Quanto é preciso somar num dia para o hábito contar como feito. */
export function dailyTarget(habit: Habit): number {
  return habit.frequency_type === "multiple_daily" ? (habit.target_quantity ?? 1) : 1;
}

/** O hábito faz parte da rotina desta data? */
export function occursOn(habit: Habit, date: Date): boolean {
  // Antes de existir, o hábito não pode ser cobrado — senão todo dia passado
  // entraria como "falhado" no histórico.
  if (toDateKey(fromDateKey(habit.created_at.slice(0, 10))) > toDateKey(date)) return false;
  if (habit.frequency_type === "one_time") return false;
  if (!habit.days_of_week || habit.days_of_week.length === 0) return true;
  return habit.days_of_week.includes(weekdayOf(date));
}

/** Minutos desde a meia-noite; hábitos sem horário vão para o fim do dia. */
export function minutesOf(habit: Habit): number {
  if (!habit.scheduled_time) return 24 * 60 + 1;
  const [h, m] = habit.scheduled_time.split(":");
  return Number(h) * 60 + Number(m);
}

/** Hábitos da data, em ordem cronológica (sem horário vão para o fim). */
export function habitsForDate(habits: Habit[], date: Date): Habit[] {
  return habits
    .filter((h) => occursOn(h, date))
    .sort((a, b) => minutesOf(a) - minutesOf(b) || a.name.localeCompare(b.name, "pt-BR"));
}

/** Soma de check-ins por `habitId:data`, calculada uma vez e reaproveitada. */
export type ProgressIndex = Map<string, number>;

export function buildProgressIndex(checkIns: CheckIn[]): ProgressIndex {
  const index: ProgressIndex = new Map();
  for (const ci of checkIns) {
    const key = `${ci.habit_id}:${ci.check_date}`;
    index.set(key, (index.get(key) ?? 0) + Number(ci.quantity));
  }
  return index;
}

export function amountOn(index: ProgressIndex, habit: Habit, date: Date): number {
  return index.get(`${habit.id}:${toDateKey(date)}`) ?? 0;
}

export function isDoneOn(index: ProgressIndex, habit: Habit, date: Date): boolean {
  return amountOn(index, habit, date) >= dailyTarget(habit);
}

export interface DayStatus {
  date: Date;
  /** Hábitos agendados para o dia, em ordem cronológica. */
  scheduled: Habit[];
  done: number;
  total: number;
  /** Dia fechado: tinha hábitos e todos foram concluídos. */
  complete: boolean;
  /** Dia sem nenhum hábito agendado — não conta como falha. */
  empty: boolean;
}

export function dayStatus(
  habits: Habit[],
  index: ProgressIndex,
  date: Date,
): DayStatus {
  const scheduled = habitsForDate(habits, date);
  const done = scheduled.filter((h) => isDoneOn(index, h, date)).length;
  return {
    date,
    scheduled,
    done,
    total: scheduled.length,
    complete: scheduled.length > 0 && done === scheduled.length,
    empty: scheduled.length === 0,
  };
}

/** Primeiro hábito ainda pendente do dia, na ordem cronológica. */
export function nextPending(
  habits: Habit[],
  index: ProgressIndex,
  date: Date,
): Habit | null {
  return habitsForDate(habits, date).find((h) => !isDoneOn(index, h, date)) ?? null;
}

/**
 * Sequência de dias consecutivos com a rotina inteira fechada. Contínua ao longo
 * do tempo — não tem nada a ver com semana. O dia de hoje ainda em andamento não
 * quebra a sequência; ele só entra quando fecha.
 */
export function systemStreak(
  habits: Habit[],
  index: ProgressIndex,
  today = new Date(),
): number {
  const todayStatus = dayStatus(habits, index, today);
  let cursor = todayStatus.complete ? today : subDays(today, 1);
  let streak = 0;

  // teto de segurança: 2 anos de histórico
  for (let guard = 0; guard < 730; guard++) {
    const status = dayStatus(habits, index, cursor);
    // dia sem hábitos agendados (ex: hábito ainda não existia) encerra a contagem
    if (status.empty || !status.complete) break;
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export interface AdherenceStats {
  /** Dias fechados na janela. */
  completeDays: number;
  /** Dias avaliáveis (tinham pelo menos um hábito agendado). */
  evaluatedDays: number;
  /** Percentual 0–100; 0 quando ainda não há dias avaliáveis. */
  rate: number;
}

/**
 * Taxa de aderência de longo prazo: % de dias fechados na janela.
 * O dia de hoje só entra na conta depois de fechado — enquanto está em
 * andamento ele não deve puxar a média para baixo.
 */
export function adherence(
  habits: Habit[],
  index: ProgressIndex,
  today = new Date(),
  windowDays = 30,
): AdherenceStats {
  let completeDays = 0;
  let evaluatedDays = 0;

  for (let i = 0; i < windowDays; i++) {
    const date = subDays(today, i);
    const status = dayStatus(habits, index, date);
    if (status.empty) continue;
    if (i === 0 && !status.complete) continue;
    evaluatedDays++;
    if (status.complete) completeDays++;
  }

  return {
    completeDays,
    evaluatedDays,
    rate: evaluatedDays === 0 ? 0 : Math.round((completeDays / evaluatedDays) * 100),
  };
}

/**
 * "Nunca falhe duas vezes": ontem ficou pela metade?
 * Retorna null quando ontem fechou, estava vazio ou nem foi começado — o aviso
 * é para retomar uma rotina interrompida, não para cobrar quem estava de folga.
 */
export function missedYesterday(
  habits: Habit[],
  index: ProgressIndex,
  today = new Date(),
): DayStatus | null {
  const status = dayStatus(habits, index, subDays(today, 1));
  if (status.empty || status.complete) return null;
  return status;
}

/** Os 7 dias da semana (segunda a domingo) que contêm a data. */
export function weekDaysOf(date: Date): Date[] {
  const monday = subDays(date, weekdayOf(date) - 1);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
