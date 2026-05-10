"use client";

import { PERSONAS } from "@/lib/personas";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// 选中态:bg-elevated + text-primary + 80% 宽 ::after underline(品牌渐变)。
// 未选中:透明底,hover 才浮出 elevated/50 + text-secondary。
export default function PersonaSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-xs text-zinc-600">画像</span>
      <div className="inline-flex items-center gap-1">
        {PERSONAS.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => onChange(p.id)}
              className={
                "cursor-pointer whitespace-nowrap px-3 py-1 text-xs transition-all duration-300 ease-in-out " +
                (active
                  ? "rounded-full bg-zinc-800/80 font-medium text-zinc-100 shadow-sm shadow-black/20"
                  : "text-zinc-400 hover:text-zinc-300")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
