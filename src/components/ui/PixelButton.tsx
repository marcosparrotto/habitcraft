import type { ButtonHTMLAttributes } from "react";
import type { BlockColor } from "../../types";
import { BLOCK_COLOR_CLASSES } from "../../theme/blockColors";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: BlockColor;
  variant?: "solid" | "ghost";
}

export function PixelButton({
  color = "grass",
  variant = "solid",
  className = "",
  ...props
}: PixelButtonProps) {
  const palette = BLOCK_COLOR_CLASSES[color];

  const base =
    "font-pixel text-xs px-4 py-3 border-4 pixel-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0_0_rgba(0,0,0,0.45)]";

  const styles =
    variant === "solid"
      ? `${palette.bg} ${palette.text} border-edge`
      : `bg-transparent ${palette.border} text-current border-current`;

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
