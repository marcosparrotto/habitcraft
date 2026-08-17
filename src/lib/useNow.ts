import { useEffect, useState } from "react";

/**
 * Relógio que avança sozinho. A aba "Hoje" decide o que destacar com base no
 * horário, então ela não pode congelar a hora no momento em que montou — o app
 * costuma ficar aberto enquanto o dia passa.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}
