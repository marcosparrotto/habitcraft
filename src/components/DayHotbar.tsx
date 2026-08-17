import { WEEKDAY_ABBR } from "../types";
import type { WeekdayISO } from "../types";
import { toDateKey, todayKey } from "../lib/dateUtils";
import { weekdayOf } from "../lib/routine";

export interface HotbarDay {
  date: Date;
  done: number;
  total: number;
  complete: boolean;
}

interface DayHotbarProps {
  days: HotbarDay[];
  selected: Date;
  onSelect: (date: Date) => void;
}

/** Hotbar de dias — os slots de inventário do painel de rotina. */
export function DayHotbar({ days, selected, onSelect }: DayHotbarProps) {
  const selectedKey = toDateKey(selected);
  const currentKey = todayKey();

  return (
    <div className="bg-panel-light border-4 border-edge p-2 overflow-x-auto theme-fade">
      <div className="flex gap-1.5 justify-center min-w-max mx-auto">
        {days.map((day) => {
          const key = toDateKey(day.date);
          const isSelected = key === selectedKey;
          const isToday = key === currentKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day.date)}
              aria-pressed={isSelected}
              className={`w-12 h-14 shrink-0 flex flex-col items-center justify-center relative bg-panel border-2 theme-fade ${
                isSelected ? "border-highlight" : "border-edge"
              } ${isToday ? "text-highlight" : "text-ink-dim"}`}
              style={{ boxShadow: "inset -2px -2px 0 rgba(0,0,0,.35), inset 2px 2px 0 rgba(255,255,255,.12)" }}
            >
              <span className="font-pixel text-[0.5rem]">
                {WEEKDAY_ABBR[weekdayOf(day.date) as WeekdayISO]}
              </span>
              <span className="text-base leading-tight mt-0.5">{day.date.getDate()}</span>
              <span
                className={`absolute bottom-1 w-1.5 h-1.5 ${
                  day.total === 0
                    ? "bg-transparent"
                    : day.complete
                      ? "bg-emerald"
                      : day.done > 0
                        ? "bg-gold"
                        : "bg-stone-dark"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
