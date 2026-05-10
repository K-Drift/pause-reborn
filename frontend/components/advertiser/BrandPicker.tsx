"use client";

import { BRANDS } from "@/lib/mock-dashboard";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Stage 9.C:品牌选择器 — 12 选 1
export default function BrandPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase tracking-widest text-text-tertiary">
        品牌
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-sm text-text-primary outline-none transition-colors hover:bg-white/[0.08] focus:bg-white/[0.08]"
      >
        {BRANDS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.brand}
          </option>
        ))}
      </select>
    </div>
  );
}
