import { addDays, getISODay, subDays, subWeeks, isBefore } from "date-fns";
import type { CheckIn, Habit, Milestone, WeekdayISO } from "../types";
import { MILESTONES } from "../types";
import { fromDateKey, toDateKey, weekKey, weekStart } from "./dateUtils";

/**
 * A habit's progress unit is the day, except for weekly_x habits where the
 * unit is the whole week — a "3x per week" habit can't be judged day by day.
 */
export function unitOf(habit: Habit): "day" | "week" {
  return habit.frequency_type === "weekly_x" ? "week" : "day";
}

/**
 * Um hábito de segunda e quarta não pode ser cobrado na terça: dias fora do
 * `days_of_week` são pulados no cálculo de sequência, não contam como falha.
 * `null`/vazio = todos os dias.
 */
export function isScheduledDay(habit: Habit, date: Date): boolean {
  if (unitOf(habit) === "week") return true;
  if (!habit.days_of_week || habit.days_of_week.length === 0) return true;
  return habit.days_of_week.includes(getISODay(date) as WeekdayISO);
}

export function unitKey(habit: Habit, date: Date): string {
  return unitOf(habit) === "week" ? weekKey(date) : toDateKey(date);
}

/** Sums check-in quantity per unit key (day or week) for one habit. */
export function progressByUnit(habit: Habit, checkIns: CheckIn[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const ci of checkIns) {
    if (ci.habit_id !== habit.id) continue;
    const key = unitKey(habit, fromDateKey(ci.check_date));
    totals.set(key, (totals.get(key) ?? 0) + Number(ci.quantity));
  }
  return totals;
}

/** How much is needed for one unit (day/week) to count as complete. */
export function unitTarget(habit: Habit): number {
  switch (habit.frequency_type) {
    case "multiple_daily":
      return habit.target_quantity ?? 1;
    case "weekly_x":
      return habit.weekly_target_count ?? 1;
    default:
      return 1;
  }
}

export function isUnitComplete(habit: Habit, amount: number): boolean {
  return amount >= unitTarget(habit);
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  todayAmount: number;
  todayTarget: number;
  todayComplete: boolean;
}

export function computeStats(habit: Habit, checkIns: CheckIn[], today = new Date()): HabitStats {
  const totals = progressByUnit(habit, checkIns);
  const target = unitTarget(habit);
  const unit = unitOf(habit);

  const completedKeys = new Set(
    [...totals.entries()].filter(([, amount]) => isUnitComplete(habit, amount)).map(([key]) => key),
  );

  const todayAmount = totals.get(unitKey(habit, today)) ?? 0;

  // one_time habits are done-or-not: no streaks, no accumulation beyond 1.
  if (habit.frequency_type === "one_time") {
    const done = completedKeys.size > 0;
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalCompleted: done ? 1 : 0,
      todayAmount,
      todayTarget: target,
      todayComplete: done,
    };
  }

  const step = (d: Date, n: number) => (unit === "week" ? subWeeks(d, n) : subDays(d, n));
  const currentUnitStart = unit === "week" ? weekStart(today) : today;

  // The current unit being incomplete doesn't break the streak yet — it's still
  // in progress — so start counting from the previous unit in that case.
  let cursor = completedKeys.has(unitKey(habit, currentUnitStart))
    ? currentUnitStart
    : step(currentUnitStart, 1);

  let currentStreak = 0;
  // guard: hábitos semanais/diários com histórico longo, sem risco de loop infinito
  for (let guard = 0; guard < 3650; guard++) {
    if (!isScheduledDay(habit, cursor)) {
      cursor = step(cursor, 1);
      continue;
    }
    if (!completedKeys.has(unitKey(habit, cursor))) break;
    currentStreak++;
    cursor = step(cursor, 1);
  }

  const bestStreak = computeBestStreak(habit, completedKeys, unit);

  return {
    currentStreak,
    bestStreak,
    totalCompleted: completedKeys.size,
    todayAmount,
    todayTarget: target,
    todayComplete: completedKeys.has(unitKey(habit, today)),
  };
}

function computeBestStreak(
  habit: Habit,
  completedKeys: Set<string>,
  unit: "day" | "week",
): number {
  if (completedKeys.size === 0) return 0;

  const sorted = [...completedKeys].map(fromDateKey).sort((a, b) => a.getTime() - b.getTime());
  const advance = (d: Date) => (unit === "week" ? addDays(d, 7) : addDays(d, 1));

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(habit, sorted[i - 1], sorted[i], unit, advance)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Dois dias concluídos são consecutivos quando não existe nenhum dia AGENDADO
 * entre eles — o intervalo de um hábito de seg/qua não conta como quebra.
 */
function isConsecutive(
  habit: Habit,
  previous: Date,
  current: Date,
  unit: "day" | "week",
  advance: (d: Date) => Date,
): boolean {
  const currentKey = toDateKey(current);
  let cursor = advance(previous);
  for (let guard = 0; guard < 3650; guard++) {
    if (toDateKey(cursor) === currentKey) return true;
    if (toDateKey(cursor) > currentKey) return false;
    if (unit === "day" && !isScheduledDay(habit, cursor)) {
      cursor = advance(cursor);
      continue;
    }
    return false;
  }
  return false;
}

/** Milestones reached for a given metric value. */
export function reachedMilestones(value: number): Milestone[] {
  return MILESTONES.filter((m) => value >= m);
}

export function nextMilestone(value: number): Milestone | null {
  return MILESTONES.find((m) => value < m) ?? null;
}

/** Percentage of units completed between two dates — used by the history charts. */
export function completionRate(
  habit: Habit,
  checkIns: CheckIn[],
  start: Date,
  end: Date,
): { completed: number; expected: number; rate: number } {
  const totals = progressByUnit(habit, checkIns);
  const unit = unitOf(habit);
  const created = fromDateKey(habit.created_at.slice(0, 10));
  const effectiveStart = isBefore(start, created) ? created : start;

  const keys = new Set<string>();
  const advance = (d: Date) => (unit === "week" ? addDays(d, 7) : addDays(d, 1));
  for (let d = unit === "week" ? weekStart(effectiveStart) : effectiveStart; d <= end; d = advance(d)) {
    if (!isScheduledDay(habit, d)) continue;
    keys.add(unitKey(habit, d));
  }

  let completed = 0;
  for (const key of keys) {
    if (isUnitComplete(habit, totals.get(key) ?? 0)) completed++;
  }

  const expected = keys.size;
  return { completed, expected, rate: expected === 0 ? 0 : (completed / expected) * 100 };
}
