import type { BadgeMetric, Milestone } from "../types";
import { MILESTONES, MILESTONE_TIER } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";

interface BadgeCaseProps {
  /** Milestones already earned for this metric. */
  earned: Set<Milestone>;
  metric: BadgeMetric;
  currentValue: number;
  compact?: boolean;
}

const METRIC_META: Record<BadgeMetric, { label: string; icon: string }> = {
  streak: { label: "Sequência", icon: "🔥" },
  total: { label: "Total", icon: "📦" },
};

export function BadgeCase({ earned, metric, currentValue, compact = false }: BadgeCaseProps) {
  const meta = METRIC_META[metric];

  return (
    <div>
      <p className="font-pixel text-[0.7rem] text-ink-dim mb-2">
        {meta.icon} {meta.label} · {currentValue}
      </p>
      <div className="flex flex-wrap gap-2">
        {MILESTONES.map((milestone) => {
          const tier = MILESTONE_TIER[milestone];
          const palette = BLOCK_COLOR_CLASSES[tier.color];
          const isEarned = earned.has(milestone);
          const size = compact ? "w-9 h-9 text-[0.6rem]" : "w-12 h-12 text-[0.65rem]";

          return (
            <div
              key={milestone}
              title={`${tier.label} · ${milestone} (${meta.label.toLowerCase()})`}
              className={`${size} border-4 border-edge flex flex-col items-center justify-center font-pixel ${
                isEarned ? `${palette.bg} ${palette.text}` : "bg-panel-light text-stone opacity-40"
              }`}
            >
              <span>{milestone}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
