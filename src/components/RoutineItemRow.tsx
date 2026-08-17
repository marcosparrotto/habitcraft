import type { Habit } from "../types";
import { formatTime } from "../lib/dateUtils";
import { PixelIcon } from "./ui/PixelIcon";

interface RoutineItemRowProps {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Marca o item que está em foco na aba "Hoje". */
  current?: boolean;
}

/** Linha de hábito da rotina — mesma peça nas abas "Hoje" e "Semana". */
export function RoutineItemRow({ habit, done, onToggle, disabled, current }: RoutineItemRowProps) {
  const time = formatTime(habit.scheduled_time);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={done}
      className={`w-full flex items-center gap-3 text-left bg-panel-light border-2 px-3 py-2 theme-fade active:translate-y-px disabled:opacity-50 ${
        current ? "border-highlight" : "border-edge"
      } ${done ? "opacity-60" : ""}`}
    >
      <PixelIcon name={habit.pixel_icon} fallback={habit.icon} className="w-7 h-7" />

      <span className="flex-1 min-w-0">
        <span className={`block text-base leading-tight break-words ${done ? "line-through" : ""}`}>
          {habit.name}
        </span>
        {time && <span className="block text-sm text-ink-dim">{time}</span>}
      </span>

      <span
        className={`w-6 h-6 shrink-0 border-2 border-edge relative ${
          done ? "bg-grass-dark" : "bg-bg"
        }`}
        aria-hidden
      >
        {done && (
          <span
            className="absolute left-[6px] top-[1px] w-[6px] h-[11px] border-r-[3px] border-b-[3px] border-white rotate-45"
            style={{ boxSizing: "border-box" }}
          />
        )}
      </span>
    </button>
  );
}
