"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:AI 解释段落
// Stage 9.F:左 60% 核心洞察 3 stats / 右 40% 叙事段;tone 标签升级带渐变描边 + 色点
export default function BrandFitNarrative({ data }: Props) {
  const insights = computeInsights(data);

  return (
    <div className="rounded-xl border border-border-subtle bg-background-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        AI 投放分析
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        为什么这个品牌适合这些剧种
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* 左 60%:核心洞察 3 卡 */}
        <div className="grid grid-cols-1 gap-2 lg:col-span-3">
          <InsightCard
            label="最高契合"
            scene={insights.bestScene}
            score={insights.bestScore}
            tone="success"
            hint="AI 主动推送的核心剧种"
          />
          <InsightCard
            label="主动规避"
            scene={insights.worstScene}
            score={insights.worstScore}
            tone="warning"
            hint="此剧种与品牌调性不符,AI 自动避开"
          />
          <RasInsightCard
            median={insights.rasMedian}
            trend={insights.rasTrend}
          />
        </div>

        {/* 右 40%:叙事段 */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-primary">
            <span className="mb-2 block text-[10px] uppercase tracking-widest text-text-tertiary">
              AI 解读
            </span>
            <p>{data.narrative}</p>
          </div>
        </div>
      </div>

      {/* 品牌调性标签:渐变描边 + 色点 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
          品牌调性
        </span>
        {data.tone.map((t, i) => (
          <ToneTag key={t} label={t} index={i} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  label,
  scene,
  score,
  tone,
  hint,
}: {
  label: string;
  scene: string;
  score: number;
  tone: "success" | "warning";
  hint: string;
}) {
  const accent =
    tone === "success" ? "text-accent-success" : "text-accent-warning";
  const dot =
    tone === "success" ? "bg-accent-success" : "bg-accent-warning";
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border-subtle bg-background-elevated p-4 transition-colors duration-300 hover:border-border-default">
      <div className="flex items-center gap-2">
        <span className={"inline-block h-1.5 w-1.5 rounded-full " + dot} />
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="text-base font-medium text-text-primary">{scene}</div>
        <div className={"font-mono text-2xl tabular-nums " + accent}>
          {score}
        </div>
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-text-tertiary">
        {hint}
      </div>
    </div>
  );
}

function RasInsightCard({
  median,
  trend,
}: {
  median: number;
  trend: "up" | "down" | "flat";
}) {
  const trendArrow =
    trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  const trendLabel =
    trend === "up" ? "上行" : trend === "down" ? "下行" : "平稳";
  const trendColor =
    trend === "up"
      ? "text-accent-success"
      : trend === "down"
        ? "text-accent-warning"
        : "text-text-tertiary";
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border-subtle bg-background-elevated p-4 transition-colors duration-300 hover:border-border-default">
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-accent-brand-from to-accent-brand-to" />
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
          RAS 表现
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="text-base font-medium text-text-primary">
          30 天中位数
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl tabular-nums text-text-primary">
            {median}
          </span>
          <span className={"font-mono text-xs tabular-nums " + trendColor}>
            {trendArrow} {trendLabel}
          </span>
        </div>
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-text-tertiary">
        近 15 天与前 15 天的均值对比走向
      </div>
    </div>
  );
}

function ToneTag({ label, index }: { label: string; index: number }) {
  // 5 种渐变色点,基于 index 循环 — 让同一品牌的多个 tag 视觉有节奏
  const dotColors = [
    "bg-accent-success",
    "bg-accent-brand-from",
    "bg-accent-brand-to",
    "bg-accent-warning",
    "bg-accent-success/70",
  ];
  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-full bg-background-elevated px-3 py-1 text-[11px] text-text-secondary">
      <span
        className="pointer-events-none absolute inset-0 rounded-full p-px"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent-brand-from), var(--color-accent-brand-to))",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0.5,
        }}
        aria-hidden
      />
      <span
        className={"relative inline-block h-1 w-1 rounded-full " + dotColors[index % dotColors.length]}
      />
      <span className="relative">{label}</span>
    </span>
  );
}

interface Insights {
  bestScene: string;
  bestScore: number;
  worstScene: string;
  worstScore: number;
  rasMedian: number;
  rasTrend: "up" | "down" | "flat";
}

function computeInsights(data: BrandDashboard): Insights {
  // 最高/最低契合场景
  const sortedFit = [...data.sceneFit].sort((a, b) => b.score - a.score);
  const best = sortedFit[0];
  const worst = sortedFit[sortedFit.length - 1];

  // RAS 中位数
  const sortedTrend = [...data.rasTrend].sort((a, b) => a - b);
  const mid = Math.floor(sortedTrend.length / 2);
  const median =
    sortedTrend.length % 2 === 0
      ? Math.round((sortedTrend[mid - 1] + sortedTrend[mid]) / 2)
      : sortedTrend[mid];

  // 走向:近 15 天 vs 前 15 天均值对比
  const half = Math.floor(data.rasTrend.length / 2);
  const earlyAvg = avg(data.rasTrend.slice(0, half));
  const lateAvg = avg(data.rasTrend.slice(half));
  const delta = lateAvg - earlyAvg;
  const trend: "up" | "down" | "flat" =
    delta > 1.5 ? "up" : delta < -1.5 ? "down" : "flat";

  return {
    bestScene: best.sceneCategory,
    bestScore: best.score,
    worstScene: worst.sceneCategory,
    worstScore: worst.score,
    rasMedian: median,
    rasTrend: trend,
  };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}
