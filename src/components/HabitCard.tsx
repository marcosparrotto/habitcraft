import type { Habit } from "../types";
import type { HabitStats } from "../lib/streaks";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";
import { PixelPanel } from "./ui/PixelPanel";
import { PixelButton } from "./ui/PixelButton";
import { ProgressBar } from "./ProgressBar";
import { formatTime } from "../lib/dateUtils";

interface HabitCardProps {
  habit: Habit;
  stats: HabitStats;
  onCheckIn: () => void;
  onUndo: () => void;
  disabled?: boolean;
}

export function HabitCard({ habit, stats, onCheckIn, onUndo, disabled }: HabitCardProps) {
  const palette = BLOCK_COLOR_CLASSES[habit.color];
  const time = formatTime(habit.scheduled_time);
  const isQuantitative = habit.frequency_type === "multiple_daily";
  const isWeekly = habit.frequency_type === "weekly_x";

  return (
    <PixelPanel className={stats.todayComplete ? "opacity-80" : ""}>
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 shrink-0 flex items-center justify-center text-2xl border-4 border-edge ${palette.bg}`}
        >
          {habit.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-pixel text-xs leading-relaxed break-words">
            {stats.todayComplete && "✅ "}
            {habit.name}
          </p>
          <p className="text-ink-dim text-base">
            {stats.currentStreak > 0 && (
              <span className="text-highlight">🔥 {stats.currentStreak} </span>
            )}
            <span>📦 {stats.totalCompleted}</span>
            {time && <span> · {time}</span>}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {stats.todayAmount > 0 && (
            <PixelButton color="stone" onClick={onUndo} disabled={disabled} title="Desfazer último check-in">
              ↩
            </PixelButton>
          )}
          <PixelButton
            color={stats.todayComplete ? "stone" : habit.color}
            onClick={onCheckIn}
            disabled={disabled || (stats.todayComplete && !isQuantitative)}
          >
            {stats.todayComplete && !isQuantitative ? "Feito" : "Confirmar"}
          </PixelButton>
        </div>
      </div>

      {(isQuantitative || isWeekly) && (
        <div className="mt-4">
          <div className="flex justify-between font-pixel text-[0.65rem] text-ink-dim mb-2">
            <span>
              {isWeekly ? "Esta semana" : "Hoje"}: {stats.todayAmount}/{stats.todayTarget}
              {habit.target_unit ? ` ${habit.target_unit}` : ""}
            </span>
            {stats.todayComplete && <span className="text-accent">meta batida!</span>}
          </div>
          <ProgressBar
            value={stats.todayAmount}
            max={stats.todayTarget}
            color={habit.color}
            segmented={isQuantitative}
          />
        </div>
      )}
    </PixelPanel>
  );
}
