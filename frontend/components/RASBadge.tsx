"use client";

import type { Decision } from "@/lib/types";
import { computeRAS, type RASBreakdown, type RASTone } from "@/lib/ras";

// Stage 9.E:RAS(克制广告分)展示徽章
// 圆形 SVG 进度环 + 标签 + 4 项 breakdown(或 no_ad/content_switch 的解释文字)
// 公式定义见 docs/RAS.md

interface Props {
  decision: Decision;
}

const TONE_STROKE: Record<RASTone, string> = {
  success: "var(--color-accent-success)",
  warning: "var(--color-accent-warning)",
  neutral: "var(--color-text-tertiary)",
};

const TONE_TEXT: Record<RASTone, string> = {
  success: "text-accent-success",
  warning: "text-accent-warning",
  neutral: "text-text-tertiary",
};

export default function RASBadge({ decision }: Props) {
  const result = computeRAS(decision);

  return (
    <div className="mb-5 flex items-center gap-4 rounded-xl bg-background-elevated p-4">
      <Ring score={result.score} tone={result.tone} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
          RAS · 克制广告分
        </div>
        <div className={"mt-0.5 text-base font-medium " + TONE_TEXT[result.tone]}>
          {result.label}
        </div>
        {result.breakdown && <BreakdownBars breakdown={result.breakdown} />}
        {result.score === 100 && result.tone === "warning" && (
          <div className="mt-2 text-xs leading-relaxed text-text-tertiary">
            拒绝出广告 · 克制广告的最高表达
          </div>
        )}
        {result.score === null && (
          <div className="mt-2 text-xs leading-relaxed text-text-tertiary">
            陪伴模式不计 RAS
          </div>
        )}
      </div>
    </div>
  );
}

function Ring({ score, tone }: { score: number | null; tone: RASTone }) {
  const size = 80;
  const radius = 32;
  const stroke = 5;
  const circ = 2 * Math.PI * radius;
  const filled = score === null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circ * (1 - filled / 100);
  const color = TONE_STROKE[tone];
  const display = score === null ? "—" : String(score);

  return (
    <svg width={size} height={size} className="shrink-0">
      {/* 底层 track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--color-border-default)"
        strokeWidth={stroke}
        fill="none"
      />
      {/* 进度弧:score 为 null 时不画 */}
      {score !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      )}
      {/* 中央数字 */}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: 24,
          fill: color,
          fontWeight: 600,
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
        }}
      >
        {display}
      </text>
    </svg>
  );
}

function BreakdownBars({ breakdown }: { breakdown: RASBreakdown }) {
  const items: { label: string; value: number }[] = [
    { label: "契合", value: breakdown.fit },
    { label: "调性", value: breakdown.tone },
    { label: "克制", value: breakdown.calm },
    { label: "提升", value: breakdown.lift },
  ];
  return (
    <div className="mt-2 grid grid-cols-4 gap-2">
      {items.map((it) => {
        const pct = Math.max(0, Math.min(100, it.value));
        return (
          <div key={it.label} className="flex flex-col gap-1">
            <div className="h-1 overflow-hidden rounded-full bg-background-card">
              <div
                className="h-full rounded-full bg-accent-success transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-tertiary">
              <span>{it.label}</span>
              <span className="font-mono">{Math.round(it.value)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
