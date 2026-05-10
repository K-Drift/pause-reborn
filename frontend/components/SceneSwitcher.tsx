"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, type SceneId } from "@/lib/scenes";

interface Props {
  value: SceneId;
  onChange: (id: SceneId) => void;
}

// 主按钮:elevated 底胶囊 + 标签 + 箭头。
// 下拉:card 底 + shadow-2xl,选中项左侧 2px 品牌渐变细条。
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
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-sm text-text-primary transition-colors duration-200 hover:bg-white/[0.10]"
      >
        <span>{current.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          className={
            "text-text-tertiary transition-transform duration-200 " +
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
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#0a0a0a] shadow-2xl backdrop-blur-md"
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
                  "relative block w-full px-4 py-2 text-left text-sm transition-colors duration-200 " +
                  (selected
                    ? "bg-white/[0.08] text-text-primary"
                    : "text-text-secondary hover:bg-white/[0.05] hover:text-text-primary")
                }
              >
                {/* 选中态:左侧 2px 品牌渐变细条 */}
                {selected && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-accent-brand-from to-accent-brand-to"
                  />
                )}
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
