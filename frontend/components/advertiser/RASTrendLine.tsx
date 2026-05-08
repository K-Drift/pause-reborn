"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:RAS 30 天趋势线 — 手工 SVG polyline
// Stage 9.D:信息密度补齐
//   - brand-gradient 填充(把 RAS 主题色和品牌色绑起来)
//   - 平均参考线 + "均 N" 浮标
//   - 末点双层 ring + "今 N" 浮标
//   - 峰值小圆点 + "峰 N" 浮标
//   - 3 处 x 轴 tick(30 天前 / 15 天前 / 今天)
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
  const avgY = padY + (1 - avg / 100) * innerH;

  // 峰值索引;若末点本身就是峰值则不重复标注,避免 "今 N" 与 "峰 N" 重叠
  const peakIdx = points.reduce(
    (best, v, i) => (v > points[best] ? i : best),
    0
  );
  const peak = coords[peakIdx];
  const showPeak = peakIdx !== coords.length - 1;

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

      <div className="relative mt-4 h-36">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* 品牌渐变 fill:brand-from(紫)→ brand-to(蓝)→ 透明,把 RAS 主题色和品牌色绑起来 */}
            <linearGradient id="ras-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-accent-brand-from)"
                stopOpacity="0.35"
              />
              <stop
                offset="60%"
                stopColor="var(--color-accent-brand-to)"
                stopOpacity="0.12"
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent-brand-to)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

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

          {/* 平均参考线 */}
          <line
            x1={padX}
            x2={w - padX}
            y1={avgY}
            y2={avgY}
            stroke="var(--color-text-tertiary)"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {/* 渐变填充区 */}
          <polygon points={area} fill="url(#ras-area)" />

          {/* 主线 */}
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--color-accent-success)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 峰值小圆点 */}
          {showPeak && (
            <circle
              cx={peak.x}
              cy={peak.y}
              r={3}
              fill="var(--color-accent-success)"
              opacity="0.5"
            />
          )}

          {/* 末点双层 ring(外圈半透明 + 内圈实心) */}
          <circle
            cx={last.x}
            cy={last.y}
            r={5}
            fill="var(--color-accent-success)"
            opacity="0.25"
          />
          <circle
            cx={last.x}
            cy={last.y}
            r={3}
            fill="var(--color-accent-success)"
          />
        </svg>

        {/* HTML overlay(SVG 用了 preserveAspectRatio="none" 会形变,文字必须用 HTML 层) */}
        {/* 末点:今 N */}
        <div
          className="pointer-events-none absolute font-mono text-[10px] text-accent-success"
          style={{
            left: `${(last.x / w) * 100}%`,
            top: `${(last.y / h) * 100}%`,
            transform: "translate(-100%, -160%)",
            whiteSpace: "nowrap",
          }}
        >
          今 {last.v}
        </div>

        {/* 平均参考线:均 N */}
        <div
          className="pointer-events-none absolute font-mono text-[10px] text-text-tertiary"
          style={{
            right: 4,
            top: `${(avgY / h) * 100}%`,
            transform: "translateY(-100%)",
          }}
        >
          均 {avg}
        </div>

        {/* 峰值标注 */}
        {showPeak && (
          <div
            className="pointer-events-none absolute font-mono text-[10px] text-accent-success/70"
            style={{
              left: `${(peak.x / w) * 100}%`,
              top: `${(peak.y / h) * 100}%`,
              transform: "translate(-50%, -180%)",
              whiteSpace: "nowrap",
            }}
          >
            ▲ 峰 {peak.v}
          </div>
        )}
      </div>

      {/* 3 处 x 轴 tick */}
      <div className="mt-2 flex justify-between text-[10px] text-text-tertiary">
        <span>30 天前</span>
        <span>15 天前</span>
        <span>今天</span>
      </div>
    </div>
  );
}
