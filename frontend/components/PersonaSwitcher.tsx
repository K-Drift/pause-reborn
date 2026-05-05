"use client";

import { PERSONAS } from "@/lib/personas";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Stage 8:NavBar 内联 pill 切换。选中态用品牌渐变,未选中态低调描边。
export default function PersonaSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-tertiary">画像</span>
      <div className="flex items-center gap-1.5">
        {PERSONAS.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => onChange(p.id)}
              className={
                "rounded-full px-3 py-1 text-xs transition-all duration-200 " +
                (active
                  ? "bg-gradient-to-r from-accent-brand-from to-accent-brand-to text-white"
                  : "border border-border-default text-text-secondary hover:text-text-primary")
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
