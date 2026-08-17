import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTheme } from "../lib/ThemeContext";

interface DayNightHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * Faixa de céu que acompanha o ciclo dia/noite: sol e lua fazem crossfade,
 * as estrelas aparecem conforme escurece, e o gradiente vem dos tokens de tema
 * (--color-sky-top / --color-sky-bottom), então nada aqui é hardcode.
 */
export function DayNightHero({ title, subtitle, children }: DayNightHeroProps) {
  const { daylight } = useTheme();

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        top: `${(i * 53 + 7) % 70}%`,
        opacity: 0.4 + ((i * 17) % 60) / 100,
      })),
    [],
  );

  return (
    <div
      className="relative overflow-hidden border-4 border-edge pixel-shadow theme-fade"
      style={{
        backgroundImage: "linear-gradient(180deg, var(--color-sky-top), var(--color-sky-bottom))",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: 1 - daylight }}
        aria-hidden
      >
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute w-[2px] h-[2px] bg-white"
            style={{ left: s.left, top: s.top, opacity: s.opacity }}
          />
        ))}
      </div>

      {/* sol e lua ocupam o mesmo lugar e trocam por opacidade */}
      <div className="absolute top-4 right-5 w-9 h-9" aria-hidden>
        <span
          className="absolute inset-0 rounded-full transition-opacity duration-700"
          style={{
            opacity: daylight,
            background: "#ffe066",
            boxShadow: "0 0 18px 6px rgba(255,224,102,.7)",
          }}
        />
        <span
          className="absolute inset-0 rounded-full transition-opacity duration-700 overflow-hidden"
          style={{
            opacity: 1 - daylight,
            background: "#e8e6f0",
            boxShadow: "0 0 12px 3px rgba(232,230,240,.5)",
          }}
        >
          <span
            className="absolute rounded-full"
            style={{ top: 2, left: 8, width: 26, height: 26, background: "var(--color-sky-top)" }}
          />
        </span>
      </div>

      <div className="relative z-10 px-4 pt-5 pb-3 text-center max-w-lg mx-auto">
        <h1
          className="font-pixel text-[0.8rem] leading-relaxed mb-1"
          style={{
            color: "var(--color-sky-ink)",
            textShadow: "2px 2px 0 var(--t-sky-shadow)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-base mb-3 first-letter:uppercase opacity-90"
            style={{ color: "var(--color-sky-ink)" }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* faixa de grama + terra fechando o bloco de céu */}
      <div
        className="relative z-10 h-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #5b8c34 0 16px, #436a26 16px 18px)",
        }}
        aria-hidden
      >
        <div
          className="absolute top-full left-0 right-0 h-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #6b4423 0 16px, #4d3019 16px 18px)",
          }}
        />
      </div>
      <div className="h-3" aria-hidden />
    </div>
  );
}
