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
        className="cursor-pointer rounded-md border border-border-default bg-background-elevated px-3 py-1.5 text-sm text-text-primary outline-none transition-colors hover:border-accent-brand-from focus:border-accent-brand-from"
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
