"use client";

import { useRef } from "react";

const PRESET_COLORS = [
  "#18181b",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
] as const;

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
};

function normalizeHex(c: string): string {
  const t = c.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (NAMED_COLORS[t]) return NAMED_COLORS[t];
  return "#18181b";
}

type ColorPickerStripProps = {
  color: string;
  onChange: (hex: string) => void;
  /** `rail` = vertical stack for side dock */
  layout?: "bar" | "rail";
};

export default function ColorPickerStrip({
  color,
  onChange,
  layout = "bar",
}: ColorPickerStripProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hex = normalizeHex(color);
  const presets = PRESET_COLORS as readonly string[];
  const isPreset = presets.includes(hex);
  const isRail = layout === "rail";

  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/85 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] ${
        isRail
          ? "flex flex-col items-center gap-3 px-2.5 py-3"
          : "flex flex-wrap items-center justify-center gap-2 px-3 py-2"
      }`}
      role="group"
      aria-label="Stroke color"
    >
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 ${
          isRail
            ? "block [writing-mode:vertical-rl] rotate-180"
            : "hidden sm:inline"
        }`}
      >
        Color
      </span>
      <div
        className={
          isRail
            ? "flex flex-col items-center gap-1.5"
            : "flex items-center gap-1.5"
        }
      >
        {presets.map((c) => {
          const active = hex === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`h-7 w-7 shrink-0 rounded-full border border-black/15 shadow-sm transition dark:border-white/15 ${
                active
                  ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-white scale-105 dark:ring-violet-400 dark:ring-offset-zinc-950"
                  : "ring-2 ring-transparent ring-offset-2 ring-offset-white hover:scale-105 dark:ring-offset-zinc-950"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              aria-pressed={active}
            />
          );
        })}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed text-xs font-bold transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            isPreset
              ? "border-zinc-300 text-zinc-500 dark:border-zinc-600 dark:text-zinc-400"
              : "border-violet-400/80 text-white shadow-inner ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:border-violet-500/60 dark:ring-violet-400 dark:ring-offset-zinc-950"
          }`}
          style={!isPreset ? { backgroundColor: hex } : undefined}
          title="More colors"
          aria-label="More colors — open color picker"
        >
          {isPreset ? "+" : null}
        </button>
      </div>
      <input
        ref={inputRef}
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="sr-only"
        tabIndex={-1}
        aria-label="Custom color"
      />
    </div>
  );
}
