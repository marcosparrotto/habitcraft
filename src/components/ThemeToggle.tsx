import { useTheme } from "../lib/ThemeContext";
import type { ThemeMode } from "../theme/daylight";

const OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "auto", icon: "🌗", label: "Automático — segue o horário" },
  { mode: "light", icon: "☀", label: "Sempre claro" },
  { mode: "dark", icon: "☾", label: "Sempre escuro" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex shrink-0" role="group" aria-label="Tema">
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => setMode(opt.mode)}
            className={`w-9 h-9 border-2 text-sm leading-none theme-fade ${
              active
                ? "border-edge bg-panel-light text-highlight"
                : "border-transparent text-ink-dim hover:border-edge"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
