import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  applyDaylight,
  daylightForMode,
  readStoredMode,
  type ThemeMode,
} from "../theme/daylight";

interface ThemeContextValue {
  /** Preferência do usuário: automático (segue o horário) ou fixo. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Fator de luz aplicado agora: 0 = noite, 1 = dia. */
  daylight: number;
  /** Atalho para decisões binárias (sol x lua, estrelas). */
  isDay: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Reavalia o horário a cada minuto — passo pequeno o bastante pra não pular. */
const TICK_MS = 60_000;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [daylight, setDaylight] = useState<number>(() => daylightForMode(readStoredMode()));

  useEffect(() => {
    function sync() {
      const next = daylightForMode(mode);
      setDaylight(next);
      applyDaylight(next);
    }

    sync();
    if (mode !== "auto") return;

    const timer = setInterval(sync, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // modo privado / storage bloqueado: o tema segue funcionando na sessão
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, daylight, isDay: daylight >= 0.5 }),
    [mode, setMode, daylight],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
