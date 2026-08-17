import { PixelIcon } from "./ui/PixelIcon";
import type { AdherenceStats } from "../lib/routine";

interface SystemStatsProps {
  streak: number;
  adherence: AdherenceStats;
  windowDays?: number;
}

/**
 * Métrica de SISTEMA: mede a rotina inteira, não cada hábito.
 * Fica no topo porque é o número que importa — a sequência é contínua no tempo
 * e não zera na virada da semana.
 */
export function SystemStats({ streak, adherence, windowDays = 30 }: SystemStatsProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      <span className="flex items-center gap-2 bg-black/60 border-2 border-black/70 px-3 py-1.5 text-white text-base">
        <PixelIcon name="diamond" className="w-4 h-4" />
        Sequência: {streak} {streak === 1 ? "dia" : "dias"}
      </span>
      <span
        className="flex items-center gap-2 bg-black/60 border-2 border-black/70 px-3 py-1.5 text-white text-base"
        title={`${adherence.completeDays} de ${adherence.evaluatedDays} dias fechados`}
      >
        <PixelIcon name="clock" className="w-4 h-4" />
        {adherence.evaluatedDays === 0
          ? `Aderência ${windowDays}d: —`
          : `Aderência ${windowDays}d: ${adherence.rate}%`}
      </span>
    </div>
  );
}
