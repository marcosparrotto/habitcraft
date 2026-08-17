import type { Habit } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";
import { formatTime } from "../lib/dateUtils";
import { PixelIcon } from "./ui/PixelIcon";
import { PixelButton } from "./ui/PixelButton";
import { PixelPanel } from "./ui/PixelPanel";

interface SpotlightCardProps {
  habit: Habit;
  /** Progresso do dia para hábitos com meta (ex: 3/8 copos). */
  amount: number;
  target: number;
  onComplete: () => void;
  onSkipToList: () => void;
  disabled?: boolean;
  /**
   * Em que momento esta atividade está:
   *   now  — está acontecendo agora (dentro da janela do horário)
   *   next — ainda vai acontecer
   *   late — passou do horário e continua pendente
   */
  phase: "now" | "next" | "late";
}

const PHASE_LABEL: Record<SpotlightCardProps["phase"], string> = {
  now: "AGORA",
  next: "PRÓXIMA ATIVIDADE",
  late: "AINDA PENDENTE",
};

/** "Quest atual": o próximo hábito pendente, em destaque. */
export function SpotlightCard({
  habit,
  amount,
  target,
  onComplete,
  onSkipToList,
  disabled,
  phase,
}: SpotlightCardProps) {
  const palette = BLOCK_COLOR_CLASSES[habit.color];
  const time = formatTime(habit.scheduled_time);
  const late = phase === "late";

  return (
    <PixelPanel className="text-center">
      {/* sem contador aqui: número ao lado do nome era lido como progresso.
          Quem conta concluídas é a barra "Dia inteiro". */}
      <p className="font-pixel text-[0.6rem] text-ink-dim mb-4">{PHASE_LABEL[phase]}</p>

      <div
        className={`w-24 h-24 mx-auto mb-4 flex items-center justify-center border-4 border-edge ${palette.bg}`}
      >
        <PixelIcon name={habit.pixel_icon} fallback={habit.icon} className="w-16 h-16 text-4xl" />
      </div>

      <h2 className="font-pixel text-xs leading-relaxed mb-2 break-words">{habit.name}</h2>

      {time && (
        <p className="text-highlight text-lg mb-1">
          {time}
          {late && <span className="text-ink-dim text-base"> · passou do horário</span>}
        </p>
      )}

      {target > 1 && (
        <p className="text-ink-dim text-base mb-1">
          {amount}/{target}
          {habit.target_unit ? ` ${habit.target_unit}` : ""}
        </p>
      )}

      {habit.category && <p className="text-ink-dim text-base mb-4">{habit.category}</p>}

      <div className="flex flex-col items-center gap-3 mt-5">
        <PixelButton color={habit.color} onClick={onComplete} disabled={disabled} className="w-full">
          {disabled ? "Salvando..." : "Concluir"}
        </PixelButton>
        <button
          type="button"
          onClick={onSkipToList}
          className="text-ink-dim text-base underline underline-offset-4"
        >
          ver o dia inteiro
        </button>
      </div>
    </PixelPanel>
  );
}
