import { addDays, getDay } from "date-fns";
import type { BlockColor } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";
import { toDateKey, formatShort } from "../lib/dateUtils";

interface HeatmapProps {
  start: Date;
  end: Date;
  /** date key -> intensity 0..1 (0 = nothing, 1 = complete) */
  values: Map<string, number>;
  color?: BlockColor;
}

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function Heatmap({ start, end, values, color = "grass" }: HeatmapProps) {
  const palette = BLOCK_COLOR_CLASSES[color];

  // Pad to Monday so each column is a full week.
  const offset = (getDay(start) + 6) % 7;
  const gridStart = addDays(start, -offset);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  function cellClass(date: Date): string {
    if (date < start || date > end) return "bg-transparent";
    const v = values.get(toDateKey(date)) ?? 0;
    if (v >= 1) return `${palette.bg}`;
    if (v > 0) return `${palette.bg} opacity-50`;
    return "bg-panel-light";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="w-3 h-3 text-[0.6rem] text-ink-dim leading-3 font-pixel">
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date) => (
              <div
                key={toDateKey(date)}
                title={`${formatShort(date)} — ${
                  (values.get(toDateKey(date)) ?? 0) >= 1
                    ? "completo"
                    : (values.get(toDateKey(date)) ?? 0) > 0
                      ? "parcial"
                      : "não cumprido"
                }`}
                className={`w-3 h-3 border border-edge ${cellClass(date)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
