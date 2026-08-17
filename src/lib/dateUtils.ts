import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Local calendar date as "YYYY-MM-DD" — avoids the UTC shift of toISOString(). */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Monday-based week start, matching ISO weeks used for weekly_x habits. */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekKey(date: Date): string {
  return toDateKey(weekStart(date));
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function formatFull(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatShort(date: Date): string {
  return format(date, "dd/MM", { locale: ptBR });
}

/** "HH:MM:SS" (Postgres time) -> "HH:MM" */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}
