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
                "relative cursor-pointer rounded-md px-3 py-1.5 text-xs transition-all duration-200 " +
                (active
                  ? "bg-background-elevated text-text-primary after:absolute after:bottom-[-2px] after:left-[10%] after:right-[10%] after:h-0.5 after:bg-gradient-to-r after:from-accent-brand-from after:to-accent-brand-to after:content-['']"
                  : "text-text-tertiary hover:bg-background-elevated/50 hover:text-text-secondary")
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
