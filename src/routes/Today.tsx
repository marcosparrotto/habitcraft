import { useMemo, useRef, useState } from "react";
import type { Badge, BadgeMetric, Habit, Milestone } from "../types";
import { MILESTONE_TIER } from "../types";
import { useHabits } from "../queries/habits";
import { useAddCheckIn, useCheckIns, useUndoCheckIn } from "../queries/checkins";
import { useAwardBadges, useBadges } from "../queries/badges";
import { computeStats, reachedMilestones } from "../lib/streaks";
import { formatFull, formatTime, todayKey } from "../lib/dateUtils";
import {
  adherence as computeAdherence,
  amountOn,
  buildProgressIndex,
  dailyTarget,
  dayStatus,
  isDoneOn,
  missedYesterday,
  systemStreak,
} from "../lib/routine";
import { DayNightHero } from "../components/DayNightHero";
import { SystemStats } from "../components/SystemStats";
import { SpotlightCard } from "../components/SpotlightCard";
import { RoutineItemRow } from "../components/RoutineItemRow";
import { CelebrationOverlay, type Celebration } from "../components/CelebrationOverlay";
import { Toast, type ToastMessage } from "../components/ui/Toast";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelIcon } from "../components/ui/PixelIcon";
import { ProgressBar } from "../components/ProgressBar";

function badgeSetKey(habitId: string, metric: BadgeMetric, milestone: Milestone) {
  return `${habitId}:${metric}:${milestone}`;
}

export function Today() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: checkIns, isLoading: checkInsLoading } = useCheckIns();
  const { data: badges } = useBadges();
  const addCheckIn = useAddCheckIn();
  const undoCheckIn = useUndoCheckIn();
  const awardBadges = useAwardBadges();

  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showList, setShowList] = useState(false);
  const notificationId = useRef(0);

  const today = useMemo(() => new Date(), []);
  const allHabits = useMemo(() => habits ?? [], [habits]);
  const progress = useMemo(() => buildProgressIndex(checkIns ?? []), [checkIns]);

  const status = useMemo(
    () => dayStatus(allHabits, progress, today),
    [allHabits, progress, today],
  );
  const streak = useMemo(
    () => systemStreak(allHabits, progress, today),
    [allHabits, progress, today],
  );
  const adherence = useMemo(
    () => computeAdherence(allHabits, progress, today),
    [allHabits, progress, today],
  );
  const missed = useMemo(
    () => missedYesterday(allHabits, progress, today),
    [allHabits, progress, today],
  );

  const pending = status.scheduled.filter((h) => !isDoneOn(progress, h, today));
  const spotlight = pending[0] ?? null;
  const oneTimeHabits = allHabits.filter((h) => h.frequency_type === "one_time");

  const earnedBadges = useMemo(() => {
    const set = new Set<string>();
    for (const b of badges ?? []) set.add(badgeSetKey(b.habit_id, b.metric_type, b.milestone));
    return set;
  }, [badges]);

  function nextId() {
    notificationId.current += 1;
    return notificationId.current;
  }

  function announceNext(justCompleted: Habit) {
    const remaining = status.scheduled.filter(
      (h) => h.id !== justCompleted.id && !isDoneOn(progress, h, today),
    );
    const upcoming = remaining[0];

    setToast({
      id: nextId(),
      title: upcoming ? "PROGRESSO!" : "DIA COMPLETO!",
      text: upcoming
        ? `Próxima: ${upcoming.name}${formatTime(upcoming.scheduled_time) ? ` às ${formatTime(upcoming.scheduled_time)}` : ""}`
        : "Rotina de hoje fechada. Constância > perfeição.",
      icon: upcoming ? (upcoming.pixel_icon ?? "diamond") : "diamond",
      emoji: upcoming?.icon,
    });
  }

  function handleComplete(habit: Habit) {
    const target = dailyTarget(habit);
    const before = amountOn(progress, habit, today);
    const willComplete = before + 1 >= target;

    addCheckIn.mutate(
      { habitId: habit.id },
      {
        onSuccess: (newCheckIn) => {
          const stats = computeStats(habit, [...(checkIns ?? []), newCheckIn], today);

          setCelebration({
            id: nextId(),
            kind: "check",
            icon: habit.icon,
            color: habit.color,
            title: willComplete ? "+10 XP" : "+5 XP",
            subtitle: willComplete
              ? stats.currentStreak > 1
                ? `sequência de ${stats.currentStreak}!`
                : "check-in completo!"
              : `${before + 1}/${target}`,
          });

          if (!willComplete) return;

          // o toast entra logo depois da animação de conclusão, não em cima dela
          setTimeout(() => announceNext(habit), 900);
          void checkMilestones(habit, stats.currentStreak, stats.totalCompleted);
        },
      },
    );
  }

  function handleToggle(habit: Habit) {
    if (isDoneOn(progress, habit, today)) {
      undoCheckIn.mutate({ habitId: habit.id, date: todayKey() });
    } else {
      handleComplete(habit);
    }
  }

  async function checkMilestones(habit: Habit, streakValue: number, total: number) {
    const pendingBadges: { habitId: string; metric: BadgeMetric; milestone: Milestone }[] = [];

    for (const m of reachedMilestones(streakValue)) {
      if (!earnedBadges.has(badgeSetKey(habit.id, "streak", m))) {
        pendingBadges.push({ habitId: habit.id, metric: "streak", milestone: m });
      }
    }
    for (const m of reachedMilestones(total)) {
      if (!earnedBadges.has(badgeSetKey(habit.id, "total", m))) {
        pendingBadges.push({ habitId: habit.id, metric: "total", milestone: m });
      }
    }
    if (pendingBadges.length === 0) return;

    const inserted = await awardBadges.mutateAsync(pendingBadges);
    const top = highestBadge(inserted);
    if (!top) return;

    const tier = MILESTONE_TIER[top.milestone];
    setTimeout(() => {
      setCelebration({
        id: nextId(),
        kind: "milestone",
        icon: "🏆",
        color: tier.color,
        title: `Medalha de ${tier.label}!`,
        subtitle: `${top.milestone} ${top.metric_type === "streak" ? "em sequência" : "no total"} · ${habit.name}`,
      });
    }, 2000);
  }

  if (habitsLoading || checkInsLoading) {
    return <p className="text-ink-dim">Carregando...</p>;
  }

  const busy = addCheckIn.isPending || undoCheckIn.isPending;

  return (
    <div className="space-y-4">
      <DayNightHero title="HOJE" subtitle={formatFull(today)}>
        <SystemStats streak={streak} adherence={adherence} />
      </DayNightHero>

      {/* o lembrete some assim que o dia de hoje fecha — já foi retomado */}
      {missed && !status.complete && (
        <div className="bg-panel-light border-l-4 border-highlight border-y-2 border-r-2 border-y-edge border-r-edge px-3 py-2 theme-fade">
          <p className="text-base">
            <span className="text-highlight">Ontem ficou em {missed.done}/{missed.total}.</span>{" "}
            Retome hoje — uma falha não vira padrão.
          </p>
        </div>
      )}

      {status.total === 0 && (
        <PixelPanel className="text-center py-8">
          <p className="font-pixel text-[0.7rem] mb-3">Nenhum hábito para hoje</p>
          <p className="text-ink-dim">
            Rode o seed da rotina ou crie hábitos na aba "Hábitos".
          </p>
        </PixelPanel>
      )}

      {spotlight && (
        <SpotlightCard
          habit={spotlight}
          amount={amountOn(progress, spotlight, today)}
          target={dailyTarget(spotlight)}
          onComplete={() => handleComplete(spotlight)}
          onSkipToList={() => setShowList(true)}
          disabled={busy}
          // posição cronológica do item, não a contagem de concluídos — o
          // usuário pode marcar fora de ordem pela lista
          position={status.scheduled.findIndex((h) => h.id === spotlight.id) + 1}
          total={status.total}
        />
      )}

      {!spotlight && status.total > 0 && (
        <PixelPanel className="text-center py-8">
          <PixelIcon name="diamond" className="w-12 h-12 mx-auto mb-4" />
          <p className="font-pixel text-xs text-accent mb-2">Dia completo!</p>
          <p className="text-ink-dim">
            {status.total} de {status.total} hábitos concluídos. Sequência de {streak}{" "}
            {streak === 1 ? "dia" : "dias"}.
          </p>
        </PixelPanel>
      )}

      {status.total > 0 && (
        <PixelPanel>
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="w-full flex items-center justify-between gap-3 font-pixel text-[0.65rem]"
            aria-expanded={showList}
          >
            <span>Dia inteiro</span>
            <span className="text-highlight">
              {status.done}/{status.total} {showList ? "▲" : "▼"}
            </span>
          </button>

          <div className="mt-3">
            <ProgressBar value={status.done} max={status.total} color="emerald" />
          </div>

          {showList && (
            <div className="mt-4 space-y-2">
              {status.scheduled.map((habit) => (
                <RoutineItemRow
                  key={habit.id}
                  habit={habit}
                  done={isDoneOn(progress, habit, today)}
                  onToggle={() => handleToggle(habit)}
                  disabled={busy}
                  current={habit.id === spotlight?.id}
                />
              ))}
            </div>
          )}
        </PixelPanel>
      )}

      {showList && oneTimeHabits.length > 0 && (
        <PixelPanel>
          <h2 className="font-pixel text-[0.65rem] text-ink-dim mb-3">Tarefas pontuais</h2>
          <div className="space-y-2">
            {oneTimeHabits.map((habit) => (
              <RoutineItemRow
                key={habit.id}
                habit={habit}
                done={isDoneOn(progress, habit, today)}
                onToggle={() => handleToggle(habit)}
                disabled={busy}
              />
            ))}
          </div>
        </PixelPanel>
      )}

      <CelebrationOverlay celebration={celebration} onDismiss={() => setCelebration(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function highestBadge(badges: Badge[]): Badge | null {
  if (badges.length === 0) return null;
  return badges.reduce((best, b) => (b.milestone > best.milestone ? b : best));
}
