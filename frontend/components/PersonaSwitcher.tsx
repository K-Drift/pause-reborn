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
      <span className="text-xs text-text-tertiary">画像</span>
      <div className="inline-flex items-center gap-4">
        {PERSONAS.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => onChange(p.id)}
              className={
                "cursor-pointer text-xs transition-all duration-300 ease-in-out " +
                (active
                  ? "text-zinc-100 drop-shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300")
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
