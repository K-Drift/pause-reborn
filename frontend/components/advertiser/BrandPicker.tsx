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
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-full border border-white/[0.08] bg-[#0a0a0a] px-3.5 py-1.5 pr-8 text-sm text-text-primary outline-none backdrop-blur-md transition-colors hover:border-white/[0.14] focus:border-white/[0.14]"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          {BRANDS.map((b) => (
            <option
              key={b.id}
              value={b.id}
              style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}
            >
              {b.brand}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
