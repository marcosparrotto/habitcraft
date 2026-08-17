import type { HTMLAttributes } from "react";

export function PixelPanel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-panel border-4 border-edge pixel-shadow crosshatch-bg p-4 ${className}`}
      {...props}
    />
  );
}
