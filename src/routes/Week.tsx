import { useMemo, useState } from "react";
import { addDays, format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Habit } from "../types";
import { useHabits } from "../queries/habits";
import { useAddCheckIn, useCheckIns, useUndoCheckIn } from "../queries/checkins";
import { toDateKey } from "../lib/dateUtils";
import {
  amountOn,
  buildProgressIndex,
  dailyTarget,
  dayStatus,
  habitsForDate,
  isDoneOn,
  minutesOf,
  occursOn,
  weekDaysOf,
} from "../lib/routine";
import { DayNightHero } from "../components/DayNightHero";
import { DayHotbar, type HotbarDay } from "../components/DayHotbar";
import { RoutineItemRow } from "../components/RoutineItemRow";
import { XpBar } from "../components/ui/XpBar";
import { PixelIcon } from "../components/ui/PixelIcon";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";

type View = "lista" | "grade";

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 05h – 23h

export function Week() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns();
  const addCheckIn = useAddCheckIn();
  const undoCheckIn = useUndoCheckIn();

  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(today);
  const [view, setView] = useState<View>("lista");

  const allHabits = useMemo(() => habits ?? [], [habits]);
  const progress = useMemo(() => buildProgressIndex(checkIns ?? []), [checkIns]);
  const days = useMemo(() => weekDaysOf(selected), [selected]);

  const statuses = useMemo(
    () => days.map((date) => dayStatus(allHabits, progress, date)),
    [days, allHabits, progress],
  );

  const hotbarDays: HotbarDay[] = statuses.map((s) => ({
    date: s.date,
    done: s.done,
    total: s.total,
    complete: s.complete,
  }));

  const weekDone = statuses.reduce((sum, s) => sum + s.done, 0);
  const weekTotal = statuses.reduce((sum, s) => sum + s.total, 0);

  const selectedStatus = useMemo(
    () => dayStatus(allHabits, progress, selected),
    [allHabits, progress, selected],
  );

  const busy = addCheckIn.isPending || undoCheckIn.isPending;

  function toggle(habit: Habit, date: Date) {
    const key = toDateKey(date);
    // não se marca o que ainda não aconteceu: um check-in no futuro entraria
    // como dia cumprido e inflaria sequência e aderência
    if (key > toDateKey(new Date())) return;
    if (isDoneOn(progress, habit, date)) {
      undoCheckIn.mutate({
        habitId: habit.id,
        date: key,
        scope: habit.frequency_type === "multiple_daily" ? "last" : "day",
      });
    } else {
      addCheckIn.mutate({ habitId: habit.id, date: key });
    }
  }

  if (habitsLoading || checkInsLoading) return <p className="text-ink-dim">Carregando...</p>;

  const isPast = toDateKey(selected) < toDateKey(today);
  const isFuture = toDateKey(selected) > toDateKey(today);

  return (
    <div className="space-y-4">
      <DayNightHero title="SEMANA" subtitle="visão panorâmica — dá pra editar dias passados">
        <div className="max-w-sm mx-auto">
          <XpBar label="XP DA SEMANA" value={weekDone} max={weekTotal} />
        </div>
      </DayNightHero>

      <div className="flex items-center gap-2">
        <PixelButton
          color="stone"
          className="text-[0.6rem] px-3 py-2"
          onClick={() => setSelected((d) => subDays(d, 7))}
          title="Semana anterior"
        >
          ‹
        </PixelButton>
        <span className="flex-1 text-center text-ink-dim text-base">
          {format(days[0], "dd/MM")} – {format(days[6], "dd/MM")}
        </span>
        <PixelButton
          color="stone"
          className="text-[0.6rem] px-3 py-2"
          onClick={() => setSelected((d) => addDays(d, 7))}
          title="Próxima semana"
        >
          ›
        </PixelButton>
      </div>

      <DayHotbar days={hotbarDays} selected={selected} onSelect={setSelected} />

      <div className="flex gap-2">
        <PixelButton
          color={view === "lista" ? "grass" : "stone"}
          onClick={() => setView("lista")}
          className="text-[0.6rem] px-3 py-2"
        >
          Lista
        </PixelButton>
        <PixelButton
          color={view === "grade" ? "grass" : "stone"}
          onClick={() => setView("grade")}
          className="text-[0.6rem] px-3 py-2"
        >
          Grade de horários
        </PixelButton>
      </div>

      {view === "lista" && (
        <PixelPanel>
          <div className="flex justify-between items-baseline flex-wrap gap-2 mb-1">
            <h2 className="font-pixel text-[0.7rem] first-letter:uppercase">
              {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <span className="font-pixel text-[0.55rem] text-highlight">
              {isSameDay(selected, today) ? "HOJE" : isPast ? "RETROATIVO" : "PLANEJADO"}
            </span>
          </div>

          <p className="text-ink-dim text-base mb-4">
            {selectedStatus.total === 0
              ? "Nenhum hábito agendado para este dia."
              : `${selectedStatus.done} de ${selectedStatus.total} hábitos concluídos`}
          </p>

          {isFuture && selectedStatus.total > 0 && (
            <p className="text-ink-dim text-sm mb-3">
              Dia futuro — só o planejado. Dá pra marcar quando chegar o dia.
            </p>
          )}

          <div className="space-y-2">
            {selectedStatus.scheduled.map((habit) => (
              <RoutineItemRow
                key={habit.id}
                habit={habit}
                done={isDoneOn(progress, habit, selected)}
                onToggle={() => toggle(habit, selected)}
                disabled={busy || isFuture}
                amount={amountOn(progress, habit, selected)}
                target={dailyTarget(habit)}
              />
            ))}
          </div>

          {selectedStatus.complete && (
            <p className="text-accent text-base mt-4 flex items-center gap-2">
              <PixelIcon name="diamond" className="w-4 h-4" />
              Dia fechado.
            </p>
          )}
        </PixelPanel>
      )}

      {view === "grade" && (
        <PixelPanel className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`font-pixel text-[0.5rem] text-center py-2 ${
                    isSameDay(day, today) ? "text-highlight" : "text-ink-dim"
                  }`}
                >
                  {format(day, "EEE", { locale: ptBR })}
                  <br />
                  {format(day, "dd")}
                </div>
              ))}
            </div>

            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                <div className="font-pixel text-[0.5rem] text-ink-dim py-2 pr-1 text-right">
                  {String(hour).padStart(2, "0")}h
                </div>
                {days.map((day) => {
                  const inSlot = habitsForDate(allHabits, day).filter(
                    (h) => Math.floor(minutesOf(h) / 60) === hour,
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-9 border-2 p-0.5 flex flex-wrap gap-0.5 ${
                        isSameDay(day, today) ? "border-highlight/50" : "border-panel-light"
                      }`}
                    >
                      {inSlot.map((habit) => (
                        <span
                          key={habit.id}
                          title={`${habit.name} — ${format(day, "dd/MM")}`}
                          className={isDoneOn(progress, habit, day) ? "" : "opacity-50"}
                        >
                          <PixelIcon
                            name={habit.pixel_icon}
                            fallback={habit.icon}
                            className="w-5 h-5"
                          />
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="text-ink-dim text-sm mt-3">
            Ícone apagado = pendente. Para marcar, use a visão em lista.
          </p>
        </PixelPanel>
      )}

      <UnscheduledNote habits={allHabits} date={selected} />
    </div>
  );
}

function UnscheduledNote({ habits, date }: { habits: Habit[]; date: Date }) {
  const loose = habits.filter((h) => occursOn(h, date) && !h.scheduled_time);
  if (loose.length === 0) return null;

  return (
    <PixelPanel>
      <h2 className="font-pixel text-[0.65rem] mb-2">Sem horário fixo</h2>
      <p className="text-ink-dim text-base">
        {loose.map((h) => h.name).join(" · ")} — faça quando der.
      </p>
    </PixelPanel>
  );
}
