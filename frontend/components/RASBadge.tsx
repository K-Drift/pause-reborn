"use client";

import type { Decision } from "@/lib/types";
import { computeRAS, type RASBreakdown, type RASTone } from "@/lib/ras";

// Stage 9.E:RAS(克制广告分)展示徽章
// Stage 9.F:breakdown 4 项升级 — 图标 + 分数自染色 + 更大字号
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
  success: "text-text-primary",
  warning: "text-accent-warning",
  neutral: "text-text-tertiary",
};

export default function RASBadge({ decision }: Props) {
  const result = computeRAS(decision);

  return (
    <div className="mb-5 flex items-center gap-4 rounded-xl border border-white/[0.06] bg-background-elevated/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--color-border-default)"
        strokeWidth={stroke}
        fill="none"
      />
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
  const items = [
    { label: "契合", value: breakdown.fit, icon: <IconTarget /> },
    { label: "调性", value: breakdown.tone, icon: <IconPalette /> },
    { label: "克制", value: breakdown.calm, icon: <IconShield /> },
    { label: "提升", value: breakdown.lift, icon: <IconTrendingUp /> },
  ];
  return (
    <div className="mt-3 space-y-1.5">
      {items.map((it) => {
        const v = Math.round(it.value);
        const tier = tierOpacity(it.value);
        return (
          <div key={it.label} className="flex items-center gap-2">
            <span className={"w-3 shrink-0 text-[9px] " + tier} aria-hidden>
              {it.icon}
            </span>
            <span className={"w-8 shrink-0 font-mono text-[11px] tabular-nums " + tier}>
              {v}
            </span>
            <span className={"text-[10px] " + tier}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function tierOpacity(value: number): string {
  if (value >= 85) return "text-zinc-200";
  if (value >= 70) return "text-zinc-400";
  if (value >= 55) return "text-zinc-500";
  return "text-zinc-600";
}

// 9×9 inline SVG icons(currentColor)
function IconTarget() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
    </svg>
  );
}
function IconPalette() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2.5a5.5 5.5 0 1 0 0 11c.6 0 1-.4 1-.9 0-.3-.2-.6-.4-.8-.2-.3-.4-.6-.4-.9 0-.5.4-.9.9-.9h1.4c1.6 0 2.9-1.3 2.9-2.9C13.4 4.1 11 2.5 8 2.5z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="5" cy="6.5" r="0.8" fill="currentColor" />
      <circle cx="7" cy="4.5" r="0.8" fill="currentColor" />
      <circle cx="10" cy="5" r="0.8" fill="currentColor" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2 3 4v4.5C3 11.5 5 13.5 8 14.5c3-1 5-3 5-6V4l-5-2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconTrendingUp() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 12l4-4 3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 5h4v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
