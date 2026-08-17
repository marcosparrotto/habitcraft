import { useEffect } from "react";
import { PixelIcon } from "./PixelIcon";

export interface ToastMessage {
  id: number;
  /** Linha superior em caixa alta (ex: "PROGRESSO!", "DIA COMPLETO!"). */
  title: string;
  /** Linha de detalhe (ex: "Próxima: Academia às 12:30"). */
  text: string;
  icon?: string | null;
  emoji?: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  durationMs?: number;
}

/** Toast de conquista do painel de rotina: desce do topo, some sozinho. */
export function Toast({ message, onDismiss, durationMs = 3600 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      key={message.id}
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 z-50 flex items-center gap-3 px-4 py-3 max-w-[92vw] bg-panel border-[3px] border-highlight pixel-shadow animate-[toastIn_450ms_cubic-bezier(0.2,1.4,0.4,1)]"
      style={{ transform: "translate(-50%, 0)" }}
    >
      <PixelIcon name={message.icon ?? "diamond"} fallback={message.emoji} className="w-7 h-7" />
      <div className="min-w-0">
        <p className="font-pixel text-[0.6rem] text-highlight leading-relaxed">{message.title}</p>
        <p className="text-ink text-base leading-tight break-words">{message.text}</p>
      </div>
    </div>
  );
}
