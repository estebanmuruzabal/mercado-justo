import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
export type PillOptionsProps<T extends string> = {
  options: readonly T[];
  value: T;
  onSelectChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
};
const SIZE_STYLES = {
  sm: { pad: "p-0.5", btn: "px-3 py-1 text-xs", inset: "top-0.5 bottom-0.5" },
  md: { pad: "p-1", btn: "px-4 py-2 text-sm", inset: "top-1 bottom-1" },
  lg: { pad: "p-1.5", btn: "px-5 py-2.5 text-base", inset: "top-1.5 bottom-1.5" },
} as const;
export function PillOptions<T extends string>({
  options,
  value,
  onSelectChange,
  className = "",
  disabled = false,
  size = "md",
}: PillOptionsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const s = SIZE_STYLES[size];
  useLayoutEffect(() => {
    const measure = () => {
      const btn = btnRefs.current[value];
      const container = containerRef.current;
      if (!btn || !container) return;
      const b = btn.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      setPill({ left: b.left - c.left, width: b.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options, size]);
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (disabled) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % options.length
        : (idx - 1 + options.length) % options.length;
    const nextOpt = options[next];
    onSelectChange(nextOpt);
    btnRefs.current[nextOpt]?.focus();
  };
  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-disabled={disabled || undefined}
      className={`relative inline-flex rounded-full bg-[#ececec] ${s.pad} ${
        disabled ? "opacity-60" : ""
      } ${className}`}
    >
      <div
        aria-hidden
        className={`absolute ${s.inset} rounded-full bg-white border-[1.5px] border-[#4a6cf7] shadow-sm`}
        style={{
          left: pill.left,
          width: pill.width,
          transition:
            "left 320ms cubic-bezier(0.4, 0, 0.2, 1), width 320ms cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: pill.width ? 1 : 0,
        }}
      />
      {options.map((opt, idx) => {
        const isActive = opt === value;
        return (
          <button
            key={opt}
            ref={(el) => {
              btnRefs.current[opt] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onSelectChange(opt)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 whitespace-nowrap rounded-full ${s.btn} transition-colors duration-150 ${
              disabled ? "cursor-not-allowed" : "active:bg-black/10"
            } ${isActive ? "font-semibold text-black" : "font-medium text-gray-700"}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
export default PillOptions;