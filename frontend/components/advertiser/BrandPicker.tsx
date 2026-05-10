"use client";

import { useEffect, useRef, useState } from "react";
import { BRANDS } from "@/lib/mock-dashboard";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Stage 9.C:品牌选择器 — 12 选 1
// Stage 9.G:废弃原生 <select>,改为自定义 div 下拉,彻底消灭浏览器默认蓝高亮
export default function BrandPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = BRANDS.find((b) => b.id === value) ?? BRANDS[0];

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
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-widest text-text-tertiary">
        品牌
      </span>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#09090b] px-5 py-2 text-sm text-zinc-100 outline-none transition-all duration-300 ease-in-out hover:border-white/[0.14] hover:bg-white/[0.04]"
        >
          <span className="max-w-[160px] truncate">{current.brand}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            className={
              "shrink-0 text-zinc-500 transition-transform duration-200 " +
              (open ? "rotate-180" : "")
            }
            aria-hidden
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
            className="absolute right-0 top-full z-50 mt-2 max-h-[380px] min-w-[220px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#09090b] py-1.5 shadow-2xl"
          >
            {BRANDS.map((b) => {
              const selected = b.id === value;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                  }}
                  className={
                    "relative block w-full px-5 py-3 text-left text-sm transition-all duration-300 ease-in-out " +
                    (selected
                      ? "bg-white/[0.06] text-zinc-100"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100")
                  }
                >
                  {selected && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-white/20"
                    />
                  )}
                  <span className="block truncate">{b.brand}</span>
                  <span className="mt-0.5 block text-[10px] text-zinc-600">
                    {b.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
