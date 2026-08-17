import type { Habit } from "../types";
import { blockRange } from "../lib/routine";
import { PixelIcon } from "./ui/PixelIcon";

/**
 * Linha de contexto de um bloco fixo. Deliberadamente não é um botão e não tem
 * caixa de marcação: bloco é tempo ocupado, não tarefa a cumprir. A borda
 * tracejada e a opacidade menor separam visualmente dos hábitos da lista.
 */
export function TimeBlockRow({ block }: { block: Habit }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-2 border-dashed border-edge/60 bg-panel-light/40 opacity-80 theme-fade">
      <PixelIcon name={block.pixel_icon} fallback={block.icon} className="w-6 h-6" />
      <span className="flex-1 min-w-0">
        <span className="block text-base leading-tight break-words">{block.name}</span>
        <span className="block text-sm text-ink-dim">{blockRange(block)} · tempo ocupado</span>
      </span>
    </div>
  );
}
