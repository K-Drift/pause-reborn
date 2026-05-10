"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, type SceneId } from "@/lib/scenes";

interface Props {
  value: SceneId;
  onChange: (id: SceneId) => void;
}

export default function SceneSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = SCENES.find((s) => s.id === value) ?? SCENES[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 bg-zinc-800/80 text-zinc-100 px-4 py-1.5 rounded-full cursor-pointer hover:bg-zinc-700/80 transition-colors"
      >
        <span className="whitespace-nowrap text-sm">{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          className={
            "transition-transform duration-200 " +
            (open ? "rotate-180" : "")
          }
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      {/* Floating Panel */}
      <div
        role="listbox"
        className={
          "absolute top-[calc(100%+8px)] left-0 w-56 z-[9999] bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ease-out " +
          (open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none")
        }
      >
        {SCENES.map((s) => {
          const selected = s.id === value;
          return (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className={
                "block w-full text-left px-4 py-3 text-sm transition-colors duration-200 cursor-pointer " +
                (selected
                  ? "text-zinc-100 bg-white/5"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100")
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
