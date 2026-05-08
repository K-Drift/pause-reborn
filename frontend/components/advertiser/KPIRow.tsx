"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:4 张 KPI 数字卡
export default function KPIRow({ data }: Props) {
  const items = [
    { label: "投放场景数", value: formatNumber(data.kpis.sceneCount), suffix: "个" },
    { label: "总暂停次数", value: formatNumber(data.kpis.pauseCount), suffix: "次" },
    { label: "触达用户数", value: formatNumber(data.kpis.reachUsers), suffix: "人" },
    { label: "平均 RAS", value: String(data.kpis.avgRAS), suffix: "/100", accent: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border-subtle bg-background-card p-4"
        >
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
            {it.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <div
              className={
                "text-2xl font-medium tabular-nums " +
                (it.accent ? "text-accent-success" : "text-text-primary")
              }
            >
              {it.value}
            </div>
            <div className="text-xs text-text-tertiary">{it.suffix}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return String(n);
}
