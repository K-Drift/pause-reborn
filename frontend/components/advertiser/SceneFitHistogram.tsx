"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:场景契合度直方图 — 8 柱手工 div 高度缩放
export default function SceneFitHistogram({ data }: Props) {
  const max = 100; // 总是按 0-100 比例渲染,便于横向比较
  return (
    <div className="rounded-xl border border-border-subtle bg-background-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        场景契合度分布
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        AI 在不同剧种里给该品牌的平均契合度
      </div>

      <div className="mt-5 flex h-40 items-end gap-2">
        {data.sceneFit.map((bar) => {
          const pct = Math.max(2, (bar.score / max) * 100);
          const tone =
            bar.score >= 80
              ? "bg-accent-success"
              : bar.score >= 60
                ? "bg-accent-brand-from"
                : "bg-text-tertiary/60";
          return (
            <div
              key={bar.sceneCategory}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${bar.sceneCategory}: ${bar.score}`}
            >
              <div className="text-[10px] font-mono text-text-tertiary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {bar.score}
              </div>
              <div
                className={"w-full rounded-t " + tone + " transition-[height] duration-700 ease-out"}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2">
        {data.sceneFit.map((bar) => (
          <div
            key={bar.sceneCategory + "_label"}
            className="flex-1 text-center text-[10px] leading-tight text-text-tertiary"
          >
            {bar.sceneCategory}
          </div>
        ))}
      </div>
    </div>
  );
}
