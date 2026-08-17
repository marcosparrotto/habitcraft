import type { BlockColor } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";

interface ProgressBarProps {
  value: number;
  max: number;
  color?: BlockColor;
  /** Renders discrete blocks instead of a continuous bar — used for small quantitative goals. */
  segmented?: boolean;
}

export function ProgressBar({ value, max, color = "grass", segmented = false }: ProgressBarProps) {
  const palette = BLOCK_COLOR_CLASSES[color];
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);

  if (segmented && max <= 12) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-4 flex-1 border-2 border-edge ${i < value ? palette.bg : "bg-panel-light"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="h-4 bg-panel-light border-2 border-edge">
      <div className={`h-full ${palette.bg} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}
