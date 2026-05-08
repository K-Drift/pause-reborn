"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:RAS 30 天趋势线 — 手工 SVG polyline
export default function RASTrendLine({ data }: Props) {
  const points = data.rasTrend;
  const w = 320;
  const h = 140;
  const padX = 8;
  const padY = 12;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // x:均匀分布;y:0-100 → padY..h-padY 反向
  const coords = points.map((v, i) => {
    const x = padX + (i / (points.length - 1)) * innerW;
    const y = padY + (1 - v / 100) * innerH;
    return { x, y, v };
  });

  const polyline = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  // 区域填充:多一个底部右下角 + 底部左下角形成闭合多边形
  const area =
    polyline +
    ` ${(padX + innerW).toFixed(1)},${(padY + innerH).toFixed(1)} ${padX},${(padY + innerH).toFixed(1)}`;

  const last = coords[coords.length - 1];
  const avg = Math.round(points.reduce((s, v) => s + v, 0) / points.length);

  return (
    <div className="rounded-xl border border-border-subtle bg-background-card p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
            RAS 30 天趋势
          </div>
          <div className="mt-1 text-sm text-text-secondary">
            该品牌的克制度 + 契合度合成评分
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
            30 天均值
          </div>
          <div className="mt-1 text-2xl font-medium tabular-nums text-accent-success">
            {avg}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-4 h-36 w-full"
        preserveAspectRatio="none"
      >
        {/* 背景参考线:25 / 50 / 75 */}
        {[25, 50, 75].map((g) => {
          const y = padY + (1 - g / 100) * innerH;
          return (
            <line
              key={g}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="var(--color-border-subtle)"
              strokeDasharray="2 4"
            />
          );
        })}
        {/* 渐变填充 */}
        <defs>
          <linearGradient id="ras-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-success)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent-success)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#ras-area)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-accent-success)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 末点 highlight */}
        <circle
          cx={last.x}
          cy={last.y}
          r={3}
          fill="var(--color-accent-success)"
        />
      </svg>

      <div className="mt-2 flex justify-between text-[10px] text-text-tertiary">
        <span>30 天前</span>
        <span>今天</span>
      </div>
    </div>
  );
}
