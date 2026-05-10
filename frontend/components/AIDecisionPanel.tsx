"use client";

import { useEffect, useState } from "react";
import type { SceneJSON, ShowAdDecision } from "@/lib/types";
import type { SceneState, DecisionState } from "@/app/page";
import type { UserState } from "@/lib/personas";
import RASBadge from "@/components/RASBadge";
import DecisionPathGraph from "@/components/DecisionPathGraph";

interface PersonaDisplay {
  id: string;
  label: string;
  hint: string;
}

interface Props {
  paused: boolean;
  sceneState: SceneState;
  decisionState: DecisionState;
  // Stage 9.B:决策推理图需要的额外上下文
  frameId: string;
  frameImageSrc: string;
  persona: PersonaDisplay;
  userState: UserState;
}

type PanelTab = "path" | "detail";

// Stage 8:右侧 AI 决策面板。
// Stage 9.B:加 tabs(推理路径 | 决策详情),默认推理路径
// - 顶部 DECISION CONSOLE 标题 + RAS 徽章 + tabs
// - 推理路径 tab:DecisionPathGraph(状态层否决与分支扇出可视化)
// - 决策详情 tab:原有 5 个 Section(场景理解 / 选中品牌 / 文案声线 / 评分 / 理由)
// - 特殊状态:content_switch / no_ad / restraint 显示对应顶部标签 + 隐藏部分区块
export default function AIDecisionPanel({
  paused,
  sceneState,
  decisionState,
  frameId,
  frameImageSrc,
  persona,
  userState,
}: Props) {
  const [tab, setTab] = useState<PanelTab>("path");
  const sceneReady = sceneState.phase === "ready" && !!sceneState.data;
  const decisionReady = decisionState.phase === "ready" && !!decisionState.data;
  const idle = !paused && sceneState.phase === "idle";

  const decision = decisionReady ? decisionState.data! : null;
  const isContentSwitch = decision?.decision === "content_switch";
  const isSilent =
    decision?.decision === "no_ad" || decision?.decision === "restraint";
  // 后端 stage2 LLM 调用失败、已降级到 mock 时,decision 上会带 _ai_status="fallback"
  const isFallback =
    decision !== null &&
    "_ai_status" in decision &&
    decision._ai_status === "fallback";

  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-2xl border border-white/[0.06] bg-background-card/80 p-6 backdrop-blur-sm">
      {/* 顶部标题区 */}
      <div className="mb-6 border-b border-white/[0.06] pb-4">
        <div className="text-xs uppercase tracking-widest text-text-tertiary">
          DECISION CONSOLE
        </div>
        <div className="mt-1 text-lg font-medium text-text-primary">
          AI 思考过程
        </div>
      </div>

      {/* 降级提示:LLM 不可达时露出,告知用户当前为预设示例 */}
      {isFallback && (
        <div className="mb-3 inline-block rounded-md border border-amber-800/30 bg-amber-950/30 px-3 py-1.5 text-xs tracking-wide text-amber-300/70">
          · AI 决策服务暂时不可达 · 当前为预设示例
        </div>
      )}

      {idle && (
        <div className="text-xs text-text-tertiary">
          点击左侧视频暂停,这里会展示 VLM 输出、决策依据与契合度评分。
        </div>
      )}

      {/* 特殊状态顶部标签条 */}
      {decisionReady && isContentSwitch && (
        <DecisionTag>决策类型:陪伴模式 · 不展示广告</DecisionTag>
      )}
      {decisionReady && isSilent && (
        <DecisionTag>决策类型:克制模式 · 此刻不打扰</DecisionTag>
      )}

      {/* Stage 9.E:RAS 克制广告分(决策就绪后展示) */}
      {decisionReady && decision && <RASBadge decision={decision} />}

      {/* Stage 9.B:tabs 切换 — 推理路径 / 决策详情。仅暂停时展示 */}
      {paused && <PanelTabs tab={tab} onChange={setTab} />}

      {/* 推理路径 tab:决策机制可视化 */}
      {paused && tab === "path" && (
        <div className="mt-4">
          <DecisionPathGraph
            frameId={frameId}
            frameImageSrc={frameImageSrc}
            scene={sceneReady ? sceneState.data! : null}
            decision={decision}
            persona={persona}
            userState={userState}
          />
        </div>
      )}

      {/* 决策详情 tab:原 5 个 Section */}
      {paused && tab === "detail" && (
        <div className="mt-4 space-y-6">
          {/* 区块 1:场景理解 */}
          <Section title="场景理解(VLM)">
            {sceneReady ? (
              <FadeIn>
                <SceneFields scene={sceneState.data!} />
                <CollapsibleJSON data={sceneState.data!} />
              </FadeIn>
            ) : (
              <FieldSkeleton lines={4} />
            )}
          </Section>

          {/* 静默模式:区块 2-5 全部隐藏 */}
          {!isSilent && (
            <DecisionBlocks
              sceneState={sceneState}
              sceneReady={sceneReady}
              decisionReady={decisionReady}
              decision={decision}
              isContentSwitch={isContentSwitch}
            />
          )}
        </div>
      )}
    </aside>
  );
}

function PanelTabs({
  tab,
  onChange,
}: {
  tab: PanelTab;
  onChange: (t: PanelTab) => void;
}) {
  const items: { id: PanelTab; label: string }[] = [
    { id: "path", label: "推理路径" },
    { id: "detail", label: "决策详情" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
      {items.map((it) => {
        const active = it.id === tab;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={
              "cursor-pointer rounded-md px-3 py-1 text-xs transition-all duration-200 " +
              (active
                ? "bg-background-card text-text-primary"
                : "text-text-tertiary hover:text-text-secondary")
            }
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function DecisionBlocks({
  sceneState,
  sceneReady,
  decisionReady,
  decision,
  isContentSwitch,
}: {
  sceneState: SceneState;
  sceneReady: boolean;
  decisionReady: boolean;
  decision: DecisionState["data"] | null;
  isContentSwitch: boolean;
}) {
  // Stage 8.5:植入位置 — 优先 LLM 输出的 selected_surface(若 stage2 真返回了),
  // 否则降级到 VLM empty_surfaces[0]
  const surfaceLabel =
    (decision &&
      decision.decision === "show_ad" &&
      decision.selected_surface) ||
    sceneState.data?.empty_surfaces?.[0] ||
    "—";
  // stage1 还没完:不显示决策块
  if (!sceneReady) return null;

  // stage1 完成,stage2 还没完:三个骨架屏占位
  if (!decisionReady || !decision) {
    return (
      <>
        <Section title={isContentSwitch ? "推荐内容" : "选中品牌"}>
          <FieldSkeleton lines={2} />
        </Section>
        <Section title={isContentSwitch ? "推荐理由" : "文案 & 声线"}>
          <FieldSkeleton lines={3} />
        </Section>
        {!isContentSwitch && (
          <Section title="契合度评分">
            <FieldSkeleton lines={4} />
          </Section>
        )}
        <Section title="决策理由">
          <FieldSkeleton lines={3} />
        </Section>
      </>
    );
  }

  if (decision.decision === "content_switch") {
    return (
      <>
        <FadeIn delayMs={0}>
          <Section title="推荐内容">
            <div className="text-base font-medium text-text-primary">
              {decision.suggested_content}
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={100}>
          <Section title="推荐理由">
            <div className="rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-secondary">
              {decision.reason}
            </div>
          </Section>
        </FadeIn>
      </>
    );
  }

  if (decision.decision === "show_ad") {
    return (
      <>
        <FadeIn delayMs={0}>
          <Section title="选中品牌">
            <div className="text-base font-medium text-text-primary">
              {decision.selected_brand}
            </div>
            {decision.alternative_brands.length > 0 && (
              <div className="mt-2 text-xs text-text-tertiary">
                备选 · {decision.alternative_brands.join(" · ")}
              </div>
            )}
          </Section>
        </FadeIn>
        <FadeIn delayMs={100}>
          <Section title="文案 & 声线">
            <div className="border-l-2 border-accent-brand-from pl-3 italic font-medium text-base text-text-primary">
              "{decision.ad_copy}"
            </div>
            <div className="mt-2 text-xs text-text-tertiary">
              声线 · {decision.voice_preset}
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={150}>
          <Section title="植入位置">
            <div className="text-sm text-text-primary">{surfaceLabel}</div>
            <div className="mt-1 text-xs text-text-tertiary">
              AI 在画面里挑选了这个位置叠加产品,而非弹窗强插
            </div>
          </Section>
        </FadeIn>
        <FadeIn delayMs={200}>
          <Section title="契合度评分">
            <ScoresView ad={decision} />
          </Section>
        </FadeIn>
        <FadeIn delayMs={300}>
          <Section title="决策理由">
            <div className="rounded-lg bg-background-elevated p-4 text-sm leading-relaxed text-text-secondary">
              {decision.reasoning}
            </div>
          </Section>
        </FadeIn>
      </>
    );
  }

  return null;
}

// Stage 9.F:VLM 区块视觉重做
//   - 画面/动作/人数 vs 场景/情绪/色调/可植入 两组各加 eyebrow 标题
//   - 画面字段:斜体 + 大字号 + 左侧 brand-gradient 竖条(强调"AI 真看到了")
//   - 场景:rounded chip
//   - 情绪:emoji 前缀 + 文本
//   - 色调:8×8 实心色块(由颜色关键字解析)+ 文本
//   - 可植入:左侧 brand-from 竖条 + "决策锚点" 高亮(AI 选位的依据)
function SceneFields({ scene }: { scene: SceneJSON }) {
  const emotionRaw = Array.isArray(scene.emotion)
    ? scene.emotion.join(" · ")
    : scene.emotion ?? "";
  const surfaces =
    scene.empty_surfaces?.length > 0 ? scene.empty_surfaces.join(" · ") : "—";
  const sceneLabel = scene.scene_category ?? scene.scene ?? "—";
  const colorTone = scene.color_tone ?? "—";

  return (
    <div>
      {/* 第一组:画面观察 */}
      <div>
        <GroupEyebrow icon={<IconEye />} label="画面观察" />
        <div className="mt-2 space-y-3">
          {scene.concrete_description && (
            <div className="border-l-2 border-accent-brand-from pl-3">
              <FieldLabel>画面</FieldLabel>
              <div className="mt-0.5 text-base italic leading-relaxed text-text-primary">
                {scene.concrete_description}
              </div>
            </div>
          )}
          {scene.main_action && (
            <FieldRow label="动作">
              <span className="text-sm text-text-secondary">
                {scene.main_action}
              </span>
            </FieldRow>
          )}
          {scene.person_count !== undefined && scene.person_count !== "" && (
            <FieldRow label="人数">
              <span className="font-mono text-sm tabular-nums text-text-secondary">
                {String(scene.person_count)}
              </span>
              <span className="ml-1 text-xs text-text-tertiary">人</span>
            </FieldRow>
          )}
        </div>
      </div>

      {/* 第二组:场景标签 */}
      <div className="mt-5 border-t border-border-subtle pt-4">
        <GroupEyebrow icon={<IconTag />} label="场景标签" />
        <div className="mt-2 space-y-3">
          <FieldRow label="场景">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-background-elevated px-2.5 py-0.5 text-xs text-text-secondary">
              <IconScene />
              {sceneLabel}
            </span>
          </FieldRow>
          <FieldRow label="情绪">
            <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <span aria-hidden>{emotionEmoji(emotionRaw)}</span>
              {emotionRaw || "—"}
            </span>
          </FieldRow>
          <FieldRow label="色调">
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-white/20"
                style={{ background: parseColorTone(colorTone) }}
                aria-hidden
              />
              {colorTone}
            </span>
          </FieldRow>
          {/* 可植入:决策锚点 — 用 brand-from 竖条 + 微底色高亮 */}
          <div className="border-l-2 border-accent-brand-from rounded-r bg-accent-brand-from/[0.06] px-3 py-2">
            <div className="flex items-baseline justify-between">
              <FieldLabel>可植入</FieldLabel>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-brand-from/80">
                决策锚点
              </span>
            </div>
            <div className="mt-0.5 text-sm text-text-primary">{surfaces}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupEyebrow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-text-tertiary">
      <span aria-hidden>{icon}</span>
      <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
      {children}
    </span>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-baseline gap-3">
      <FieldLabel>{label}</FieldLabel>
      <div>{children}</div>
    </div>
  );
}

// 12×12 inline icons
function IconEye() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 2.5h5l6 6-5 5-6-6v-5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor" />
    </svg>
  );
}
function IconScene() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 由情绪关键字粗略 map 一个 emoji,不命中时返回中性符号
function emotionEmoji(s: string): string {
  if (!s) return "·";
  if (/欢乐|庆祝|喜悦|兴奋|甜|喜/.test(s)) return "🥂";
  if (/孤独|沉重|哀|悲|忧/.test(s)) return "🌙";
  if (/温馨|温暖|温情|安睡/.test(s)) return "☀";
  if (/紧张|冲突|对峙|对决/.test(s)) return "⚡";
  if (/禅意|雅致|沉静|宁静/.test(s)) return "🍃";
  if (/神秘|阴/.test(s)) return "🌑";
  if (/疲惫|疲倦/.test(s)) return "💤";
  return "·";
}

// 由色调关键字解析为颜色值,用作色块。命中规则按从严到宽,fallback slate
function parseColorTone(s: string): string {
  const exactMap: Record<string, string> = {
    暖橘: "#d97706",
    暖金: "#eab308",
    暖黄: "#facc15",
    冷蓝: "#3b82f6",
    深蓝: "#1d4ed8",
    海蓝: "#0ea5e9",
    青绿: "#10b981",
    墨绿: "#166534",
    灰白: "#cbd5e1",
    暗灰: "#475569",
  };
  for (const key of Object.keys(exactMap)) {
    if (s.startsWith(key) || s.includes(key)) return exactMap[key];
  }
  if (/暖|橘|金|黄/.test(s)) return "#d97706";
  if (/冷|蓝/.test(s)) return "#3b82f6";
  if (/绿/.test(s)) return "#22c55e";
  if (/紫/.test(s)) return "#a855f7";
  if (/红|粉/.test(s)) return "#ef4444";
  if (/灰/.test(s)) return "#94a3b8";
  if (/白/.test(s)) return "#e2e8f0";
  if (/黑|暗/.test(s)) return "#1f2937";
  return "#64748b";
}

function ScoresView({ ad }: { ad: ShowAdDecision }) {
  // 用户心境干扰度:string → 反向数值映射(low=90, medium=60, high=25),数值越高条越满
  const disturbanceMap: Record<string, number> = { low: 90, medium: 60, high: 25 };
  const disturbValue = disturbanceMap[ad.scores.user_disturbance] ?? 60;

  // predicted_attention_lift 是 "+39%" 这类字符串,直接拼后缀展示
  const liftLabel = ad.scores.predicted_attention_lift;

  return (
    <div className="space-y-3">
      <ScoreRow
        label="场景情绪契合度"
        value={String(ad.scores.scene_emotion_fit)}
        pct={ad.scores.scene_emotion_fit}
      />
      <ScoreRow
        label="品牌调性匹配度"
        value={String(ad.scores.brand_tone_match)}
        pct={ad.scores.brand_tone_match}
      />
      <ScoreRow
        label="用户心境干扰度"
        value={ad.scores.user_disturbance}
        pct={disturbValue}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-tertiary">预测注意力捕获率</div>
        <div className="text-xs font-mono text-text-secondary">
          {liftLabel} vs 传统弹窗
        </div>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-tertiary">{label}</div>
        <div className="text-xs font-mono text-text-primary">{value}</div>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-elevated">
        <div
          className="h-full rounded-full bg-text-secondary/50 transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-xs uppercase tracking-wider text-text-tertiary">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DecisionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-block rounded-full border border-amber-700/30 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-200">
      {children}
    </div>
  );
}

function FieldSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ["70%", "85%", "60%", "90%"];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-background-elevated"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function CollapsibleJSON({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-text-tertiary transition-colors duration-200 hover:text-text-secondary"
      >
        {open ? "▾" : "▸"} 完整 SceneJSON
      </button>
      {open && (
        <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-background-elevated p-3 font-mono text-xs leading-relaxed text-text-secondary">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function FadeIn({
  children,
  delayMs = 0,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (delayMs <= 0) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
  return (
    <div
      className={
        "transition-opacity duration-500 " + (shown ? "opacity-100" : "opacity-0")
      }
    >
      {children}
    </div>
  );
}
