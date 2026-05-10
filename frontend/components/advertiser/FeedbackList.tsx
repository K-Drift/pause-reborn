"use client";

import type { BrandDashboard } from "@/lib/mock-dashboard";
import { SCENE_BUCKETS } from "@/lib/mock-dashboard";
import FeedbackAvatar from "@/components/advertiser/FeedbackAvatar";

interface Props {
  data: BrandDashboard;
}

// Stage 9.C:用户主观接受度反馈
// Stage 9.F:Featured 首条放大 + 后 3 条 sentiment 配色 + 头像 + 场景上下文 chip
export default function FeedbackList({ data }: Props) {
  const items = data.feedback;
  if (items.length === 0) return null;
  const [headline, ...rest] = items;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-background-card/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.10] hover:bg-white/[0.02] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="text-[10px] uppercase tracking-widest text-text-tertiary">
        用户主观接受度反馈
      </div>
      <div className="mt-1 text-sm text-text-secondary">
        采样自该品牌投放场景的暂停后回访
      </div>

      {/* Featured headline — 跨满宽,大字号 */}
      <FeaturedQuote
        quote={headline.quote}
        sentiment={headline.sentiment}
        scene={pickScene(headline.quote, 0)}
      />

      {/* 后 3 条 紧凑卡片 */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {rest.map((f, i) => (
          <CompactQuote
            key={i}
            quote={f.quote}
            sentiment={f.sentiment}
            scene={pickScene(f.quote, i + 1)}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturedQuote({
  quote,
  sentiment,
  scene,
}: {
  quote: string;
  sentiment: "pos" | "neutral";
  scene: string;
}) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
      {/* 大引号:左上角浮动 */}
      <span
        className="absolute left-3 top-2 select-none font-serif text-7xl leading-none text-white/[0.08]"
        aria-hidden
      >
        &ldquo;
      </span>

      <div className="relative pl-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-accent-brand-from/80">
          代表性反馈
        </div>
        <p className="mt-2 font-serif text-xl font-medium leading-relaxed text-text-primary">
          {quote}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <FeedbackAvatar seed={quote} size={28} />
          <SentimentChip sentiment={sentiment} />
          <SceneChip scene={scene} />
        </div>
      </div>
    </div>
  );
}

function CompactQuote({
  quote,
  sentiment,
  scene,
}: {
  quote: string;
  sentiment: "pos" | "neutral";
  scene: string;
}) {
  // sentiment 决定卡片调性
  const tint =
    sentiment === "pos"
      ? "border-white/[0.08] bg-white/[0.03]"
      : "border-white/[0.06] bg-white/[0.02]";

  return (
    <div className={"flex flex-col gap-3 rounded-lg border p-4 " + tint}>
      <p className="text-sm leading-relaxed text-text-secondary">
        <span className="mr-1 align-top font-serif text-base text-accent-brand-from/70">&ldquo;</span>
        {quote}
        <span className="ml-1 align-top font-serif text-base text-accent-brand-to/70">&rdquo;</span>
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <FeedbackAvatar seed={quote} />
        <SentimentChip sentiment={sentiment} />
        <SceneChip scene={scene} />
      </div>
    </div>
  );
}

function SentimentChip({ sentiment }: { sentiment: "pos" | "neutral" }) {
  if (sentiment === "pos") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent-brand-from/20 bg-accent-brand-from/[0.08] px-2 py-0.5 text-[10px] text-accent-brand-from">
        <span className="inline-block h-1 w-1 rounded-full bg-accent-brand-from" />
        正向
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-text-tertiary">
      <span className="inline-block h-1 w-1 rounded-full bg-text-tertiary" />
      中性
    </span>
  );
}

function SceneChip({ scene }: { scene: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-background-elevated px-2 py-0.5 text-[10px] text-text-tertiary">
      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {scene}
    </span>
  );
}

// 把 quote 字符串映射到一个稳定的 SCENE_BUCKETS 元素 — 加 i 是为了让同一品牌
// 的 4 条反馈尽量分到不同场景,提升直观信号
function pickScene(quote: string, i: number): string {
  let h = 2166136261 >>> 0;
  for (let k = 0; k < quote.length; k++) {
    h = ((h ^ quote.charCodeAt(k)) >>> 0) * 16777619 >>> 0;
  }
  return SCENE_BUCKETS[(h + i) % SCENE_BUCKETS.length];
}
