"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:4 张 KPI 数字卡
// Stage 9.D:左侧品牌渐变锚点 + inline SVG 图标 + hover lift,从 wireframe 升到产品级视觉
export default function KPIRow({ data }: Props) {
  const items = [
    {
      label: "投放场景数",
      value: formatNumber(data.kpis.sceneCount),
      suffix: "个",
      icon: <IconSceneFrame />,
    },
    {
      label: "总暂停次数",
      value: formatNumber(data.kpis.pauseCount),
      suffix: "次",
      icon: <IconPause />,
    },
    {
      label: "触达用户数",
      value: formatNumber(data.kpis.reachUsers),
      suffix: "人",
      icon: <IconUsers />,
    },
    {
      label: "平均 RAS",
      value: String(data.kpis.avgRAS),
      suffix: "/100",
      icon: <IconRing />,
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-background-card/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.10] hover:bg-white/[0.02] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        >
          {/* 左侧品牌渐变锚点 */}
          <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-accent-brand-from to-accent-brand-to opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="flex items-start justify-between">
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
              {it.label}
            </div>
            <div className="text-text-tertiary opacity-50 transition-opacity duration-300 group-hover:opacity-90">
              {it.icon}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <div
              className={
                "font-serif text-3xl font-medium tabular-nums leading-none " +
                (it.accent ? "text-text-secondary" : "text-text-primary")
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

// 14×14 inline SVG 图标(currentColor,跟随父级 text 颜色)
function IconSceneFrame() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5 6h6M5 9h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4" y="3" width="2.5" height="10" rx="0.6" fill="currentColor" />
      <rect x="9.5" y="3" width="2.5" height="10" rx="0.6" fill="currentColor" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M2 13.2c.7-2 2.2-3 4-3s3.3 1 4 3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="11.5" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 12c.6-1.2 1.6-2 3-2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconRing() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="5"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
      />
      <path
        d="M8 3a5 5 0 0 1 4.7 6.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
