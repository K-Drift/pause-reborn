"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:AI 解释段落 — 为什么这个品牌适合这些剧种
export default function BrandFitNarrative({ data }: Props) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        AI 投放分析
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        为什么这个品牌适合这些剧种
      </div>

      <div className="mt-4 rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-primary">
        {data.narrative}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
          品牌调性
        </span>
        {data.tone.map((t) => (
          <span
            key={t}
            className="rounded-full border border-border-default bg-background-elevated px-2.5 py-0.5 text-[11px] text-text-secondary"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
