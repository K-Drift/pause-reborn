"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:场景契合度直方图 — 8 柱手工 div 高度缩放
// Stage 9.D:配色重做 — 单色饱和度阶梯(高度 + 透明度双重编码)
// 80+ → opacity 100(达标),60-79 → 70%,<60 → 40%。叠加一条 "达标 80" 虚线参考线
export default function SceneFitHistogram({ data }: Props) {
  const max = 100;
  // 80 分参考线 = 距顶 20%(从底向上 80%)
  const passLineTop = 100 - 80;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-background-card/80 p-5 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        场景契合度分布
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        AI 在不同剧种里给该品牌的平均契合度
      </div>

      <div className="relative mt-5 h-40">
        {/* 达标线:80 分参考 */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent-success/20"
          style={{ top: `${passLineTop}%` }}
        >
          <span className="absolute -top-3.5 right-0 text-[10px] text-accent-success/40">
            达标 80
          </span>
        </div>

        <div className="flex h-full items-end gap-2">
          {data.sceneFit.map((bar) => {
            const pct = Math.max(2, (bar.score / max) * 100);
            const opacity =
              bar.score >= 80 ? 1 : bar.score >= 60 ? 0.7 : 0.4;
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
                  className="w-full rounded-t bg-accent-success transition-[height,opacity] duration-700 ease-out"
                  style={{ height: `${pct}%`, opacity: opacity * 0.85 }}
                />
              </div>
            );
          })}
        </div>
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
