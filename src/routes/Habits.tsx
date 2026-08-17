import { useState } from "react";
import type { Habit, HabitInput } from "../types";
import { WEEKDAY_ABBR } from "../types";
import { useCreateHabit, useDeleteHabit, useHabits, useUpdateHabit } from "../queries/habits";
import { HabitForm } from "./HabitForm";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelIcon } from "../components/ui/PixelIcon";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";
import { formatTime } from "../lib/dateUtils";

function weekdaysLabel(habit: Habit): string {
  if (habit.frequency_type === "one_time") return "Tarefa avulsa";
  const days = habit.days_of_week;
  if (!days || days.length === 7) return "Todos os dias";
  if (days.length === 5 && days.every((d) => d <= 5)) return "Dias de semana";
  if (days.length === 2 && days.includes(6) && days.includes(7)) return "Fim de semana";
  return days.map((d) => WEEKDAY_ABBR[d]).join(", ");
}

function frequencyLabel(habit: Habit): string {
  switch (habit.frequency_type) {
    case "daily":
      return "Diário";
    case "multiple_daily":
      return `${habit.target_quantity}${habit.target_unit ? ` ${habit.target_unit}` : "x"} por dia`;
    case "weekly_x":
      return `${habit.weekly_target_count}x por semana`;
    case "one_time":
      return "Pontual";
  }
}

export function Habits() {
  const { data: habits, isLoading, error } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [mode, setMode] = useState<{ type: "list" } | { type: "new" } | { type: "edit"; habit: Habit }>({
    type: "list",
  });
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null);

  function handleSubmit(input: HabitInput) {
    if (mode.type === "edit") {
      updateHabit.mutate({ id: mode.habit.id, input }, { onSuccess: () => setMode({ type: "list" }) });
    } else {
      createHabit.mutate(input, { onSuccess: () => setMode({ type: "list" }) });
    }
  }

  if (mode.type !== "list") {
    return (
      <HabitForm
        habit={mode.type === "edit" ? mode.habit : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setMode({ type: "list" })}
        submitting={createHabit.isPending || updateHabit.isPending}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-sm text-accent">Meus hábitos</h1>
        <PixelButton color="grass" onClick={() => setMode({ type: "new" })}>
          + Novo
        </PixelButton>
      </div>

      {isLoading && <p className="text-ink-dim">Carregando...</p>}
      {error && <p className="text-danger">Erro ao carregar: {(error as Error).message}</p>}

      {habits?.length === 0 && (
        <PixelPanel className="text-center py-10">
          <p className="text-ink-dim mb-4">Nenhum hábito ainda.</p>
          <PixelButton color="grass" onClick={() => setMode({ type: "new" })}>
            Criar o primeiro
          </PixelButton>
        </PixelPanel>
      )}

      <div className="space-y-3">
        {habits?.map((habit) => {
          const palette = BLOCK_COLOR_CLASSES[habit.color];
          const time = formatTime(habit.scheduled_time);
          return (
            <PixelPanel key={habit.id} className="flex items-center gap-4">
              <div
                className={`w-14 h-14 shrink-0 flex items-center justify-center text-2xl border-4 border-edge ${palette.bg}`}
              >
                <PixelIcon name={habit.pixel_icon} fallback={habit.icon} className="w-9 h-9" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-xs leading-relaxed break-words">{habit.name}</p>
                <p className="text-ink-dim text-base">
                  {frequencyLabel(habit)}
                  {time && ` · ${time}`}
                  {habit.category && ` · ${habit.category}`}
                </p>
                <p className="text-ink-dim text-sm">{weekdaysLabel(habit)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <PixelButton color="stone" onClick={() => setMode({ type: "edit", habit })}>
                  Editar
                </PixelButton>
                <PixelButton color="redstone" onClick={() => setConfirmDelete(habit)}>
                  X
                </PixelButton>
              </div>
            </PixelPanel>
          );
        })}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-30">
          <PixelPanel className="max-w-sm w-full">
            <p className="font-pixel text-xs mb-3">Deletar hábito?</p>
            <p className="text-ink-dim mb-5">
              "{confirmDelete.name}" e todos os check-ins e medalhas dele serão apagados. Isso não pode
              ser desfeito.
            </p>
            <div className="flex gap-3">
              <PixelButton
                color="redstone"
                disabled={deleteHabit.isPending}
                onClick={() =>
                  deleteHabit.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
                }
              >
                {deleteHabit.isPending ? "Deletando..." : "Deletar"}
              </PixelButton>
              <PixelButton color="stone" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </PixelButton>
            </div>
          </PixelPanel>
        </div>
      )}
    </div>
  );
}
