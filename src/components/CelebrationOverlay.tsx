import { useEffect } from "react";
import type { BlockColor } from "../types";
import { BLOCK_COLOR_CLASSES } from "../theme/blockColors";

export interface Celebration {
  id: number;
  kind: "check" | "milestone";
  icon: string;
  color: BlockColor;
  title: string;
  subtitle: string;
}

interface CelebrationOverlayProps {
  celebration: Celebration | null;
  onDismiss: () => void;
}

export function CelebrationOverlay({ celebration, onDismiss }: CelebrationOverlayProps) {
  const isMilestone = celebration?.kind === "milestone";

  useEffect(() => {
    if (!celebration) return;
    const timeout = setTimeout(onDismiss, isMilestone ? 3200 : 1400);
    return () => clearTimeout(timeout);
  }, [celebration, isMilestone, onDismiss]);

  if (!celebration) return null;

  const palette = BLOCK_COLOR_CLASSES[celebration.color];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none px-4"
      role="status"
      aria-live="polite"
    >
      {isMilestone && <div className="absolute inset-0 bg-black/60 animate-[fadeIn_180ms_ease-out]" />}

      <div
        className={`relative text-center border-4 border-edge pixel-shadow px-8 py-6 ${palette.bg} ${palette.text} ${
          isMilestone ? "animate-[popIn_320ms_cubic-bezier(0.2,1.4,0.4,1)]" : "animate-[floatUp_1.4s_ease-out]"
        }`}
      >
        <div className={`text-5xl mb-2 ${isMilestone ? "animate-[shake_500ms_ease-in-out]" : ""}`}>
          {celebration.icon}
        </div>
        <p className="font-pixel text-sm mb-1">{celebration.title}</p>
        <p className="font-pixel text-[0.7rem] opacity-90">{celebration.subtitle}</p>

        {isMilestone && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 bg-current opacity-70 animate-[sparkle_900ms_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 70}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
