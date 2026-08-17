import type { Habit } from "../types";
import { amountOn, dailyTarget, isDoneOn, type ProgressIndex } from "../lib/routine";
import { PixelIcon } from "./ui/PixelIcon";
import { PixelPanel } from "./ui/PixelPanel";
import { ProgressBar } from "./ProgressBar";

interface FlexibleHabitsProps {
  habits: Habit[];
  progress: ProgressIndex;
  date: Date;
  /** Registra uma unidade (um copo, uma vez). */
  onAdd: (habit: Habit) => void;
  /** Desfaz a última unidade. */
  onRemove: (habit: Habit) => void;
  disabled?: boolean;
}

/**
 * Hábitos sem horário fixo. Ficam fora da linha cronológica — não têm "próxima
 * atividade" nem entram no spotlight —, mas contam para o fechamento do dia
 * como qualquer outro: só que um hábito com meta (8 copos) só fecha na meta
 * cheia, e o check-in é de uma unidade por vez.
 */
export function FlexibleHabits({
  habits,
  progress,
  date,
  onAdd,
  onRemove,
  disabled,
}: FlexibleHabitsProps) {
  if (habits.length === 0) return null;

  return (
    <PixelPanel>
      <h2 className="font-pixel text-[0.6rem] text-ink-dim mb-1">A QUALQUER HORA</h2>
      <p className="text-ink-dim text-sm mb-4">Sem hora marcada — faça quando der.</p>

      <div className="space-y-3">
        {habits.map((habit) => {
          const target = dailyTarget(habit);
          const amount = amountOn(progress, habit, date);
          const done = isDoneOn(progress, habit, date);

          return (
            <div
              key={habit.id}
              className={`bg-panel-light border-2 border-edge p-3 theme-fade ${done ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3">
                <PixelIcon name={habit.pixel_icon} fallback={habit.icon} className="w-7 h-7" />

                <div className="flex-1 min-w-0">
                  <p className="text-base leading-tight break-words">{habit.name}</p>
                  {target > 1 && (
                    <p className="text-sm text-ink-dim">
                      {amount}/{target}
                      {habit.target_unit ? ` ${habit.target_unit}` : ""}
                      {done && " · meta batida"}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 shrink-0">
                  {amount > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemove(habit)}
                      disabled={disabled}
                      aria-label={`Desfazer uma unidade de ${habit.name}`}
                      className="w-10 h-10 border-2 border-edge bg-panel text-ink font-pixel text-[0.6rem] disabled:opacity-40"
                    >
                      −
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAdd(habit)}
                    disabled={disabled || (target === 1 && done)}
                    aria-label={
                      target > 1 ? `Registrar uma unidade de ${habit.name}` : `Concluir ${habit.name}`
                    }
                    className="min-w-10 h-10 px-3 border-2 border-edge bg-grass text-obsidian font-pixel text-[0.6rem] disabled:opacity-40"
                  >
                    {target > 1 ? "+1" : done ? "✓" : "Feito"}
                  </button>
                </div>
              </div>

              {target > 1 && (
                <div className="mt-3">
                  <ProgressBar value={amount} max={target} color={habit.color} segmented />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PixelPanel>
  );
}
