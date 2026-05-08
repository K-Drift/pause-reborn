"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:用户主观接受度反馈
export default function FeedbackList({ data }: Props) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        用户主观接受度反馈
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        采样自该品牌投放场景的暂停后回访
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {data.feedback.map((f, i) => (
          <div
            key={i}
            className="rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-secondary"
          >
            <span className="mr-2 text-accent-brand-from">&ldquo;</span>
            {f.quote}
            <span className="ml-1 text-accent-brand-to">&rdquo;</span>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-text-tertiary">
              {f.sentiment === "pos" ? "正向" : "中性"} · 匿名用户
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
