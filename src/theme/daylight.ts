/**
 * Ciclo dia/noite do app.
 *
 * O painel original virava a chave de forma seca (>=6h e <18h = dia). Aqui a luz
 * é um fator contínuo de 0 (noite fechada) a 1 (pleno dia), com rampas no
 * amanhecer e no anoitecer — o app clareia e escurece junto com o dia real em
 * vez de dar um corte.
 */
export type ThemeMode = "auto" | "light" | "dark";

export const THEME_STORAGE_KEY = "habitcraft:theme-mode";

/** Janelas de transição, em horas decimais. */
export const DAWN_START = 5.5; // 05h30
export const DAWN_END = 7.0; // 07h00
export const DUSK_START = 17.5; // 17h30
export const DUSK_END = 19.0; // 19h00

/** Suaviza as pontas da rampa (ease-in-out) em vez de subir em linha reta. */
function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function hoursOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/** Fator de luz do horário: 0 = noite, 1 = dia, valores intermediários nas rampas. */
export function daylightAt(date: Date = new Date()): number {
  const h = hoursOf(date);
  if (h <= DAWN_START || h >= DUSK_END) return 0;
  if (h >= DAWN_END && h <= DUSK_START) return 1;
  if (h < DAWN_END) return smoothstep((h - DAWN_START) / (DAWN_END - DAWN_START));
  return 1 - smoothstep((h - DUSK_START) / (DUSK_END - DUSK_START));
}

/** Fator de luz efetivo, já considerando o override manual do usuário. */
export function daylightForMode(mode: ThemeMode, date: Date = new Date()): number {
  if (mode === "light") return 1;
  if (mode === "dark") return 0;
  return daylightAt(date);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark";
}

export function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : "auto";
  } catch {
    return "auto";
  }
}

/** Aplica o fator de luz no documento. Única função que escreve no CSS. */
export function applyDaylight(daylight: number): void {
  const root = document.documentElement;
  const nightMix = (1 - daylight) * 100;
  root.style.setProperty("--night-mix", `${nightMix.toFixed(2)}%`);
  root.dataset.theme = daylight >= 0.5 ? "light" : "dark";
}
