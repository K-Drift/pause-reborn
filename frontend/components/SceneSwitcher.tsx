"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, type SceneId } from "@/lib/scenes";

interface Props {
  value: SceneId;
  onChange: (id: SceneId) => void;
}

// Stage 8:NavBar 场景下拉。点击空白处关闭。
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-background-card px-3 py-1.5 text-sm text-text-primary transition-colors duration-200 hover:bg-background-elevated"
      >
        <span>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" className="text-text-tertiary">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[180px] overflow-hidden rounded-lg border border-border-subtle bg-background-card shadow-2xl z-50">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className={
                "block w-full px-3 py-2 text-left text-sm transition-colors duration-200 " +
                (s.id === value
                  ? "bg-background-elevated text-text-primary"
                  : "text-text-secondary hover:bg-background-elevated hover:text-text-primary")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
