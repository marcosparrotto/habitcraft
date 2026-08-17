import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Habit, Milestone } from "../types";
import { MILESTONE_TIER } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";
import { useHabits } from "../queries/habits";
import { useCheckIns } from "../queries/checkins";
import { useBadges } from "../queries/badges";
import {
  completionRate,
  computeStats,
  isUnitComplete,
  progressByUnit,
} from "../lib/streaks";
import { amountOn, buildProgressIndex, dailyTarget, dayStatus, occursOn } from "../lib/routine";
import { toDateKey } from "../lib/dateUtils";
import { PixelPanel } from "../components/ui/PixelPanel";
import { PixelButton } from "../components/ui/PixelButton";
import { PixelSelect } from "../components/ui/PixelInput";
import { Heatmap } from "../components/Heatmap";
import { BadgeCase } from "../components/BadgeCase";

type Period = "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semanal",
  month: "Mensal",
  year: "Anual",
};

function periodRange(period: Period, today: Date): { start: Date; end: Date } {
  switch (period) {
    case "week":
      return { start: subDays(today, 6), end: today };
    case "month":
      return { start: startOfMonth(today), end: today };
    case "year":
      return { start: startOfYear(today), end: today };
  }
}

export function History() {
  const { data: habits, isLoading } = useHabits();
  const { data: checkIns } = useCheckIns();
  const { data: badges } = useBadges();

  const [period, setPeriod] = useState<Period>("month");
  const [habitId, setHabitId] = useState<string>("all");

  const today = new Date();
  const { start, end } = periodRange(period, today);

  const selectedHabit = habits?.find((h) => h.id === habitId) ?? null;

  const trendData = useMemo(() => {
    if (!habits || !checkIns) return [];
    const target = selectedHabit ? [selectedHabit] : habits;
    if (target.length === 0) return [];

    if (period === "year") {
      return eachMonthOfInterval({ start, end }).map((monthStart) => {
        const monthEnd = endOfMonth(monthStart) > end ? end : endOfMonth(monthStart);
        const rates = target.map((h) => completionRate(h, checkIns, monthStart, monthEnd).rate);
        return {
          label: format(monthStart, "MMM", { locale: ptBR }),
          taxa: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
        };
      });
    }

    // Day-by-day trend only covers day-unit habits; weekly_x has no per-day notion of success.
    const dailyHabits = target.filter(
      (h) => h.frequency_type !== "weekly_x" && h.frequency_type !== "one_time",
    );
    const totalsByHabit = new Map(dailyHabits.map((h) => [h.id, progressByUnit(h, checkIns)]));

    const points: { label: string; taxa: number | null }[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const dayKey = toDateKey(d);
      let completed = 0;
      let expected = 0;
      for (const habit of dailyHabits) {
        if (habit.created_at.slice(0, 10) > dayKey) continue;
        expected++;
        const amount = totalsByHabit.get(habit.id)?.get(dayKey) ?? 0;
        if (isUnitComplete(habit, amount)) completed++;
      }
      points.push({
        label: format(d, "dd/MM"),
        // No habit existed yet — a gap, not a 0% failure.
        taxa: expected === 0 ? null : Math.round((completed / expected) * 100),
      });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, checkIns, period, habitId]);

  /**
   * Intensidade por dia: 1 = dia fechado, entre 0 e 1 = parcial.
   *
   * Na visão geral é a proporção de hábitos concluídos sobre os agendados
   * daquele dia — a mesma definição que a sequência usa. (Antes era o MÁXIMO
   * entre os hábitos, então um único hábito concluído pintava o dia inteiro
   * como cumprido.) Dias sem nada agendado ficam de fora do mapa.
   */
  const heatmapValues = useMemo(() => {
    const map = new Map<string, number>();
    if (!checkIns || !habits) return map;
    const index = buildProgressIndex(checkIns);

    for (let d = start; d <= end; d = addDays(d, 1)) {
      const key = toDateKey(d);

      if (selectedHabit) {
        if (!occursOn(selectedHabit, d)) continue;
        // hábito semanal não se julga por dia: marcou naquele dia, conta o dia
        if (selectedHabit.frequency_type === "weekly_x") {
          const amount = amountOn(index, selectedHabit, d);
          if (amount > 0) map.set(key, 1);
          continue;
        }
        const amount = amountOn(index, selectedHabit, d);
        map.set(key, Math.min(1, amount / dailyTarget(selectedHabit)));
        continue;
      }

      const status = dayStatus(habits, index, d);
      if (status.empty) continue;
      map.set(key, status.done / status.total);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, checkIns, habitId, period]);

  const selectedStats =
    selectedHabit && checkIns ? computeStats(selectedHabit, checkIns, today) : null;

  const earnedFor = (habit: Habit, metric: "streak" | "total") =>
    new Set<Milestone>(
      (badges ?? [])
        .filter((b) => b.habit_id === habit.id && b.metric_type === metric)
        .map((b) => b.milestone),
    );

  if (isLoading) return <p className="text-ink-dim">Carregando...</p>;
  if (!habits || habits.length === 0) {
    return (
      <PixelPanel className="text-center py-10">
        <p className="text-ink-dim">Sem hábitos ainda — nada para mostrar aqui.</p>
      </PixelPanel>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-pixel text-sm text-accent">Histórico</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <PixelButton
              key={p}
              color={period === p ? "grass" : "stone"}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </PixelButton>
          ))}
        </div>
        <PixelSelect
          className="max-w-xs"
          value={habitId}
          onChange={(e) => setHabitId(e.target.value)}
        >
          <option value="all">Todos os hábitos</option>
          {habits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.icon} {h.name}
            </option>
          ))}
        </PixelSelect>
      </div>

      {!selectedHabit && (
        <PixelPanel>
          <h2 className="font-pixel text-xs mb-4">🏆 Medalhas conquistadas</h2>
          {(badges ?? []).length === 0 ? (
            <p className="text-ink-dim">
              Nenhuma medalha ainda. A primeira vem aos 7 dias — madeira.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...(badges ?? [])]
                .sort((a, b) => b.milestone - a.milestone)
                .map((badge) => {
                  const habit = habits.find((h) => h.id === badge.habit_id);
                  const tier = MILESTONE_TIER[badge.milestone];
                  const palette = BLOCK_COLOR_CLASSES[tier.color];
                  return (
                    <div
                      key={badge.id}
                      title={`${tier.label} · ${badge.milestone} ${
                        badge.metric_type === "streak" ? "em sequência" : "no total"
                      } · ${habit?.name ?? ""}`}
                      className={`${palette.bg} ${palette.text} border-4 border-edge px-3 py-2 font-pixel text-[0.65rem] flex items-center gap-2`}
                    >
                      <span>{badge.metric_type === "streak" ? "🔥" : "📦"}</span>
                      <span>{badge.milestone}</span>
                      <span className="opacity-80">{habit?.icon}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </PixelPanel>
      )}

      {selectedHabit && selectedStats && (
        <PixelPanel className="space-y-4">
          <div className="flex gap-6 flex-wrap">
            <Stat label="Sequência atual" value={selectedStats.currentStreak} accent="text-highlight" />
            <Stat label="Melhor sequência" value={selectedStats.bestStreak} accent="text-diamond" />
            <Stat label="Total" value={selectedStats.totalCompleted} accent="text-accent" />
          </div>
          <div className="flex gap-6 flex-wrap pt-2">
            <BadgeCase
              earned={earnedFor(selectedHabit, "streak")}
              metric="streak"
              currentValue={selectedStats.currentStreak}
              compact
            />
            <BadgeCase
              earned={earnedFor(selectedHabit, "total")}
              metric="total"
              currentValue={selectedStats.totalCompleted}
              compact
            />
          </div>
        </PixelPanel>
      )}

      <PixelPanel>
        <h2 className="font-pixel text-xs mb-4">Mapa de constância</h2>
        <Heatmap
          start={start}
          end={end}
          values={heatmapValues}
          color={selectedHabit?.color ?? "grass"}
        />
        <div className="flex items-center gap-3 mt-3 text-ink-dim text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-panel-light border border-edge inline-block" /> não cumprido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-grass opacity-50 border border-edge inline-block" /> parcial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-grass border border-edge inline-block" /> completo
          </span>
        </div>
      </PixelPanel>

      <PixelPanel>
        <h2 className="font-pixel text-xs mb-4">
          Taxa de cumprimento {selectedHabit ? `· ${selectedHabit.name}` : "· geral"}
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="#3c3c3c" strokeDasharray="4 4" />
            <XAxis dataKey="label" stroke="#a9a9a9" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a9a9a9" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              contentStyle={{ background: "#2b2b2b", border: "4px solid #17131f", color: "#fff" }}
              formatter={(v) => [`${v}%`, "taxa"]}
            />
            <Line
              type="monotone"
              dataKey="taxa"
              stroke="#5ea62e"
              strokeWidth={3}
              // Dots matter here: an isolated day (gaps on both sides) draws no line segment.
              dot={{ r: 3, fill: "#5ea62e", strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </PixelPanel>

    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <p className={`font-pixel text-lg ${accent}`}>{value}</p>
      <p className="text-ink-dim text-sm">{label}</p>
    </div>
  );
}
