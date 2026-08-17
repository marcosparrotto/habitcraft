interface XpBarProps {
  label?: string;
  value: number;
  max: number;
}

/** Barra de XP listrada, no estilo da barra de experiência do painel de rotina. */
export function XpBar({ label, value, max }: XpBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      {label && (
        <div
          className="font-pixel text-[0.6rem] mb-1 flex justify-between gap-2"
          style={{ color: "var(--color-sky-ink)" }}
        >
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="h-4 bg-[#1a1a1a] border-[3px] border-black relative overflow-hidden"
        style={{ boxShadow: "inset 0 0 0 2px #444" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,.25) 0 3px, transparent 3px 8px), linear-gradient(180deg, #5fd35f, #2f8f2f)",
          }}
        />
      </div>
    </div>
  );
}
