import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

const fieldClasses =
  "w-full bg-panel-light border-4 border-edge px-3 py-2 text-lg font-mono-game text-ink placeholder:text-ink-dim focus:outline-none focus:border-diamond theme-fade";

export const PixelInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${fieldClasses} ${className}`} {...props} />
  ),
);
PixelInput.displayName = "PixelInput";

export const PixelSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => (
  <select ref={ref} className={`${fieldClasses} ${className}`} {...props}>
    {children}
  </select>
));
PixelSelect.displayName = "PixelSelect";

export function PixelLabel({ children }: { children: ReactNode }) {
  return <label className="block font-pixel text-[0.65rem] text-ink-dim mb-2">{children}</label>;
}
