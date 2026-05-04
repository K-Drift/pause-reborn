"use client";

import { useState } from "react";
import type { AnalyzeResponse, ShowAdDecision } from "@/lib/types";

interface Props {
  loading: boolean;
  result: AnalyzeResponse | null;
}

export default function DebugPanel({ loading, result }: Props) {
  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 text-sm">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Decision Console
        </div>
        <div className="mt-1 text-zinc-300">AI 思考过程</div>
      </header>

      {loading && <Skeleton />}
      {!loading && !result && (
        <div className="text-xs text-zinc-600">
          暂停以触发分析。这里会展示 VLM 输出、决策依据与契合度评分。
        </div>
      )}
      {!loading && result && <ResultView result={result} />}
    </aside>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[60, 90, 75, 80, 65].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-zinc-800"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function ResultView({ result }: { result: AnalyzeResponse }) {
  const { scene, decision } = result;
  return (
    <div className="space-y-5">
      <Section title="场景理解(VLM)">
        <SceneSummary scene={scene} />
        <CollapsibleJSON label="完整 SceneJSON" data={scene} />
      </Section>

      {decision.decision === "show_ad" && <ShowAdView ad={decision} />}
      {decision.decision === "no_ad" && (
        <Section title="决策">
          <Tag color="rose">no_ad · 敏感场景</Tag>
          <p className="mt-2 text-xs text-zinc-400">{decision.reason}</p>
        </Section>
      )}
      {decision.decision === "content_switch" && (
        <Section title="决策">
          <Tag color="amber">content_switch · 切换内容</Tag>
          <p className="mt-2 text-xs text-zinc-300">
            建议:{decision.suggested_content}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{decision.reason}</p>
        </Section>
      )}
    </div>
  );
}

function ShowAdView({ ad }: { ad: ShowAdDecision }) {
  return (
    <>
      <Section title="选中品牌">
        <div className="text-zinc-100">{ad.selected_brand}</div>
        {ad.alternative_brands.length > 0 && (
          <div className="mt-1 text-[11px] text-zinc-500">
            备选:{ad.alternative_brands.join(" · ")}
          </div>
        )}
      </Section>

      <Section title="文案 & 声线">
        <div className="font-serif text-zinc-200">"{ad.ad_copy}"</div>
        <div className="mt-2 text-[11px] text-zinc-500">
          声线:<span className="text-zinc-300">{ad.voice_preset}</span>
        </div>
      </Section>

      <Section title="契合度评分">
        <div className="space-y-2">
          <ScoreBar label="场景情绪契合度" value={ad.scores.scene_emotion_fit} />
          <ScoreBar label="品牌调性匹配度" value={ad.scores.brand_tone_match} />
          <KV label="用户心境干扰度" value={ad.scores.user_disturbance} accent />
          <KV
            label="预测注意力捕获率"
            value={ad.scores.predicted_attention_lift}
            accent
          />
        </div>
      </Section>

      <Section title="决策理由">
        <p className="text-[12px] leading-relaxed text-zinc-400">{ad.reasoning}</p>
      </Section>
    </>
  );
}

function SceneSummary({ scene }: { scene: AnalyzeResponse["scene"] }) {
  return (
    <div className="space-y-1 text-[12px] text-zinc-400">
      <div>
        <span className="text-zinc-500">场景:</span>{" "}
        <span className="text-zinc-200">{scene.scene}</span>
      </div>
      <div>
        <span className="text-zinc-500">情绪:</span>{" "}
        <span className="text-zinc-200">
          {Array.isArray(scene.emotion) ? scene.emotion.join(" / ") : scene.emotion}
        </span>
      </div>
      <div>
        <span className="text-zinc-500">色调:</span>{" "}
        <span className="text-zinc-200">{scene.color_tone}</span>
      </div>
      {scene.empty_surfaces?.length > 0 && (
        <div>
          <span className="text-zinc-500">可植入表面:</span>{" "}
          <span className="text-zinc-200">{scene.empty_surfaces.join(" · ")}</span>
        </div>
      )}
    </div>
  );
}

function CollapsibleJSON({ label, data }: { label: string; data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-zinc-500 hover:text-zinc-300"
      >
        {open ? "▾" : "▸"} {label}
      </button>
      {open && (
        <pre className="mt-1 max-h-60 overflow-auto rounded bg-black/40 p-2 text-[10px] leading-relaxed text-zinc-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
        {title}
      </div>
      {children}
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-200 tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function KV({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <span className={accent ? "text-emerald-300 tabular-nums" : "text-zinc-200"}>
        {value}
      </span>
    </div>
  );
}

function Tag({
  color,
  children,
}: {
  color: "rose" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const map = {
    rose: "border-rose-700/70 text-rose-300 bg-rose-950/40",
    amber: "border-amber-700/70 text-amber-300 bg-amber-950/40",
    emerald: "border-emerald-700/70 text-emerald-300 bg-emerald-950/40",
  } as const;
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[color]}`}
    >
      {children}
    </span>
  );
}
